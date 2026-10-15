import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  Sparkles,
  ArrowUp,
  Plus,
  Trash2,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  PanelLeftClose,
  PanelLeft,
  Clock,
  TrendingUp,
  Users,
  Phone,
  MessageSquare,
  BarChart3,
  Bot,
  AlertCircle,
  Mic,
  MicOff,
  Radio,
  X,
  HelpCircle,
  CornerDownRight,
  Volume2,
  VolumeX,
  ChevronDown,
  Database,
  Info,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import { API_ENDPOINTS } from "../utils/constants.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useGeminiLiveVoice } from "../hooks/useGeminiLiveVoice.js";
import { useTextToSpeech } from "../hooks/useTextToSpeech.js";
import { useSpeechToText } from "../hooks/useSpeechToText.js";
import GeminiLiveVoiceModal from "../components/ai/GeminiLiveVoiceModal.jsx";
import FormattedAIResponse from "../components/ai/FormattedAIResponse.jsx";

// Supported CRM Data Capabilities
const DATA_CAPABILITIES = [
  {
    title: "Leads & Conversion Pipeline",
    desc: "Stage distribution (New, Follow Up, Converted, Lost), intake dates, and qualification notes.",
    icon: TrendingUp,
  },
  {
    title: "Salesperson Performance",
    desc: "Assigned lead count, win rates, conversion speed, and active workload by representative.",
    icon: Users,
  },
  {
    title: "Follow-Up Schedules",
    desc: "Overdue tasks, today's call queue, scheduled customer touches, and pending action items.",
    icon: Phone,
  },
  {
    title: "Service & Product Demand",
    desc: "Lead volume categorized by requested offerings and service interests.",
    icon: BarChart3,
  },
  {
    title: "WhatsApp Communication",
    desc: "Inbound customer activity, response responsiveness, and unreplied message tracking.",
    icon: MessageSquare,
  },
];

// Suggested questions when no messages yet
const SUGGESTED_PROMPTS = [
  {
    icon: TrendingUp,
    category: "Pipeline & Conversion",
    title: "Conversion & Growth",
    prompt: "What is our lead-to-won conversion rate this month?",
  },
  {
    icon: Users,
    category: "Team Performance",
    title: "Sales Leaderboard",
    prompt: "Which salesperson generated the most won leads and highest conversion?",
  },
  {
    icon: Clock,
    category: "Lead Inflow",
    title: "Morning Inflow",
    prompt: "How many new leads came in this morning compared to yesterday?",
  },
  {
    icon: Phone,
    category: "Task Schedules",
    title: "Pending Follow-ups",
    prompt: "How many follow-ups are overdue or scheduled for today?",
  },
  {
    icon: MessageSquare,
    category: "Messaging Activity",
    title: "WhatsApp Engagement",
    prompt: "Which active leads haven't received a WhatsApp reply yet?",
  },
  {
    icon: BarChart3,
    category: "Offerings",
    title: "Service Breakdown",
    prompt: "Give me a summary of leads grouped by service offering.",
  },
];

// Helper to group sessions by time periods (Today, Yesterday, Previous 7 Days, Older)
function groupSessionsByDate(sessions) {
  const groups = {
    Today: [],
    Yesterday: [],
    "Previous 7 Days": [],
    Older: [],
  };

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 86400000;
  const startOfLast7Days = startOfToday - 7 * 86400000;

  sessions.forEach((s) => {
    const time = new Date(s.updatedAt || s.createdAt || Date.now()).getTime();
    if (time >= startOfToday) {
      groups["Today"].push(s);
    } else if (time >= startOfYesterday) {
      groups["Yesterday"].push(s);
    } else if (time >= startOfLast7Days) {
      groups["Previous 7 Days"].push(s);
    } else {
      groups["Older"].push(s);
    }
  });

  return groups;
}

// Render formatted AI response using structured Markdown parser
const RenderFormattedContent = FormattedAIResponse;

