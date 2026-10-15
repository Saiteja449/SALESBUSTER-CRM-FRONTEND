import { useState, useRef, useCallback, useEffect } from 'react';

// ---------- 1. Voice selection ----------
// Indian-English neural voices first (best fit for Indian names, numbers, ₹ amounts),
// then other neural / high-quality voices.
const PREFERRED_VOICES = [
  /Microsoft (Neerja|Prabhat).*Online \(Natural\)/i, // Edge en-IN neural
  /Microsoft .*Online \(Natural\).*English/i,        // Edge neural (Aria, Jenny, Guy...)
  /Microsoft .*Online \(Natural\)/i,
  /Google UK English Female/i,
  /Google US English/i,
  /Samantha|Ava|Serena|Karen|Rishi/i,                // macOS / iOS
];

function pickVoice(voices) {
  if (!voices.length) return null;
  const english = voices.filter((v) => /^en[-_]/i.test(v.lang));
  for (const re of PREFERRED_VOICES) {
    const hit = english.find((v) => re.test(v.name));
    if (hit) return hit;
  }
  return (
    english.find((v) => /en[-_]IN/i.test(v.lang)) ||
    english.find((v) => !v.localService) ||
    english[0] ||
    voices[0]
  );
}

// ---------- 2. Sanitizer ----------
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
  'August', 'September', 'October', 'November', 'December'];

// "9876543210" -> "9 8 7 6 5, 4 3 2 1 0"  (digits one by one, pause between groups)
const digits = (s) => s.replace(/\D/g, '').split('').join(' ');
// Keep the number's own grouping if it has spaces/dashes ("415 555 0132"),
// otherwise split 3-3-4 style and never leave a lone trailing digit.
const groupDigits = (s) => {
  const given = s.trim().split(/[\s-]+/).filter(Boolean);
  if (given.length > 1) return given.map(digits).join(', ');
  const d = s.replace(/\D/g, '');
  const parts = [];
  let i = 0;
  while (i < d.length) {
    const left = d.length - i;
    const size = left <= 4 ? left : 3;
    parts.push(d.slice(i, i + size));
    i += size;
  }
  return parts.map(digits).join(', ');
};

function speakPhoneNumbers(t) {
  // Indian mobile with country code / trunk prefix: +91 98765 43210, 91-9876543210, 09876543210
  t = t.replace(
    /(?<![\d.,])(\+\s?91|91|0)[\s-]?([6-9]\d{4})[\s-]?(\d{5})(?!\d|,\d)/g,
    (_, pre, a, b) => {
      const p = pre.startsWith('+') ? 'plus 9 1' : pre === '91' ? '9 1' : 'zero';
      return ` ${p}, ${digits(a)}, ${digits(b)} `;
    }
  );
  // Plain Indian mobile: 9876543210 / 98765 43210 / 98765-43210
  t = t.replace(
    /(?<![\d.,])([6-9]\d{4})[\s-]?(\d{5})(?!\d|,\d|\.\d)/g,
    (_, a, b) => ` ${digits(a)}, ${digits(b)} `
  );
  // Toll-free: 1800 123 4567
  t = t.replace(
    /(?<![\d.,])(1800)[\s-]?(\d{3})[\s-]?(\d{3,4})(?!\d)/g,
    (_, a, b, c) => ` ${digits(a)}, ${digits(b)}, ${digits(c)} `
  );
  // US / Canada: +1 415 555 0132, +1 (415) 555-0132, +14155550132
  t = t.replace(
    /\+1[\s-]?\(?(\d{3})\)?[\s-]?(\d{3})[\s-]?(\d{4})(?!\d)/g,
    (_, a, b, c) => ` plus 1, ${digits(a)}, ${digits(b)}, ${digits(c)} `
  );
  // Other international: +44 20 7946 0958
  t = t.replace(
    /\+(\d{1,3})[\s-]?(\d[\d\s-]{6,13}\d)/g,
    (_, cc, rest) => ` plus ${digits(cc)}, ${groupDigits(rest)} `
  );
  return t;
}

