import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  X,
  Sparkles,
  Bot,
  LifeBuoy,
  Ticket,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronRight,
  Headphones,
  Paperclip,
  Check,
  RotateCcw,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { useSupportModal } from "../../context/SupportModalContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { API_ENDPOINTS } from "../../utils/constants.js";

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

export default function SupportCenterModal() {
  const {
    isOpen,
    activeTab,
    setActiveTab,
    handoffData,
    setHandoffData,
    closeSupportModal,
  } = useSupportModal();

  const { currentUser, organization } = useAuth();

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
  const [selectedTicket, setSelectedTicket] = useState(null);

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

  // Fetch tickets when My Tickets tab is selected
  useEffect(() => {
    if (isOpen && activeTab === "my_tickets") {
      fetchTickets();
    }
  }, [isOpen, activeTab]);

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
      closeSupportModal();
    }, 2000);
  };

  // 3. One-Click Escalation from AI Chat to Ticket
  const handleEscalateToTicket = (lastMsg) => {
    const fullTranscript = chatMessages.map((m) => ({
      role: m.role,
      content: m.content,
      timestamp: m.timestamp,
    }));

    // Find first user query or last message subject
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

    setActiveTab("report_issue");
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
          setActiveTab("my_tickets");
        }, 1500);
      }
    } catch (err) {
      alert(err.response?.data?.error || "Failed to submit ticket. Please try again.");
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  if (!isOpen) return null;

  // Filtered tickets
  const filteredTickets = tickets.filter((t) => {
    if (ticketFilter === "all") return true;
    return t.status === ticketFilter;
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/65 backdrop-blur-xs animate-fadeIn"
      onClick={closeSupportModal}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-4xl h-[92vh] max-h-[760px] bg-bg-card border border-border-main rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header & Tab Navigation */}
        <div className="flex flex-col border-b border-border-main bg-gradient-to-r from-bg-card via-purple-500/5 to-bg-card shrink-0">
          <div className="flex items-center justify-between px-5 py-3.5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <LifeBuoy className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-text-primary tracking-tight flex items-center gap-2">
                  SalesBuster Support Center
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
                    24/7 Live
                  </span>
                </h2>
                <p className="text-xs text-text-secondary">
                  Instant AI answers or report an issue for human engineering assistance
                </p>
              </div>
            </div>
            <button
              onClick={closeSupportModal}
              className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-secondary/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Differentiated Tabs Navigation */}
          <div className="flex items-center gap-1 px-5 pb-2 overflow-x-auto">
            {/* Tab 1: AI Help (Instant Support) */}
            <button
              onClick={() => setActiveTab("instant_ai")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "instant_ai"
                  ? "bg-purple-600 text-white shadow-xs"
                  : "text-text-secondary hover:text-text-primary hover:bg-bg-secondary/40"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Instant Support</span>
              <span className="text-[10px] opacity-80">(AI Help)</span>
            </button>

            {/* Tab 2: Report an Issue */}
            <button
              onClick={() => setActiveTab("report_issue")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "report_issue"
                  ? "bg-purple-600 text-white shadow-xs"
                  : "text-text-secondary hover:text-text-primary hover:bg-bg-secondary/40"
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Report an Issue</span>
              <span className="text-[10px] opacity-80">(Human Support)</span>
            </button>

            {/* Tab 3: My Tickets Tracker */}
            <button
              onClick={() => setActiveTab("my_tickets")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "my_tickets"
                  ? "bg-purple-600 text-white shadow-xs"
                  : "text-text-secondary hover:text-text-primary hover:bg-bg-secondary/40"
              }`}
            >
              <Ticket className="w-3.5 h-3.5" />
              <span>My Tickets</span>
              {tickets.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-bg-card text-text-primary font-bold">
                  {tickets.length}
                </span>
              )}
            </button>

            {/* Tab 4: 1-on-1 Consultation */}
            <button
              onClick={() => setActiveTab("consultation")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "consultation"
                  ? "bg-purple-600 text-white shadow-xs"
                  : "text-text-secondary hover:text-text-primary hover:bg-bg-secondary/40"
              }`}
            >
              <Headphones className="w-3.5 h-3.5" />
              <span>Book Meeting</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: INSTANT SUPPORT (AI HELP) */}
        {/* ========================================================================= */}
        {activeTab === "instant_ai" && (
          <div className="flex-1 flex flex-col min-h-0 bg-bg-card">
            {resolvedSuccessToast && (
              <div className="bg-emerald-500/15 border-b border-emerald-500/30 px-4 py-2.5 text-xs text-emerald-700 dark:text-emerald-300 font-semibold flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Great! Glad we could resolve your issue automatically.
              </div>
            )}

            {/* Chat Messages Scroll */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
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
                      <div className="w-8 h-8 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-600 flex items-center justify-center shrink-0">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${
                        isAssistant
                          ? "bg-bg-secondary/40 border border-border-main text-text-primary"
                          : "bg-purple-600 text-white rounded-br-xs"
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{msg.content}</div>

                      {/* Resolution Choices for Assistant responses (except intro) */}
                      {isAssistant && idx > 0 && (
                        <div className="mt-3 pt-3 border-t border-border-main/60 flex flex-wrap items-center gap-2">
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
                  <div className="w-8 h-8 rounded-full bg-purple-500/10 text-purple-600 flex items-center justify-center">
                    <Bot className="w-4 h-4" />
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
            <div className="px-4 py-2 border-t border-border-main/50 bg-bg-secondary/20 flex items-center gap-2 overflow-x-auto">
              <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider shrink-0">
                Suggested:
              </span>
              {QUICK_PROMPTS.map((prompt, pIdx) => (
                <button
                  key={pIdx}
                  type="button"
                  onClick={() => handleSendAiMessage(prompt)}
                  disabled={isAiLoading}
                  className="px-2.5 py-1 rounded-full text-[11px] bg-bg-card hover:bg-bg-secondary border border-border-main text-text-secondary hover:text-text-primary whitespace-nowrap transition-colors cursor-pointer"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <div className="p-3 border-t border-border-main bg-bg-card flex items-center gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendAiMessage()}
                placeholder="Ask questions about WhatsApp, calls, leads, setup..."
                disabled={isAiLoading}
                className="flex-1 bg-bg-secondary/40 border border-border-main rounded-xl px-4 py-2.5 text-xs text-text-primary focus:outline-hidden focus:ring-1 focus:ring-purple-500"
              />
              <button
                type="button"
                onClick={() => handleSendAiMessage()}
                disabled={!chatInput.trim() || isAiLoading}
                className="p-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-40 transition-all cursor-pointer shadow-xs"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: REPORT AN ISSUE (HUMAN SUPPORT & TICKETING) */}
        {/* ========================================================================= */}
        {activeTab === "report_issue" && (
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-bg-card">
            {ticketSuccess ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-text-primary">
                  Support Ticket Raised Successfully!
                </h3>
                <p className="text-xs text-text-secondary max-w-sm">
                  Ticket <strong>{ticketSuccess.ticketNumber}</strong> has been logged. Our engineering
                  team will review your issue and attached chat transcript immediately.
                </p>
                <div className="pt-2 text-xs text-purple-600 font-semibold animate-pulse">
                  Redirecting to My Tickets...
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitTicket} className="space-y-4 max-w-2xl mx-auto">
                {/* Auto Handoff Notice */}
                {handoffData?.aiChatHistory?.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div className="text-xs text-emerald-800 dark:text-emerald-300">
                      <strong>AI Chat Transcript Attached:</strong> Our support engineers can view the full
                      troubleshooting conversation. You do not need to re-explain the issue.
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-text-primary mb-1">
                    Issue Subject / Summary <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Brief description of the problem"
                    className="w-full bg-bg-secondary/40 border border-border-main rounded-xl px-3.5 py-2 text-xs text-text-primary focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-text-primary mb-1">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-bg-secondary/40 border border-border-main rounded-xl px-3.5 py-2 text-xs text-text-primary focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-text-primary mb-1">Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full bg-bg-secondary/40 border border-border-main rounded-xl px-3.5 py-2 text-xs text-text-primary focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                    >
                      <option value="low">Low (General question)</option>
                      <option value="medium">Medium (Standard issue)</option>
                      <option value="high">High (Urgent production issue)</option>
                      <option value="urgent">Urgent (System down / Blocking)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-primary mb-1">
                    Detailed Explanation <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide any additional details or error messages encountered..."
                    className="w-full bg-bg-secondary/40 border border-border-main rounded-xl p-3 text-xs text-text-primary focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                {/* Submitter Details Auto-Filled */}
                <div className="p-3 rounded-xl bg-bg-secondary/30 border border-border-main text-[11px] text-text-secondary flex flex-wrap items-center gap-4">
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
                    onClick={() => setActiveTab("instant_ai")}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-bg-secondary/50 transition-colors"
                  >
                    Back to AI Help
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingTicket}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white transition-all cursor-pointer shadow-xs disabled:opacity-50"
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
          <div className="flex-1 flex flex-col min-h-0 bg-bg-card">
            {/* Filter Bar */}
            <div className="px-5 py-3 border-b border-border-main bg-bg-secondary/20 flex items-center justify-between gap-4">
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {["all", "open", "in_progress", "resolved"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setTicketFilter(st)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-colors ${
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
                className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-colors"
                title="Refresh tickets"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingTickets ? "animate-spin" : ""}`} />
              </button>
            </div>

            {/* Tickets Table / List */}
            <div className="flex-1 overflow-y-auto p-5">
              {isLoadingTickets ? (
                <div className="h-full flex items-center justify-center text-xs text-text-secondary">
                  Loading tickets...
                </div>
              ) : filteredTickets.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
                  <Ticket className="w-10 h-10 text-text-secondary/40" />
                  <p className="text-xs font-bold text-text-primary">No Support Tickets Found</p>
                  <p className="text-[11px] text-text-secondary">
                    You currently have no tickets matching this filter.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTickets.map((t) => {
                    const isSelected = selectedTicket?._id === t._id;
                    return (
                      <div
                        key={t._id}
                        className={`p-4 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-purple-500/5 border-purple-500/40"
                            : "bg-bg-secondary/20 border-border-main hover:border-purple-500/30"
                        }`}
                        onClick={() => setSelectedTicket(isSelected ? null : t)}
                      >
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-purple-600 dark:text-purple-400">
                              {t.ticketNumber}
                            </span>
                            <span className="text-xs font-bold text-text-primary">{t.subject}</span>
                          </div>

                          {/* Status Pill */}
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                t.status === "open"
                                  ? "bg-blue-500/10 text-blue-600 border border-blue-500/20"
                                  : t.status === "in_progress"
                                  ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20"
                                  : "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                              }`}
                            >
                              {t.status.replace("_", " ")}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-text-secondary">
                          <span>Category: {t.category.replace("_", " ")}</span>
                          <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                        </div>

                        {/* Expanded Drawer Details */}
                        {isSelected && (
                          <div className="mt-4 pt-4 border-t border-border-main/60 space-y-3 text-xs">
                            <div>
                              <strong className="text-text-primary">Problem Description:</strong>
                              <p className="text-text-secondary mt-1 whitespace-pre-wrap">
                                {t.description}
                              </p>
                            </div>

                            {/* Resolution Notes from Super Admin */}
                            {t.resolutionNotes && (
                              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                <strong className="text-emerald-700 dark:text-emerald-300">
                                  Support Team Resolution Notes:
                                </strong>
                                <p className="text-emerald-900 dark:text-emerald-100 mt-1 whitespace-pre-wrap">
                                  {t.resolutionNotes}
                                </p>
                                {t.resolvedAt && (
                                  <div className="mt-1 text-[10px] text-emerald-600">
                                    Resolved on {new Date(t.resolvedAt).toLocaleString()} by{" "}
                                    {t.resolvedBy || "Support Engineer"}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Attached AI Chat Transcript */}
                            {t.aiChatHistory && t.aiChatHistory.length > 0 && (
                              <div className="p-3 rounded-lg bg-bg-secondary/40 border border-border-main">
                                <strong className="text-text-primary text-[11px] block mb-2">
                                  Attached AI Troubleshooting Transcript ({t.aiChatHistory.length}{" "}
                                  messages):
                                </strong>
                                <div className="space-y-1.5 max-h-36 overflow-y-auto text-[11px]">
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
        {/* TAB 4: 1-ON-1 CONSULTATION (CALENDLY EMBED) */}
        {/* ========================================================================= */}
        {activeTab === "consultation" && (
          <div className="flex-1 bg-bg-card relative">
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
        )}
      </div>
    </div>
  );
}
