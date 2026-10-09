import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import {
  X,
  Send,
  Bot,
  Sparkles,
  History,
  Trash2,
  Plus,
  RefreshCw,
  Clock,
  Layers,
  ChevronRight,
  TrendingUp,
  Phone,
  Users,
  CheckCircle,
  HelpCircle,
  MessageSquare,
} from "lucide-react";
import { API_ENDPOINTS } from "../../utils/constants.js";

const SUGGESTED_QUESTIONS = [
  {
    icon: Clock,
    label: "Leads this morning",
    prompt: "How many new leads came this morning?",
  },
  {
    icon: TrendingUp,
    label: "Today vs Yesterday",
    prompt: "How many leads did we receive today compared to yesterday?",
  },
  {
    icon: CheckCircle,
    label: "Conversion rate",
    prompt: "What is our conversion rate this month?",
  },
  {
    icon: Users,
    label: "Top salesperson",
    prompt: "Which salesperson generated the most leads this month?",
  },
  {
    icon: Phone,
    label: "Pending follow-ups",
    prompt: "How many follow-ups are pending or overdue?",
  },
  {
    icon: MessageSquare,
    label: "Unreplied WhatsApp",
    prompt: "Which leads haven't received a WhatsApp reply?",
  },
  {
    icon: Layers,
    label: "Active integrations",
    prompt: "Which integrations are connected to our organization?",
  },
  {
    icon: HelpCircle,
    label: "How to use features",
    prompt: "How do I create and start a WhatsApp bulk campaign?",
  },
];

