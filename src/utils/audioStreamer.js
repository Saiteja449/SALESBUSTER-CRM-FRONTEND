/**
 * Utility functions for Web Audio API:
 * 1. Live Microphone PCM 16kHz Streaming (User -> Gemini)
 * 2. Real-time PCM 24kHz Queue Playback with Instant Interruption (Gemini -> Speaker)
 * 3. Volume and Frequency Analysis for Animated Voice Orb
 */

/**
 * Converts Float32Array from Web Audio to 16-bit Linear PCM ArrayBuffer
 */
export function float32ToInt16PCM(float32Array) {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true); // Little endian
  }
  return buffer;
}

function resampleAudio(input, inputRate, outputRate) {
  if (inputRate === outputRate) return input;
  const outputLength = Math.max(1, Math.floor((input.length * outputRate) / inputRate));
  const output = new Float32Array(outputLength);
  const step = inputRate / outputRate;

  for (let i = 0; i < outputLength; i++) {
    const position = i * step;
    const left = Math.floor(position);
    const right = Math.min(left + 1, input.length - 1);
    const fraction = position - left;
    output[i] = input[left] * (1 - fraction) + input[right] * fraction;
  }
  return output;
}

/**
 * Converts ArrayBuffer / Uint8Array to base64 string
 */
export function arrayBufferToBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

/**
 * Decodes base64 string to Float32Array for Web Audio playback
 */
export function base64ToFloat32Array(base64String) {
  const binaryString = window.atob(base64String);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const int16Array = new Int16Array(bytes.buffer);
  const float32Array = new Float32Array(int16Array.length);
  for (let i = 0; i < int16Array.length; i++) {
    float32Array[i] = int16Array[i] / 32768.0;
  }
  return float32Array;
}

/**
 * Live Microphone Recorder targeting 16,000 Hz for Gemini Multimodal Live API
 */
export class LiveAudioRecorder {
  constructor({ onAudioChunk, onVolumeChange }) {
    this.onAudioChunk = onAudioChunk;
    this.onVolumeChange = onVolumeChange;
    this.audioContext = null;
    this.mediaStream = null;
    this.processor = null;
    this.analyser = null;
    this.source = null;
    this.isRecording = false;
    this.animFrameId = null;
  }

  async start() {
    if (this.isRecording) return;

    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        sampleRate: 16000,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    this.audioContext = new AudioContextClass({ sampleRate: 16000 });
    if (this.audioContext.state === "suspended") {
      await this.audioContext.resume();
    }

    this.source = this.audioContext.createMediaStreamSource(this.mediaStream);
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;

    // Buffer size of 2048 at 16kHz is ~128ms per chunk (ideal for live streaming)
    this.processor = this.audioContext.createScriptProcessor(2048, 1, 1);

    this.processor.onaudioprocess = (e) => {
      if (!this.isRecording) return;
      const inputData = e.inputBuffer.getChannelData(0);
      const pcm16k = resampleAudio(inputData, this.audioContext.sampleRate, 16000);
      const pcmBuffer = float32ToInt16PCM(pcm16k);
      const base64Chunk = arrayBufferToBase64(pcmBuffer);

      if (this.onAudioChunk) {
        this.onAudioChunk(base64Chunk);
      }
    };

    this.source.connect(this.analyser);
    this.analyser.connect(this.processor);
    this.processor.connect(this.audioContext.destination);

    this.isRecording = true;
    this.startVolumePolling();
  }

  startVolumePolling() {
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    const poll = () => {
      if (!this.isRecording) return;
      this.analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const avg = sum / dataArray.length; // 0 to 255
      const normalized = Math.min(1, avg / 80);

      if (this.onVolumeChange) {
        this.onVolumeChange(normalized);
      }
      this.animFrameId = requestAnimationFrame(poll);
    };
    this.animFrameId = requestAnimationFrame(poll);
  }

  stop() {
    this.isRecording = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }
    if (this.audioContext && this.audioContext.state !== "closed") {
      this.audioContext.close();
      this.audioContext = null;
    }

    if (this.onVolumeChange) {
      this.onVolumeChange(0);
    }
  }
}

/**
 * Continuous PCM 24kHz Audio Stream Player for Gemini Responses
 * Features jitter queue scheduling and instant interruption flush
 */
export class LiveAudioPlayer {
  constructor({ onVolumeChange, onPlaybackEnded } = {}) {
    this.onVolumeChange = onVolumeChange;
    this.onPlaybackEnded = onPlaybackEnded;
    this.audioContext = null;
    this.analyser = null;
    this.nextPlayTime = 0;
    this.activeSources = new Set();
    this.animFrameId = null;
    this.isPlaying = false;
  }

  init() {
    if (!this.audioContext || this.audioContext.state === "closed") {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContextClass({ sampleRate: 24000 });
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.connect(this.audioContext.destination);
      this.nextPlayTime = this.audioContext.currentTime;
      this.startVolumePolling();
    } else if (this.audioContext.state === "suspended") {
      this.audioContext.resume();
    }
  }

  startVolumePolling() {
    if (!this.analyser) return;
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    const poll = () => {
      if (!this.audioContext || this.audioContext.state === "closed") return;
      this.analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const avg = sum / dataArray.length;
      const normalized = Math.min(1, avg / 70);

      if (this.onVolumeChange) {
        this.onVolumeChange(normalized);
      }
      this.animFrameId = requestAnimationFrame(poll);
    };
    this.animFrameId = requestAnimationFrame(poll);
  }

  /**
   * Enqueues base64 PCM 24kHz chunk into the Web Audio playback pipeline
   */
  enqueueAudioChunk(base64Chunk) {
    this.init();
    try {
      const float32Samples = base64ToFloat32Array(base64Chunk);
      if (float32Samples.length === 0) return;

      const audioBuffer = this.audioContext.createBuffer(
        1,
        float32Samples.length,
        24000
      );
      audioBuffer.copyToChannel(float32Samples, 0);

      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.analyser);

      const currentTime = this.audioContext.currentTime;
      // If queue fell behind, reset nextPlayTime to avoid delay
      if (this.nextPlayTime < currentTime) {
        this.nextPlayTime = currentTime + 0.02; // Tiny 20ms buffer
      }

      source.start(this.nextPlayTime);
      this.nextPlayTime += audioBuffer.duration;
      this.activeSources.add(source);
      this.isPlaying = true;

      source.onended = () => {
        this.activeSources.delete(source);
        if (this.activeSources.size === 0) {
          this.isPlaying = false;
          if (this.onPlaybackEnded) {
            this.onPlaybackEnded();
          }
        }
      };
    } catch (err) {
      console.warn("[LiveAudioPlayer] Error enqueuing audio chunk:", err);
    }
  }

  /**
   * Instant interruption flush: stops all playing buffers immediately
   */
  flush() {
    for (const source of this.activeSources) {
      try {
        source.stop();
        source.disconnect();
      } catch {
        // Source might have already finished
      }
    }
    this.activeSources.clear();
    this.isPlaying = false;
    if (this.audioContext) {
      this.nextPlayTime = this.audioContext.currentTime;
    }
    if (this.onVolumeChange) {
      this.onVolumeChange(0);
    }
  }

  stop() {
    this.flush();
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.audioContext && this.audioContext.state !== "closed") {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}
