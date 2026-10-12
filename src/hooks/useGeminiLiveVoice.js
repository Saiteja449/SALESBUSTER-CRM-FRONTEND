import { useState, useEffect, useRef, useCallback } from "react";
import { socket } from "../utils/socket.js";
import { LiveAudioRecorder, LiveAudioPlayer } from "../utils/audioStreamer.js";

/**
 * Custom React Hook for Gemini Multimodal Live API Real-Time Voice Chat
 * Coordinates bidirectional audio streaming over Socket.IO and live state management
 */
export function useGeminiLiveVoice() {
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [status, setStatus] = useState("idle"); // 'idle' | 'connecting' | 'listening' | 'tool_running' | 'speaking' | 'error'
  const [activeToolName, setActiveToolName] = useState(null);
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

  // Initialize player once
  useEffect(() => {
    playerRef.current = new LiveAudioPlayer({
      onVolumeChange: (vol) => {
        setOutputVolume(vol);
        if (vol > 0.05) {
          setIsPlaying(true);
          setStatus((prev) => (prev !== "tool_running" ? "speaking" : prev));
        }
      },
      onPlaybackEnded: () => {
        setIsPlaying(false);
        setOutputVolume(0);
        setStatus("listening");
      },
    });

    return () => {
      playerRef.current?.stop();
    };
  }, []);

  // Socket event subscriptions
  useEffect(() => {
    const handleStatus = (data) => {
      if (data.state === "connected") {
        setIsConnected(true);
        setStatus("listening");
        setError(null);
      } else if (data.state === "closed") {
        setIsConnected(false);
        setStatus("idle");
      } else if (data.state === "tool_running") {
        setStatus("tool_running");
        setActiveToolName(data.toolName);
      } else if (data.state === "tool_complete") {
        setActiveToolName(null);
        setStatus("speaking");
      }
    };

    const handleAudioOut = (data) => {
      if (data?.data && playerRef.current) {
        playerRef.current.enqueueAudioChunk(data.data);
      }
    };

    const handleTranscript = (data) => {
      if (data?.text) {
        currentAssistantTurnRef.current += data.text;
        setLiveTranscript(currentAssistantTurnRef.current);
      }
    };

    const handleInterrupted = () => {
      console.log("[Live Voice Hook] Interrupted by user");
      if (playerRef.current) {
        playerRef.current.flush();
      }
      setIsPlaying(false);
      setOutputVolume(0);
      setStatus("listening");
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
    };

    const handleError = (data) => {
      console.error("[Live Voice Hook] Socket voice error:", data);
      setError(data.message || "Voice session encountered an error.");
      setStatus("error");
    };

    socket.on("bi_voice_status", handleStatus);
    socket.on("bi_voice_audio_out", handleAudioOut);
    socket.on("bi_voice_transcript", handleTranscript);
    socket.on("bi_voice_interrupted", handleInterrupted);
    socket.on("bi_voice_turn_complete", handleTurnComplete);
    socket.on("bi_voice_error", handleError);

    return () => {
      socket.off("bi_voice_status", handleStatus);
      socket.off("bi_voice_audio_out", handleAudioOut);
      socket.off("bi_voice_transcript", handleTranscript);
      socket.off("bi_voice_interrupted", handleInterrupted);
      socket.off("bi_voice_turn_complete", handleTurnComplete);
      socket.off("bi_voice_error", handleError);
    };
  }, []);

  /**
   * Start Live Voice Session
   */
  const startLiveVoice = useCallback(
    async (preferredVoice = voiceName) => {
      setError(null);
      setStatus("connecting");
      setLiveTranscript("");
      currentAssistantTurnRef.current = "";

      try {
        // Ensure socket is connected
        if (!socket.connected) {
          socket.connect();
        }

        // Initialize Audio Recorder
        recorderRef.current = new LiveAudioRecorder({
          onAudioChunk: (base64Chunk) => {
            if (!isMuted && socket.connected) {
              socket.emit("bi_voice_audio_in", base64Chunk);
            }
          },
          onVolumeChange: (vol) => {
            setInputVolume(vol);
          },
        });

        await recorderRef.current.start();
        setIsRecording(true);

        // Tell backend to start Gemini Live Session
        socket.emit("bi_voice_start", { voiceName: preferredVoice, model: "gemini-3.8-live" });
      } catch (err) {
        console.error("[Live Voice Hook] Failed to start:", err);
        setError(err.message || "Microphone access denied or audio initialization failed.");
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
