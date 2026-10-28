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
    <div className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* ── 1. Top Header & Primary Actions ──────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-border-color/60">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-md">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold text-brand-primary tracking-tight">
                  Event Networking Hub
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
                  <Mic className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                  Voice AI Capture
                </span>
              </div>
              <p className="text-xs md:text-sm text-brand-primary/60 mt-0.5">
                Real-time speech transcription, one-tap WhatsApp messages & attendee directory.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              loadEvents();
              if (selectedEventId) loadContacts(selectedEventId);
            }}
            disabled={loadingEvents || loadingContacts}
            title="Refresh events and contacts"
            className="p-2.5 rounded-xl border border-border-color bg-brand-light text-brand-primary/80 hover:text-brand-primary hover:bg-brand-secondary/40 transition-colors cursor-pointer"
          >
            <RefreshCw
              className={`w-4 h-4 ${
                loadingEvents || loadingContacts ? "animate-spin text-indigo-600" : ""
              }`}
            />
          </button>

          <button
            type="button"
            onClick={handleExport}
            disabled={!filteredContacts.length}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border-color bg-brand-light text-brand-primary/90 hover:bg-brand-secondary/40 text-xs md:text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
          >
            <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Export Excel</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCreateEventModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white text-xs md:text-sm font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Event</span>
          </button>
        </div>
      </div>

      {/* ── 2. Data Isolation & Privacy Banner ────────────────────────────── */}
      <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent border border-indigo-500/20 rounded-2xl p-3.5 md:p-4 flex items-start sm:items-center justify-between gap-3 text-xs md:text-sm text-brand-primary/90">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 shrink-0">
            <ShieldCheck className="w-4 h-4 md:w-5 md:h-5" />
          </div>
          <div>
            <span className="font-semibold text-brand-primary">
              Strict Lead Isolation Guaranteed:
            </span>{" "}
            <span className="text-brand-primary/70">
              Event contacts and voice recordings captured during expos are kept exclusively within this event container. They do not mix with your general CRM leads or analytics.
            </span>
          </div>
        </div>
        <div className="hidden lg:flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full shrink-0">
          <Info className="w-3.5 h-3.5" />
          Mobile Live Sync Active
        </div>
      </div>

      {/* ── 3. Event Selector & Header Summary Card ──────────────────────── */}
      <div className="bg-brand-light border border-border-color rounded-2xl p-4 md:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="text-xs uppercase tracking-wider font-bold text-brand-primary/50">
              Active Event:
            </span>
            {events.length > 0 ? (
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="bg-bg-main border border-border-color text-brand-primary text-sm font-semibold rounded-xl px-3.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 cursor-pointer shadow-xs max-w-xs md:max-w-md"
              >
                {events.map((ev) => (
                  <option key={ev._id} value={ev._id}>
                    {ev.name} {ev.location ? `(${ev.location})` : ""}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-sm font-semibold text-brand-primary/60 italic">
                No events created yet.
              </span>
            )}
          </div>

          {selectedEvent && (
            <div className="flex flex-wrap items-center gap-2 md:gap-3 text-xs text-brand-primary/70">
              {selectedEvent.location && (
                <span className="inline-flex items-center gap-1 bg-brand-secondary/40 px-2.5 py-1 rounded-lg">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" />
                  {selectedEvent.location}
                </span>
              )}
              {selectedEvent.eventDate && (
                <span className="inline-flex items-center gap-1 bg-brand-secondary/40 px-2.5 py-1 rounded-lg">
                  <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                  {new Date(selectedEvent.eventDate).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              )}
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Live & Active
              </span>
            </div>
          )}
        </div>

        {selectedEvent?.description && (
          <p className="text-xs md:text-sm text-brand-primary/70 italic border-l-2 border-indigo-500/40 pl-3">
            "{selectedEvent.description}"
          </p>
        )}

        {/* ── Metric Cards ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          <div className="bg-bg-main border border-border-color/80 rounded-xl p-3.5 flex flex-col justify-between">
            <span className="text-xs font-semibold text-brand-primary/60">
              Total Captured
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-bold text-brand-primary">
                {metrics.totalCaptured}
              </span>
              <Users className="w-4 h-4 text-indigo-500" />
            </div>
            <span className="text-[11px] text-brand-primary/50 mt-1">
              Attendees registered
            </span>
          </div>

          <div className="bg-bg-main border border-border-color/80 rounded-xl p-3.5 flex flex-col justify-between">
            <span className="text-xs font-semibold text-brand-primary/60">
              WhatsApp Sent
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {metrics.sentCount}
              </span>
              <FaWhatsapp className="w-4 h-4 text-green-500" />
            </div>
            <span className="text-[11px] text-brand-primary/50 mt-1">
              Follow-ups launched
            </span>
          </div>

          <div className="bg-bg-main border border-border-color/80 rounded-xl p-3.5 flex flex-col justify-between">
            <span className="text-xs font-semibold text-brand-primary/60">
              Sent Rate
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {metrics.sentRate}%
              </span>
              <Sparkles className="w-4 h-4 text-amber-500" />
            </div>
            <span className="text-[11px] text-brand-primary/50 mt-1">
              Dispatch conversion
            </span>
          </div>

          <div className="bg-bg-main border border-border-color/80 rounded-xl p-3.5 flex flex-col justify-between">
            <span className="text-xs font-semibold text-brand-primary/60">
              Pending Outreach
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {metrics.pendingCount}
              </span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <span className="text-[11px] text-brand-primary/50 mt-1">
              Ready to send
            </span>
          </div>
        </div>
      </div>

      {/* ── 4. Search, Filter & Attendees Directory ─────────────────────── */}
      <div className="bg-brand-light border border-border-color rounded-2xl shadow-xs overflow-hidden">
        {/* Controls Toolbar */}
        <div className="p-4 border-b border-border-color/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-primary/40 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, phone, company, or discussion..."
              className="w-full bg-bg-main border border-border-color text-brand-primary text-xs md:text-sm rounded-xl pl-9 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-primary/40 hover:text-brand-primary cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto overflow-x-auto text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                statusFilter === "all"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-bg-main text-brand-primary/70 hover:bg-brand-secondary/40 hover:text-brand-primary"
              }`}
            >
              All ({contacts.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("whatsapp_opened")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                statusFilter === "whatsapp_opened"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-bg-main text-brand-primary/70 hover:bg-brand-secondary/40"
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
              WhatsApp Sent ({metrics.sentCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("pending")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                statusFilter === "pending"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "bg-bg-main text-brand-primary/70 hover:bg-brand-secondary/40"
              }`}
            >
              <Clock className="w-3 h-3" />
              Pending ({metrics.pendingCount})
            </button>
          </div>
        </div>

        {/* Directory Table */}
        {loadingContacts ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-brand-primary/60">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
            <span className="text-xs md:text-sm font-medium">
              Loading event attendees...
            </span>
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="py-16 text-center px-4 flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
              <Users className="w-7 h-7" />
            </div>
            <h3 className="text-sm md:text-base font-bold text-brand-primary">
              No Attendees Captured Yet
            </h3>
            <p className="text-xs text-brand-primary/60 max-w-md mt-1 mb-4">
              {searchQuery
                ? `No attendee matches "${searchQuery}". Try clearing search filters.`
                : "Open the SalesBuster Mobile App, select this event, and tap the Voice Microphone to record conversations and auto-generate WhatsApp messages in real-time."}
            </p>
            {events.length === 0 && (
              <button
                type="button"
                onClick={() => setShowCreateEventModal(true)}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold shadow-sm hover:bg-indigo-700 cursor-pointer"
              >
                Create First Event
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs md:text-sm">
              <thead>
                <tr className="border-b border-border-color bg-bg-main/60 text-brand-primary/60 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Attendee</th>
                  <th className="py-3 px-4">Phone Number</th>
                  <th className="py-3 px-4">AI Discussion Summary</th>
                  <th className="py-3 px-4">WhatsApp Message</th>
                  <th className="py-3 px-4">Captured By</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-color/60">
                {filteredContacts.map((contact) => {
                  const isSent =
                    contact.status === "whatsapp_opened" ||
                    contact.status === "completed";

                  return (
                    <tr
                      key={contact._id}
                      className="hover:bg-brand-secondary/20 transition-colors group cursor-pointer"
                      onClick={() => {
                        setActiveAttendee(contact);
                        setShowAttendeeModal(true);
                      }}
                    >
                      {/* Attendee Name & Company */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center font-bold text-xs uppercase shrink-0 shadow-xs">
                            {contact.name ? contact.name.slice(0, 2) : "??"}
                          </div>
                          <div>
                            <div className="font-semibold text-brand-primary">
                              {contact.name || "Unknown Attendee"}
                            </div>
                            {contact.companyName && (
                              <div className="text-[11px] text-brand-primary/60 flex items-center gap-1">
                                <Building2 className="w-3 h-3 text-brand-primary/40 shrink-0" />
                                {contact.companyName}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Phone Number */}
                      <td className="py-3.5 px-4 font-mono text-xs">
                        {contact.phone ? (
                          <div className="flex items-center gap-1.5 text-brand-primary">
                            <Phone className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                            <span>{contact.phone}</span>
                          </div>
                        ) : (
                          <span className="text-brand-primary/40 italic">
                            No Phone
                          </span>
                        )}
                      </td>

                      {/* AI Discussion Summary */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="line-clamp-2 text-brand-primary/80 text-xs">
                          {contact.summary || (
                            <span className="italic text-brand-primary/40">
                              No discussion notes
                            </span>
                          )}
                        </p>
                      </td>

                      {/* Tailored WhatsApp Message */}
                      <td className="py-3.5 px-4 max-w-sm">
                        <div className="relative group/msg bg-bg-main/80 border border-border-color/60 rounded-lg p-2 text-xs text-brand-primary/85">
                          <p className="line-clamp-2 italic font-sans">
                            "{contact.messageText || "No message generated"}"
                          </p>
                        </div>
                      </td>

                      {/* Captured By */}
                      <td className="py-3.5 px-4 text-xs text-brand-primary/70">
                        <div className="font-medium">
                          {contact.capturedByName || "Sales Rep"}
                        </div>
                        {contact.createdAt && (
                          <div className="text-[11px] text-brand-primary/50">
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
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            WhatsApp Sent
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            <Clock className="w-3.5 h-3.5" />
                            Pending
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
                            className="p-1.5 rounded-lg border border-border-color/70 bg-bg-main text-brand-primary/70 hover:text-brand-primary hover:bg-brand-secondary/40 transition-colors cursor-pointer"
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
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium text-xs transition-colors cursor-pointer shadow-xs"
                          >
                            <FaWhatsapp className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Send</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── 5. Attendee Detail Slide-Over Modal ───────────────────────────── */}
      {showAttendeeModal && activeAttendee && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setShowAttendeeModal(false)}
        >
          <div
            className="bg-brand-light border border-border-color rounded-2xl w-full max-w-lg shadow-2xl p-5 md:p-6 space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-border-color/60">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                  {activeAttendee.name ? activeAttendee.name.slice(0, 2) : "??"}
                </div>
                <div>
                  <h3 className="font-bold text-brand-primary text-base">
                    {activeAttendee.name || "Unknown Attendee"}
                  </h3>
                  <p className="text-xs text-brand-primary/60">
                    {activeAttendee.companyName || "No Company Specified"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAttendeeModal(false)}
                className="p-1.5 rounded-lg text-brand-primary/50 hover:text-brand-primary hover:bg-brand-secondary/40 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs md:text-sm">
              <div className="flex items-center justify-between p-3 rounded-xl bg-bg-main border border-border-color">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-indigo-500" />
                  <span className="font-mono font-semibold text-brand-primary">
                    {activeAttendee.phone || "No phone provided"}
                  </span>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    activeAttendee.status === "whatsapp_opened" ||
                    activeAttendee.status === "completed"
                      ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                  }`}
                >
                  {activeAttendee.status === "whatsapp_opened" ||
                  activeAttendee.status === "completed"
                    ? "WhatsApp Sent"
                    : "Pending"}
                </span>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-brand-primary/60 block mb-1">
                  Discussion Summary (AI Analyzed):
                </label>
                <div className="p-3 rounded-xl bg-bg-main border border-border-color text-brand-primary/80">
                  {activeAttendee.summary || "No notes available."}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-brand-primary/60">
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
                    className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer"
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
                <div className="p-3.5 rounded-xl bg-bg-main border border-border-color whitespace-pre-wrap font-sans text-brand-primary/90 text-xs md:text-sm">
                  {activeAttendee.messageText || "No message text."}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-brand-primary/60 pt-2 border-t border-border-color/60">
                <div>
                  <span className="font-semibold block text-brand-primary/80">
                    Captured By:
                  </span>
                  {activeAttendee.capturedByName || "Sales Rep"}
                </div>
                <div>
                  <span className="font-semibold block text-brand-primary/80">
                    Captured Time:
                  </span>
                  {activeAttendee.createdAt
                    ? new Date(activeAttendee.createdAt).toLocaleString()
                    : "N/A"}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-border-color/60 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAttendeeModal(false)}
                className="px-4 py-2 rounded-xl border border-border-color bg-brand-light text-brand-primary font-semibold text-xs cursor-pointer hover:bg-brand-secondary/40"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => handleDirectWhatsApp(activeAttendee)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold text-xs cursor-pointer shadow-sm"
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setShowCreateEventModal(false)}
        >
          <div
            className="bg-brand-light border border-border-color rounded-2xl w-full max-w-md shadow-2xl p-5 md:p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-border-color/60">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-brand-primary text-base">
                  Create New Event
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateEventModal(false)}
                className="p-1.5 rounded-lg text-brand-primary/50 hover:text-brand-primary hover:bg-brand-secondary/40 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-3.5 text-xs md:text-sm">
              <div>
                <label className="block text-xs font-semibold text-brand-primary/80 mb-1">
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
                  className="w-full bg-bg-main border border-border-color rounded-xl px-3.5 py-2 text-brand-primary focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-primary/80 mb-1">
                  Event Date
                </label>
                <input
                  type="date"
                  value={newEventData.eventDate}
                  onChange={(e) =>
                    setNewEventData({ ...newEventData, eventDate: e.target.value })
                  }
                  className="w-full bg-bg-main border border-border-color rounded-xl px-3.5 py-2 text-brand-primary focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-primary/80 mb-1">
                  Location / Venue
                </label>
                <input
                  type="text"
                  placeholder="e.g., Hall 4, HITEX Hyderabad"
                  value={newEventData.location}
                  onChange={(e) =>
                    setNewEventData({ ...newEventData, location: e.target.value })
                  }
                  className="w-full bg-bg-main border border-border-color rounded-xl px-3.5 py-2 text-brand-primary focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-primary/80 mb-1">
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
                  className="w-full bg-bg-main border border-border-color rounded-xl px-3.5 py-2 text-brand-primary focus:outline-none focus:ring-2 focus:ring-indigo-500/40 resize-none"
                />
              </div>

              <div className="pt-3 border-t border-border-color/60 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateEventModal(false)}
                  className="px-4 py-2 rounded-xl border border-border-color bg-brand-light text-brand-primary font-semibold text-xs cursor-pointer hover:bg-brand-secondary/40"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingEvent || !newEventData.name.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs cursor-pointer shadow-sm disabled:opacity-50"
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

