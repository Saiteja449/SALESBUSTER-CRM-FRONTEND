/**
 * Utility functions for Web Audio API:
 * 1. Live Microphone PCM 16kHz Streaming (User -> Gemini) using AudioWorklet (with ScriptProcessor fallback)
 * 2. Real-time PCM 24kHz Queue Playback with Instant Interruption & Latency Measurement (Gemini -> Speaker)
 * 3. Volume and Frequency Analysis for Responsive Animated Voice Waveform
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
 * Inline AudioWorklet processor definition for real-time 16kHz PCM audio chunking.
 * Offloads audio buffering and slicing from the main browser UI thread to the audio rendering thread.
 */
const RECORDER_WORKLET_CODE = `
class PcmRecorderProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = 512; // 32ms at 16kHz
    this.buffer = new Float32Array(this.bufferSize);
    this.bufferIndex = 0;
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0]) return true;
    const channelData = input[0];

    for (let i = 0; i < channelData.length; i++) {
      this.buffer[this.bufferIndex++] = channelData[i];
      if (this.bufferIndex >= this.bufferSize) {
        this.port.postMessage(this.buffer.slice(0, this.bufferSize));
        this.bufferIndex = 0;
      }
    }
    return true;
  }
}

registerProcessor("pcm-recorder-processor", PcmRecorderProcessor);
`;

/**
 * Live Microphone Recorder targeting 16,000 Hz for Gemini Multimodal Live API.
 * Uses AudioWorklet on modern browsers to eliminate main-thread stutter,
 * with automatic graceful fallback to ScriptProcessorNode.
 */
export class LiveAudioRecorder {
  constructor({ onAudioChunk, onVolumeChange, onMetrics } = {}) {
    this.onAudioChunk = onAudioChunk;
    this.onVolumeChange = onVolumeChange;
    this.onMetrics = onMetrics;
    this.audioContext = null;
    this.mediaStream = null;
    this.workletNode = null;
    this.processor = null; // fallback
    this.analyser = null;
    this.source = null;
    this.isRecording = false;
    this.animFrameId = null;
    this.processorType = "none";
    this.lastChunkTime = null;
    this.chunkCount = 0;
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

    this.source = this.audioContext.createMediaStreamSource(this.mediaStream);
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;

    let workletInitialized = false;

    // Try AudioWorklet first (offloads audio chunking from main thread)
    if (this.audioContext.audioWorklet && typeof window.Blob === "function") {
      try {
        const blob = new Blob([RECORDER_WORKLET_CODE], { type: "application/javascript" });
        const workletUrl = URL.createObjectURL(blob);
        await this.audioContext.audioWorklet.addModule(workletUrl);
        URL.revokeObjectURL(workletUrl);

        this.workletNode = new AudioWorkletNode(this.audioContext, "pcm-recorder-processor");
        this.workletNode.port.onmessage = (event) => {
          if (!this.isRecording) return;
          this.handleRawAudioData(event.data);
        };

        this.source.connect(this.analyser);
        this.analyser.connect(this.workletNode);
        this.workletNode.connect(this.audioContext.destination);

        this.processorType = "AudioWorklet";
        workletInitialized = true;
      } catch (err) {
        console.warn("[LiveAudioRecorder] AudioWorklet initialization failed, falling back to ScriptProcessor:", err);
      }
    }

    // Fallback: ScriptProcessorNode (runs on main thread)
    if (!workletInitialized) {
      this.processor = this.audioContext.createScriptProcessor(512, 1, 1);
      this.processor.onaudioprocess = (e) => {
        if (!this.isRecording) return;
        const inputData = e.inputBuffer.getChannelData(0);
        this.handleRawAudioData(inputData);
      };

      this.source.connect(this.analyser);
      this.analyser.connect(this.processor);
      this.processor.connect(this.audioContext.destination);
      this.processorType = "ScriptProcessor";
    }

    this.isRecording = true;
    this.startVolumePolling();

    if (this.onMetrics) {
      this.onMetrics({ event: "recorder_started", processorType: this.processorType });
    }
  }

  handleRawAudioData(float32Array) {
    const now = performance.now();
    const intervalMs = this.lastChunkTime ? Math.round(now - this.lastChunkTime) : 0;
    this.lastChunkTime = now;
    this.chunkCount++;

    const pcmBuffer = float32ToInt16PCM(float32Array);
    const base64Chunk = arrayBufferToBase64(pcmBuffer);

    if (this.onAudioChunk) {
      this.onAudioChunk(base64Chunk, {
        chunkIndex: this.chunkCount,
        intervalMs,
        byteLength: pcmBuffer.byteLength,
        processorType: this.processorType,
      });
    }
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

    if (this.workletNode) {
      try {
        this.workletNode.disconnect();
      } catch (e) {}
      this.workletNode = null;
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
      this.audioContext.close();
      this.audioContext = null;
    }

    if (this.onVolumeChange) {
      this.onVolumeChange(0);
    }
    this.lastChunkTime = null;
    this.chunkCount = 0;
  }
}

/**
 * Continuous PCM 24kHz Audio Stream Player for Gemini Responses
 * Features jitter queue scheduling, latency instrumentation, and instant interruption flush
 */
export class LiveAudioPlayer {
  constructor({ onVolumeChange, onPlaybackEnded, onFirstChunkPlayed } = {}) {
    this.onVolumeChange = onVolumeChange;
    this.onPlaybackEnded = onPlaybackEnded;
    this.onFirstChunkPlayed = onFirstChunkPlayed;
    this.audioContext = null;
    this.analyser = null;
    this.nextPlayTime = 0;
    this.activeSources = new Set();
    this.animFrameId = null;
    this.isPlaying = false;
    this.endTimeout = null;
    this.hasPlayedFirstChunkInTurn = false;
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
   * Enqueues base64 PCM 24kHz chunk into the Web Audio playback pipeline.
   * Jitter offset tuned to 60ms for low latency without voice clipping.
   */
  enqueueAudioChunk(base64Chunk) {
    this.init();
    try {
      if (this.endTimeout) {
        clearTimeout(this.endTimeout);
        this.endTimeout = null;
      }

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
      // Pre-buffer 60ms when starting fresh or recovering from network jitter to prevent voice breaking
      if (this.nextPlayTime < currentTime) {
        this.nextPlayTime = currentTime + 0.06;
      }

      source.start(this.nextPlayTime);

      if (!this.hasPlayedFirstChunkInTurn) {
        this.hasPlayedFirstChunkInTurn = true;
        const delayUntilPlayMs = Math.max(0, Math.round((this.nextPlayTime - currentTime) * 1000));
        if (this.onFirstChunkPlayed) {
          this.onFirstChunkPlayed({ delayUntilPlayMs });
        }
      }

      this.nextPlayTime += audioBuffer.duration;
      this.activeSources.add(source);
      this.isPlaying = true;

      source.onended = () => {
        this.activeSources.delete(source);
        if (this.activeSources.size === 0) {
          if (this.endTimeout) clearTimeout(this.endTimeout);
          this.endTimeout = setTimeout(() => {
            if (this.activeSources.size === 0) {
              this.isPlaying = false;
              this.hasPlayedFirstChunkInTurn = false;
              if (this.onPlaybackEnded) {
                this.onPlaybackEnded();
              }
            }
          }, 200);
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
      } catch (e) {}
    }
    if (this.endTimeout) {
      clearTimeout(this.endTimeout);
      this.endTimeout = null;
    }
    this.activeSources.clear();
    this.isPlaying = false;
    this.hasPlayedFirstChunkInTurn = false;
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
