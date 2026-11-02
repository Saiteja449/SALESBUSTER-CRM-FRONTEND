import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Calendar,
  Users,
  MessageSquare,
  Send,
  ExternalLink,
  Plus,
  Search,
  Download,
  RefreshCw,
  CheckCircle2,
  Clock,
  Sparkles,
  ShieldCheck,
  Building2,
  Phone,
  Copy,
  Check,
  X,
  Filter,
  MapPin,
  Mic,
  CalendarDays,
  ChevronRight,
  Info,
  AlertCircle,
  FileSpreadsheet,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { useAuth } from "../context/AuthContext.jsx";
import { eventService } from "../services/eventService.js";

export default function EventDashboard() {
  const { currentUser, isManager } = useAuth();

  // State
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'whatsapp_opened' | 'pending'
  const [error, setError] = useState(null);

  // Modals
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [showAttendeeModal, setShowAttendeeModal] = useState(false);
  const [activeAttendee, setActiveAttendee] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Create Event Form State
  const [newEventData, setNewEventData] = useState({
    name: "",
    description: "",
    location: "",
    eventDate: new Date().toISOString().split("T")[0],
  });
  const [creatingEvent, setCreatingEvent] = useState(false);

  // Fetch Events
  const loadEvents = useCallback(async (selectId = null) => {
    try {
      setLoadingEvents(true);
      setError(null);
      const data = await eventService.getEvents();
      setEvents(data);

      if (data.length > 0) {
        const nextId =
          selectId && data.some((e) => e._id === selectId)
            ? selectId
            : selectedEventId && data.some((e) => e._id === selectedEventId)
            ? selectedEventId
            : data[0]._id;
        setSelectedEventId(nextId);
        const cur = data.find((e) => e._id === nextId) || data[0];
        setSelectedEvent(cur);
      } else {
        setSelectedEventId("");
        setSelectedEvent(null);
        setContacts([]);
      }
    } catch (err) {
      console.error("Failed to load events:", err);
      setError(err.message || "Failed to load events list.");
    } finally {
      setLoadingEvents(false);
    }
  }, [selectedEventId]);

  // Fetch Contacts for selected event
  const loadContacts = useCallback(async (eventId) => {
    if (!eventId) {
      setContacts([]);
      return;
    }
    try {
      setLoadingContacts(true);
      const res = await eventService.getEventContacts(eventId, { limit: 200 });
      setContacts(res.contacts || []);
    } catch (err) {
      console.error("Failed to load event contacts:", err);
    } finally {
      setLoadingContacts(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadEvents();
  }, []);

  // When selected event changes
  useEffect(() => {
    if (selectedEventId) {
      const match = events.find((e) => e._id === selectedEventId);
      if (match) setSelectedEvent(match);
      loadContacts(selectedEventId);
    }
  }, [selectedEventId, events, loadContacts]);

  // Filtered contacts
  const filteredContacts = useMemo(() => {
    return contacts.filter((c) => {
      // Status filter
      if (
        statusFilter === "whatsapp_opened" &&
        c.status !== "whatsapp_opened" &&
        c.status !== "completed"
      ) {
        return false;
      }
      if (
        statusFilter === "pending" &&
        (c.status === "whatsapp_opened" || c.status === "completed")
      ) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = c.name?.toLowerCase().includes(q);
        const matchPhone = c.phone?.toLowerCase().includes(q);
        const matchCompany = c.companyName?.toLowerCase().includes(q);
        const matchDesignation = c.designation?.toLowerCase().includes(q);
        const matchSummary = c.summary?.toLowerCase().includes(q);
        const matchRep = c.capturedByName?.toLowerCase().includes(q);
        return matchName || matchPhone || matchCompany || matchSummary || matchRep;
      }

      return true;
    });
  }, [contacts, statusFilter, searchQuery]);

  // Metrics
  const metrics = useMemo(() => {
    const totalCaptured = contacts.length;
    const sentCount = contacts.filter(
      (c) => c.status === "whatsapp_opened" || c.status === "completed"
    ).length;
    const pendingCount = totalCaptured - sentCount;
    const sentRate =
      totalCaptured > 0 ? Math.round((sentCount / totalCaptured) * 100) : 0;

    return {
      totalCaptured,
      sentCount,
      pendingCount,
      sentRate,
    };
  }, [contacts]);

  // Create Event Submit
  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!newEventData.name.trim()) return;

    try {
      setCreatingEvent(true);
      const created = await eventService.createEvent(newEventData);
      setShowCreateEventModal(false);
      setNewEventData({
        name: "",
        description: "",
        location: "",
        eventDate: new Date().toISOString().split("T")[0],
      });
      await loadEvents(created._id);
    } catch (err) {
      alert(err.message || "Failed to create event");
    } finally {
      setCreatingEvent(false);
    }
  };

  // Copy WhatsApp Message
  const handleCopyMessage = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Launch WhatsApp Web directly
  const handleDirectWhatsApp = (contact) => {
    if (!contact?.phone) return;
    const cleanDigits = contact.phone.replace(/\D/g, "");
    const intlPhone = cleanDigits.length === 10 ? `91${cleanDigits}` : cleanDigits;
    const encodedText = encodeURIComponent(
      contact.messageText ||
        `Hello ${contact.name || ""}, it was great connecting with you!`
    );
    const waUrl = `https://wa.me/${intlPhone}?text=${encodedText}`;

    // Mark as whatsapp_opened
    eventService
      .updateContactStatus(selectedEventId, contact._id, "whatsapp_opened")
      .then(() => {
        setContacts((prev) =>
          prev.map((item) =>
            item._id === contact._id
              ? { ...item, status: "whatsapp_opened", sentAt: new Date() }
              : item
          )
        );
      })
      .catch((e) => console.warn("Status update notice:", e));

    window.open(waUrl, "_blank", "noopener,noreferrer");
  };

  // Export
  const handleExport = () => {
    if (!filteredContacts.length) {
      alert("No contacts available to export for this event.");
      return;
    }
    eventService.exportToExcel(
      filteredContacts,
      selectedEvent?.name || "Event_Attendees"
    );
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* ── 1. Top Header & Primary Actions ──────────────────────────────── */}
      <div className="bg-bg-card border border-border-main rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-pilot-blue/10 border border-pilot-blue/20 text-pilot-blue flex items-center justify-center font-bold shrink-0 shadow-2xs">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl md:text-2xl font-black text-text-primary tracking-tight">
                Event Networking Hub
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-pilot-blue/10 text-pilot-blue border border-pilot-blue/25">
                <Mic className="w-3 h-3 text-pilot-blue" />
                Voice AI Capture
              </span>
            </div>
            <p className="text-xs md:text-sm text-text-secondary mt-0.5">
              Real-time speech transcription, one-tap WhatsApp messages & attendee directory.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
          <button
            type="button"
            onClick={() => {
              loadEvents();
              if (selectedEventId) loadContacts(selectedEventId);
            }}
            disabled={loadingEvents || loadingContacts}
            title="Refresh events and contacts"
            aria-label="Refresh events and contacts"
            className="p-2.5 rounded-xl border border-border-main bg-bg-card text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-colors cursor-pointer shadow-2xs focus-visible:ring-2 focus-visible:ring-pilot-blue focus-visible:outline-none"
          >
            <RefreshCw
              className={`w-4 h-4 ${
                loadingEvents || loadingContacts ? "animate-spin text-pilot-blue" : ""
              }`}
            />
          </button>

          <button
            type="button"
            onClick={handleExport}
            disabled={!filteredContacts.length}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-border-main bg-bg-card text-text-primary hover:bg-bg-secondary text-xs md:text-sm font-bold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs focus-visible:ring-2 focus-visible:ring-pilot-blue focus-visible:outline-none"
          >
            <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Export Excel</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCreateEventModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-pilot-blue hover:bg-pilot-blue-hover text-white text-xs md:text-sm font-bold shadow-xs active:scale-98 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-pilot-blue focus-visible:outline-none"
          >
            <Plus className="w-4 h-4" />
            <span>Create Event</span>
          </button>
        </div>
      </div>

      {/* ── Error Banner (If present) ────────────────────────────────────── */}
      {error && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-start justify-between gap-3 text-xs md:text-sm text-red-600 dark:text-red-400 shadow-2xs"
        >
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700 cursor-pointer p-0.5"
            aria-label="Dismiss error"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── 2. Data Isolation & Privacy Banner ────────────────────────────── */}
      <div className="bg-pilot-blue/10 border border-pilot-blue/25 rounded-2xl p-4 flex items-start sm:items-center justify-between gap-3 text-xs md:text-sm text-text-primary shadow-2xs">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2 rounded-xl bg-pilot-blue/15 text-pilot-blue shrink-0">
            <ShieldCheck className="w-4 h-4 md:w-5 md:h-5" />
          </div>
          <div>
            <span className="font-bold text-text-primary">
              Strict Lead Isolation Guaranteed:
            </span>{" "}
            <span className="text-text-secondary">
              Event contacts and voice recordings captured during expos are kept exclusively within this event container. They do not mix with your general CRM leads or analytics.
            </span>
          </div>
        </div>
        <div className="hidden lg:flex items-center gap-1.5 text-xs font-bold text-pilot-blue bg-pilot-blue/15 border border-pilot-blue/30 px-3 py-1 rounded-full shrink-0">
          <Info className="w-3.5 h-3.5" />
          Mobile Live Sync Active
        </div>
      </div>

      {/* ── 3. Event Selector & Header Summary Card ──────────────────────── */}
      <div className="bg-bg-card border border-border-main rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-xs uppercase tracking-wider font-bold text-text-secondary">
              Active Event:
            </span>
            {events.length > 0 ? (
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="bg-bg-main border border-border-main text-text-primary text-xs md:text-sm font-bold rounded-xl px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-pilot-blue/40 focus:border-pilot-blue cursor-pointer shadow-2xs max-w-xs md:max-w-md"
              >
                {events.map((ev) => (
                  <option key={ev._id} value={ev._id}>
                    {ev.name} {ev.location ? `(${ev.location})` : ""}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-sm font-semibold text-text-secondary italic">
                No events created yet.
              </span>
            )}
          </div>

          {selectedEvent && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {selectedEvent.location && (
                <span className="inline-flex items-center gap-1.5 bg-bg-secondary border border-border-main px-2.5 py-1 rounded-lg font-semibold text-text-secondary">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" />
                  {selectedEvent.location}
                </span>
              )}
              {selectedEvent.eventDate && (
                <span className="inline-flex items-center gap-1.5 bg-bg-secondary border border-border-main px-2.5 py-1 rounded-lg font-semibold text-text-secondary">
                  <Calendar className="w-3.5 h-3.5 text-pilot-blue" />
                  {new Date(selectedEvent.eventDate).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              )}
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Live & Active
              </span>
            </div>
          )}
        </div>

        {selectedEvent?.description && (
          <p className="text-xs md:text-sm text-text-secondary italic border-l-2 border-pilot-blue/50 pl-3 py-0.5">
            "{selectedEvent.description}"
          </p>
        )}

        {/* ── Metric Cards ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 pt-1">
          {/* Total Captured */}
          <div className="bg-bg-card border border-border-main rounded-2xl p-4 shadow-2xs flex flex-col justify-between transition-all hover:border-pilot-blue/40">
            <div className="flex items-center justify-between text-text-secondary">
              <span className="text-[11px] font-bold uppercase tracking-wider">
                Total Captured
              </span>
              <div className="w-8 h-8 rounded-xl bg-pilot-blue/10 border border-pilot-blue/20 flex items-center justify-center text-pilot-blue shrink-0">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl md:text-3xl font-black text-text-primary tracking-tight">
                {metrics.totalCaptured}
              </div>
              <span className="text-[11px] font-medium text-text-secondary mt-1 block">
                Attendees registered
              </span>
            </div>
          </div>

          {/* WhatsApp Sent */}
          <div className="bg-bg-card border border-border-main rounded-2xl p-4 shadow-2xs flex flex-col justify-between transition-all hover:border-emerald-500/40">
            <div className="flex items-center justify-between text-text-secondary">
              <span className="text-[11px] font-bold uppercase tracking-wider">
                WhatsApp Sent
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                <FaWhatsapp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl md:text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                {metrics.sentCount}
              </div>
              <span className="text-[11px] font-medium text-text-secondary mt-1 block">
                Follow-ups launched
              </span>
            </div>
          </div>

          {/* Sent Rate */}
          <div className="bg-bg-card border border-border-main rounded-2xl p-4 shadow-2xs flex flex-col justify-between transition-all hover:border-purple-500/40">
            <div className="flex items-center justify-between text-text-secondary">
              <span className="text-[11px] font-bold uppercase tracking-wider">
                Sent Rate
              </span>
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl md:text-3xl font-black text-purple-600 dark:text-purple-400 tracking-tight">
                {metrics.sentRate}%
              </div>
              <span className="text-[11px] font-medium text-text-secondary mt-1 block">
                Dispatch conversion
              </span>
            </div>
          </div>

          {/* Pending Outreach */}
          <div className="bg-bg-card border border-border-main rounded-2xl p-4 shadow-2xs flex flex-col justify-between transition-all hover:border-amber-500/40">
            <div className="flex items-center justify-between text-text-secondary">
              <span className="text-[11px] font-bold uppercase tracking-wider">
                Pending Outreach
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl md:text-3xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
                {metrics.pendingCount}
              </div>
              <span className="text-[11px] font-medium text-text-secondary mt-1 block">
                Ready to send
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. Search, Filter & Attendees Directory ─────────────────────── */}
      <div className="bg-bg-card border border-border-main rounded-2xl shadow-xs overflow-hidden">
        {/* Controls Toolbar */}
        <div className="p-4 border-b border-border-main bg-bg-card flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, phone, company, or discussion..."
              className="w-full bg-bg-main border border-border-main text-text-primary text-xs md:text-sm rounded-xl pl-9 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-pilot-blue/40 focus:border-pilot-blue shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary cursor-pointer p-0.5"
                aria-label="Clear search query"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto overflow-x-auto text-xs font-bold">
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === "all"
                  ? "bg-pilot-blue text-white shadow-2xs"
                  : "bg-bg-main border border-border-main text-text-secondary hover:text-text-primary hover:bg-bg-secondary"
              }`}
            >
              All ({contacts.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("whatsapp_opened")}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                statusFilter === "whatsapp_opened"
                  ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 shadow-2xs"
                  : "bg-bg-main border border-border-main text-text-secondary hover:text-text-primary hover:bg-bg-secondary"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>WhatsApp Sent ({metrics.sentCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("pending")}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                statusFilter === "pending"
                  ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40 shadow-2xs"
                  : "bg-bg-main border border-border-main text-text-secondary hover:text-text-primary hover:bg-bg-secondary"
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>Pending ({metrics.pendingCount})</span>
            </button>
          </div>
        </div>

        {/* Directory Content */}
        {loadingContacts ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-text-secondary">
            <RefreshCw className="w-7 h-7 animate-spin text-pilot-blue" />
            <span className="text-xs md:text-sm font-bold text-text-primary">
              Loading event attendees...
            </span>
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="py-16 text-center px-4 flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-pilot-blue/10 border border-pilot-blue/20 text-pilot-blue flex items-center justify-center mb-3 shadow-2xs">
              <Users className="w-7 h-7" />
            </div>
            <h3 className="text-sm md:text-base font-bold text-text-primary">
              No Attendees Captured Yet
            </h3>
            <p className="text-xs text-text-secondary max-w-md mt-1 mb-4 leading-relaxed">
              {searchQuery
                ? `No attendee matches "${searchQuery}". Try clearing search filters.`
                : "Open the SalesBuster Mobile App, select this event, and tap the Voice Microphone to record conversations and auto-generate WhatsApp messages in real-time."}
            </p>
            {events.length === 0 && (
              <button
                type="button"
                onClick={() => setShowCreateEventModal(true)}
                className="px-4 py-2 rounded-xl bg-pilot-blue hover:bg-pilot-blue-hover text-white text-xs font-bold shadow-xs cursor-pointer transition-colors"
              >
                Create First Event
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs md:text-sm">
                <thead>
                  <tr className="border-b border-border-main bg-bg-secondary/40 text-text-secondary font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4">Attendee</th>
                    <th className="py-3.5 px-4">Phone Number</th>
                    <th className="py-3.5 px-4">AI Discussion Summary</th>
                    <th className="py-3.5 px-4">WhatsApp Message</th>
                    <th className="py-3.5 px-4">Captured By</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-main/60">
                  {filteredContacts.map((contact) => {
                    const isSent =
                      contact.status === "whatsapp_opened" ||
                      contact.status === "completed";

                    return (
                      <tr
                        key={contact._id}
                        className="hover:bg-bg-secondary/30 transition-colors group cursor-pointer"
                        onClick={() => {
                          setActiveAttendee(contact);
                          setShowAttendeeModal(true);
                        }}
                      >
                        {/* Attendee Name & Company */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs uppercase shrink-0 shadow-2xs">
                              {contact.name ? contact.name.slice(0, 2) : "??"}
                            </div>
                            <div>
                              <div className="font-bold text-text-primary text-xs md:text-sm">
                                {contact.name || "Unknown Attendee"}
                              </div>
                              {contact.companyName && (
                                <div className="text-[11px] text-text-secondary flex items-center gap-1 mt-0.5">
                                  <Building2 className="w-3 h-3 text-text-secondary/70 shrink-0" />
                                  <span>{contact.companyName}</span>
                                  {contact.designation && (
                                    <span className="text-text-secondary/70"> • {contact.designation}</span>
                                  )}
                                </div>
                              )}
                              {!contact.companyName && contact.designation && (
                                <div className="text-[11px] text-text-secondary flex items-center gap-1 mt-0.5">
                                  <span>{contact.designation}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Phone Number */}
                        <td className="py-3.5 px-4 font-mono text-xs">
                          {contact.phone ? (
                            <a
                              href={`tel:${contact.phone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1.5 text-text-primary hover:text-pilot-blue transition-colors font-semibold"
                              title={`Call ${contact.phone}`}
                            >
                              <Phone className="w-3.5 h-3.5 text-pilot-blue shrink-0" />
                              <span>{contact.phone}</span>
                            </a>
                          ) : (
                            <span className="text-text-secondary/50 italic">
                              No Phone
                            </span>
                          )}
                        </td>

                        {/* AI Discussion Summary */}
                        <td className="py-3.5 px-4 max-w-xs">
                          <p className="line-clamp-2 text-text-secondary text-xs leading-relaxed">
                            {contact.summary || (
                              <span className="italic text-text-secondary/40">
                                No discussion notes
                              </span>
                            )}
                          </p>
                        </td>

                        {/* Tailored WhatsApp Message */}
                        <td className="py-3.5 px-4 max-w-sm">
                          <div className="bg-bg-main border border-border-main/70 rounded-xl p-2.5 text-xs text-text-primary/90 italic font-sans leading-relaxed shadow-2xs">
                            <p className="line-clamp-2">
                              "{contact.messageText || "No message generated"}"
                            </p>
                          </div>
                        </td>

                        {/* Captured By */}
                        <td className="py-3.5 px-4 text-xs">
                          <div className="font-bold text-text-primary">
                            {contact.capturedByName || "Sales Rep"}
                          </div>
                          {contact.createdAt && (
                            <div className="text-[11px] text-text-secondary mt-0.5">
                              {new Date(contact.createdAt).toLocaleDateString(
                                undefined,
                                {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </div>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          {isSent ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>WhatsApp Sent</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                              <Clock className="w-3.5 h-3.5" />
                              <span>Pending</span>
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td
                          className="py-3.5 px-4 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                handleCopyMessage(contact.messageText, contact._id)
                              }
                              title="Copy personalized message"
                              aria-label="Copy personalized message"
                              className="p-1.5 rounded-lg border border-border-main bg-bg-card text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-colors cursor-pointer shadow-2xs focus-visible:ring-2 focus-visible:ring-pilot-blue focus-visible:outline-none"
                            >
                              {copiedId === contact._id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDirectWhatsApp(contact)}
                              title="Open WhatsApp Web & Send"
                              aria-label={`Open WhatsApp Web & Send message to ${contact.name || "attendee"}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-2xs focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:outline-none"
                            >
                              <FaWhatsapp className="w-3.5 h-3.5" />
                              <span>Send</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Directory View */}
            <div className="block md:hidden divide-y divide-border-main/60">
              {filteredContacts.map((contact) => {
                const isSent =
                  contact.status === "whatsapp_opened" ||
                  contact.status === "completed";

                return (
                  <div
                    key={contact._id}
                    onClick={() => {
                      setActiveAttendee(contact);
                      setShowAttendeeModal(true);
                    }}
                    className="p-4 hover:bg-bg-secondary/30 transition-colors space-y-3 cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs uppercase shrink-0 shadow-2xs">
                          {contact.name ? contact.name.slice(0, 2) : "??"}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-text-primary text-sm truncate">
                            {contact.name || "Unknown Attendee"}
                          </div>
                          {contact.companyName && (
                            <div className="text-[11px] text-text-secondary flex items-center gap-1 mt-0.5 truncate">
                              <Building2 className="w-3 h-3 text-text-secondary/70 shrink-0" />
                              <span>{contact.companyName}</span>
                              {contact.designation && (
                                <span className="text-text-secondary/70"> • {contact.designation}</span>
                              )}
                            </div>
                          )}
                          {!contact.companyName && contact.designation && (
                            <div className="text-[11px] text-text-secondary flex items-center gap-1 mt-0.5 truncate">
                              <span>{contact.designation}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Status */}
                      {isSent ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shrink-0">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Sent</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 shrink-0">
                          <Clock className="w-3 h-3" />
                          <span>Pending</span>
                        </span>
                      )}
                    </div>

                    {/* Phone & Rep row */}
                    <div className="flex items-center justify-between text-xs text-text-secondary">
                      {contact.phone ? (
                        <span className="font-mono font-semibold text-text-primary flex items-center gap-1">
                          <Phone className="w-3 h-3 text-pilot-blue shrink-0" />
                          {contact.phone}
                        </span>
                      ) : (
                        <span className="italic text-text-secondary/50">No Phone</span>
                      )}

                      <span className="text-[11px] font-medium">
                        Rep: <strong className="text-text-primary">{contact.capturedByName || "SR"}</strong>
                      </span>
                    </div>

                    {/* Discussion Summary */}
                    {contact.summary && (
                      <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed bg-bg-main p-2 rounded-lg border border-border-main/50">
                        {contact.summary}
                      </p>
                    )}

                    {/* Actions row */}
                    <div
                      className="flex items-center justify-end gap-2 pt-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          handleCopyMessage(contact.messageText, contact._id)
                        }
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border-main bg-bg-card text-text-secondary hover:text-text-primary text-xs font-semibold"
                      >
                        {copiedId === contact._id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-500" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy Msg</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDirectWhatsApp(contact)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold text-xs shadow-2xs"
                      >
                        <FaWhatsapp className="w-3.5 h-3.5" />
                        <span>Launch WhatsApp</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ── 5. Attendee Detail Slide-Over Modal ───────────────────────────── */}
      {showAttendeeModal && activeAttendee && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setShowAttendeeModal(false)}
        >
          <div
            className="bg-bg-card border border-border-main rounded-2xl w-full max-w-lg shadow-2xl p-5 md:p-6 space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3.5 border-b border-border-main">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-2xs">
                  {activeAttendee.name ? activeAttendee.name.slice(0, 2) : "??"}
                </div>
                <div>
                  <h3 className="font-bold text-text-primary text-base">
                    {activeAttendee.name || "Unknown Attendee"}
                  </h3>
                  <p className="text-xs text-text-secondary">
                    {activeAttendee.companyName || "No Company Specified"}
                    {activeAttendee.designation ? ` • ${activeAttendee.designation}` : ""}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAttendeeModal(false)}
                aria-label="Close modal"
                className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs md:text-sm">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-bg-main border border-border-main">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-pilot-blue" />
                  <span className="font-mono font-bold text-text-primary">
                    {activeAttendee.phone || "No phone provided"}
                  </span>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    activeAttendee.status === "whatsapp_opened" ||
                    activeAttendee.status === "completed"
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                      : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                  }`}
                >
                  {activeAttendee.status === "whatsapp_opened" ||
                  activeAttendee.status === "completed"
                    ? "WhatsApp Sent"
                    : "Pending"}
                </span>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-text-secondary block mb-1.5">
                  Discussion Summary (AI Analyzed):
                </label>
                <div className="p-3.5 rounded-xl bg-bg-main border border-border-main text-text-primary leading-relaxed">
                  {activeAttendee.summary || "No notes available."}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                    Generated WhatsApp Message:
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopyMessage(
                        activeAttendee.messageText,
                        "modal-attendee"
                      )
                    }
                    className="flex items-center gap-1 text-xs text-pilot-blue font-bold hover:underline cursor-pointer"
                  >
                    {copiedId === "modal-attendee" ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Message</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="p-3.5 rounded-xl bg-bg-main border border-border-main whitespace-pre-wrap font-sans text-text-primary text-xs md:text-sm leading-relaxed">
                  {activeAttendee.messageText || "No message text."}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-text-secondary pt-2 border-t border-border-main">
                <div>
                  <span className="font-bold block text-text-primary">
                    Captured By:
                  </span>
                  <span>{activeAttendee.capturedByName || "Sales Rep"}</span>
                </div>
                <div>
                  <span className="font-bold block text-text-primary">
                    Captured Time:
                  </span>
                  <span>
                    {activeAttendee.createdAt
                      ? new Date(activeAttendee.createdAt).toLocaleString()
                      : "N/A"}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3.5 border-t border-border-main flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowAttendeeModal(false)}
                className="px-4 py-2 rounded-xl border border-border-main bg-bg-card text-text-primary font-bold text-xs cursor-pointer hover:bg-bg-secondary transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => handleDirectWhatsApp(activeAttendee)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-xs cursor-pointer shadow-xs transition-colors"
              >
                <FaWhatsapp className="w-4 h-4" />
                <span>Launch WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 6. Create Event Modal ────────────────────────────────────────── */}
      {showCreateEventModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setShowCreateEventModal(false)}
        >
          <div
            className="bg-bg-card border border-border-main rounded-2xl w-full max-w-md shadow-2xl p-5 md:p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3.5 border-b border-border-main">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-pilot-blue/10 border border-pilot-blue/20 text-pilot-blue flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-text-primary text-base">
                  Create New Event
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateEventModal(false)}
                aria-label="Close modal"
                className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4 text-xs md:text-sm">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">
                  Event Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Tech Expo 2026, Global Summit"
                  value={newEventData.name}
                  onChange={(e) =>
                    setNewEventData({ ...newEventData, name: e.target.value })
                  }
                  className="w-full bg-bg-main border border-border-main rounded-xl px-3.5 py-2.5 text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-pilot-blue/40 focus:border-pilot-blue transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">
                  Event Date
                </label>
                <input
                  type="date"
                  value={newEventData.eventDate}
                  onChange={(e) =>
                    setNewEventData({ ...newEventData, eventDate: e.target.value })
                  }
                  className="w-full bg-bg-main border border-border-main rounded-xl px-3.5 py-2.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-pilot-blue/40 focus:border-pilot-blue transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">
                  Location / Venue
                </label>
                <input
                  type="text"
                  placeholder="e.g., Hall 4, HITEX Hyderabad"
                  value={newEventData.location}
                  onChange={(e) =>
                    setNewEventData({ ...newEventData, location: e.target.value })
                  }
                  className="w-full bg-bg-main border border-border-main rounded-xl px-3.5 py-2.5 text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-pilot-blue/40 focus:border-pilot-blue transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">
                  Description / Topic (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Target audience, discussion context..."
                  value={newEventData.description}
                  onChange={(e) =>
                    setNewEventData({
                      ...newEventData,
                      description: e.target.value,
                    })
                  }
                  className="w-full bg-bg-main border border-border-main rounded-xl px-3.5 py-2.5 text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-pilot-blue/40 focus:border-pilot-blue transition-all resize-none"
                />
              </div>

              <div className="pt-3.5 border-t border-border-main flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCreateEventModal(false)}
                  className="px-4 py-2 rounded-xl border border-border-main bg-bg-card text-text-primary font-bold text-xs cursor-pointer hover:bg-bg-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingEvent || !newEventData.name.trim()}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-pilot-blue hover:bg-pilot-blue-hover text-white font-bold text-xs cursor-pointer shadow-xs active:scale-98 transition-all disabled:opacity-50"
                >
                  {creatingEvent && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{creatingEvent ? "Creating..." : "Save Event"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
