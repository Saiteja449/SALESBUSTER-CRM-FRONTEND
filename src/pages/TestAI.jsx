import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  Send,
  RefreshCw,
  Bot,
  Sparkles,
  User,
  Clock,
  AlertCircle,
  CheckCircle2,
  Settings,
  ExternalLink,
  MessageSquare,
  Flame,
  HelpCircle,
  ArrowRight,
  ShieldAlert,
  Zap,
  Image as ImageIcon,
} from "lucide-react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useLeads } from "../context/LeadsContext.jsx";
import { useWhatsAppToast } from "../context/WhatsAppToastContext.jsx";
import { getLocalTodayDateString } from "../utils/helpers.js";
import { API_ENDPOINTS } from "../utils/constants.js";

export default function TestAI() {
  const { isManager, currentUser } = useAuth();
  const { qualificationFields: contextQualFields } = useLeads();
  const { addAiFollowupToast } = useWhatsAppToast();

  const [schemaFields, setSchemaFields] = useState([]);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [aiQualification, setAiQualification] = useState(null);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [leadId, setLeadId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState("chat"); // "chat" | "qualification"

  // Organization AI Settings State
  const [orgAiSettings, setOrgAiSettings] = useState(null);
  const [loadingSettings, setLoadingSettings] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const isAuthorized =
    isManager ||
    currentUser?.role === "Sales Manager" ||
    currentUser?.role === "Super Admin" ||
    currentUser?.isOrgOwner;

  if (import.meta.env.VITE_PROD === "true" || !isAuthorized) {
    return <Navigate to="/dashboard" replace />;
  }

  const API_URL = import.meta.env.VITE_API_BASE_URL
    ? `${import.meta.env.VITE_API_BASE_URL}/whatsapp/test-ai`
    : "https://betaapi.salesbuster.ai/api/whatsapp/test-ai";

  // Fetch organization's active AI settings for context
  const fetchOrgAiSettings = async () => {
    try {
      setLoadingSettings(true);
      const res = await axios.get(API_ENDPOINTS.ORGANIZATIONS.AI_SETTINGS);
      if (res.data?.success && res.data?.aiSettings) {
        setOrgAiSettings(res.data.aiSettings);
        if (res.data.aiSettings.qualificationFields?.length) {
          setSchemaFields(res.data.aiSettings.qualificationFields);
        }
      }
    } catch (err) {
      console.warn("Could not load organization AI settings:", err);
    } finally {
      setLoadingSettings(false);
    }
  };

  const handleSimulateAIFollowupToast = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = getLocalTodayDateString(tomorrow);

    addAiFollowupToast({
      followup: {
        id: "test_fu_" + Date.now(),
        leadId: leadId || "mock_lead_1",
        leadName: "Rahul Sharma",
        type: "Call",
        date: tomorrowStr,
        time: "11:00 AM",
        priority: "High",
        notes:
          "Customer requested a callback regarding product quotation and site measurement.",
        author: "AI Agent",
      },
      lead: {
        id: leadId || "mock_lead_1",
        name: "Rahul Sharma",
        phone: "+91 98765 43210",
        service: "General Inquiry",
      },
      message:
        "Customer requested a callback regarding product quotation and site measurement.",
      assignedRepName: "Sales Representative",
      timestamp: new Date(),
    });
  };

  const fetchHistory = async () => {
    try {
      setHistoryLoading(true);
      setErrorMessage("");
      const res = await axios.get(API_URL);
      setMessages(res.data.messages || []);
      setAiQualification(res.data.aiQualification || null);
      if (res.data.qualificationFields?.length) {
        setSchemaFields(res.data.qualificationFields);
      }
      setLeadId(res.data.leadId);
    } catch (error) {
      console.error("Error fetching AI test history:", error);
      setErrorMessage(
        error?.response?.data?.message ||
          "Failed to load test conversation history. Please check your network connection.",
      );
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    fetchOrgAiSettings();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (messageToSend) => {
    const text = (typeof messageToSend === "string" ? messageToSend : inputText).trim();
    if (!text || loading) return;

    const userMessage = {
      text,
      role: "user",
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setLoading(true);
    setErrorMessage("");

    const startTime = performance.now();

    try {
      const res = await axios.post(API_URL, {
        message: text,
        leadId,
      });

      const latencyMs = Math.round(performance.now() - startTime);

      const aiResponse = {
        text: res.data.outgoing?.text || "No reply generated.",
        role: "ai",
        timestamp: res.data.outgoing?.timestamp || new Date().toISOString(),
        durationMs: latencyMs,
        serviceImages: res.data.serviceImages || [],
      };

      setMessages((prev) => [...prev, aiResponse]);
      setAiQualification(res.data.aiQualification);
      if (res.data.qualificationFields?.length) {
        setSchemaFields(res.data.qualificationFields);
      }
      if (res.data.leadId) {
        setLeadId(res.data.leadId);
      }
    } catch (error) {
      console.error("Error sending message to AI:", error);
      const errMsg =
        error?.response?.data?.message ||
        "Failed to generate AI response. Please ensure your Gemini API key is configured.";
      setErrorMessage(errMsg);
      // Append an error note in chat
      setMessages((prev) => [
        ...prev,
        {
          text: `Error: ${errMsg}`,
          role: "ai",
          isError: true,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleReset = async () => {
    try {
      setLoading(true);
      setConfirmReset(false);
      setErrorMessage("");
      await axios.post(API_URL, { reset: true, leadId });
      setMessages([]);
      setAiQualification(null);
      await fetchHistory();
    } catch (error) {
      console.error("Error resetting AI test:", error);
      setErrorMessage(
        error?.response?.data?.message || "Failed to reset test conversation.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Starter prompts to quickly test AI responses
  const starterPrompts = [
    "Hi! What services or products do you offer?",
    "What is your pricing and how soon can you start?",
    "Can someone call me tomorrow at 11:00 AM?",
    "1",
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] overflow-hidden p-3 sm:p-5 gap-3 max-w-[1600px] mx-auto w-full">
      {/* ── Top Configuration & Context Banner ── */}
      <div className="rounded-2xl border border-border-main bg-bg-card p-3 sm:p-4 shadow-xs shrink-0 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-xs">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base font-bold text-text-primary leading-tight">
                AI Sales Agent Test Sandbox
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3" />
                Live Saved Prompts
              </span>
              {orgAiSettings && (
                <span className="text-[11px] text-text-secondary bg-bg-secondary px-2 py-0.5 rounded-md border border-border-main font-medium">
                  {orgAiSettings.companyName || "Organization"} &bull; {orgAiSettings.agentPersona || "Helpful"} Tone
                </span>
              )}
            </div>
            <p className="text-xs text-text-secondary mt-0.5">
              Simulate customer WhatsApp chats to test automated replies, service suggestions, and real-time lead qualification.
            </p>
          </div>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-2 self-end md:self-center shrink-0 flex-wrap">
          <Link
            to="/organization-profile"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary bg-bg-secondary hover:bg-bg-secondary/80 border border-border-main rounded-xl transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:outline-none"
            title="Edit company description, tone, offerings, or lead questions in Organization Profile"
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Configure AI Prompts</span>
            <ExternalLink className="w-3 h-3 opacity-60" />
          </Link>

          <button
            type="button"
            onClick={handleSimulateAIFollowupToast}
            aria-label="Test AI follow-up alert toast"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl shadow-xs transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:outline-none"
            title="Preview the real-time AI follow-up notification popup"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Preview Follow-up Alert</span>
          </button>
        </div>
      </div>

      {/* ── Unconfigured AI Warning (if Gemini key missing) ── */}
      {orgAiSettings && !orgAiSettings.isGeminiKeyConfigured && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start justify-between gap-3 text-xs text-amber-900 dark:text-amber-200 shrink-0 animate-fadeIn">
          <div className="flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Gemini API Key Missing: </span>
              Your organization has not saved a validated Gemini API key. AI testing may fail or return fallback messages until configured.
            </div>
          </div>
          <Link
            to="/organization-profile"
            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[11px] shrink-0 transition-colors"
          >
            Setup Key
          </Link>
        </div>
      )}

      {/* ── Mobile Tab Switcher (Chat vs Qualification) ── */}
      <div className="flex md:hidden border-b border-border-main bg-bg-card rounded-xl p-1 shrink-0">
        <button
          type="button"
          onClick={() => setActiveMobileTab("chat")}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
            activeMobileTab === "chat"
              ? "bg-purple-600 text-white shadow-xs"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Chat Sandbox ({messages.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveMobileTab("qualification")}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
            activeMobileTab === "qualification"
              ? "bg-purple-600 text-white shadow-xs"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Extracted Lead Info</span>
        </button>
      </div>

      {/* ── Main Dual-Panel Layout ── */}
      <div className="flex-1 flex overflow-hidden gap-4 min-h-0">
        {/* ── LEFT: Chat Simulation Area ── */}
        <div
          className={`flex-1 flex flex-col bg-bg-card rounded-2xl border border-border-main overflow-hidden shadow-xs ${
            activeMobileTab === "chat" ? "flex" : "hidden md:flex"
          }`}
        >
          {/* Chat Header */}
          <div className="p-3 sm:p-4 border-b border-border-main flex justify-between items-center bg-bg-secondary/40 shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-text-primary">
                Customer Conversation Stream
              </span>
              <span className="text-[11px] text-text-secondary hidden sm:inline">
                &bull; Simulates WhatsApp Test Lead (ID: {leadId ? String(leadId).slice(-6) : "dummy"})
              </span>
            </div>

            {/* Reset Action with Confirmation */}
            {confirmReset ? (
              <div className="flex items-center gap-1.5 animate-fadeIn">
                <span className="text-xs text-rose-600 dark:text-rose-400 font-semibold hidden sm:inline">
                  Clear test messages?
                </span>
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={loading}
                  className="px-2.5 py-1 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  Yes, Reset
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  disabled={loading}
                  className="px-2.5 py-1 text-xs font-bold bg-bg-secondary hover:bg-bg-secondary/80 text-text-secondary rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                disabled={loading || messages.length === 0}
                aria-label="Reset test conversation"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary bg-bg-secondary hover:bg-bg-secondary/80 border border-border-main rounded-xl transition-colors cursor-pointer disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:outline-none"
                title="Clear conversation history and restart the qualification simulation"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                <span>Reset Conversation</span>
              </button>
            )}
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {historyLoading ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <RefreshCw className="w-8 h-8 text-purple-600 animate-spin mb-3" />
                <p className="text-xs font-bold text-text-primary">Loading test simulation history...</p>
                <p className="text-[11px] text-text-secondary mt-1">Retrieving previous customer messages and AI replies</p>
              </div>
            ) : messages.length === 0 ? (
              /* Empty State with Explanations & Quick Prompts */
              <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto py-8">
                <div className="w-14 h-14 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4 shadow-inner">
                  <Bot className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-text-primary mb-1">
                  Ready to Test Your WhatsApp AI
                </h3>
                <p className="text-xs text-text-secondary mb-6 leading-relaxed">
                  Type a customer inquiry below or click any of the starter prompts to test how your AI greets customers, presents offerings, and extracts qualification data.
                </p>

                <div className="w-full space-y-2 text-left">
                  <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider block px-1">
                    Try a starter inquiry:
                  </span>
                  {starterPrompts.map((prompt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSend(prompt)}
                      disabled={loading}
                      className="w-full p-2.5 rounded-xl bg-bg-secondary/70 hover:bg-bg-secondary border border-border-main text-xs text-text-primary font-medium text-left flex items-center justify-between gap-2 transition-all cursor-pointer group hover:border-purple-500/50"
                    >
                      <span>&ldquo;{prompt}&rdquo;</span>
                      <ArrowRight className="w-3.5 h-3.5 text-text-secondary group-hover:text-purple-600 transition-transform group-hover:translate-x-0.5 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Messages List */
              messages.map((msg, index) => {
                const isUser = msg.role === "user";
                return (
                  <div
                    key={index}
                    className={`flex flex-col ${isUser ? "items-end" : "items-start"} animate-fadeIn`}
                  >
                    {/* Message Sender Header */}
                    <div
                      className={`flex items-center gap-1.5 mb-1 px-1 text-[11px] ${
                        isUser ? "text-purple-700 dark:text-purple-300" : "text-text-secondary"
                      }`}
                    >
                      {isUser ? (
                        <>
                          <span className="font-bold">Customer (You)</span>
                          <User className="w-3 h-3" />
                        </>
                      ) : (
                        <>
                          <Bot className="w-3 h-3 text-purple-600" />
                          <span className="font-bold text-text-primary">Sales AI Agent</span>
                          {msg.durationMs !== undefined && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-600 dark:text-amber-400 font-mono bg-amber-500/10 px-1.5 py-0.2 rounded">
                              <Zap className="w-2.5 h-2.5" />
                              {(msg.durationMs / 1000).toFixed(1)}s
                            </span>
                          )}
                        </>
                      )}
                    </div>

                    {/* Message Bubble */}
                    <div
                      className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 shadow-xs text-sm leading-relaxed ${
                        isUser
                          ? "bg-purple-600 text-white rounded-tr-xs"
                          : msg.isError
                            ? "bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/30 rounded-tl-xs"
                            : "bg-bg-secondary text-text-primary border border-border-main rounded-tl-xs"
                      }`}
                    >
                      <p className="whitespace-pre-wrap font-sans">{msg.text}</p>

                      {/* Service Images Carousel if sent by AI */}
                      {msg.serviceImages && msg.serviceImages.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-border-main/60 space-y-2">
                          <span className="text-[11px] font-bold text-text-secondary flex items-center gap-1">
                            <ImageIcon className="w-3 h-3" />
                            Catalog Photos Dispatched:
                          </span>
                          <div className="grid grid-cols-2 gap-2">
                            {msg.serviceImages.map((img, i) => (
                              <div
                                key={i}
                                className="rounded-xl overflow-hidden border border-border-main bg-bg-card p-1"
                              >
                                {img.url ? (
                                  <img
                                    src={img.url}
                                    alt={img.title || "Service photo"}
                                    className="w-full h-24 object-cover rounded-lg"
                                  />
                                ) : (
                                  <div className="w-full h-24 bg-bg-secondary flex items-center justify-center text-text-secondary text-xs">
                                    No Image
                                  </div>
                                )}
                                {img.title && (
                                  <p className="text-[10px] font-bold text-text-primary mt-1 truncate">
                                    {img.title}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Timestamp */}
                    {msg.timestamp && (
                      <span className="text-[10px] text-text-secondary/70 mt-0.5 px-1">
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    )}
                  </div>
                );
              })
            )}

            {/* AI Thinking Animation */}
            {loading && (
              <div className="flex items-start gap-2.5 animate-fadeIn">
                <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4 animate-pulse" />
                </div>
                <div className="bg-bg-secondary border border-border-main rounded-2xl rounded-tl-xs px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-secondary font-medium">
                      AI is generating reply...
                    </span>
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-purple-600 rounded-full animate-bounce"></span>
                      <span className="w-1.5 h-1.5 bg-purple-600 rounded-full animate-bounce delay-100"></span>
                      <span className="w-1.5 h-1.5 bg-purple-600 rounded-full animate-bounce delay-200"></span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message banner */}
            {errorMessage && !loading && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-700 dark:text-rose-300 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{errorMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setErrorMessage("")}
                  className="text-rose-500 hover:text-rose-700 font-bold p-1 cursor-pointer"
                  aria-label="Dismiss error"
                >
                  &times;
                </button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Chat Composer at Bottom */}
          <div className="p-3 sm:p-4 bg-bg-secondary/40 border-t border-border-main shrink-0">
            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                id="test-ai-message-input"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type customer inquiry (e.g., 'What are your prices?' or '1')..."
                className="flex-1 bg-bg-card border border-border-main rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:border-purple-500 focus-visible:ring-2 focus-visible:ring-purple-500/30 transition-all"
                disabled={loading}
                aria-label="Type message to test AI"
              />
              <button
                type="submit"
                disabled={loading || !inputText.trim()}
                aria-label="Send test message"
                className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-all disabled:opacity-40 flex items-center justify-center gap-1.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:outline-none"
              >
                <span>Send</span>
                <Send className="w-4 h-4" />
              </button>
            </form>
            <div className="flex items-center justify-between text-[11px] text-text-secondary/70 mt-1.5 px-1">
              <span>Press <strong>Enter</strong> to send &bull; Simulates real WhatsApp Web inbound message</span>
              <span className="hidden sm:inline">Responses are produced using current organization settings</span>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Extracted AI Qualification Area ── */}
        <div
          className={`w-full md:w-88 flex flex-col bg-bg-card rounded-2xl border border-border-main overflow-hidden shadow-xs shrink-0 ${
            activeMobileTab === "qualification" ? "flex" : "hidden md:flex"
          }`}
        >
          {/* Panel Header */}
          <div className="p-3 sm:p-4 border-b border-border-main bg-bg-secondary/40 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <h2 className="text-sm font-bold text-text-primary">
                  Live Qualification Extraction
                </h2>
              </div>
              {aiQualification && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20">
                  Active Sync
                </span>
              )}
            </div>
            <p className="text-[11px] text-text-secondary mt-0.5">
              Parameters extracted from chat by the AI extraction engine.
            </p>
          </div>

          {/* Qualification Content */}
          <div className="p-4 overflow-y-auto flex-1 space-y-4">
            {aiQualification ? (
              <div className="space-y-4">
                {/* Interest Score Gauge */}
                <div className="p-3 rounded-xl bg-bg-secondary/60 border border-border-main">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-text-primary flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-amber-500" />
                      Lead Interest Score
                    </span>
                    <span className="text-xs font-black text-text-primary">
                      {aiQualification.interestScore || 0} / 10
                    </span>
                  </div>
                  <div className="h-2 w-full bg-border-main rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        (aiQualification.interestScore || 0) >= 8
                          ? "bg-emerald-500"
                          : (aiQualification.interestScore || 0) >= 5
                            ? "bg-amber-500"
                            : "bg-rose-500"
                      }`}
                      style={{
                        width: `${Math.min(100, (aiQualification.interestScore || 0) * 10)}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-text-secondary mt-1">
                    <span>Cold (0-4)</span>
                    <span>Warm (5-7)</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">Hot (8-10)</span>
                  </div>
                </div>

                {/* Core Attributes Card */}
                <div className="space-y-2.5 text-xs">
                  <h3 className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">
                    Core Lead Attributes
                  </h3>

                  <div className="p-3 rounded-xl bg-bg-secondary/40 border border-border-main space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary">Service / Intent:</span>
                      <span className="font-bold text-text-primary text-right max-w-[60%] truncate">
                        {aiQualification.intent || aiQualification.service || (
                          <span className="text-text-secondary/50 font-normal">Not detected yet</span>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary">Location / City:</span>
                      <span className="font-bold text-text-primary text-right">
                        {aiQualification.city || (
                          <span className="text-text-secondary/50 font-normal">Not detected yet</span>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary">Requested Callback:</span>
                      <span className="font-bold text-text-primary text-right">
                        {aiQualification.preferredCallTime
                          ? `${aiQualification.preferredCallDate || "Soon"} (${aiQualification.preferredCallTime})`
                          : aiQualification.preferredCallDate || (
                              <span className="text-text-secondary/50 font-normal">None requested</span>
                            )}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary">Urgency Level:</span>
                      <span
                        className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                          aiQualification.urgency?.toLowerCase() === "high"
                            ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                            : aiQualification.urgency?.toLowerCase() === "low"
                              ? "bg-sky-500/15 text-sky-600 dark:text-sky-400"
                              : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {aiQualification.urgency || "Medium"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Dynamic Organization Schema Fields */}
                <div className="space-y-2.5 text-xs">
                  <h3 className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">
                    Custom Organization Questions
                  </h3>

                  <div className="p-3 rounded-xl bg-bg-secondary/40 border border-border-main space-y-2">
                    {(schemaFields?.length ? schemaFields : contextQualFields)?.length > 0 ? (
                      (schemaFields?.length ? schemaFields : contextQualFields).map((f) => {
                        const val = aiQualification[f.key];
                        return (
                          <div key={f.key} className="flex items-center justify-between gap-2">
                            <span className="text-text-secondary">{f.label || f.key}:</span>
                            <span className="font-bold text-text-primary text-right max-w-[55%] truncate">
                              {val !== undefined && val !== null && val !== "" ? (
                                String(val)
                              ) : (
                                <span className="text-text-secondary/50 font-normal">-</span>
                              )}
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-[11px] text-text-secondary">
                        No custom qualification fields defined. You can add questions in Organization Profile.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Empty Qualification State */
              <div className="flex flex-col items-center justify-center h-full text-center py-10 px-2">
                <div className="w-12 h-12 rounded-2xl bg-bg-secondary flex items-center justify-center text-text-secondary mb-3">
                  <HelpCircle className="w-6 h-6" />
                </div>
                <h4 className="text-xs font-bold text-text-primary mb-1">
                  No Qualification Data Yet
                </h4>
                <p className="text-[11px] text-text-secondary leading-relaxed">
                  As you test conversations with the AI, customer intent, city, urgency, callback schedules, and answers to your qualification questions will be extracted here automatically.
                </p>
              </div>
            )}
          </div>

          {/* Panel Footer / Help Tip */}
          <div className="p-3 border-t border-border-main bg-bg-secondary/20 text-[11px] text-text-secondary flex items-center justify-between shrink-0">
            <span>Updates in real-time as customer answers</span>
            <Link
              to="/organization-profile"
              className="text-purple-600 hover:text-purple-700 font-bold hover:underline"
            >
              Edit Questions &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