export function cleanTextForSpeech(raw = '') {
  let t = raw;

  // --- markdown ---
  t = t.replace(/```[\s\S]*?```/g, ' ');
  t = t.replace(/`([^`]*)`/g, '$1');
  t = t.replace(/!\[[^\]]*\]\([^)]*\)/g, ' ');
  t = t.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');
  t = t.replace(/https?:\/\/\S+/g, ' ');
  t = t.replace(/^\s*\|?[\s:|-]{3,}\|?\s*$/gm, ' ');
  t = t.replace(/^\s*\|(.+)\|\s*$/gm, (_, row) =>
    row.split('|').map((c) => c.trim()).filter(Boolean).join(', ') + '.'
  );
  t = t.replace(/^\s{0,3}#{1,6}\s*(.+)$/gm, '$1.');
  t = t.replace(/^\s*[-*•]\s+(.+)$/gm, '$1.');
  t = t.replace(/^\s*\d+[.)]\s+(.+)$/gm, '$1.');
  t = t.replace(/(\*\*|__|\*|~~)/g, '');
  t = t.replace(/(^|\s)_+|_+(\s|$)/g, ' ');
  t = t.replace(/^>\s?/gm, '');
  t = t.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, '');

  // --- phone numbers FIRST (before any number/dash/comma rules can mangle them) ---
  t = speakPhoneNumbers(t);

  // --- dates ---
  t = t.replace(/\b(\d{4})-(\d{2})-(\d{2})\b/g, (m, y, mo, d) =>
    +mo >= 1 && +mo <= 12 ? `${+d} ${MONTHS[+mo - 1]} ${y}` : m
  );
  t = t.replace(/\b(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})\b/g, (m, d, mo, y) =>
    +mo >= 1 && +mo <= 12 && +d <= 31 ? `${+d} ${MONTHS[+mo - 1]} ${y}` : m
  );

  // --- abbreviations (their dots break sentence splitting) ---
  t = t.replace(/\be\.g\.,?/gi, 'for example,');
  t = t.replace(/\bi\.e\.,?/gi, 'that is,');
  t = t.replace(/\betc\./gi, 'etcetera.');
  t = t.replace(/\bapprox\./gi, 'approximately');
  t = t.replace(/\b(Mr|Mrs|Ms|Dr)\./g, '$1');

  // --- numbers: strip thousands separators (handles 1,234 and Indian 1,23,456) ---
  t = t.replace(/\b\d{1,3}(?:,\d{2,3})+(?:\.\d+)?\b/g, (m) => m.replace(/,/g, ''));

  // --- currency / units ---
  t = t.replace(/(?:₹|Rs\.?|INR)\s?(\d+(?:\.\d+)?)\s?(cr|crore)s?\b/gi, '$1 crore rupees');
  t = t.replace(/(?:₹|Rs\.?|INR)\s?(\d+(?:\.\d+)?)\s?(l|lakh|lakhs)\b/gi, '$1 lakh rupees');
  t = t.replace(/(?:₹|Rs\.?|INR)\s?(\d+(?:\.\d+)?)\s?k\b/gi, '$1 thousand rupees');
  t = t.replace(/(?:₹|Rs\.?|INR)\s?(\d+(?:\.\d+)?)/gi, '$1 rupees');
  t = t.replace(/\$\s?(\d+(?:\.\d+)?)\s?(k|m|b)\b/gi, (_, n, u) =>
    `${n} ${({ k: 'thousand', m: 'million', b: 'billion' })[u.toLowerCase()]} dollars`
  );
  t = t.replace(/\$\s?(\d+(?:\.\d+)?)/g, '$1 dollars');
  t = t.replace(/(\d)\s?%/g, '$1 percent');
  t = t.replace(/(\d)x\b/g, '$1 times');

  // --- shorthand ---
  t = t.replace(/\bYoY\b/g, 'year over year');
  t = t.replace(/\bMoM\b/g, 'month over month');
  t = t.replace(/\bQoQ\b/g, 'quarter over quarter');
  t = t.replace(/\bvs\.?(?=\s)/gi, 'versus');
  t = t.replace(/\s*&\s*/g, ' and ');
  t = t.replace(/\s*\/\s*/g, ' or ');
  t = t.replace(/\s*(?:→|->|=>)\s*/g, ' to ');
  t = t.replace(/(\d)\s?[-–]\s?(\d)/g, '$1 to $2'); // ranges only; phones/dates already handled

  // --- tidy so punctuation gives natural pauses ---
  t = t.replace(/\s*\n+\s*/g, '. ');
  t = t.replace(/\.{2,}/g, '.');
  t = t.replace(/([.!?])(\s*[.,])+/g, '$1');
  t = t.replace(/,\s*\./g, '.');
  t = t.replace(/\s+([,.!?;:])/g, '$1');
  t = t.replace(/\s{2,}/g, ' ');
  return t.trim();
}

// ---------- 3. Chunking ----------
// Split on sentence ends only when followed by whitespace, so "12.5" and "3.14" never split.
function splitIntoChunks(text, max) {
  const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
  const pieces = [];
  for (const s of sentences) {
    if (s.length <= max) {
      pieces.push(s);
    } else {
      // very long sentence: break at commas / semicolons / colons
      let cur = '';
      for (const part of s.split(/(?<=[,;:])\s+/)) {
        if ((cur + ' ' + part).trim().length > max && cur) {
          pieces.push(cur.trim());
          cur = part;
        } else {
          cur = (cur + ' ' + part).trim();
        }
      }
      if (cur) pieces.push(cur);
    }
  }
  // merge short neighbours into fewer, longer chunks (fewer chunk gaps = smoother)
  const chunks = [];
  let cur = '';
  for (const p of pieces) {
    if (cur && (cur + ' ' + p).length > max) {
      chunks.push(cur);
      cur = p;
    } else {
      cur = cur ? cur + ' ' + p : p;
    }
  }
  if (cur) chunks.push(cur);
  return chunks;
}

export function useTextToSpeech() {
  const [speakingMessageId, setSpeakingMessageId] = useState(null);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('sb_tts_voice') || '' : '';
  });
  const voiceRef = useRef(null);
  const runIdRef = useRef(0);
  const utterancesRef = useRef([]); // keep refs so Chrome doesn't GC them mid-speech

  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  useEffect(() => {
    if (!supported) return;
    const load = () => {
      const v = window.speechSynthesis.getVoices();
      if (!v.length) return;

      // Group English / natural voices first, then all voices
      const english = v.filter((voice) => /^en[-_]/i.test(voice.lang));
      const list = english.length ? english : v;
      setAvailableVoices(list);

      // Check if user previously saved a voice preference in localStorage
      const saved = localStorage.getItem('sb_tts_voice');
      const matched = saved ? list.find((item) => item.name === saved) : null;
      const initial = matched || pickVoice(v);

      if (initial) {
        voiceRef.current = initial;
        setSelectedVoiceName(initial.name);
      }
    };
    load();
    window.speechSynthesis.addEventListener('voiceschanged', load);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', load);
  }, [supported]);

  const changeVoice = useCallback(
    (voiceName) => {
      const match = availableVoices.find((v) => v.name === voiceName);
      if (match) {
        voiceRef.current = match;
        setSelectedVoiceName(match.name);
        try {
          localStorage.setItem('sb_tts_voice', match.name);
        } catch (e) {
          // ignore localStorage error if in private mode
        }
      }
    },
    [availableVoices]
  );

  const stop = useCallback(() => {
    if (!supported) return;
    runIdRef.current += 1;
    utterancesRef.current = [];
    window.speechSynthesis.cancel();
    setSpeakingMessageId(null);
  }, [supported]);

  const speak = useCallback(
    (messageId, rawText) => {
      if (!supported) return;

      if (speakingMessageId === messageId) {
        stop();
        return;
      }

      stop();
      const myRun = runIdRef.current;
      const voice = voiceRef.current;

      // Google network voices in Chrome cut off long utterances (~15s), so they need
      // short chunks. Other voices (Edge Natural, macOS) handle longer ones, which
      // gives fewer gaps between chunks and smoother delivery.
      const max = voice && /Google/i.test(voice.name) ? 140 : 240;
      const chunks = splitIntoChunks(cleanTextForSpeech(rawText), max);
      if (!chunks.length) return;

      // Chrome drops the first words if speak() fires right after cancel()
      setTimeout(() => {
        if (myRun !== runIdRef.current) return;

        utterancesRef.current = chunks.map((chunk, i) => {
          const u = new SpeechSynthesisUtterance(chunk);
          if (voice) {
            u.voice = voice;
            u.lang = voice.lang;
          } else {
            u.lang = 'en-IN';
          }
          u.rate = 1.0;
          u.pitch = 1.0;
          u.volume = 1;

          if (i === chunks.length - 1) {
            u.onend = () => myRun === runIdRef.current && stop();
          }
          u.onerror = (e) => {
            if (e.error === 'canceled' || e.error === 'interrupted') return;
            if (myRun === runIdRef.current) stop();
          };
          return u;
        });

        setSpeakingMessageId(messageId);
        // Queue everything up front so the engine can pre-buffer the next chunk
        utterancesRef.current.forEach((u) => window.speechSynthesis.speak(u));
      }, 60);
    },
    [speakingMessageId, stop, supported]
  );

  useEffect(() => stop, [stop]);

  return {
    speak,
    stop,
    speakingMessageId,
    supported,
    voices: availableVoices,
    selectedVoiceName,
    changeVoice,
    setVoice: changeVoice,
    // Aliases for compatibility
    speakMessage: speak,
    stopSpeaking: stop,
    isSpeaking: !!speakingMessageId,
    isSupported: supported,
  };
}

export default useTextToSpeech;