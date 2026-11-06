import { useState, useCallback, useRef, useEffect } from "react";
import axios from "axios";
import { API_ENDPOINTS } from "../utils/constants.js";
import { extractTextContent } from "../components/ai/FormattedAIResponse.jsx";

// Helper to generate a unique ID inside event handlers
function generateMessageId(prefix = "msg") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function useBIChat({ activeSessionId, onSessionCreated }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSessionLoading, setIsSessionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [limitError, setLimitError] = useState(null); // { resetTime, message }
  const [addonRequired, setAddonRequired] = useState(false);
  const [options, setOptions] = useState(null);
  const [lastUserPrompt, setLastUserPrompt] = useState("");
  const [isOffline, setIsOffline] = useState(() => (typeof navigator !== "undefined" ? !navigator.onLine : false));

  const abortControllerRef = useRef(null);

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Fetch session message history
  const loadSessionMessages = useCallback(async (chatId) => {
    if (!chatId) {
      setMessages([]);
      setOptions(null);
      setError(null);
      setLimitError(null);
      setAddonRequired(false);
      setIsSessionLoading(false);
      return;
    }

    setIsSessionLoading(true);
    setMessages([]); // Clear previous messages immediately while loading new session
    setError(null);
    setLimitError(null);
    setAddonRequired(false);

    try {
      const res = await axios.get(API_ENDPOINTS.AI_ASSISTANT.SESSION(chatId));
      if (res.data?.success && res.data?.data) {
        const msgs = (res.data.data.messages || []).map((m) => ({
          ...m,
          content: extractTextContent(m.content),
          emailDraft: m.emailDraft || null,
        }));
        setMessages(msgs);
        const lastMsg = msgs[msgs.length - 1];
        if (lastMsg && lastMsg.role === "assistant" && Array.isArray(lastMsg.options) && lastMsg.options.length > 0) {
          setOptions(lastMsg.options);
        } else {
          setOptions(null);
        }
      }
    } catch (err) {
      console.error("[useBIChat] Error loading session messages:", err);
      setError(err.response?.data?.message || "Failed to load conversation history.");
    } finally {
      setIsSessionLoading(false);
    }
  }, []);

  // Abort ongoing request
  const stopRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setLoading(false);
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const sendMessage = useCallback(
    async (text, optionsArg = {}) => {
      const trimmed = text?.trim();
      if (!trimmed || loading) return { success: false };

      if (typeof navigator !== "undefined" && !navigator.onLine) {
        setIsOffline(true);
        setError("You are currently offline. Check your internet connection.");
        return { success: false, offline: true };
      }

      setError(null);
      setLimitError(null);
      setAddonRequired(false);
      setLastUserPrompt(trimmed);
      setOptions(null);

      // Create stable message IDs
      const userMsgId = generateMessageId("user");
      const userMessage = {
        id: userMsgId,
        role: "user",
        content: trimmed,
        timestamp: new Date().toISOString(),
        isVoice: Boolean(optionsArg.isVoice),
      };

      setMessages((prev) => [...prev, userMessage]);
      setLoading(true);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const res = await axios.post(
          API_ENDPOINTS.AI_ASSISTANT.CHAT,
          {
            message: trimmed,
            chatId: activeSessionId || undefined,
          },
          {
            signal: controller.signal,
          }
        );

        if (res.data?.success) {
          const { reply, options: returnedOptions, chatId: returnedChatId, toolsUsed, modelUsed, emailDraft } = res.data;

          if (!activeSessionId && returnedChatId && onSessionCreated) {
            onSessionCreated(returnedChatId);
          }

          const assistantMsgId = generateMessageId("ast");
          const cleanReply = extractTextContent(reply);
          const assistantMessage = {
            id: assistantMsgId,
            role: "assistant",
            content: cleanReply || "No data found for that query.",
            options: returnedOptions || [],
            toolsUsed: toolsUsed || [],
            emailDraft: emailDraft || null,
            modelUsed: modelUsed || "Gemini 3.5 Flash",
            timestamp: new Date().toISOString(),
          };

          setMessages((prev) => [...prev, assistantMessage]);

          if (Array.isArray(returnedOptions) && returnedOptions.length > 0) {
            setOptions(returnedOptions);
          } else {
            setOptions(null);
          }

          setLoading(false);
          abortControllerRef.current = null;
          return { success: true, assistantMsgId };
        } else {
          const errMsg = res.data?.message || "Failed to generate reply.";
          setError(errMsg);
          setLoading(false);
          abortControllerRef.current = null;
          return { success: false, error: errMsg };
        }
      } catch (err) {
        if (axios.isCancel(err) || err.name === "CanceledError" || err.name === "AbortError") {
          // User stopped request
          setLoading(false);
          abortControllerRef.current = null;
          return { success: false, aborted: true };
        }

        const status = err.response?.status;
        const data = err.response?.data;
        const msg = data?.message || err.message || "Error communicating with BI Analyst engine.";

        if (status === 429) {
          // Daily limit error
          setLimitError({
            message: msg,
            resetTime: data?.resetTime || "00:00 UTC",
          });
        } else if (status === 403) {
          // Add-on required error
          setAddonRequired(true);
        } else {
          setError(msg);
        }

        // Mark user message as failed or append error info
        setMessages((prev) =>
          prev.map((m) => (m.id === userMsgId ? { ...m, failed: true, errorReason: msg } : m))
        );

        setLoading(false);
        abortControllerRef.current = null;
        return { success: false, error: msg, status };
      }
    },
    [activeSessionId, loading, onSessionCreated]
  );

  const retryLastMessage = useCallback(() => {
    if (lastUserPrompt) {
      sendMessage(lastUserPrompt);
    }
  }, [lastUserPrompt, sendMessage]);

  const regenerateResponse = useCallback(
    (assistantMsgId) => {
      // Find the user message that preceded this assistant message
      const idx = messages.findIndex((m) => m.id === assistantMsgId);
      if (idx > 0) {
        const prevUserMsg = messages[idx - 1];
        if (prevUserMsg && prevUserMsg.role === "user") {
          // Remove the assistant message (and any subsequent) and re-send
          setMessages((prev) => prev.slice(0, idx));
          sendMessage(prevUserMsg.content);
        }
      } else if (lastUserPrompt) {
        retryLastMessage();
      }
    },
    [messages, lastUserPrompt, retryLastMessage, sendMessage]
  );

  const confirmEmailReport = useCallback(async (draftId, confirmed) => {
    try {
      const res = await axios.post(API_ENDPOINTS.AI_ASSISTANT.CONFIRM_EMAIL_REPORT, {
        draftId,
        confirmed,
      });
      if (res.data?.success) {
        setMessages((prev) =>
          prev.map((m) => {
            if (m.emailDraft?.draftId === draftId) {
              return {
                ...m,
                emailDraft: {
                  ...m.emailDraft,
                  status: confirmed ? "sent" : "cancelled",
                },
              };
            }
            return m;
          })
        );
        return { success: true, status: confirmed ? "sent" : "cancelled" };
      }
      return { success: false, error: res.data?.message };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || err.message };
    }
  }, []);

  const clearChat = useCallback(() => {
    stopRequest();
    setMessages([]);
    setOptions(null);
    setError(null);
    setLimitError(null);
    setAddonRequired(false);
  }, [stopRequest]);

  return {
    messages,
    setMessages,
    loading,
    isSessionLoading,
    error,
    limitError,
    addonRequired,
    options,
    lastUserPrompt,
    isOffline,
    sendMessage,
    stopRequest,
    retryLastMessage,
    regenerateResponse,
    clearChat,
    loadSessionMessages,
    confirmEmailReport,
  };
}

export default useBIChat;