export default function AIAssistantDrawer({ isOpen, onClose }) {
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      fetchSessions();
      setTimeout(() => inputRef.current?.focus(), 200);

      const handleEscape = (e) => {
        if (e.key === "Escape") onClose();
      };
      window.addEventListener("keydown", handleEscape);
      return () => window.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Load chat session history list
  const fetchSessions = async () => {
    try {
      const res = await axios.get(API_ENDPOINTS.AI_ASSISTANT.SESSIONS);
      const sessionList = res.data.data || [];
      setSessions(sessionList);

      // If active session exists, refresh it; otherwise select most recent if any
      if (sessionList.length > 0 && !activeSessionId) {
        loadSession(sessionList[0].id);
      } else if (sessionList.length === 0) {
        setMessages([]);
        setActiveSessionId(null);
      }
    } catch (err) {
      console.warn("Failed to fetch AI sessions:", err);
    }
  };

  // Load specific chat session messages
  const loadSession = async (chatId) => {
    try {
      setActiveSessionId(chatId);
      setError(null);
      const res = await axios.get(API_ENDPOINTS.AI_ASSISTANT.SESSION(chatId));
      if (res.data.success && res.data.data) {
        setMessages(res.data.data.messages || []);
      }
    } catch (err) {
      console.error("Failed to load chat session:", err);
      setError("Failed to load session history.");
    }
  };

  // Start a fresh chat
  const handleStartNewChat = () => {
    setActiveSessionId(null);
    setMessages([]);
    setError(null);
    setShowHistory(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // Delete a chat session
  const handleDeleteSession = async (e, chatId) => {
    e.stopPropagation();
    try {
      await axios.delete(API_ENDPOINTS.AI_ASSISTANT.SESSION(chatId));
      setSessions((prev) => prev.filter((s) => s.id !== chatId));
      if (activeSessionId === chatId) {
        handleStartNewChat();
      }
    } catch (err) {
      console.error("Failed to delete chat session:", err);
    }
  };

  // Send question to AI Assistant
  const handleSendMessage = async (textToSend) => {
    const query = (textToSend || inputValue).trim();
    if (!query || loading) return;

    setError(null);
    setInputValue("");

    // Optimistically append user message to UI
    const tempUserMsg = {
      id: `temp_${Date.now()}`,
      role: "user",
      content: query,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setLoading(true);

    try {
      const res = await axios.post(API_ENDPOINTS.AI_ASSISTANT.CHAT, {
        message: query,
        chatId: activeSessionId,
      });

      if (res.data.success) {
        const { reply, toolsUsed, chatId: returnedChatId } = res.data;

        // If this was a new chat, update session tracking
        if (!activeSessionId && returnedChatId) {
          setActiveSessionId(returnedChatId);
          fetchSessions();
        }

        const assistantMsg = {
          id: `resp_${Date.now()}`,
          role: "assistant",
          content: reply,
          toolsUsed: toolsUsed || [],
          timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        setError(res.data.message || "Failed to generate reply.");
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Network error communicating with AI Assistant.";
      setError(msg);
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: "assistant",
          content: `⚠️ ${msg}`,
          toolsUsed: [],
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  const drawerContent = (
    <div className="fixed inset-0 z-[9999] overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div className="relative w-full max-w-2xl bg-bg-card border-l border-border-main text-text-primary shadow-2xl flex flex-col h-screen h-[100dvh] z-10 animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border-main bg-bg-card/90 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-text-primary">CRM AI Assistant</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                  Manager Intelligence
                </span>
              </div>
              <p className="text-xs text-text-secondary flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Connected to live MongoDB & Qdrant RAG
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* History Toggle */}
            <button
              type="button"
              onClick={() => setShowHistory((prev) => !prev)}
              className={`p-2 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                showHistory
                  ? "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30"
                  : "bg-bg-secondary/40 text-text-secondary hover:text-text-primary border-border-main"
              }`}
              title="Chat History"
            >
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">History</span>
            </button>

            {/* New Chat */}
            <button
              type="button"
              onClick={handleStartNewChat}
              className="p-2 rounded-lg text-xs font-medium bg-bg-secondary/40 hover:bg-bg-secondary text-text-secondary hover:text-text-primary border border-border-main transition-colors flex items-center gap-1.5"
              title="Start New Chat"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Chat</span>
            </button>

            {/* Close Drawer */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-secondary/60 transition-colors ml-1"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area with optional History Sidebar */}
        <div className="flex-1 flex overflow-hidden relative min-h-0">
          {/* Slide-out History Panel */}
          {showHistory && (
            <div className="w-64 border-r border-border-main bg-bg-secondary/20 flex flex-col shrink-0 min-h-0 animate-in slide-in-from-left duration-200">
              <div className="p-3 border-b border-border-main flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                  Recent Conversations
                </span>
                <button
                  type="button"
                  onClick={handleStartNewChat}
                  className="text-xs text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" /> New
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {sessions.length === 0 ? (
                  <p className="text-xs text-text-secondary p-3 text-center">No past conversations yet.</p>
                ) : (
                  sessions.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => {
                        loadSession(s.id);
                        setShowHistory(false);
                      }}
                      className={`group flex items-center justify-between p-2.5 rounded-lg text-xs cursor-pointer transition-all ${
                        activeSessionId === s.id
                          ? "bg-purple-500/15 text-purple-700 dark:text-purple-300 font-semibold border border-purple-500/25"
                          : "text-text-secondary hover:text-text-primary hover:bg-bg-secondary/60"
                      }`}
                    >
                      <div className="truncate flex-1 mr-2">
                        <p className="truncate">{s.title}</p>
                        <span className="text-[10px] text-text-secondary/70">
                          {new Date(s.updatedAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                          })}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteSession(e, s.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-opacity"
                        title="Delete chat"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Messages Container */}
          <div className="flex-1 flex flex-col overflow-hidden bg-bg-primary/30 min-h-0">
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {/* If no messages in current chat, show Welcome & Quick Suggestions */}
              {messages.length === 0 && !loading && (
                <div className="py-6 text-center max-w-lg mx-auto">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-500 text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-purple-500/20">
                    <Bot className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-text-primary mb-1">
                    Ask SalesBuster Intelligence
                  </h3>
                  <p className="text-xs text-text-secondary mb-5">
                    Query real-time lead counts, salesperson leaderboard, WhatsApp replies, follow-ups, and feature guides with zero fabrication.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                    {SUGGESTED_QUESTIONS.map((item, idx) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSendMessage(item.prompt)}
                          className="flex items-start gap-2.5 p-3 rounded-xl bg-bg-card border border-border-main hover:border-purple-500/40 hover:bg-purple-500/5 text-left transition-all group"
                        >
                          <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0 group-hover:bg-purple-500/20">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-text-primary block leading-tight">
                              {item.label}
                            </span>
                            <span className="text-[11px] text-text-secondary line-clamp-1 mt-0.5">
                              {item.prompt}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Render Message Turns */}
              {messages.map((m, idx) => {
                const isUser = m.role === "user";
                return (
                  <div
                    key={m.id || idx}
                    className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        isUser
                          ? "bg-purple-600 text-white"
                          : "bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-xs"
                      }`}
                    >
                      {isUser ? "You" : <Bot className="w-4 h-4" />}
                    </div>

                    {/* Bubble */}
                    <div className={`max-w-[85%] ${isUser ? "items-end" : "items-start"} flex flex-col`}>
                      <div
                        className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                          isUser
                            ? "bg-purple-600 text-white rounded-tr-xs"
                            : "bg-bg-card border border-border-main text-text-primary shadow-xs rounded-tl-xs whitespace-pre-line"
                        }`}
                      >
                        {m.content}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Loading State */}
              {loading && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 animate-spin" />
                  </div>
                  <div className="p-3.5 rounded-2xl rounded-tl-xs bg-bg-card border border-border-main text-xs text-text-secondary flex items-center gap-2 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping"></span>
                    <span>Querying live MongoDB & synthesizing answer...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-3 sm:p-4 border-t border-border-main bg-bg-card/90 backdrop-blur-md shrink-0">
              {error && (
                <div className="mb-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center justify-between">
                  <span>{error}</span>
                  <button type="button" onClick={() => setError(null)} className="p-0.5">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="relative flex items-center">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a question about leads, team, or CRM features..."
                  disabled={loading}
                  className="w-full pl-4 pr-12 py-3 rounded-xl bg-bg-secondary/40 border border-border-main focus:border-purple-500 focus:bg-bg-card focus:outline-none text-xs text-text-primary placeholder:text-text-secondary transition-all"
                />

                <button
                  type="button"
                  onClick={() => handleSendMessage()}
                  disabled={!inputValue.trim() || loading}
                  className="absolute right-2 p-2 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:hover:bg-purple-600 text-white transition-all cursor-pointer disabled:cursor-not-allowed shadow-xs"
                  aria-label="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center justify-between mt-2 px-1 text-[11px] text-text-secondary">
                <span>Model: <code className="text-purple-600 dark:text-purple-400">gemini-3.5-flash-lite</code></span>
                <span>Press <kbd className="px-1 py-0.5 rounded bg-bg-secondary text-[10px] font-mono border border-border-main">Enter</kbd> to ask</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined"
    ? createPortal(drawerContent, document.body)
    : drawerContent;
}