export default function BIAnalyst() {
  const { organization } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const [feedbackState, setFeedbackState] = useState({});
  const [error, setError] = useState(null);
  const [lastPrompt, setLastPrompt] = useState("");
  const [activeOptions, setActiveOptions] = useState(null);
  const [isLiveVoiceModalOpen, setIsLiveVoiceModalOpen] = useState(false);
  const [showScopeModal, setShowScopeModal] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState(null);
  const [deletingSession, setDeletingSession] = useState(false);

  // Text-To-Speech (Speak Loud for every message)
  const {
    speakingMessageId,
    speakMessage,
    stopSpeaking,
    voices: ttsVoices,
    selectedVoiceName,
    setVoice: setTtsVoice,
  } = useTextToSpeech();

  // Speech-To-Text (Voice Typing into input)
  const {
    isListening: isVoiceTyping,
    error: speechToTextError,
    toggleListening: toggleVoiceTyping,
    stopListening: stopVoiceTyping,
    clearError: clearSpeechError,
  } = useSpeechToText();

  const handleToggleVoiceTyping = () => {
    toggleVoiceTyping((newText) => {
      setInputValue(newText);
    }, inputValue);
  };

  // Gemini Multimodal Live API Voice Hook
  const {
    isConnected: isLiveConnected,
    isRecording: isLiveRecording,
    isPlaying: isLivePlaying,
    status: liveStatus,
    activeToolName: liveActiveToolName,
    inputVolume: liveInputVolume,
    outputVolume: liveOutputVolume,
    liveTranscript,
    conversationTurns: liveConversationTurns,
    error: liveVoiceError,
    voiceName,
    isMuted: isLiveMuted,
    setVoiceName,
    startLiveVoice,
    stopLiveVoice,
    toggleMute: toggleLiveMute,
    interrupt: interruptLive,
  } = useGeminiLiveVoice();

  // Sync finished spoken turns into chat message history
  useEffect(() => {
    if (liveConversationTurns.length > 0) {
      const lastTurn = liveConversationTurns[liveConversationTurns.length - 1];
      setMessages((prev) => {
        const alreadyExists = prev.some(
          (m) =>
            m.content === lastTurn.text &&
            Math.abs(new Date(m.timestamp || 0) - new Date(lastTurn.timestamp)) < 4000
        );
        if (!alreadyExists) {
          return [
            ...prev,
            {
              id: `voice_${Date.now()}`,
              role: lastTurn.role,
              content: lastTurn.text,
              timestamp: lastTurn.timestamp,
            },
          ];
        }
        return prev;
      });
    }
  }, [liveConversationTurns]);

  const handleOpenLiveVoice = () => {
    setIsLiveVoiceModalOpen(true);
    startLiveVoice();
  };

  const handleCloseLiveVoice = () => {
    stopLiveVoice();
    setIsLiveVoiceModalOpen(false);
  };

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const chatScrollRef = useRef(null);

  // Auto-scroll chat container strictly internally
  const scrollToBottom = () => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTo({
        top: chatScrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchSessions();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Adjust textarea height dynamically like ChatGPT
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [inputValue]);

  // Load chat session list
  const fetchSessions = async () => {
    try {
      const res = await axios.get(API_ENDPOINTS.AI_ASSISTANT.SESSIONS);
      const sessionList = res.data.data || [];
      setSessions(sessionList);

      if (sessionList.length > 0 && !activeSessionId) {
        loadSession(sessionList[0].id);
      } else if (sessionList.length === 0) {
        setMessages([]);
        setActiveSessionId(null);
      }
    } catch (err) {
      console.warn("Failed to fetch sessions:", err);
    }
  };

  // Load specific chat session
  const loadSession = async (chatId) => {
    try {
      stopSpeaking();
      stopVoiceTyping();
      setActiveSessionId(chatId);
      setError(null);
      clearSpeechError();
      const res = await axios.get(API_ENDPOINTS.AI_ASSISTANT.SESSION(chatId));
      if (res.data.success && res.data.data) {
        const msgs = res.data.data.messages || [];
        setMessages(msgs);
        const lastMsg = msgs[msgs.length - 1];
        if (
          lastMsg &&
          lastMsg.role === "assistant" &&
          Array.isArray(lastMsg.options) &&
          lastMsg.options.length > 0
        ) {
          setActiveOptions(lastMsg.options);
        } else {
          setActiveOptions(null);
        }
      }
    } catch (err) {
      console.error("Failed to load session:", err);
      setError("Failed to load conversation history.");
    }
  };

  // Start new fresh chat
  const handleStartNewChat = () => {
    stopSpeaking();
    stopVoiceTyping();
    setActiveSessionId(null);
    setMessages([]);
    setActiveOptions(null);
    setError(null);
    clearSpeechError();
    setInputValue("");
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Safe delete chat session with confirmation
  const confirmDeleteSession = async () => {
    if (!sessionToDelete) return;
    setDeletingSession(true);
    try {
      await axios.delete(API_ENDPOINTS.AI_ASSISTANT.SESSION(sessionToDelete.id));
      setSessions((prev) => prev.filter((s) => s.id !== sessionToDelete.id));
      if (activeSessionId === sessionToDelete.id) {
        handleStartNewChat();
      }
      setSessionToDelete(null);
    } catch (err) {
      console.error("Failed to delete session:", err);
    } finally {
      setDeletingSession(false);
    }
  };

  // Send message to BI Assistant
  const handleSendMessage = async (customPrompt) => {
    stopVoiceTyping();
    stopSpeaking();
    const text = (customPrompt || inputValue).trim();
    if (!text || loading) return;

    setLastPrompt(text);
    setError(null);
    clearSpeechError();
    setActiveOptions(null);
    setInputValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    const tempUserMsg = {
      id: `temp_${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setLoading(true);

    try {
      const res = await axios.post(API_ENDPOINTS.AI_ASSISTANT.CHAT, {
        message: text,
        chatId: activeSessionId,
      });

      if (res.data.success) {
        const { reply, options, chatId: returnedChatId } = res.data;

        if (!activeSessionId && returnedChatId) {
          setActiveSessionId(returnedChatId);
          fetchSessions();
        }

        const assistantMsg = {
          id: `resp_${Date.now()}`,
          role: "assistant",
          content: reply,
          options: options || [],
          timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, assistantMsg]);
        if (Array.isArray(options) && options.length > 0) {
          setActiveOptions(options);
        } else {
          setActiveOptions(null);
        }
      } else {
        setError(res.data.message || "Failed to generate reply.");
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Error communicating with BI Analyst engine.";
      setError(msg);
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: "assistant",
          content: `⚠️ ${msg}`,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  };

  // Key press listener for Enter (without Shift)
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Copy assistant response
  const handleCopyMessage = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  // Toggle thumbs up / down
  const handleFeedback = (id, type) => {
    setFeedbackState((prev) => ({
      ...prev,
      [id]: prev[id] === type ? null : type,
    }));
  };

  const groupedSessions = groupSessionsByDate(sessions);

  return (
    <div className="flex h-full w-full bg-bg-main overflow-hidden text-text-primary">
      {/* =========================================================================
          LEFT SIDEBAR: Chat History (ChatGPT Style)
          ========================================================================= */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-0 -translate-x-full"
        } transition-all duration-300 ease-in-out shrink-0 bg-bg-card border-r border-border-main flex flex-col h-full overflow-hidden z-20`}
        aria-label="Chat history sidebar"
      >
        {/* Sidebar Header: New Chat Button */}
        <div className="p-3 border-b border-border-main flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleStartNewChat}
            className="flex-1 flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold bg-bg-secondary hover:bg-bg-secondary/70 border border-border-main transition-colors text-text-primary group shadow-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:outline-none"
            aria-label="Start new chat analysis"
          >
            <Plus className="w-4 h-4 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform" />
            <span>New chat</span>
          </button>

          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            title="Close sidebar"
            aria-label="Close sidebar"
            className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-secondary/50 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:outline-none"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        {/* Chat History List Grouped by Date */}
        <div className="flex-1 overflow-y-auto p-2 space-y-4">
          {sessions.length === 0 ? (
            <div className="p-6 text-center">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 mx-auto flex items-center justify-center mb-2">
                <Bot className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-text-primary">No chat history</p>
              <p className="text-[11px] text-text-secondary mt-1">
                Ask a question about your CRM pipeline to begin a new analysis.
              </p>
            </div>
          ) : (
            Object.entries(groupedSessions).map(([period, items]) => {
              if (items.length === 0) return null;
              return (
                <div key={period} className="space-y-1">
                  <div className="px-3 pt-2 pb-1 text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
                    {period}
                  </div>
                  {items.map((s) => {
                    const isActive = activeSessionId === s.id;
                    return (
                      <div
                        key={s.id}
                        onClick={() => loadSession(s.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") loadSession(s.id);
                        }}
                        className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:outline-none ${
                          isActive
                            ? "bg-purple-500/15 text-purple-700 dark:text-purple-300 font-medium border-l-2 border-purple-600"
                            : "text-text-secondary hover:text-text-primary hover:bg-bg-secondary/50"
                        }`}
                      >
                        <span className="truncate pr-5 flex-1">{s.title || "Untitled Analysis"}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSessionToDelete(s);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:text-red-500 transition-opacity focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-red-500"
                          title="Delete chat session"
                          aria-label={`Delete chat session ${s.title || "Untitled"}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        {/* Sidebar Footer: Org / Model Indicator */}
        <div className="p-3 border-t border-border-main bg-bg-card/50 flex items-center justify-between text-xs text-text-secondary">
          <div className="flex items-center gap-2 truncate">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
            <span className="truncate font-medium">{organization?.name || "SalesBuster"}</span>
          </div>
          <span className="text-[10px] font-mono opacity-70">LIVE CRM RAG</span>
        </div>
      </aside>

      {/* =========================================================================
          MAIN CHAT CANVAS
          ========================================================================= */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Top Header Bar */}
        <header className="h-12 border-b border-border-main bg-bg-card/60 backdrop-blur-md px-4 flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                title="Open sidebar"
                aria-label="Open sidebar"
                className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-secondary/50 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:outline-none"
              >
                <PanelLeft className="w-4 h-4" />
              </button>
            )}

            {/* Model Pill */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-bg-secondary border border-border-main text-xs font-semibold text-text-primary">
                <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>BI Analyst</span>
                <span className="text-[10px] text-text-secondary font-normal ml-1">
                  Gemini 3.5 Flash
                </span>
              </div>

              {/* Data Capabilities Info Button */}
              <button
                type="button"
                onClick={() => setShowScopeModal(true)}
                className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] text-purple-700 dark:text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 transition-colors cursor-pointer"
                title="View what CRM data the BI Analyst can answer questions about"
                aria-label="View supported CRM data capabilities"
              >
                <Database className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                <span>Data Scope</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* TTS Narration Voice Selector */}
            {ttsVoices && ttsVoices.length > 0 && (
              <div
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-bg-secondary/80 border border-border-main text-xs text-text-secondary hover:text-text-primary transition-all shadow-2xs"
                title="Select narration voice for Speak Loud"
              >
                <Volume2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                <span className="hidden xl:inline text-[11px] font-medium text-text-secondary">
                  Voice:
                </span>
                <div className="relative flex items-center">
                  <select
                    value={selectedVoiceName || ""}
                    onChange={(e) => setTtsVoice(e.target.value)}
                    className="bg-transparent text-text-primary font-medium text-xs outline-none cursor-pointer pr-4 appearance-none max-w-[110px] sm:max-w-[150px] truncate"
                    title="Choose text-to-speech voice"
                    aria-label="Select text to speech voice"
                  >
                    {ttsVoices.map((v) => {
                      const cleanName = v.name
                        .replace(/Online\s*\(Natural\)/i, "(Natural)")
                        .replace(/^Microsoft\s+/i, "")
                        .replace(/English\s*\(([^)]+)\)/i, "$1");
                      return (
                        <option key={v.name} value={v.name} className="bg-bg-card text-text-primary">
                          {cleanName}
                        </option>
                      );
                    })}
                  </select>
                  <ChevronDown className="w-3 h-3 text-text-secondary pointer-events-none -ml-3" />
                </div>
              </div>
            )}

            {/* Live Voice Mode Button */}
            <button
              type="button"
              onClick={handleOpenLiveVoice}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:outline-none"
              title="Open Gemini Multimodal Live Voice Chat"
              aria-label="Open Gemini Live Voice modal"
            >
              <Radio className="w-3.5 h-3.5 animate-pulse text-purple-200" />
              <span>Live Voice</span>
            </button>

            <button
              type="button"
              onClick={handleStartNewChat}
              className="p-1.5 rounded-lg text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-colors flex items-center gap-1 cursor-pointer focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:outline-none"
              title="New Chat"
              aria-label="Start new chat"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New chat</span>
            </button>
          </div>
        </header>

        {/* Message Stream */}
        <div ref={chatScrollRef} className="flex-1 overflow-y-auto">
          {/* If No Messages: Landing View */}
          {messages.length === 0 && !loading ? (
            <div className="min-h-full flex flex-col items-center justify-center max-w-3xl mx-auto px-4 py-8 text-center animate-in fade-in duration-300">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-purple-500/20 mb-4">
                <Sparkles className="w-8 h-8" />
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary mb-2">
                What would you like to analyze today?
              </h2>
              <p className="text-xs sm:text-sm text-text-secondary max-w-xl mb-6 leading-relaxed">
                Your AI Business Intelligence Analyst queries live CRM data to calculate pipeline conversions, sales rep leaderboards, follow-up schedules, and customer inquiries.
              </p>

              {/* Data Scope Summary Pill */}
              <div className="w-full max-w-2xl p-3.5 rounded-2xl bg-purple-500/5 dark:bg-purple-950/20 border border-purple-500/20 text-xs text-text-secondary mb-6 text-left flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                  <span>
                    <strong className="text-text-primary font-semibold">Live Data Connected:</strong> Leads, Sales Reps, Follow-Ups, Offerings &amp; WhatsApp logs.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowScopeModal(true)}
                  className="text-purple-600 dark:text-purple-400 hover:underline font-semibold whitespace-nowrap self-start sm:self-auto cursor-pointer"
                >
                  View data sources &rarr;
                </button>
              </div>

              {/* 2x3 Grid of Prompt Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left">
                {SUGGESTED_PROMPTS.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendMessage(item.prompt)}
                      className="p-3.5 rounded-2xl bg-bg-card hover:bg-bg-secondary/40 border border-border-main hover:border-purple-500/30 transition-all text-left flex items-start gap-3 group cursor-pointer shadow-2xs focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:outline-none"
                    >
                      <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0 group-hover:scale-105 transition-transform">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="truncate flex-1">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className="text-xs font-bold text-text-primary block leading-tight">
                            {item.title}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-bg-secondary text-text-secondary font-medium">
                            {item.category}
                          </span>
                        </div>
                        <span className="text-[11px] text-text-secondary line-clamp-1 mt-0.5">
                          {item.prompt}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Active Chat Stream */
            <div className="max-w-3xl mx-auto w-full px-4 py-6 space-y-6">
              {messages.map((m, idx) => {
                const isUser = m.role === "user";
                const feedback = feedbackState[m.id];
                const isCopied = copiedMessageId === m.id;
                const isSpeakingThis = speakingMessageId === m.id;

                return (
                  <div key={m.id || idx} className="w-full flex flex-col group animate-in fade-in duration-200">
                    {isUser ? (
                      /* User Message: Right-aligned with Speak option */
                      <div className="flex flex-col items-end gap-1 group/userMsg">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-text-secondary font-semibold uppercase tracking-wider">
                            You
                          </span>
                          {m.timestamp && (
                            <span className="text-[10px] text-text-secondary/70">
                              {new Date(m.timestamp).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => speakMessage(m.id, m.content)}
                            className={`p-1.5 rounded-lg transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-purple-500 ${
                              isSpeakingThis
                                ? "opacity-100 text-purple-600 dark:text-purple-400 bg-purple-500/10"
                                : "opacity-0 group-hover/userMsg:opacity-100 text-text-secondary hover:text-text-primary hover:bg-bg-secondary/60"
                            }`}
                            title={isSpeakingThis ? "Stop speaking" : "Speak loud"}
                            aria-label={isSpeakingThis ? "Stop speaking user message" : "Speak loud user message"}
                          >
                            {isSpeakingThis ? (
                              <VolumeX className="w-4 h-4 text-purple-600 dark:text-purple-400 animate-pulse" />
                            ) : (
                              <Volume2 className="w-4 h-4" />
                            )}
                          </button>
                          <div className="max-w-[85%] px-5 py-3 rounded-3xl bg-bg-secondary/90 text-text-primary text-sm leading-relaxed border border-border-main shadow-2xs font-sans">
                            {m.content}
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Assistant Message: Clean markdown layout */
                      <div className="flex items-start gap-3.5 pt-2">
                        {/* Icon */}
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-xs">
                          <Bot className="w-4 h-4" />
                        </div>

                        {/* Content Body */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-text-primary">
                              BI Analyst
                            </span>
                            {m.timestamp && (
                              <span className="text-[10px] text-text-secondary">
                                {new Date(m.timestamp).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            )}
                          </div>

                          <RenderFormattedContent content={m.content} />

                          {/* Clarification / Suggested Options */}
                          {Array.isArray(m.options) && m.options.length > 0 && (
                            <div className="mt-3.5 p-3 rounded-2xl bg-purple-500/5 dark:bg-purple-950/25 border border-purple-500/20 dark:border-purple-500/25 shadow-2xs space-y-2">
                              <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300 block">
                                Suggested follow-up analyses:
                              </span>
                              <div className="flex flex-wrap items-center gap-2">
                                {m.options.map((opt, oIdx) => (
                                  <button
                                    key={oIdx}
                                    type="button"
                                    onClick={() => handleSendMessage(opt)}
                                    disabled={loading}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-border-main hover:border-purple-500 dark:hover:border-purple-400 hover:bg-purple-50/80 dark:hover:bg-purple-950/40 text-xs font-semibold text-slate-800 dark:text-slate-100 hover:text-purple-700 dark:hover:text-purple-300 transition-all duration-150 shadow-2xs hover:shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-left active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-purple-500"
                                  >
                                    <CornerDownRight className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0 stroke-[2.5]" />
                                    <span>{opt}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Message Action Bar */}
                          <div className="flex items-center gap-1.5 mt-3 pt-1 text-text-secondary opacity-70 group-hover:opacity-100 transition-opacity flex-wrap">
                            {/* Speak Loud Button */}
                            <button
                              type="button"
                              onClick={() => speakMessage(m.id, m.content)}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-[11px] focus-visible:ring-2 focus-visible:ring-purple-500 ${
                                isSpeakingThis
                                    ? "text-purple-600 dark:text-purple-400 bg-purple-500/15 font-medium shadow-2xs"
                                  : "hover:bg-bg-secondary hover:text-text-primary"
                              }`}
                              title={isSpeakingThis ? "Stop speaking" : "Speak loud (Read aloud)"}
                              aria-label={isSpeakingThis ? "Stop reading response aloud" : "Speak response loud"}
                            >
                              {isSpeakingThis ? (
                                <>
                                  <VolumeX className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 animate-pulse" />
                                  <span className="text-purple-600 dark:text-purple-400 font-medium">Stop</span>
                                </>
                              ) : (
                                <>
                                  <Volume2 className="w-3.5 h-3.5" />
                                  <span>Speak</span>
                                </>
                              )}
                            </button>

                            {/* Copy Button */}
                            <button
                              type="button"
                              onClick={() => handleCopyMessage(m.id, m.content)}
                              className="p-1.5 rounded-lg hover:bg-bg-secondary hover:text-text-primary transition-colors cursor-pointer flex items-center gap-1 text-[11px] focus-visible:ring-2 focus-visible:ring-purple-500"
                              title="Copy response"
                              aria-label="Copy response to clipboard"
                            >
                              {isCopied ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                                  <span className="text-emerald-500">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>

                            {/* Thumbs Up */}
                            <button
                              type="button"
                              onClick={() => handleFeedback(m.id, "up")}
                              className={`p-1.5 rounded-lg hover:bg-bg-secondary transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-purple-500 ${
                                feedback === "up"
                                  ? "text-purple-600 dark:text-purple-400 bg-purple-500/10"
                                  : "hover:text-text-primary"
                              }`}
                              title="Helpful"
                              aria-label="Rate response as helpful"
                            >
                              <ThumbsUp className="w-3.5 h-3.5" />
                            </button>

                            {/* Thumbs Down */}
                            <button
                              type="button"
                              onClick={() => handleFeedback(m.id, "down")}
                              className={`p-1.5 rounded-lg hover:bg-bg-secondary transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-purple-500 ${
                                feedback === "down"
                                  ? "text-red-500 bg-red-500/10"
                                  : "hover:text-text-primary"
                              }`}
                              title="Not helpful"
                              aria-label="Rate response as not helpful"
                            >
                              <ThumbsDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Enhanced Loading Skeleton */}
              {loading && (
                <div className="flex items-start gap-3.5 pt-2 animate-in fade-in duration-200">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-xs">
                    <Bot className="w-4 h-4 animate-spin" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="text-xs font-bold text-text-primary">BI Analyst</div>
                    <div className="p-3.5 rounded-2xl bg-bg-card border border-border-main space-y-2">
                      <div className="flex items-center gap-2 text-xs text-text-secondary">
                        <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping" />
                        <span className="font-medium">
                          Querying live database &amp; synthesizing business metrics...
                        </span>
                      </div>
                      <div className="h-2 bg-bg-secondary rounded-full overflow-hidden w-3/4">
                        <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 animate-pulse w-full" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* =========================================================================
            BOTTOM CHATGPT INPUT CAPSULE
            ========================================================================= */}
        <div className="shrink-0 max-w-3xl mx-auto w-full px-4 pb-4 pt-1">
          {(error || speechToTextError) && (
            <div className="mb-2 p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center justify-between gap-3 animate-fadeIn">
              <div className="flex items-center gap-2 min-w-0">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="truncate">{error || speechToTextError}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {lastPrompt && !loading && (
                  <button
                    type="button"
                    onClick={() => handleSendMessage(lastPrompt)}
                    className="font-bold underline hover:opacity-80 cursor-pointer"
                  >
                    Retry
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    clearSpeechError();
                  }}
                  className="p-1 rounded hover:bg-red-500/20 cursor-pointer"
                  aria-label="Dismiss error"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Floating Pill Input Box */}
          <div
            className={`relative rounded-3xl border bg-bg-card shadow-md transition-all p-2 sm:p-3 focus-within:ring-2 focus-within:ring-purple-500/30 focus-within:border-purple-500 ${
              isVoiceTyping
                ? "border-red-500/70 ring-2 ring-red-500/20 shadow-red-500/10"
                : "border-border-main"
            }`}
          >
            <label htmlFor="bi-analyst-input" className="sr-only">
              Ask BI Analyst a question about leads, revenue, conversion, or team
            </label>
            <textarea
              id="bi-analyst-input"
              ref={textareaRef}
              rows={1}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isVoiceTyping
                  ? "Listening... Speak your prompt into microphone..."
                  : "Ask anything about your leads, revenue, conversion, or team..."
              }
              disabled={loading}
              className="w-full bg-transparent resize-none border-none outline-none focus:outline-none focus:ring-0 text-sm text-text-primary placeholder:text-text-secondary px-2 py-1 max-h-44"
              style={{ overflowY: inputValue.length > 200 ? "auto" : "hidden" }}
            />

            {/* Bottom Row inside capsule */}
            <div className="flex items-center justify-between pt-1 px-1">
              {isVoiceTyping ? (
                <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  <span className="font-medium">Listening... speak now (click Send or Mic when done)</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-[11px] text-text-secondary">
                  <span className="hidden sm:inline">Press</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-bg-secondary text-[10px] font-mono border border-border-main hidden sm:inline">
                    Enter ↵
                  </kbd>
                  <span className="hidden sm:inline">to send</span>
                  <span className="hidden sm:inline text-text-secondary/60">• Shift + Enter for new line</span>
                </div>
              )}

              {/* Action Buttons: Voice Typing Mic and Send */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleVoiceTyping}
                  disabled={loading}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-xs shrink-0 focus-visible:ring-2 focus-visible:ring-purple-500 ${
                    isVoiceTyping
                      ? "bg-red-500 hover:bg-red-600 text-white animate-pulse shadow-md shadow-red-500/30 ring-2 ring-red-400/60"
                      : "bg-bg-secondary hover:bg-purple-600 hover:text-white text-text-secondary"
                  }`}
                  title={isVoiceTyping ? "Stop listening" : "Speak instead of typing (Voice dictation)"}
                  aria-label={isVoiceTyping ? "Stop voice typing" : "Start voice typing"}
                >
                  {isVoiceTyping ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                {/* Round Send Button with ArrowUp */}
                <button
                  type="button"
                  onClick={() => handleSendMessage()}
                  disabled={!inputValue.trim() || loading}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-all bg-purple-600 hover:bg-purple-700 text-white disabled:bg-bg-secondary disabled:text-text-secondary/40 cursor-pointer disabled:cursor-not-allowed shadow-xs shrink-0 focus-visible:ring-2 focus-visible:ring-purple-500"
                  title="Send message"
                  aria-label="Send message"
                >
                  <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <p className="text-center text-[11px] text-text-secondary/70 mt-2">
            BI Analyst synthesizes live organization CRM records. Verify critical financial decisions with primary exports.
          </p>
        </div>
      </div>

      {/* Data Capabilities & Scope Modal */}
      {showScopeModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="scope-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
        >
          <div className="w-full max-w-lg bg-bg-card rounded-2xl shadow-2xl border border-border-main p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border-main">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 id="scope-modal-title" className="text-sm font-bold text-text-primary">
                    BI Analyst Supported Data Scope
                  </h3>
                  <p className="text-[11px] text-text-secondary">
                    Live CRM datasets available for querying
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowScopeModal(false)}
                className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-secondary"
                aria-label="Close data scope modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {DATA_CAPABILITIES.map((cap, cIdx) => {
                const Icon = cap.icon;
                return (
                  <div
                    key={cIdx}
                    className="p-3 rounded-xl bg-bg-secondary/40 border border-border-main flex items-start gap-3"
                  >
                    <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-text-primary">{cap.title}</h4>
                      <p className="text-[11px] text-text-secondary mt-0.5 leading-relaxed">
                        {cap.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-border-main flex items-center justify-between">
              <span className="text-[10px] text-text-secondary">
                Protected by organization role policies
              </span>
              <button
                type="button"
                onClick={() => setShowScopeModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600 text-white hover:bg-purple-700 transition-colors cursor-pointer"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Chat Session Confirmation Modal */}
      {sessionToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-session-title"
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
        >
          <div className="w-full max-w-md bg-bg-card rounded-2xl shadow-2xl border border-border-main p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 id="delete-session-title" className="text-base font-bold text-text-primary">
                Delete Chat Session?
              </h3>
              <p className="text-xs text-text-secondary mt-2 leading-relaxed">
                Are you sure you want to delete <span className="font-semibold text-text-primary">&quot;{sessionToDelete.title || "Untitled Analysis"}&quot;</span>? This will permanently remove its conversation history from your CRM.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSessionToDelete(null)}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-text-primary bg-bg-secondary hover:bg-bg-secondary/70 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteSession}
                disabled={deletingSession}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {deletingSession ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Gemini Multimodal Live Voice Modal */}
      <GeminiLiveVoiceModal
        isOpen={isLiveVoiceModalOpen}
        onClose={handleCloseLiveVoice}
        status={liveStatus}
        activeToolName={liveActiveToolName}
        inputVolume={liveInputVolume}
        outputVolume={liveOutputVolume}
        liveTranscript={liveTranscript}
        error={liveVoiceError}
        voiceName={voiceName}
        onVoiceChange={setVoiceName}
        isMuted={isLiveMuted}
        onToggleMute={toggleLiveMute}
        onInterrupt={interruptLive}
      />
    </div>
  );
}
