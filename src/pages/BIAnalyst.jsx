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
} from "lucide-react";
import { API_ENDPOINTS } from "../utils/constants.js";
import { useAuth } from "../context/AuthContext.jsx";

// Suggested questions when no messages yet
const SUGGESTED_PROMPTS = [
  {
    icon: TrendingUp,
    title: "Conversion & Growth",
    prompt: "What is our lead-to-won conversion rate this month?",
  },
  {
    icon: Users,
    title: "Sales Leaderboard",
    prompt: "Which salesperson generated the most won leads and highest conversion?",
  },
  {
    icon: Clock,
    title: "Morning Inflow",
    prompt: "How many new leads came in this morning compared to yesterday?",
  },
  {
    icon: Phone,
    title: "Pending Follow-ups",
    prompt: "How many follow-ups are overdue or scheduled for today?",
  },
  {
    icon: MessageSquare,
    title: "WhatsApp Engagement",
    prompt: "Which active leads haven't received a WhatsApp reply yet?",
  },
  {
    icon: BarChart3,
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

// Lightweight Markdown & Table Parser for ChatGPT-like rich rendering
function RenderFormattedContent({ content }) {
  if (!content) return null;

  // Split into paragraphs / blocks
  const blocks = content.split(/\n\n+/);

  return (
    <div className="space-y-3 text-sm leading-relaxed text-text-primary">
      {blocks.map((block, bIdx) => {
        const trimmed = block.trim();

        // Check if block is a Markdown table
        if (trimmed.includes("|") && trimmed.split("\n").length >= 2) {
          const lines = trimmed.split("\n").map((l) => l.trim()).filter(Boolean);
          const isTable = lines.every((l) => l.startsWith("|") && l.endsWith("|"));

          if (isTable && lines.length >= 2) {
            const headerCells = lines[0]
              .slice(1, -1)
              .split("|")
              .map((c) => c.trim());

            // Skip separator line if it exists
            const startIndex = lines[1].includes("---") ? 2 : 1;
            const dataRows = lines.slice(startIndex).map((row) =>
              row
                .slice(1, -1)
                .split("|")
                .map((c) => c.trim())
            );

            return (
              <div key={bIdx} className="overflow-x-auto my-3 rounded-xl border border-border-main bg-bg-card shadow-xs">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-bg-secondary/60 border-b border-border-main">
                      {headerCells.map((h, hIdx) => (
                        <th key={hIdx} className="px-3.5 py-2.5 font-semibold text-text-primary">
                          {formatInlineMarkdown(h)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-main/50">
                    {dataRows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-bg-secondary/20 transition-colors">
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="px-3.5 py-2 text-text-secondary">
                            {formatInlineMarkdown(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }
        }

        // Check if block is a code block
        if (trimmed.startsWith("```")) {
          const cleanCode = trimmed.replace(/^```[a-z]*\n?/, "").replace(/```$/, "");
          return (
            <pre
              key={bIdx}
              className="p-3.5 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto my-2 border border-slate-800"
            >
              <code>{cleanCode}</code>
            </pre>
          );
        }

        // Check for list items (lines starting with - or * or numbers)
        const lines = trimmed.split("\n");
        const isBulletList = lines.every((l) => /^\s*[-*•]\s+/.test(l));
        const isNumberedList = lines.every((l) => /^\s*\d+\.\s+/.test(l));

        if (isBulletList) {
          return (
            <ul key={bIdx} className="space-y-1.5 list-disc pl-5 my-2">
              {lines.map((item, iIdx) => (
                <li key={iIdx} className="text-text-primary">
                  {formatInlineMarkdown(item.replace(/^\s*[-*•]\s+/, ""))}
                </li>
              ))}
            </ul>
          );
        }

        if (isNumberedList) {
          return (
            <ol key={bIdx} className="space-y-1.5 list-decimal pl-5 my-2">
              {lines.map((item, iIdx) => (
                <li key={iIdx} className="text-text-primary">
                  {formatInlineMarkdown(item.replace(/^\s*\d+\.\s+/, ""))}
                </li>
              ))}
            </ol>
          );
        }

        // Check for header
        if (trimmed.startsWith("### ")) {
          return (
            <h4 key={bIdx} className="text-sm font-bold text-text-primary mt-2">
              {formatInlineMarkdown(trimmed.replace(/^###\s+/, ""))}
            </h4>
          );
        }
        if (trimmed.startsWith("## ")) {
          return (
            <h3 key={bIdx} className="text-base font-bold text-text-primary mt-2">
              {formatInlineMarkdown(trimmed.replace(/^##\s+/, ""))}
            </h3>
          );
        }
        if (trimmed.startsWith("# ")) {
          return (
            <h2 key={bIdx} className="text-lg font-bold text-text-primary mt-2">
              {formatInlineMarkdown(trimmed.replace(/^#\s+/, ""))}
            </h2>
          );
        }

        // Standard paragraph
        return (
          <p key={bIdx} className="whitespace-pre-line">
            {formatInlineMarkdown(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

// Inline Markdown formatter (bold, code, links)
function formatInlineMarkdown(text) {
  if (!text) return "";

  // Split by bold (**bold**) and inline code (`code`)
  const parts = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    const boldMatch = remaining.match(/\*\*(.*?)\*\*/);
    const codeMatch = remaining.match(/`([^`]+)`/);

    let match = null;
    let type = null;

    if (boldMatch && (!codeMatch || boldMatch.index < codeMatch.index)) {
      match = boldMatch;
      type = "bold";
    } else if (codeMatch) {
      match = codeMatch;
      type = "code";
    }

    if (match) {
      if (match.index > 0) {
        parts.push(remaining.slice(0, match.index));
      }
      if (type === "bold") {
        parts.push(
          <strong key={key++} className="font-semibold text-text-primary">
            {match[1]}
          </strong>
        );
      } else if (type === "code") {
        parts.push(
          <code
            key={key++}
            className="px-1.5 py-0.5 rounded bg-bg-secondary text-purple-600 dark:text-purple-400 font-mono text-xs border border-border-main"
          >
            {match[1]}
          </code>
        );
      }
      remaining = remaining.slice(match.index + match[0].length);
    } else {
      parts.push(remaining);
      break;
    }
  }

  return parts;
}

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

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const chatScrollRef = useRef(null);

  // Auto-scroll chat container strictly internally (avoids outer window/page scrolling)
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
      setActiveSessionId(chatId);
      setError(null);
      const res = await axios.get(API_ENDPOINTS.AI_ASSISTANT.SESSION(chatId));
      if (res.data.success && res.data.data) {
        setMessages(res.data.data.messages || []);
      }
    } catch (err) {
      console.error("Failed to load session:", err);
      setError("Failed to load conversation history.");
    }
  };

  // Start new fresh chat
  const handleStartNewChat = () => {
    setActiveSessionId(null);
    setMessages([]);
    setError(null);
    setInputValue("");
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Delete chat session
  const handleDeleteSession = async (e, chatId) => {
    e.stopPropagation();
    try {
      await axios.delete(API_ENDPOINTS.AI_ASSISTANT.SESSION(chatId));
      setSessions((prev) => prev.filter((s) => s.id !== chatId));
      if (activeSessionId === chatId) {
        handleStartNewChat();
      }
    } catch (err) {
      console.error("Failed to delete session:", err);
    }
  };

  // Send message to BI Assistant
  const handleSendMessage = async (customPrompt) => {
    const text = (customPrompt || inputValue).trim();
    if (!text || loading) return;

    setError(null);
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
        const { reply, chatId: returnedChatId } = res.data;

        if (!activeSessionId && returnedChatId) {
          setActiveSessionId(returnedChatId);
          fetchSessions();
        }

        const assistantMsg = {
          id: `resp_${Date.now()}`,
          role: "assistant",
          content: reply,
          timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, assistantMsg]);
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
      >
        {/* Sidebar Header: New Chat Button */}
        <div className="p-3 border-b border-border-main flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleStartNewChat}
            className="flex-1 flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold bg-bg-secondary hover:bg-bg-secondary/70 border border-border-main transition-colors text-text-primary group shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform" />
            <span>New chat</span>
          </button>

          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            title="Close sidebar"
            className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-secondary/50 transition-colors cursor-pointer"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        {/* Chat History List Grouped by Date */}
        <div className="flex-1 overflow-y-auto p-2 space-y-4">
          {sessions.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-xs text-text-secondary">No chat history yet.</p>
              <p className="text-[11px] text-text-secondary/70 mt-1">
                Start a new conversation to analyze live CRM data.
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
                        className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-colors ${
                          isActive
                            ? "bg-purple-500/15 text-purple-700 dark:text-purple-300 font-medium"
                            : "text-text-secondary hover:text-text-primary hover:bg-bg-secondary/50"
                        }`}
                      >
                        <span className="truncate pr-5 flex-1">{s.title || "Untitled Analysis"}</span>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteSession(e, s.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:text-red-500 transition-opacity"
                          title="Delete chat"
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
          <span className="text-[10px] font-mono opacity-70">RAG LIVE</span>
        </div>
      </aside>

      {/* =========================================================================
          MAIN CHAT CANVAS: ChatGPT Style
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
                className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-secondary/50 transition-colors cursor-pointer"
              >
                <PanelLeft className="w-4 h-4" />
              </button>
            )}

            {/* Model Pill (ChatGPT Style) */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-bg-secondary border border-border-main text-xs font-semibold text-text-primary">
                <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>BI Analyst</span>
                <span className="text-[10px] text-text-secondary font-normal ml-1">
                  Gemini 3.5 Flash
                </span>
              </div>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Connected to live CRM
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleStartNewChat}
              className="p-1.5 rounded-lg text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-colors flex items-center gap-1 cursor-pointer"
              title="New Chat"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New chat</span>
            </button>
          </div>
        </header>

        {/* Message Stream */}
        <div ref={chatScrollRef} className="flex-1 overflow-y-auto">
          {/* If No Messages: ChatGPT Landing View */}
          {messages.length === 0 && !loading ? (
            <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto px-4 py-8 text-center animate-in fade-in duration-300">
              {/* ChatGPT Iconic Center Icon */}
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-purple-500/20 mb-5">
                <Sparkles className="w-8 h-8" />
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary mb-2">
                What would you like to analyze today?
              </h2>
              <p className="text-sm text-text-secondary max-w-md mb-8">
                Ask questions about live lead flow, salesperson performance, WhatsApp response times, or business conversion rates.
              </p>

              {/* 2x3 Grid of Prompt Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full text-left">
                {SUGGESTED_PROMPTS.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendMessage(item.prompt)}
                      className="p-3.5 rounded-2xl bg-bg-card hover:bg-bg-secondary/40 border border-border-main hover:border-purple-500/30 transition-all text-left flex items-start gap-3 group cursor-pointer shadow-2xs"
                    >
                      <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0 group-hover:scale-105 transition-transform">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <span className="text-xs font-semibold text-text-primary block leading-tight">
                          {item.title}
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
          ) : (
            /* Active Chat Stream */
            <div className="max-w-3xl mx-auto w-full px-4 py-6 space-y-6">
              {messages.map((m, idx) => {
                const isUser = m.role === "user";
                const feedback = feedbackState[m.id];
                const isCopied = copiedMessageId === m.id;

                return (
                  <div key={m.id || idx} className="w-full flex flex-col group animate-in fade-in duration-200">
                    {isUser ? (
                      /* User Message: ChatGPT style right-aligned capsule */
                      <div className="flex justify-end">
                        <div className="max-w-[80%] px-5 py-3 rounded-3xl bg-bg-secondary/90 text-text-primary text-sm leading-relaxed border border-border-main shadow-2xs">
                          {m.content}
                        </div>
                      </div>
                    ) : (
                      /* Assistant Message: ChatGPT style full-width clean text */
                      <div className="flex items-start gap-3.5 pt-2">
                        {/* Icon */}
                        <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-xs">
                          <Bot className="w-4 h-4" />
                        </div>

                        {/* Content Body */}
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-text-secondary mb-1">
                            BI Analyst
                          </div>

                          <RenderFormattedContent content={m.content} />

                          {/* ChatGPT Message Action Bar */}
                          <div className="flex items-center gap-1 mt-3 pt-1 text-text-secondary opacity-70 group-hover:opacity-100 transition-opacity">
                            {/* Copy Button */}
                            <button
                              type="button"
                              onClick={() => handleCopyMessage(m.id, m.content)}
                              className="p-1.5 rounded-lg hover:bg-bg-secondary hover:text-text-primary transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
                              title="Copy response"
                            >
                              {isCopied ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                                  <span className="text-emerald-500">Copied</span>
                                </>
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>

                            {/* Thumbs Up */}
                            <button
                              type="button"
                              onClick={() => handleFeedback(m.id, "up")}
                              className={`p-1.5 rounded-lg hover:bg-bg-secondary transition-colors cursor-pointer ${
                                feedback === "up"
                                  ? "text-purple-600 dark:text-purple-400 bg-purple-500/10"
                                  : "hover:text-text-primary"
                              }`}
                              title="Helpful"
                            >
                              <ThumbsUp className="w-3.5 h-3.5" />
                            </button>

                            {/* Thumbs Down */}
                            <button
                              type="button"
                              onClick={() => handleFeedback(m.id, "down")}
                              className={`p-1.5 rounded-lg hover:bg-bg-secondary transition-colors cursor-pointer ${
                                feedback === "down"
                                  ? "text-red-500 bg-red-500/10"
                                  : "hover:text-text-primary"
                              }`}
                              title="Not helpful"
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

              {/* Streaming / Loading Indicator */}
              {loading && (
                <div className="flex items-start gap-3.5 pt-2 animate-in fade-in duration-200">
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shrink-0 mt-0.5">
                    <Bot className="w-4 h-4 animate-spin" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-text-secondary mb-1">BI Analyst</div>
                    <div className="flex items-center gap-2 text-xs text-text-secondary py-1">
                      <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping" />
                      <span>Analyzing live database & synthesizing answer...</span>
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
          {error && (
            <div className="mb-2 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={() => setError(null)}
                className="text-xs hover:underline cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Floating Pill Input Box (Signature ChatGPT) */}
          <div className="relative rounded-3xl border border-border-main bg-bg-card shadow-md focus-within:shadow-lg focus-within:border-purple-500/60 transition-all p-2 sm:p-3">
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about your leads, revenue, conversion, or team..."
              disabled={loading}
              className="w-full bg-transparent resize-none border-none outline-none focus:outline-none focus:ring-0 text-sm text-text-primary placeholder:text-text-secondary px-2 py-1 max-h-44"
              style={{ overflowY: inputValue.length > 200 ? "auto" : "hidden" }}
            />

            {/* Bottom Row inside capsule */}
            <div className="flex items-center justify-between pt-1 px-1">
              <div className="flex items-center gap-1.5 text-[11px] text-text-secondary">
                <span className="hidden sm:inline">Press</span>
                <kbd className="px-1.5 py-0.5 rounded bg-bg-secondary text-[10px] font-mono border border-border-main hidden sm:inline">
                  Enter ↵
                </kbd>
                <span className="hidden sm:inline">to send</span>
              </div>

              {/* Round Send Button with ArrowUp */}
              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!inputValue.trim() || loading}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all bg-purple-600 hover:bg-purple-700 text-white disabled:bg-bg-secondary disabled:text-text-secondary/40 cursor-pointer disabled:cursor-not-allowed shadow-xs shrink-0"
                aria-label="Send message"
              >
                <ArrowUp className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>

          {/* ChatGPT Disclaimer */}
          <p className="text-center text-[11px] text-text-secondary/70 mt-2">
            BI Analyst can make mistakes. Verify critical business numbers with raw CRM reports.
          </p>
        </div>
      </div>
    </div>
  );
}
