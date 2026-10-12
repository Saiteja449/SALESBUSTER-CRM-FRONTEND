/**
 * Web Audio API Utilities for Gemini Multimodal Live API
 * - Real-time downsampling to exact 16,000 Hz linear PCM (fixes silent/unresponsive AI)
 * - Jitter-buffered 24kHz PCM playback with smooth queueing and debounced state transitions
 * - Instant barge-in interruption flush
 * - High-precision volume & frequency analysis for animated voice orb
 */

/**
 * Resamples any input sample rate (44.1kHz, 48kHz, 96kHz) down to exact 16,000 Hz
 */
export function downsampleTo16000(inputBuffer, inputSampleRate) {
  if (!inputBuffer || inputBuffer.length === 0) return new Float32Array(0);
  if (inputSampleRate === 16000) return inputBuffer;

  const ratio = inputSampleRate / 16000;
  const newLength = Math.round(inputBuffer.length / ratio);
  const result = new Float32Array(newLength);
  let offsetResult = 0;
  let offsetBuffer = 0;

  while (offsetResult < result.length) {
    const nextOffsetBuffer = Math.round((offsetResult + 1) * ratio);
    let accum = 0;
    let count = 0;
    for (let i = offsetBuffer; i < nextOffsetBuffer && i < inputBuffer.length; i++) {
      accum += inputBuffer[i];
      count++;
    }
    result[offsetResult] = count > 0 ? accum / count : 0;
    offsetResult++;
    offsetBuffer = nextOffsetBuffer;
  }
  return result;
}

/**
 * Converts Float32Array (-1.0 to 1.0) to 16-bit Linear PCM ArrayBuffer (Little Endian)
 */
export function float32ToInt16PCM(float32Array) {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return buffer;
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
 * Live Microphone Recorder with Automatic 16,000 Hz Software Downsampler
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

    // Request clean audio with acoustic echo cancellation
    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    // Allow browser default hardware rate (usually 48kHz on Windows/Mac) to avoid audio driver distortion
    this.audioContext = new AudioContextClass();
    if (this.audioContext.state === "suspended") {
      await this.audioContext.resume();
    }

    const hardwareRate = this.audioContext.sampleRate || 48000;
    this.source = this.audioContext.createMediaStreamSource(this.mediaStream);
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;

    // 4096 buffer size gives ~85ms chunks at 48kHz (smooth, low overhead)
    this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

    this.processor.onaudioprocess = (e) => {
      if (!this.isRecording) return;
      const rawFloat32 = e.inputBuffer.getChannelData(0);

      // Downsample from hardware rate (48000Hz/44100Hz) down to exact 16000Hz expected by Gemini
      const downsampled16k = downsampleTo16000(rawFloat32, hardwareRate);
      const pcmBuffer = float32ToInt16PCM(downsampled16k);
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
    if (!this.analyser) return;
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    const poll = () => {
      if (!this.isRecording) return;
      this.analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const avg = sum / dataArray.length;
      const normalized = Math.min(1, avg / 65);

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
      try {
        this.processor.disconnect();
      } catch (e) {}
      this.processor = null;
    }
    if (this.source) {
      try {
        this.source.disconnect();
      } catch (e) {}
      this.source = null;
    }
    if (this.analyser) {
      try {
        this.analyser.disconnect();
      } catch (e) {}
      this.analyser = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }
    if (this.audioContext && this.audioContext.state !== "closed") {
      try {
        this.audioContext.close();
      } catch (e) {}
      this.audioContext = null;
    }

    if (this.onVolumeChange) {
      this.onVolumeChange(0);
    }
  }
}

/**
 * Continuous PCM 24kHz Audio Stream Player for Gemini Responses
 * Features jitter queue scheduling, debounced playback ending, and instant barge-in flush
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
    this.playbackEndTimer = null;
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
    }
    if (this.audioContext.state === "suspended") {
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
      const normalized = Math.min(1, avg / 60);

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

      if (this.playbackEndTimer) {
        clearTimeout(this.playbackEndTimer);
        this.playbackEndTimer = null;
      }

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
      // If queue fell behind (e.g. pause or network lag), smoothly restart with 40ms safety buffer
      if (this.nextPlayTime < currentTime) {
        this.nextPlayTime = currentTime + 0.04;
      }

      source.start(this.nextPlayTime);
      this.nextPlayTime += audioBuffer.duration;
      this.activeSources.add(source);
      this.isPlaying = true;

      source.onended = () => {
        this.activeSources.delete(source);
        if (this.activeSources.size === 0) {
          // Debounce playback end to allow subsequent chunks without choppy stutter
          if (this.playbackEndTimer) clearTimeout(this.playbackEndTimer);
          this.playbackEndTimer = setTimeout(() => {
            if (this.activeSources.size === 0) {
              this.isPlaying = false;
              if (this.onPlaybackEnded) {
                this.onPlaybackEnded();
              }
            }
          }, 300);
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
    if (this.playbackEndTimer) {
      clearTimeout(this.playbackEndTimer);
      this.playbackEndTimer = null;
    }
    for (const source of this.activeSources) {
      try {
        source.stop();
        source.disconnect();
      } catch (e) {}
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
      try {
        this.audioContext.close();
      } catch (e) {}
      this.audioContext = null;
    }
  }
}
