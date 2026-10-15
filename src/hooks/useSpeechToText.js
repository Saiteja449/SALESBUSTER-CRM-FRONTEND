import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Custom hook for Speech-to-Text (Voice Typing / Dictation)
 * Uses browser's native SpeechRecognition / webkitSpeechRecognition API
 */
export function useSpeechToText() {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);
  const onTranscriptChangeRef = useRef(null);
  const baseTextRef = useRef("");

  const SpeechRecognition =
    typeof window !== "undefined"
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null;

  const isSupported = !!SpeechRecognition;

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        // Recognition might already be stopped
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback(
    (onTranscriptChange, baseText = "") => {
      if (!isSupported) {
        setError("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
        return;
      }

      // Stop any existing session
      stopListening();
      setError(null);

      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = typeof navigator !== "undefined" && navigator.language ? navigator.language : "en-US";

        onTranscriptChangeRef.current = onTranscriptChange;
        baseTextRef.current = baseText ? baseText.trim() : "";

        let accumulatedFinal = "";

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event) => {
          let currentInterim = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              accumulatedFinal += (accumulatedFinal ? " " : "") + transcript.trim();
            } else {
              currentInterim += transcript;
            }
          }

          const spokenTotal = [accumulatedFinal, currentInterim].filter(Boolean).join(" ").trim();
          const fullResult = baseTextRef.current
            ? `${baseTextRef.current} ${spokenTotal}`
            : spokenTotal;

          if (onTranscriptChangeRef.current) {
            onTranscriptChangeRef.current(fullResult);
          }
        };

        recognition.onerror = (event) => {
          console.warn("[SpeechToText] Recognition error:", event.error);
          if (event.error === "not-allowed" || event.error === "service-not-allowed") {
            setError("Microphone access was denied. Please allow microphone permissions.");
          } else if (event.error !== "no-speech") {
            setError(`Speech recognition error: ${event.error}`);
          }
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
          recognitionRef.current = null;
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (err) {
        console.error("[SpeechToText] Failed to start:", err);
        setError("Could not start microphone recording.");
        setIsListening(false);
      }
    },
    [isSupported, stopListening]
  );

  const toggleListening = useCallback(
    (onTranscriptChange, baseText = "") => {
      if (isListening) {
        stopListening();
      } else {
        startListening(onTranscriptChange, baseText);
      }
    },
    [isListening, startListening, stopListening]
  );

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore
        }
      }
    };
  }, []);

  return {
    isSupported,
    isListening,
    error,
    startListening,
    stopListening,
    toggleListening,
    clearError: () => setError(null),
  };
}
