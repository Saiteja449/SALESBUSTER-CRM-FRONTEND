import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import {
  Sparkles,
  Bot,
  LifeBuoy,
  Ticket,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  Headphones,
  Check,
  RefreshCw,
  ExternalLink,
  MessageSquare,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useSupportModal } from "../context/SupportModalContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { API_ENDPOINTS } from "../utils/constants.js";

const QUICK_PROMPTS = [
  "How do I pair WhatsApp via code or QR?",
  "Why are call recordings not syncing from Android?",
  "How to assign incoming leads to sales reps?",
  "How do I import leads from Excel / CSV?",
];

const CATEGORIES = [
  { id: "technical_issue", label: "Technical Bug / Issue" },
  { id: "whatsapp_meta", label: "WhatsApp & Meta Coexistence" },
  { id: "call_recording", label: "Call Recording & Mobile App" },
  { id: "leads_pipeline", label: "Leads Directory & Pipeline" },
  { id: "billing", label: "Billing & Subscriptions" },
  { id: "feature_request", label: "Feature Request" },
  { id: "general", label: "General Inquiry" },
];

const CALENDLY_BASE_URL = "https://calendly.com/team-salesbuster/30min";

export default function SupportCenter() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get("tab");

  const {
    activeTab: contextTab,
    setActiveTab: setContextTab,
    handoffData,
    setHandoffData,
    meetingContext,
  } = useSupportModal();

  const { currentUser, organization } = useAuth();

  // Primary active tab state synchronized with URL query params
  const activeTab = urlTab || contextTab || "instant_ai";

  const handleTabChange = (tabId) => {
    setSearchParams({ tab: tabId });
    setContextTab(tabId);
  };

  // --- Tab 1: AI Chat State ---
  const [chatMessages, setChatMessages] = useState([
    {
      role: "assistant",
      content:
        "Hello! I am your SalesBuster Instant Support Assistant. Ask me anything about WhatsApp pairing, call recording, lead management, or setup. How can I assist you today?",
      timestamp: new Date(),
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [resolvedSuccessToast, setResolvedSuccessToast] = useState(false);
  const chatBottomRef = useRef(null);

  // --- Tab 2: Report Form State ---
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("technical_issue");
  const [priority, setPriority] = useState("medium");
  const [description, setDescription] = useState("");
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [ticketSuccess, setTicketSuccess] = useState(null);

  // --- Tab 3: Tickets Tracker State ---
  const [tickets, setTickets] = useState([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  const [ticketFilter, setTicketFilter] = useState("all");
  const [selectedTicketId, setSelectedTicketId] = useState(null);

  // Auto-scroll chat
  useEffect(() => {
    if (activeTab === "instant_ai") {
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, activeTab]);

  // Handle handoff pre-fill when escalated from AI chat
  useEffect(() => {
    if (handoffData) {
      if (handoffData.subject) setSubject(handoffData.subject);
      if (handoffData.category) setCategory(handoffData.category);
      if (handoffData.description) setDescription(handoffData.description);
    }
  }, [handoffData]);

  // Fetch tickets on mount & when My Tickets tab is active
  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    if (activeTab === "my_tickets") {
      fetchTickets();
    }
  }, [activeTab]);

  const fetchTickets = async () => {
    try {
      setIsLoadingTickets(true);
      const res = await axios.get(API_ENDPOINTS.SUPPORT.TICKETS);
      if (res.data?.success) {
        setTickets(res.data.tickets || []);
      }
    } catch (err) {
      console.error("Error fetching tickets:", err);
    } finally {
      setIsLoadingTickets(false);
    }
  };

  // 1. Send Message to AI Support
  const handleSendAiMessage = async (textToSend) => {
    const query = (textToSend || chatInput).trim();
    if (!query || isAiLoading) return;

    const userMsg = { role: "user", content: query, timestamp: new Date() };
    const newHistory = [...chatMessages, userMsg];
    setChatMessages(newHistory);
    setChatInput("");
    setIsAiLoading(true);

    try {
      const res = await axios.post(API_ENDPOINTS.SUPPORT.AI_CHAT, {
        message: query,
        history: newHistory.map((m) => ({ role: m.role, content: m.content })),
      });

      if (res.data?.success) {
        const assistantMsg = {
          role: "assistant",
          content: res.data.reply,
          timestamp: new Date(),
          suggestedSubject: res.data.suggestedSubject,
          suggestedCategory: res.data.suggestedCategory,
        };
        setChatMessages((prev) => [...prev, assistantMsg]);
      }
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I encountered a temporary connection issue. You can click 'Still need help? Report an Issue' below to raise a ticket directly with our engineering team.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  // 2. Mark AI Issue as Resolved
  const handleMarkResolved = () => {
    setResolvedSuccessToast(true);
    setTimeout(() => {
      setResolvedSuccessToast(false);
    }, 4000);
  };

  // 3. One-Click Escalation from AI Chat to Ticket
  const handleEscalateToTicket = (lastMsg) => {
    const fullTranscript = chatMessages.map((m) => ({
      role: m.role,
      content: m.content,
      timestamp: m.timestamp,
    }));

    const firstUserMsg = chatMessages.find((m) => m.role === "user");
    const summary =
      lastMsg?.suggestedSubject || firstUserMsg?.content?.slice(0, 70) || "CRM Technical Inquiry";

    setHandoffData({
      subject: summary,
      category: lastMsg?.suggestedCategory || "technical_issue",
      description: `Issue raised from AI Chat:\n"${firstUserMsg?.content || summary}"`,
      aiChatHistory: fullTranscript,
      aiSummary: summary,
    });

    handleTabChange("report_issue");
  };

  // 4. Submit Human Support Ticket
  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;

    try {
      setIsSubmittingTicket(true);
      const payload = {
        subject: subject.trim(),
        category,
        priority,
        description: description.trim(),
        aiChatHistory: handoffData?.aiChatHistory || [],
        aiSummary: handoffData?.aiSummary || subject.trim(),
      };

      const res = await axios.post(API_ENDPOINTS.SUPPORT.TICKETS, payload);
      if (res.data?.success) {
        setTicketSuccess(res.data.ticket);
        setSubject("");
        setDescription("");
        setHandoffData(null);
        fetchTickets();
        setTimeout(() => {
          setTicketSuccess(null);
          handleTabChange("my_tickets");
        }, 1500);
      }
    } catch (err) {
      alert(err.response?.data?.error || "Failed to submit ticket. Please try again.");
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  // Filtered tickets
  const filteredTickets = tickets.filter((t) => {
    if (ticketFilter === "all") return true;
    return t.status === ticketFilter;
  });

  const openTicketsCount = tickets.filter((t) => t.status === "open" || t.status === "in_progress").length;

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto w-full space-y-6">
      {/* Top Header Card */}
      <div className="bg-bg-card border border-border-main rounded-2xl p-5 md:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
            <LifeBuoy className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl md:text-2xl font-extrabold text-text-primary tracking-tight">
                Support & Help Center
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                24/7 AI & Engineering Support
              </span>
            </div>
            <p className="text-xs md:text-sm text-text-secondary mt-1">
              Ask instant technical questions, submit tickets directly to engineering, and track resolution in real time.
            </p>
          </div>
        </div>

        {/* Quick Stats Pills */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-xl bg-bg-secondary/40 border border-border-main text-xs">
            <span className="text-text-secondary block text-[10px] uppercase font-bold tracking-wider">
              Active Tickets
            </span>
            <span className="font-extrabold text-text-primary text-sm">
              {openTicketsCount}
            </span>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-bg-secondary/40 border border-border-main text-xs">
            <span className="text-text-secondary block text-[10px] uppercase font-bold tracking-wider">
              Avg Response
            </span>
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
              Instant (AI)
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="flex items-center gap-2 border-b border-border-main pb-2 overflow-x-auto">
        {/* Tab 1: Instant Support (AI) */}
        <button
          type="button"
          onClick={() => handleTabChange("instant_ai")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "instant_ai"
              ? "bg-purple-600 text-white shadow-xs"
              : "bg-bg-card border border-border-main text-text-secondary hover:text-text-primary hover:bg-bg-secondary/40"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Instant Support</span>
          <span className="text-[11px] opacity-80">(AI Help)</span>
        </button>

        {/* Tab 2: Report an Issue */}
        <button
          type="button"
          onClick={() => handleTabChange("report_issue")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "report_issue"
              ? "bg-purple-600 text-white shadow-xs"
              : "bg-bg-card border border-border-main text-text-secondary hover:text-text-primary hover:bg-bg-secondary/40"
          }`}
        >
          <AlertCircle className="w-4 h-4" />
          <span>Report an Issue</span>
          <span className="text-[11px] opacity-80">(Human Support)</span>
        </button>

        {/* Tab 3: My Tickets Tracker */}
        <button
          type="button"
          onClick={() => handleTabChange("my_tickets")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "my_tickets"
              ? "bg-purple-600 text-white shadow-xs"
              : "bg-bg-card border border-border-main text-text-secondary hover:text-text-primary hover:bg-bg-secondary/40"
          }`}
        >
          <Ticket className="w-4 h-4" />
          <span>My Tickets</span>
          {tickets.length > 0 && (
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === "my_tickets"
                  ? "bg-white/20 text-white"
                  : "bg-bg-secondary text-text-primary"
              }`}
            >
              {tickets.length}
            </span>
          )}
        </button>

        {/* Tab 4: 1-on-1 Consultation */}
        <button
          type="button"
          onClick={() => handleTabChange("consultation")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "consultation"
              ? "bg-purple-600 text-white shadow-xs"
              : "bg-bg-card border border-border-main text-text-secondary hover:text-text-primary hover:bg-bg-secondary/40"
          }`}
        >
          <Headphones className="w-4 h-4" />
          <span>Book 1-on-1 Consultation</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: INSTANT SUPPORT (AI HELP) */}
      {/* ========================================================================= */}
      {activeTab === "instant_ai" && (
        <div className="bg-bg-card border border-border-main rounded-2xl shadow-xs overflow-hidden flex flex-col h-[720px] max-h-[80vh]">
          {/* AI Status Banner */}
          <div className="px-5 py-3 border-b border-border-main bg-gradient-to-r from-bg-card via-purple-500/5 to-bg-card flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-text-secondary">
              <Bot className="w-4 h-4 text-purple-500" />
              <span>
                Connected to <strong>SalesBuster Knowledge Base</strong> (WhatsApp Coexistence, Call Sync, Leads & Setup).
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleTabChange("report_issue")}
              className="text-xs text-purple-600 dark:text-purple-400 font-semibold hover:underline flex items-center gap-1"
            >
              Need human engineers? Raise Ticket &rarr;
            </button>
          </div>

          {resolvedSuccessToast && (
            <div className="bg-emerald-500/15 border-b border-emerald-500/30 px-4 py-2.5 text-xs text-emerald-700 dark:text-emerald-300 font-semibold flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Awesome! We are glad your issue was resolved automatically.
            </div>
          )}

          {/* Chat Messages Scroll */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {chatMessages.map((msg, idx) => {
              const isAssistant = msg.role === "assistant";
              return (
                <div
                  key={idx}
                  className={`flex items-start gap-3 ${
                    isAssistant ? "justify-start" : "justify-end"
                  }`}
                >
                  {isAssistant && (
                    <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                      <Bot className="w-5 h-5" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                      isAssistant
                        ? "bg-bg-secondary/40 border border-border-main text-text-primary shadow-xs"
                        : "bg-purple-600 text-white rounded-br-xs shadow-xs"
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>

                    {/* Resolution Choices for Assistant responses (except intro) */}
                    {isAssistant && idx > 0 && (
                      <div className="mt-3.5 pt-3 border-t border-border-main/60 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={handleMarkResolved}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 transition-all cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Issue Resolved
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEscalateToTicket(msg)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/20 transition-all cursor-pointer"
                        >
                          <AlertCircle className="w-3.5 h-3.5" />
                          Still need help? Report an Issue
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isAiLoading && (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="bg-bg-secondary/40 border border-border-main rounded-2xl px-4 py-2.5 text-xs text-text-secondary flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                  Analyzing CRM knowledge base...
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Quick Prompt Pills */}
          <div className="px-4 sm:px-6 py-2.5 border-t border-border-main/50 bg-bg-secondary/20 flex items-center gap-2 overflow-x-auto">
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider shrink-0">
              Suggested:
            </span>
            {QUICK_PROMPTS.map((prompt, pIdx) => (
              <button
                key={pIdx}
                type="button"
                onClick={() => handleSendAiMessage(prompt)}
                disabled={isAiLoading}
                className="px-3 py-1.5 rounded-full text-xs bg-bg-card hover:bg-bg-secondary border border-border-main text-text-secondary hover:text-text-primary whitespace-nowrap transition-colors cursor-pointer"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <div className="p-3 sm:p-4 border-t border-border-main bg-bg-card flex items-center gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendAiMessage()}
              placeholder="Ask anything about WhatsApp pairing, call recordings, leads, setup..."
              disabled={isAiLoading}
              className="flex-1 bg-bg-secondary/40 border border-border-main rounded-xl px-4 py-3 text-xs sm:text-sm text-text-primary focus:outline-hidden focus:ring-1 focus:ring-purple-500"
            />
            <button
              type="button"
              onClick={() => handleSendAiMessage()}
              disabled={!chatInput.trim() || isAiLoading}
              className="px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-40 transition-all cursor-pointer font-semibold flex items-center gap-2 shadow-xs"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: REPORT AN ISSUE (HUMAN SUPPORT & TICKETING) */}
      {/* ========================================================================= */}
      {activeTab === "report_issue" && (
        <div className="bg-bg-card border border-border-main rounded-2xl p-6 sm:p-8 shadow-xs">
          {ticketSuccess ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-lg font-bold text-text-primary">
                Support Ticket Raised Successfully!
              </h3>
              <p className="text-xs sm:text-sm text-text-secondary max-w-md">
                Ticket <strong>{ticketSuccess.ticketNumber}</strong> has been logged. Our engineering
                team will review your issue and attached conversation history immediately.
              </p>
              <div className="pt-2 text-xs text-purple-600 font-semibold animate-pulse">
                Redirecting to My Tickets...
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmitTicket} className="space-y-5 max-w-3xl mx-auto">
              <div className="border-b border-border-main pb-4">
                <h2 className="text-base sm:text-lg font-bold text-text-primary">
                  Submit a Support Ticket
                </h2>
                <p className="text-xs text-text-secondary mt-1">
                  Our technical engineering team will review your diagnostic logs and ticket details.
                </p>
              </div>

              {/* Auto Handoff Notice */}
              {handoffData?.aiChatHistory?.length > 0 && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
                  <Check className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div className="text-xs sm:text-sm text-emerald-800 dark:text-emerald-300">
                    <strong>AI Chat Transcript Attached:</strong> Our support engineers can view the full
                    troubleshooting conversation. You do not need to re-explain the issue.
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs sm:text-sm font-bold text-text-primary mb-1.5">
                  Issue Subject / Summary <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. WhatsApp pairing code expired repeatedly"
                  className="w-full bg-bg-secondary/40 border border-border-main rounded-xl px-4 py-2.5 text-xs sm:text-sm text-text-primary focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-text-primary mb-1.5">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-bg-secondary/40 border border-border-main rounded-xl px-4 py-2.5 text-xs sm:text-sm text-text-primary focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-bold text-text-primary mb-1.5">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full bg-bg-secondary/40 border border-border-main rounded-xl px-4 py-2.5 text-xs sm:text-sm text-text-primary focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                  >
                    <option value="low">Low (General question)</option>
                    <option value="medium">Medium (Standard issue)</option>
                    <option value="high">High (Urgent production issue)</option>
                    <option value="urgent">Urgent (System down / Blocking)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-text-primary mb-1.5">
                  Detailed Explanation <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={5}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide any additional details or error messages encountered..."
                  className="w-full bg-bg-secondary/40 border border-border-main rounded-xl p-4 text-xs sm:text-sm text-text-primary focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                />
              </div>

              {/* Submitter Details Auto-Filled */}
              <div className="p-3.5 rounded-xl bg-bg-secondary/30 border border-border-main text-xs text-text-secondary flex flex-wrap items-center gap-4">
                <span>
                  <strong>Reporter:</strong> {currentUser?.name || "User"}
                </span>
                <span>
                  <strong>Email:</strong> {currentUser?.email}
                </span>
                <span>
                  <strong>Organization:</strong> {organization?.name || "Client"}
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => handleTabChange("instant_ai")}
                  className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-text-secondary hover:text-text-primary hover:bg-bg-secondary/50 transition-colors"
                >
                  Back to AI Help
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTicket}
                  className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-purple-600 hover:bg-purple-700 text-white transition-all cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isSubmittingTicket ? "Submitting Ticket..." : "Submit Support Ticket"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: MY TICKETS (STATUS TRACKING & HISTORY) */}
      {/* ========================================================================= */}
      {activeTab === "my_tickets" && (
        <div className="bg-bg-card border border-border-main rounded-2xl shadow-xs overflow-hidden flex flex-col">
          {/* Filter Bar */}
          <div className="px-5 py-3.5 border-b border-border-main bg-bg-secondary/20 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {["all", "open", "in_progress", "resolved"].map((st) => (
                <button
                  key={st}
                  onClick={() => setTicketFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                    ticketFilter === st
                      ? "bg-purple-600 text-white"
                      : "text-text-secondary hover:text-text-primary hover:bg-bg-secondary"
                  }`}
                >
                  {st.replace("_", " ")}
                </button>
              ))}
            </div>
            <button
              onClick={fetchTickets}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-main text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-colors"
              title="Refresh tickets"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingTickets ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>

          {/* Tickets List */}
          <div className="p-5 sm:p-6">
            {isLoadingTickets ? (
              <div className="py-16 text-center text-xs text-text-secondary">
                Loading tickets...
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center text-center space-y-2">
                <Ticket className="w-12 h-12 text-text-secondary/40" />
                <p className="text-sm font-bold text-text-primary">No Support Tickets Found</p>
                <p className="text-xs text-text-secondary max-w-sm">
                  You currently have no tickets matching this filter. If you have an issue, submit a ticket in the Report an Issue tab.
                </p>
                <button
                  type="button"
                  onClick={() => handleTabChange("report_issue")}
                  className="mt-3 px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600 text-white hover:bg-purple-700"
                >
                  Create First Ticket
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTickets.map((t) => {
                  const isSelected = selectedTicketId === t._id;
                  return (
                    <div
                      key={t._id}
                      className={`p-4 sm:p-5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-purple-500/5 border-purple-500/40 shadow-xs"
                          : "bg-bg-secondary/20 border-border-main hover:border-purple-500/30"
                      }`}
                      onClick={() => setSelectedTicketId(isSelected ? null : t._id)}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md">
                            {t.ticketNumber}
                          </span>
                          <span className="text-sm font-bold text-text-primary">{t.subject}</span>
                        </div>

                        {/* Status Pill */}
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              t.status === "open"
                                ? "bg-blue-500/10 text-blue-600 border border-blue-500/20"
                                : t.status === "in_progress"
                                ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20"
                                : "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                            }`}
                          >
                            {t.status.replace("_", " ")}
                          </span>
                          {isSelected ? (
                            <ChevronUp className="w-4 h-4 text-text-secondary" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-text-secondary" />
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between text-xs text-text-secondary gap-2">
                        <span>Category: <strong>{t.category.replace("_", " ")}</strong></span>
                        <span>Created: {new Date(t.createdAt).toLocaleString()}</span>
                      </div>

                      {/* Expanded Drawer Details */}
                      {isSelected && (
                        <div className="mt-4 pt-4 border-t border-border-main/60 space-y-3.5 text-xs sm:text-sm">
                          <div>
                            <strong className="text-text-primary block mb-1">Problem Description:</strong>
                            <p className="text-text-secondary whitespace-pre-wrap leading-relaxed">
                              {t.description}
                            </p>
                          </div>

                          {/* Resolution Notes from Super Admin */}
                          {t.resolutionNotes && (
                            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                              <strong className="text-emerald-700 dark:text-emerald-300 block mb-1">
                                Support Team Resolution Notes:
                              </strong>
                              <p className="text-emerald-900 dark:text-emerald-100 whitespace-pre-wrap leading-relaxed">
                                {t.resolutionNotes}
                              </p>
                              {t.resolvedAt && (
                                <div className="mt-2 text-[11px] text-emerald-600">
                                  Resolved on {new Date(t.resolvedAt).toLocaleString()} by{" "}
                                  {t.resolvedBy || "Support Engineer"}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Attached AI Chat Transcript */}
                          {t.aiChatHistory && t.aiChatHistory.length > 0 && (
                            <div className="p-3.5 rounded-xl bg-bg-secondary/40 border border-border-main">
                              <strong className="text-text-primary text-xs block mb-2">
                                Attached AI Troubleshooting Transcript ({t.aiChatHistory.length}{" "}
                                messages):
                              </strong>
                              <div className="space-y-2 max-h-48 overflow-y-auto text-xs">
                                {t.aiChatHistory.map((m, mIdx) => (
                                  <div key={mIdx}>
                                    <span className="font-bold text-text-secondary">
                                      {m.role === "assistant" ? "AI Assistant" : "User"}:
                                    </span>{" "}
                                    <span className="text-text-primary">{m.content}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: 1-ON-1 CONSULTATION (CALENDLY EMBED / MEETING) */}
      {/* ========================================================================= */}
      {activeTab === "consultation" && (
        <div className="bg-bg-card border border-border-main rounded-2xl shadow-xs overflow-hidden h-[750px] relative flex flex-col">
          <div className="p-4 border-b border-border-main bg-bg-secondary/20 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-text-primary">
                Book 1-on-1 Human Technical Assistance
              </h3>
              <p className="text-xs text-text-secondary">
                Select a convenient 30-minute slot with our solutions engineering team.
              </p>
            </div>
            <a
              href={`${CALENDLY_BASE_URL}?name=${encodeURIComponent(
                currentUser?.name || organization?.name || ""
              )}&email=${encodeURIComponent(currentUser?.email || organization?.email || "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-xs"
            >
              <span>Open in New Tab</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
          <div className="flex-1 relative">
            <iframe
              src={`${CALENDLY_BASE_URL}?name=${encodeURIComponent(
                currentUser?.name || organization?.name || ""
              )}&email=${encodeURIComponent(currentUser?.email || organization?.email || "")}`}
              width="100%"
              height="100%"
              frameBorder="0"
              title="Calendly Consultation"
            />
          </div>
        </div>
      )}
    </div>
  );
}
