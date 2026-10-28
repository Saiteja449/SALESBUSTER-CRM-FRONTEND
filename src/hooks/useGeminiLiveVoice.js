import { useState, useEffect, useRef, useCallback } from "react";
import { socket } from "../utils/socket.js";
import { LiveAudioRecorder, LiveAudioPlayer } from "../utils/audioStreamer.js";

/**
 * Custom React Hook for Gemini Multimodal Live API Real-Time Voice Chat
 * Coordinates bidirectional audio streaming over Socket.IO and live state management
 * with explicit session readiness handshake, AudioWorklet capture, and correlated timing.
 */
export function useGeminiLiveVoice() {
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  // Accurate UI states: 'idle' | 'connecting' | 'listening' | 'processing' | 'tool_running' | 'speaking' | 'reconnecting' | 'error'
  const [status, setStatus] = useState("idle");
  const [activeToolName, setActiveToolName] = useState(null);
  const [toolDetails, setToolDetails] = useState(null);
  const [inputVolume, setInputVolume] = useState(0);
  const [outputVolume, setOutputVolume] = useState(0);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [conversationTurns, setConversationTurns] = useState([]);
  const [error, setError] = useState(null);
  const [voiceName, setVoiceName] = useState("Aoede");
  const [isMuted, setIsMuted] = useState(false);

  const recorderRef = useRef(null);
  const playerRef = useRef(null);
  const currentAssistantTurnRef = useRef("");
  const sessionReadyPromiseRef = useRef(null);
  const startupTimeoutRef = useRef(null);

  // Timing Instrumentation (Local session metrics)
  const timingRef = useRef({
    sessionStartMs: null,
    sessionReadyMs: null,
    turnStartMs: null,
    firstAudioReceivedMs: null,
    firstAudioPlayedMs: null,
  });

  // Initialize player once
  useEffect(() => {
    playerRef.current = new LiveAudioPlayer({
      onVolumeChange: (vol) => {
        setOutputVolume(vol);
        if (vol > 0.05) {
          setIsPlaying(true);
        }
      },
      onFirstChunkPlayed: ({ delayUntilPlayMs }) => {
        timingRef.current.firstAudioPlayedMs = Date.now();
        console.log(`[Voice Telemetry] First audio played to speaker (queue delay: ${delayUntilPlayMs}ms)`);
      },
      onPlaybackEnded: () => {
        setIsPlaying(false);
        setOutputVolume(0);
        setStatus((prev) => (prev === "speaking" ? "listening" : prev));
      },
    });

    return () => {
      playerRef.current?.stop();
    };
  }, []);

  // Socket event subscriptions
  useEffect(() => {
    // 1. Backend Session-Ready Handshake
    const handleReady = (data) => {
      console.log("[Live Voice Hook] Session ready acknowledged by backend:", data);
      if (startupTimeoutRef.current) {
        clearTimeout(startupTimeoutRef.current);
        startupTimeoutRef.current = null;
      }
      timingRef.current.sessionReadyMs = Date.now();
      setIsConnected(true);
      setError(null);

      if (sessionReadyPromiseRef.current) {
        sessionReadyPromiseRef.current.resolve(data);
        sessionReadyPromiseRef.current = null;
      }
    };

    // 2. Explicit Status Transitions
    const handleStatus = (data) => {
      if (data.state === "connected") {
        setIsConnected(true);
        setError(null);
        if (sessionReadyPromiseRef.current) {
          sessionReadyPromiseRef.current.resolve(data);
          sessionReadyPromiseRef.current = null;
        }
      } else if (data.state === "closed") {
        setIsConnected(false);
        setStatus("idle");
      } else if (data.state === "processing") {
        // User speech was received, Gemini is processing turn
        setStatus("processing");
      } else if (data.state === "tool_running") {
        setStatus("tool_running");
        setActiveToolName(data.toolName);
        setToolDetails({
          toolName: data.toolName,
          friendlyLabel: data.friendlyLabel,
          count: data.count || 1,
          concurrent: Boolean(data.concurrent),
        });
      } else if (data.state === "tool_complete") {
        setActiveToolName(null);
        setToolDetails(null);
        // Do NOT transition back to listening if model will speak next
        setStatus("processing");
      } else if (data.state === "speaking") {
        setStatus("speaking");
      } else if (data.state === "listening") {
        setStatus("listening");
      }
    };

    const handleAudioOut = (data) => {
      if (!timingRef.current.firstAudioReceivedMs) {
        timingRef.current.firstAudioReceivedMs = Date.now();
        console.log("[Voice Telemetry] First audio chunk received from backend");
      }

      if (data?.data && playerRef.current) {
        playerRef.current.enqueueAudioChunk(data.data);
      }
    };

    const handleTranscript = (data) => {
      if (data?.text) {
        if (data.role === "user") {
          setLiveTranscript(`You: ${data.text}`);
        } else {
          currentAssistantTurnRef.current += data.text;
          setLiveTranscript(currentAssistantTurnRef.current);
        }
      }
    };

    const handleInterrupted = () => {
      console.log("[Live Voice Hook] Interrupted by user speech");
      if (playerRef.current) {
        playerRef.current.flush();
      }
      setIsPlaying(false);
      setOutputVolume(0);
      setStatus("listening");
      timingRef.current.firstAudioReceivedMs = null;
      timingRef.current.firstAudioPlayedMs = null;
    };

    const handleTurnComplete = () => {
      if (currentAssistantTurnRef.current.trim()) {
        const finishedTurn = currentAssistantTurnRef.current.trim();
        setConversationTurns((prev) => [
          ...prev,
          { role: "assistant", text: finishedTurn, timestamp: new Date().toISOString() },
        ]);
        currentAssistantTurnRef.current = "";
        setLiveTranscript("");
      }

      // Reset turn timing markers
      timingRef.current.turnStartMs = null;
      timingRef.current.firstAudioReceivedMs = null;
      timingRef.current.firstAudioPlayedMs = null;

      setTimeout(() => {
        setIsPlaying(false);
        setOutputVolume(0);
        setStatus("listening");
      }, 400);
    };

    const handleError = (data) => {
      console.error("[Live Voice Hook] Voice error received:", data);
      if (startupTimeoutRef.current) {
        clearTimeout(startupTimeoutRef.current);
        startupTimeoutRef.current = null;
      }
      if (sessionReadyPromiseRef.current) {
        sessionReadyPromiseRef.current.reject(new Error(data.message || "Voice session failed"));
        sessionReadyPromiseRef.current = null;
      }
      setError(data.message || "Voice session encountered an error.");
      setStatus("error");
      if (recorderRef.current) {
        recorderRef.current.stop();
        recorderRef.current = null;
      }
      setIsRecording(false);
    };

    const handleDisconnect = () => {
      console.warn("[Live Voice Hook] Socket disconnected, setting state to reconnecting");
      setStatus("reconnecting");
    };

    const handleConnect = () => {
      if (status === "reconnecting") {
        setStatus("listening");
      }
    };

    socket.on("bi_voice_ready", handleReady);
    socket.on("bi_voice_status", handleStatus);
    socket.on("bi_voice_audio_out", handleAudioOut);
    socket.on("bi_voice_transcript", handleTranscript);
    socket.on("bi_voice_interrupted", handleInterrupted);
    socket.on("bi_voice_turn_complete", handleTurnComplete);
    socket.on("bi_voice_error", handleError);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect", handleConnect);

    return () => {
      socket.off("bi_voice_ready", handleReady);
      socket.off("bi_voice_status", handleStatus);
      socket.off("bi_voice_audio_out", handleAudioOut);
      socket.off("bi_voice_transcript", handleTranscript);
      socket.off("bi_voice_interrupted", handleInterrupted);
      socket.off("bi_voice_turn_complete", handleTurnComplete);
      socket.off("bi_voice_error", handleError);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect", handleConnect);
    };
  }, [status]);

  /**
   * Start Live Voice Session with explicit session readiness handshake.
   * GATES microphone streaming until backend confirms readiness.
   */
  const startLiveVoice = useCallback(
    async (preferredVoice = voiceName) => {
      setError(null);
      setStatus("connecting");
      setLiveTranscript("");
      currentAssistantTurnRef.current = "";
      timingRef.current.sessionStartMs = Date.now();

      try {
        // Ensure socket is connected
        if (!socket.connected) {
          socket.connect();
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => resolve(), 4000);
            socket.once("connect", () => {
              clearTimeout(timeout);
              resolve();
            });
            socket.once("connect_error", (err) => {
              clearTimeout(timeout);
              reject(err);
            });
          });
        }

        // Setup session readiness promise with safety timeout (12s)
        const sessionReadyPromise = new Promise((resolve, reject) => {
          sessionReadyPromiseRef.current = { resolve, reject };
          startupTimeoutRef.current = setTimeout(() => {
            reject(new Error("Voice assistant connection timed out. Please retry."));
          }, 12000);
        });

        // Request backend to start live session
        socket.emit("bi_voice_start", { voiceName: preferredVoice });

        // AWAIT explicit backend confirmation before capturing microphone audio!
        await sessionReadyPromise;

        // Initialize Audio Recorder (Uses AudioWorklet if supported, otherwise ScriptProcessor)
        recorderRef.current = new LiveAudioRecorder({
          onAudioChunk: (base64Chunk) => {
            if (!isMuted && socket.connected) {
              if (!timingRef.current.turnStartMs) {
                timingRef.current.turnStartMs = Date.now();
              }
              socket.emit("bi_voice_audio_in", base64Chunk);
            }
          },
          onVolumeChange: (vol) => {
            setInputVolume(vol);
          },
        });

        await recorderRef.current.start();
        setIsRecording(true);
        setStatus("listening");
      } catch (err) {
        console.error("[Live Voice Hook] Start session failed:", err);
        if (startupTimeoutRef.current) {
          clearTimeout(startupTimeoutRef.current);
          startupTimeoutRef.current = null;
        }
        sessionReadyPromiseRef.current = null;
        setError(err.message || "Failed to initialize Gemini Live voice session.");
        setStatus("error");
        stopLiveVoice();
      }
    },
    [voiceName, isMuted]
  );

  /**
   * Stop Live Voice Session
   */
  const stopLiveVoice = useCallback(() => {
    if (startupTimeoutRef.current) {
      clearTimeout(startupTimeoutRef.current);
      startupTimeoutRef.current = null;
    }
    if (sessionReadyPromiseRef.current) {
      sessionReadyPromiseRef.current.reject(new Error("Voice session stopped by user"));
      sessionReadyPromiseRef.current = null;
    }

    if (recorderRef.current) {
      recorderRef.current.stop();
      recorderRef.current = null;
    }
    if (playerRef.current) {
      playerRef.current.flush();
    }
    socket.emit("bi_voice_stop");
    setIsRecording(false);
    setIsConnected(false);
    setIsPlaying(false);
    setStatus("idle");
    setInputVolume(0);
    setOutputVolume(0);
    setActiveToolName(null);
    setToolDetails(null);
  }, []);

  /**
   * Toggle Mute Microphone
   */
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  /**
   * Manual Interrupt (Stops current assistant speech)
   */
  const interrupt = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.flush();
    }
    setIsPlaying(false);
    setOutputVolume(0);
    setStatus("listening");
  }, []);

  return {
    isConnected,
    isRecording,
    isPlaying,
    status,
    activeToolName,
    toolDetails,
    inputVolume,
    outputVolume,
    liveTranscript,
    conversationTurns,
    error,
    voiceName,
    isMuted,
    setVoiceName,
    startLiveVoice,
    stopLiveVoice,
    toggleMute,
    interrupt,
  };
}
