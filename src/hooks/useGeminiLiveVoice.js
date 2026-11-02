import { useState, useEffect, useRef, useCallback } from "react";
import { socket } from "../utils/socket.js";
import { LiveAudioRecorder, LiveAudioPlayer } from "../utils/audioStreamer.js";

/**
 * Custom React Hook for Gemini Multimodal Live API Real-Time Voice Chat
 * Coordinates bidirectional audio streaming over Socket.IO and live state management
 * with explicit session readiness handshake, AudioWorklet capture, and correlated timing.
 * 
 * Additively extended with:
 * - turns: array of { id, role, text, ts }
 * - sessionStartedAt: ISO string
 * - onSessionEnd({ turns, durationMs }): optional callback
 * - retry(): reconnects with same parameters
 */
export function useGeminiLiveVoice(options = {}) {
  const onSessionEndRef = useRef(options?.onSessionEnd);
  const turnsRef = useRef([]);

  useEffect(() => {
    onSessionEndRef.current = options?.onSessionEnd;
  }, [options?.onSessionEnd]);

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
  const [turns, setTurns] = useState([]);
  const [sessionStartedAt, setSessionStartedAt] = useState(null);
  const [error, setError] = useState(null);
  const [voiceName, setVoiceName] = useState("Aoede");
  const [isMuted, setIsMuted] = useState(false);
  const [pendingEmailDraft, setPendingEmailDraft] = useState(null);
  const [latestSavedTurn, setLatestSavedTurn] = useState(null);

  useEffect(() => {
    turnsRef.current = turns;
  }, [turns]);

  const recorderRef = useRef(null);
  const playerRef = useRef(null);
  const currentAssistantTurnRef = useRef("");
  const sessionReadyPromiseRef = useRef(null);
  const startupTimeoutRef = useRef(null);
  const lastStartArgsRef = useRef({ param1: null, param2: null });

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
      setSessionStartedAt(new Date().toISOString());

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
        setSessionStartedAt(new Date().toISOString());
        if (sessionReadyPromiseRef.current) {
          sessionReadyPromiseRef.current.resolve(data);
          sessionReadyPromiseRef.current = null;
        }
      } else if (data.state === "closed") {
        setIsConnected(false);
        setStatus("idle");
      } else if (data.state === "processing") {
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
          const userTurn = {
            id: `turn_u_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            role: "user",
            text: data.text,
            ts: new Date().toISOString(),
          };
          setTurns((prev) => {
            const updated = [...prev, userTurn];
            turnsRef.current = updated;
            return updated;
          });
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
        const asstTurn = {
          id: `turn_a_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          role: "assistant",
          text: finishedTurn,
          ts: new Date().toISOString(),
        };
        setConversationTurns((prev) => [
          ...prev,
          { role: "assistant", text: finishedTurn, timestamp: asstTurn.ts },
        ]);
        setTurns((prev) => {
          const updated = [...prev, asstTurn];
          turnsRef.current = updated;
          return updated;
        });
        currentAssistantTurnRef.current = "";
        setLiveTranscript("");
      }

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
      if (status !== "idle" && status !== "error") {
        setStatus("reconnecting");
      }
    };

    const handleConnect = () => {
      console.log("[Live Voice Hook] Socket re-connected successfully");
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

    const handleEmailReportConfirmationRequired = (data) => {
      console.log("[Live Voice Hook] Email report confirmation required:", data);
      setPendingEmailDraft(data);
    };

    const handleEmailReportSent = (data) => {
      console.log("[Live Voice Hook] Email report sent successfully:", data);
      setPendingEmailDraft((prev) => (prev ? { ...prev, status: "sent", sentData: data } : null));
      setTimeout(() => {
        setPendingEmailDraft((prev) => (prev?.status === "sent" ? null : prev));
      }, 6000);
    };

    const handleEmailReportCancelled = (data) => {
      console.log("[Live Voice Hook] Email report cancelled:", data);
      setPendingEmailDraft((prev) => (prev ? { ...prev, status: "cancelled", cancelData: data } : null));
      setTimeout(() => {
        setPendingEmailDraft((prev) => (prev?.status === "cancelled" ? null : prev));
      }, 4000);
    };

    socket.on("email_report_confirmation_required", handleEmailReportConfirmationRequired);
    socket.on("email_report_sent", handleEmailReportSent);
    socket.on("email_report_cancelled", handleEmailReportCancelled);

    const handleTurnSaved = (data) => {
      console.log("[Live Voice Hook] Voice turn persisted to DB:", data);
      setLatestSavedTurn(data);
    };
    socket.on("bi_voice_turn_saved", handleTurnSaved);

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
      socket.off("email_report_confirmation_required", handleEmailReportConfirmationRequired);
      socket.off("email_report_sent", handleEmailReportSent);
      socket.off("email_report_cancelled", handleEmailReportCancelled);
      socket.off("bi_voice_turn_saved", handleTurnSaved);
    };
  }, [status]);

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

    const durationMs = timingRef.current.sessionStartMs
      ? Math.max(0, Date.now() - timingRef.current.sessionStartMs)
      : 0;

    if (onSessionEndRef.current) {
      onSessionEndRef.current({ turns: turnsRef.current, durationMs });
    }

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
   * Start Live Voice Session with explicit session readiness handshake.
   */
  const startLiveVoice = useCallback(
    async (param1 = null, param2 = null) => {
      lastStartArgsRef.current = { param1, param2 };
      let preferredVoice = voiceName;
      let targetChatId = null;

      if (param1 && typeof param1 === "object") {
        preferredVoice = param1.voiceName || voiceName;
        targetChatId = param1.chatId || null;
      } else if (typeof param1 === "string") {
        if (["Aoede", "Charon", "Fenrir", "Kore", "Puck"].includes(param1)) {
          preferredVoice = param1;
          targetChatId = param2;
        } else {
          targetChatId = param1;
          if (param2) preferredVoice = param2;
        }
      }
      setError(null);
      setStatus("connecting");
      setLiveTranscript("");
      setTurns([]);
      turnsRef.current = [];
      currentAssistantTurnRef.current = "";
      timingRef.current.sessionStartMs = Date.now();

      try {
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

        const sessionReadyPromise = new Promise((resolve, reject) => {
          sessionReadyPromiseRef.current = { resolve, reject };
          startupTimeoutRef.current = setTimeout(() => {
            reject(new Error("Voice assistant connection timed out. Please retry."));
          }, 12000);
        });

        socket.emit("bi_voice_start", { voiceName: preferredVoice, chatId: targetChatId });
        await sessionReadyPromise;

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
    [voiceName, isMuted, stopLiveVoice]
  );

  /**
   * Retry voice connection
   */
  const retry = useCallback(() => {
    stopLiveVoice();
    setTimeout(() => {
      startLiveVoice(lastStartArgsRef.current.param1, lastStartArgsRef.current.param2);
    }, 200);
  }, [startLiveVoice, stopLiveVoice]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  const confirmEmailReport = useCallback((draftId, confirmed) => {
    console.log(`[Live Voice Hook] confirmEmailReport: draftId=${draftId}, confirmed=${confirmed}`);
    if (confirmed) {
      setPendingEmailDraft((prev) => (prev ? { ...prev, status: "sending" } : null));
    }
    socket.emit("bi_voice_action_confirm", {
      action: "send_email_report",
      draftId,
      confirmed,
    });
  }, []);

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
    turns,
    sessionStartedAt,
    error,
    voiceName,
    isMuted,
    setVoiceName,
    startLiveVoice,
    stopLiveVoice,
    toggleMute,
    interrupt,
    retry,
    pendingEmailDraft,
    setPendingEmailDraft,
    confirmEmailReport,
    latestSavedTurn,
  };
}

export default useGeminiLiveVoice;
