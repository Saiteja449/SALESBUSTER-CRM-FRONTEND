import React, { useEffect, useRef, useState } from "react";
import {
  Mic,
  MicOff,
  PhoneOff,
  Sparkles,
  Bot,
  Database,
  Square,
  AlertCircle,
  Zap,
  Activity,
  Lightbulb,
  ChevronDown,
} from "lucide-react";

const SUGGESTED_QUERIES = [
  "How many leads came in today vs yesterday?",
  "What is our lead conversion rate this month?",
  "Who is our top salesperson this week?",
  "Are there any overdue follow-ups?",
  "Which active leads haven't received a WhatsApp reply?",
];

/**
 * Premium White-Themed Gemini Live Voice Modal with Dynamic Audio Waveform
 * Replaces the orb with responsive vertical sound wave bars (pill caps).
 * Accurately surfaces connecting, listening, processing, tool querying, speaking, and reconnecting states.
 */
export default function GeminiLiveVoiceModal({
  isOpen,
  onClose,
  status = "idle", // 'idle' | 'connecting' | 'listening' | 'processing' | 'tool_running' | 'speaking' | 'reconnecting' | 'error'
  activeToolName = null,
  toolDetails = null,
  inputVolume = 0,
  outputVolume = 0,
  liveTranscript = "",
  error = null,
  voiceName = "Aoede",
  onVoiceChange,
  isMuted = false,
  onToggleMute,
  onInterrupt,
}) {
  const canvasRef = useRef(null);
  const [activeSuggestionIdx, setActiveSuggestionIdx] = useState(0);

  // Cycle through suggestions periodically
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setActiveSuggestionIdx((prev) => (prev + 1) % SUGGESTED_QUERIES.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Dynamic Vertical Audio Waveform Canvas
  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;
    let phase = 0;

    const numBars = 31;
    const barWidth = 6;
    const barGap = 5;
    const totalWidth = numBars * (barWidth + barGap) - barGap;

    // Static envelope multiplier recreating 3-peak sound wave
    const envelope = [];
    for (let i = 0; i < numBars; i++) {
      const leftPeak = Math.exp(-Math.pow((i - 5) / 2.8, 2)) * 0.72;
      const centerPeak = Math.exp(-Math.pow((i - 15) / 3.4, 2)) * 1.0;
      const rightPeak = Math.exp(-Math.pow((i - 25) / 3.0, 2)) * 0.78;
      const baseEdge = 0.16 + 0.1 * Math.sin((i / numBars) * Math.PI);
      envelope.push(Math.max(0.18, Math.max(leftPeak, centerPeak, rightPeak, baseEdge)));
    }

    const render = () => {
      phase += 0.045;
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;
      const startX = (width - totalWidth) / 2;

      ctx.clearRect(0, 0, width, height);

      const isSpeaking = status === "speaking";
      const isListening = status === "listening" && !isMuted;
      const isTool = status === "tool_running";
      const isProcessing = status === "processing";
      const vol = isSpeaking ? outputVolume : isListening ? inputVolume : 0.04;

      // Color scheme for vertical bars
      let barColor = "#0f172a"; // Slate/black for listening
      if (isSpeaking) {
        barColor = "#4338ca"; // Indigo when Gemini speaks
      } else if (isTool) {
        barColor = "#d97706"; // Amber when executing CRM tools
      } else if (isProcessing) {
        barColor = "#2563eb"; // Blue when processing question
      }

      ctx.fillStyle = barColor;

      for (let i = 0; i < numBars; i++) {
        const x = startX + i * (barWidth + barGap);

        // Harmonic oscillation across bars
        const wave =
          Math.sin(phase * 4 + i * 0.38) * 0.22 +
          Math.cos(phase * 2.2 - i * 0.28) * 0.14;

        const baseH = envelope[i] * 128;

        let currentH;
        if (vol > 0.08) {
          currentH = Math.max(8, baseH * (0.45 + vol * 1.8 * (1 + wave * 0.4)));
        } else if (isProcessing) {
          // Dynamic traveling ripple for processing state
          const ripple = Math.sin(phase * 3 - i * 0.5) * 0.35 + 0.65;
          currentH = Math.max(8, baseH * ripple);
        } else {
          currentH = Math.max(8, baseH * (0.8 + wave * 0.18));
        }

        const clampedH = Math.min(height - 16, Math.max(8, currentH));
        const y = centerY - clampedH / 2;

        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x, y, barWidth, clampedH, barWidth / 2);
        } else {
          ctx.rect(x, y, barWidth, clampedH);
        }
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [isOpen, status, inputVolume, outputVolume, isMuted]);

  if (!isOpen) return null;

  const isSpeaking = status === "speaking";
  const isTool = status === "tool_running";
  const isProcessing = status === "processing";
  const isConnecting = status === "connecting";
  const isReconnecting = status === "reconnecting";

  // State-specific heading and helper copy
  let statusHeading = "Listening...";
  let statusSubtext = "Speak naturally, I'm listening to your question.";

  if (isConnecting) {
    statusHeading = "Connecting...";
    statusSubtext = "Negotiating secure session with Gemini Live API...";
  } else if (isReconnecting) {
    statusHeading = "Reconnecting...";
    statusSubtext = "Re-establishing real-time connection...";
  } else if (isProcessing) {
    statusHeading = "Thinking...";
    statusSubtext = "Formulating your answer with live CRM context...";
  } else if (isTool) {
    statusHeading = "Querying CRM...";
    statusSubtext = toolDetails?.friendlyLabel || "Querying database tools for live figures.";
  } else if (isSpeaking) {
    statusHeading = "Speaking...";
    statusSubtext = "BI Analyst is delivering your CRM insights in real-time.";
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      {/* Light Soft Frosted Glass Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/35 backdrop-blur-md transition-opacity animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Main Pure White Card Container */}
      <div
        className="relative w-full max-w-4xl bg-white border border-slate-200/90 rounded-[28px] shadow-[0_25px_70px_rgba(15,23,42,0.18)] p-6 sm:p-8 flex flex-col justify-between overflow-hidden transition-all animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* =========================================================================
            HEADER: Bot Icon + Title + Green Badge + Voice Selector (White Theme)
            ========================================================================= */}
        <div className="w-full flex items-center justify-between gap-4">
          {/* Left: Avatar & Branding */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/25 shrink-0">
              <Bot className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  BI Analyst Live
                </h3>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Gemini Live API
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5 font-medium">
                <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>Low Latency • Live CRM Grounded</span>
              </p>
            </div>
          </div>

          {/* Right: Audio Wave Voice Dropdown Pill */}
          <div className="relative">
            <div className="flex items-center gap-2 bg-slate-100/90 hover:bg-slate-200/70 border border-slate-200 rounded-2xl px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors shadow-xs">
              <Activity className="w-3.5 h-3.5 text-indigo-600" />
              <select
                value={voiceName}
                onChange={(e) => onVoiceChange && onVoiceChange(e.target.value)}
                className="bg-transparent text-slate-800 outline-none cursor-pointer appearance-none pr-5 text-xs font-semibold"
                title="Select Google HD Voice Persona"
              >
                <option value="Aoede" className="bg-white text-slate-900">Aoede (Warm Executive)</option>
                <option value="Puck" className="bg-white text-slate-900">Puck (Energetic)</option>
                <option value="Charon" className="bg-white text-slate-900">Charon (Calm Authority)</option>
                <option value="Fenrir" className="bg-white text-slate-900">Fenrir (Deep Resonance)</option>
                <option value="Kore" className="bg-white text-slate-900">Kore (Clear Professional)</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 pointer-events-none -ml-4" />
            </div>
          </div>
        </div>

        {/* =========================================================================
            CENTER 3-COLUMN STUDIO SECTION:
            Left: Status text | Center: Dynamic Audio Waveform | Right: Feature Cards
            ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center my-6 sm:my-8">
          {/* Left Column: Live Status & Subtitle */}
          <div className="hidden md:flex md:col-span-3 flex-col justify-center">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-base tracking-tight">
              <Activity className="w-5 h-5 text-indigo-600" />
              <span>{statusHeading}</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed mt-2 max-w-[210px] font-medium">
              {statusSubtext}
            </p>
          </div>

          {/* Center Column: Dynamic Vertical Audio Waveform */}
          <div className="col-span-1 md:col-span-6 flex flex-col items-center justify-center">
            {/* Audio Waveform Canvas */}
            <div className="w-full flex items-center justify-center py-2">
              <canvas
                ref={canvasRef}
                width={360}
                height={160}
                className="w-[300px] h-[135px] sm:w-[350px] sm:h-[155px]"
              />
            </div>

            {/* Accurate Status Badge Pill (Never shows "Listening" while processing or querying) */}
            <div className="mt-3">
              {isConnecting && (
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-purple-50 border border-purple-200 text-purple-700 shadow-xs">
                  <Activity className="w-3.5 h-3.5 animate-spin text-purple-600" />
                  <span>Connecting Live Session...</span>
                </div>
              )}
              {isReconnecting && (
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-amber-50 border border-amber-200 text-amber-700 shadow-xs">
                  <Activity className="w-3.5 h-3.5 animate-spin text-amber-600" />
                  <span>Reconnecting live voice session...</span>
                </div>
              )}
              {isProcessing && (
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-blue-50 border border-blue-200 text-blue-700 shadow-xs animate-pulse">
                  <Sparkles className="w-3.5 h-3.5 animate-spin text-blue-600" />
                  <span>Thinking... Processing Question</span>
                </div>
              )}
              {isTool && (
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-amber-50 border border-amber-200 text-amber-700 shadow-xs animate-pulse">
                  <Database className="w-3.5 h-3.5 animate-spin text-amber-600" />
                  <span>{toolDetails?.friendlyLabel || "Querying Live CRM Database..."}</span>
                </div>
              )}
              {isSpeaking && (
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-indigo-50 border border-indigo-200 text-indigo-700 shadow-xs">
                  <Activity className="w-3.5 h-3.5 animate-pulse text-indigo-600" />
                  <span>BI Analyst Speaking ({voiceName})</span>
                </div>
              )}
              {!isConnecting && !isReconnecting && !isProcessing && !isTool && !isSpeaking && (
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 border border-emerald-200 text-emerald-700 shadow-xs">
                  <Activity className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Listening • Speak your question anytime</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: 3 Floating Feature Cards (White Theme) */}
          <div className="hidden md:flex md:col-span-3 flex-col gap-2.5">
            {/* Feature 1: Live AI */}
            <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-50 border border-slate-200 shadow-xs">
              <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800">Live AI</div>
                <div className="text-[10px] text-slate-500 font-medium">Real-time response</div>
              </div>
            </div>

            {/* Feature 2: CRM Grounded */}
            <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-50 border border-slate-200 shadow-xs">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800">CRM Grounded</div>
                <div className="text-[10px] text-slate-500 font-medium">Accurate & relevant</div>
              </div>
            </div>

            {/* Feature 3: Low Latency */}
            <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-50 border border-slate-200 shadow-xs">
              <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                <Zap className="w-4 h-4 fill-amber-500" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800">Low Latency</div>
                <div className="text-[10px] text-slate-500 font-medium">Fast answers</div>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            SUGGESTION / TRANSCRIPT WIDE PILL (White Theme)
            ========================================================================= */}
        <div className="w-full max-w-2xl mx-auto mb-4">
          <div className="flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-700 shadow-xs text-center font-medium">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            {liveTranscript ? (
              <span className="font-semibold text-slate-900 line-clamp-1">
                "{liveTranscript}"
              </span>
            ) : (
              <span>
                Try asking: <span className="text-slate-900 font-semibold">"{SUGGESTED_QUERIES[activeSuggestionIdx]}"</span>
              </span>
            )}
          </div>

          {error && (
            <div className="mt-2 p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-center gap-2 font-medium">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Subtle Horizontal Divider */}
        <div className="w-full h-[1px] bg-slate-200/80 my-2" />

        {/* =========================================================================
            BOTTOM 3 CIRCULAR CONTROLS: Mic | Large Stop/Interrupt | Red End Call
            ========================================================================= */}
        <div className="w-full flex items-center justify-center gap-5 pt-3">
          {/* 1. Mic Button (Left) */}
          <button
            type="button"
            onClick={onToggleMute}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-150 cursor-pointer shadow-sm active:scale-95 ${
              isMuted
                ? "bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100"
                : "bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700"
            }`}
            title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
            aria-label="Toggle Mute"
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* 2. Active Central Stop / Interrupt Button (Primary Blue Glow) */}
          <button
            type="button"
            onClick={onInterrupt}
            className="relative w-14 h-14 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 flex items-center justify-center text-white ring-4 ring-indigo-500/25 ring-offset-4 ring-offset-white transition-all duration-150 cursor-pointer shadow-lg shadow-indigo-500/30 active:scale-95"
            title="Interrupt AI Speech"
            aria-label="Interrupt AI"
          >
            <Square className="w-5 h-5 fill-white text-white" />
          </button>

          {/* 3. Red End Call Button (Right Coral Red) */}
          <button
            type="button"
            onClick={onClose}
            className="w-12 h-12 rounded-full bg-rose-600 hover:bg-rose-700 flex items-center justify-center text-white transition-all duration-150 cursor-pointer shadow-lg shadow-rose-600/30 active:scale-95"
            title="End Live Voice Chat"
            aria-label="End Call"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
