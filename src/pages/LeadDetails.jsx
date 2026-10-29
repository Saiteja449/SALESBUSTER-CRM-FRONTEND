import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Phone,
  PhoneCall,
  Mail,
  User,
  Calendar,
  CheckCircle,
  CheckCircle2,
  Plus,
  X,
  MapPin,
  MessageSquare,
  Building2,
  ChevronDown,
  Upload,
  Mic,
  FileAudio,
  RotateCcw,
  Copy,
  Check,
  Sparkles,
  AlertCircle,
  AlertTriangle,
  Clock,
  PhoneMissed,
  XCircle,
  DollarSign,
  ClipboardList,
  Edit2,
  Share2,
  Flame,
  CheckSquare,
  Square,
  Layers,
  Inbox,
  ExternalLink,
} from "lucide-react";
import axios from "axios";
import { API_BASE_URL, BACKEND_URL, ENABLE_AI_AUDIO_ANALYSIS } from "../utils/constants.js";
import { useLeads } from "../context/LeadsContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { formatDate, formatTime, formatDateTime, getServiceColor, getRepName, getLocalTodayDateString } from "../utils/helpers.js";
import { socket } from "../utils/socket.js";
import DatePicker from "../components/DatePicker.jsx";
import RecordingsSidebar from "../components/leads/RecordingsSidebar.jsx";

export default function LeadDetails() {
  const { allUsers = [], currentUser, isManager } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    leads = [],
    updateLead,
    followups = [],
    addFollowup,
    toggleFollowupDone,
    activeServices = [],
    qualificationFields = [],
  } = useLeads();

  const currentLead = useMemo(() => {
    return leads.find((l) => String(l.id) === String(id) || String(l._id) === String(id));
  }, [leads, id]);

  const isManagerRole = Boolean(
    isManager ||
    ["sales manager", "super_admin", "admin", "super admin"].includes(
      (currentUser?.role || "").toLowerCase()
    ) ||
    currentUser?.isOrgOwner
  );

  // Active Workspace Tab
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "history" | "update"
  const [historyFilter, setHistoryFilter] = useState("all"); // "all" | "pending" | "completed"
  const [copiedPhone, setCopiedPhone] = useState(false);

  // Notes state
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState(currentLead?.notes || "");

  // Update Lead Details Form form data
  const [formData, setFormData] = useState({
    status: currentLead?.status || "New",
    service: currentLead?.service || "General Enquiry",
    nextFollowUp: currentLead?.nextFollowUp || "",
    appointmentDate: currentLead?.appointmentDate || "",
    appointmentTime: currentLead?.appointmentTime || "",
    assignedTo: currentLead?.assignedTo || "",
    importantLead: currentLead?.importantLead || false,
    comments: "",
  });

  // Keep state sync if lead switches or refreshes
  useEffect(() => {
    if (currentLead) {
      setFormData({
        status: currentLead.status || "New",
        service: currentLead.service || "General Enquiry",
        nextFollowUp: currentLead.nextFollowUp || "",
        appointmentDate: currentLead.appointmentDate || "",
        appointmentTime: currentLead.appointmentTime || "",
        assignedTo: currentLead.assignedTo || "",
        importantLead: Boolean(currentLead.importantLead),
        comments: "",
      });
      setNotesText(currentLead.notes || "");
    }
  }, [currentLead]);

  // Add Followup Modal State
  const [followupOpen, setFollowupOpen] = useState(false);
  const [newFw, setNewFw] = useState({
    type: "Call",
    date: getLocalTodayDateString(),
    time: "11:00 AM",
    priority: "Medium",
    notes: "",
  });

  // Add Activity Modal State
  const [activityOpen, setActivityOpen] = useState(false);
  const [newAct, setNewAct] = useState({
    type: "Call Completed",
    content: "",
    author: currentUser?.name || "Representative",
  });

  const [followupType, setFollowupType] = useState("Call");
  const [isRecordingsSidebarOpen, setIsRecordingsSidebarOpen] = useState(false);
  const [recordingsRepFilter, setRecordingsRepFilter] = useState(null);
  const [isSubmittingUpdate, setIsSubmittingUpdate] = useState(false);

  const repCallSummary = useMemo(() => {
    const map = new Map();

    if (Array.isArray(currentLead?.repCallCounts)) {
      currentLead.repCallCounts.forEach((rc) => {
        const key = String(rc.salespersonId || rc.salespersonName || "unnamed");
        map.set(key, {
          salespersonId: rc.salespersonId,
          salespersonName: rc.salespersonName || "Sales Representative",
          count: rc.count || 0,
          lastCalledAt: rc.lastCalledAt,
          recordingsCount: 0,
        });
      });
    }

    const recs = currentLead?.recordings || [];
    recs.forEach((rec) => {
      const key = String(rec.salespersonId || rec.salespersonName || "unnamed");
      if (map.has(key)) {
        const existing = map.get(key);
        existing.recordingsCount += 1;
      } else if (rec.salespersonName || rec.salespersonId) {
        map.set(key, {
          salespersonId: rec.salespersonId,
          salespersonName: rec.salespersonName || "Sales Representative",
          count: 1,
          lastCalledAt: rec.uploadedAt,
          recordingsCount: 1,
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [currentLead?.repCallCounts, currentLead?.recordings]);

  const totalCallCount = useMemo(() => {
    return (
      currentLead?.callCount ||
      repCallSummary.reduce((sum, r) => sum + r.count, 0) ||
      currentLead?.recordings?.length ||
      0
    );
  }, [currentLead?.callCount, repCallSummary, currentLead?.recordings]);

  const formatDurationSeconds = (sec) => {
    if (!sec || sec <= 0) return null;
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    if (m === 0) return `${s}s`;
    return `${m}m ${s}s`;
  };

  const callTimeline = useMemo(() => {
    let history = Array.isArray(currentLead?.callHistory) ? [...currentLead.callHistory] : [];

    // Fallback: if callHistory is empty but repCallCounts exist (e.g. earlier calls synced before callHistory array)
    if (history.length === 0 && Array.isArray(currentLead?.repCallCounts)) {
      currentLead.repCallCounts.forEach((rep) => {
        const count = rep.count || 0;
        for (let i = 0; i < count; i++) {
          history.push({
            salespersonId: rep.salespersonId,
            salespersonName: rep.salespersonName || "Sales Representative",
            calledAt: rep.lastCalledAt || currentLead.lastCallAt || currentLead.updatedAt,
            callType: "outgoing",
            status: "connected",
            duration: 0,
          });
        }
      });
    }

    const recordings = Array.isArray(currentLead?.recordings) ? currentLead.recordings : [];
    const enriched = history.map((item) => {
      let matchedRec = null;
      if (item.recordingUrl || item.recordingId) {
        matchedRec = recordings.find(
          (r) =>
            (item.recordingId && String(r._id) === String(item.recordingId)) ||
            (item.recordingUrl && r.url === item.recordingUrl)
        );
      }
      return {
        ...item,
        recording: matchedRec,
      };
    });

    // Sort descending by calledAt (newest call first)
    return enriched.sort((a, b) => new Date(b.calledAt || 0) - new Date(a.calledAt || 0));
  }, [currentLead?.callHistory, currentLead?.repCallCounts, currentLead?.lastCallAt, currentLead?.recordings]);

  const todayStr = useMemo(() => getLocalTodayDateString(), []);

  // Multi-modal Status Badge (Semantic icon + text)
  const renderStatusBadge = (statusName) => {
    const s = (statusName || "New").toLowerCase().trim();
    switch (s) {
      case "new":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30">
            <Sparkles className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>New</span>
          </span>
        );
      case "missed call":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
            <PhoneMissed className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>Missed Call</span>
          </span>
        );
      case "follow up":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>Follow Up</span>
          </span>
        );
      case "converted":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>Converted</span>
          </span>
        );
      case "not attended":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>Not Attended</span>
          </span>
        );
      case "price issue":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/25">
            <DollarSign className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>Price Issue</span>
          </span>
        );
      case "not interested":
      case "lost":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/30">
            <XCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>{statusName || "Lost"}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-brand-secondary/40 text-brand-primary border border-brand-secondary/60">
            <CheckCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>{statusName}</span>
          </span>
        );
    }
  };

  // Follow-up Urgency Indicator helper
  const getFollowUpStatus = (lead) => {
    if (!lead?.nextFollowUp) {
      return {
        type: "none",
        label: "No Follow-up Scheduled",
        icon: <Calendar className="w-4 h-4 text-brand-primary/50" />,
        badgeClass: "bg-brand-secondary/30 text-brand-primary/70 border-brand-secondary",
      };
    }

    const fwDate = lead.nextFollowUp;
    const isOverdue = fwDate < todayStr && lead.status === "Follow Up";
    const isToday = fwDate === todayStr;

    if (isOverdue) {
      return {
        type: "overdue",
        label: `Overdue (${formatDate(fwDate)})`,
        date: fwDate,
        time: lead.followupTime || lead.appointmentTime || "",
        icon: <AlertTriangle className="w-4 h-4 text-red-500" />,
        badgeClass: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30 font-bold",
      };
    }

    if (isToday) {
      return {
        type: "today",
        label: `Today${lead.followupTime ? ` at ${lead.followupTime}` : ""}`,
        date: fwDate,
        time: lead.followupTime || lead.appointmentTime || "",
        icon: <Clock className="w-4 h-4 text-amber-500" />,
        badgeClass: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 font-bold",
      };
    }

    return {
      type: "upcoming",
      label: `Scheduled: ${formatDate(fwDate)}${lead.followupTime ? ` at ${lead.followupTime}` : ""}`,
      date: fwDate,
      time: lead.followupTime || lead.appointmentTime || "",
      icon: <Calendar className="w-4 h-4 text-teal-600" />,
      badgeClass: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30 font-semibold",
    };
  };

  // Fallback / Missing lead state
  if (!currentLead) {
    return (
      <div className="p-4 md:p-8 max-w-xl mx-auto text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-brand-secondary/40 text-brand-primary/60 flex items-center justify-center mx-auto">
          <Inbox className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-brand-primary">
            Lead Record Not Found
          </h2>
          <p className="text-xs text-brand-primary/60 mt-1 max-w-sm mx-auto">
            The customer lead you requested could not be located in your organization's directory. It may have been reassigned, deleted, or the ID is invalid.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/leads")}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-pilot-blue hover:bg-pilot-blue-hover text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs focus-visible:ring-2 focus-visible:ring-pilot-blue focus-visible:outline-none"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Leads Directory</span>
        </button>
      </div>
    );
  }

  const leadFollowups = followups.filter(
    (f) => String(f.leadId) === String(currentLead.id || currentLead._id)
  );

  const combinedHistory = leadFollowups
    .map((f) => {
      const scheduledD = new Date(f.date + "T" + (f.time || "00:00:00"));
      const creationDateStr = f.createdAt || new Date().toISOString();
      const creationD = new Date(creationDateStr);
      return {
        id: f.id || f._id,
        isFollowup: !f.done,
        done: Boolean(f.done),
        type: f.type || "Call",
        priority: f.priority || "Medium",
        rawDate: creationD.getTime(),
        scheduledDate: f.date,
        scheduledTime: f.time || "",
        notes: f.notes || "",
        author: f.author || getRepName(currentLead.assignedTo, allUsers) || "System",
        createdAt: creationDateStr,
      };
    })
    .sort((a, b) => b.rawDate - a.rawDate);

  const filteredHistory = combinedHistory.filter((item) => {
    if (historyFilter === "pending") return !item.done;
    if (historyFilter === "completed") return item.done;
    return true;
  });

  const fwStatus = getFollowUpStatus(currentLead);
  const serviceColor = getServiceColor(currentLead.service || "General Enquiry");

  // Reassign directly (Managers only)
  const handleAssigneeChange = async (e) => {
    try {
      const nextAssignee = e.target.value;
      await updateLead(
        currentLead.id || currentLead._id,
        { assignedTo: nextAssignee },
        currentUser?.name || "System"
      );
    } catch (error) {
      console.error(error);
      alert("Failed to update representative assignment.");
    }
  };

  // Handle lead update submit
  const handleUpdateLeadFormSubmit = async (e) => {
    e.preventDefault();

    if (formData.status === "Follow Up") {
      if (!formData.nextFollowUp || !followupType || !formData.comments.trim()) {
        alert("Please supply a valid Follow Up Date, Channel Type, and Comments.");
        return;
      }
    }

    const updatedFields = {
      status: formData.status,
      service: formData.service,
      nextFollowUp: formData.nextFollowUp,
      appointmentDate: formData.appointmentDate,
      appointmentTime: formData.appointmentTime,
      importantLead: formData.importantLead,
    };

    if (formData.assignedTo !== currentLead?.assignedTo) {
      updatedFields.assignedTo = formData.assignedTo;
    }

    const authorName = currentUser?.name || "System";
    setIsSubmittingUpdate(true);

    try {
      await updateLead(currentLead.id || currentLead._id, updatedFields, authorName);

      if (formData.status === "Follow Up") {
        addFollowup({
          leadId: currentLead.id || currentLead._id,
          leadName: currentLead.name,
          type: followupType,
          date: formData.nextFollowUp,
          time: formData.appointmentTime || "11:00 AM",
          priority: formData.importantLead ? "High" : "Medium",
          notes:
            formData.comments || `Routine followup scheduled via ${followupType}`,
          author: authorName,
        });
      }

      setFormData((prev) => ({ ...prev, comments: "" }));
      alert("Lead records updated successfully.");
      setActiveTab("overview");
    } catch (error) {
      console.error(error);
      alert("Failed to update lead records.");
    } finally {
      setIsSubmittingUpdate(false);
    }
  };

  // Save notes
  const handleSaveNotes = async () => {
    try {
      await updateLead(
        currentLead.id || currentLead._id,
        { notes: notesText },
        currentUser?.name || "System"
      );
      setEditingNotes(false);
    } catch (error) {
      console.error(error);
      alert("Failed to save notes");
    }
  };

  // Schedule follow-up
  const handleSaveFollowup = async (e) => {
    e.preventDefault();
    if (!newFw.date || !newFw.type || !newFw.notes.trim()) {
      alert("Please supply a valid Follow Up Date, Type, and Notes.");
      return;
    }
    try {
      addFollowup({
        leadId: currentLead.id || currentLead._id,
        leadName: currentLead.name,
        type: newFw.type,
        date: newFw.date,
        time: newFw.time,
        priority: newFw.priority,
        notes: newFw.notes,
        author: currentUser?.name || "Representative",
      });
      await updateLead(currentLead.id || currentLead._id, {
        nextFollowUp: newFw.date,
        followupTime: newFw.time,
        status: "Follow Up",
      });
      setFollowupOpen(false);
      setNewFw({
        type: "Call",
        date: getLocalTodayDateString(),
        time: "11:00 AM",
        priority: "Medium",
        notes: "",
      });
    } catch (error) {
      console.error(error);
      alert("Failed to schedule follow-up");
    }
  };

  // Log activity
  const handleSaveActivity = (e) => {
    e.preventDefault();
    if (!newAct.content.trim()) {
      alert("Please provide the activity notes content.");
      return;
    }
    addFollowup({
      leadId: currentLead.id || currentLead._id,
      leadName: currentLead.name,
      type: newAct.type,
      date: getLocalTodayDateString(),
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      priority: "Low",
      notes: newAct.content,
      author: newAct.author,
      done: true,
    });
    setActivityOpen(false);
    setNewAct({
      type: "Call Completed",
      content: "",
      author: currentUser?.name || "Representative",
    });
  };

  const handleCopyPhone = () => {
    if (!currentLead.phone) return;
    navigator.clipboard?.writeText(currentLead.phone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 1500);
  };

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto w-full">
      {/* ── Back Navigation ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate("/leads")}
          className="inline-flex items-center gap-2 text-xs md:text-sm font-bold text-brand-primary/70 hover:text-brand-primary transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-pilot-blue focus-visible:outline-none rounded-lg px-2 py-1"
          aria-label="Return to leads directory"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Leads Directory</span>
        </button>

        <span className="text-[11px] text-brand-primary/50">
          Lead ID: {currentLead.id || currentLead._id}
        </span>
      </div>

      {/* ── 1. Hero Summary Card at Top ────────────────────────────────── */}
      <div className="bg-brand-light border border-brand-secondary rounded-2xl p-4 md:p-6 shadow-xs">
        {/* Top Header Row: Name, Status & Tags */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-brand-secondary/40">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-extrabold text-lg shrink-0 shadow-xs">
              {currentLead.name ? currentLead.name.substring(0, 1).toUpperCase() : "L"}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl md:text-2xl font-extrabold text-brand-primary tracking-tight truncate">
                  {currentLead.name || "Unnamed Prospect"}
                </h1>

                {currentLead.importantLead && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                    <Flame className="w-3.5 h-3.5" />
                    <span>Hot Lead</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 mt-1.5 flex-wrap text-xs">
                {renderStatusBadge(currentLead.status)}

                <span
                  className="px-2.5 py-1 rounded-full text-xs font-bold text-white shadow-2xs"
                  style={{ backgroundColor: serviceColor }}
                >
                  {currentLead.service || "General Enquiry"}
                </span>

                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-brand-secondary/40 text-brand-primary border border-brand-secondary">
                  Source: {currentLead.source || "Direct Entry"}
                </span>

                {(currentLead.appointmentDate || currentLead.tags?.includes("Demo Booked")) && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    📅 Demo Booked: {currentLead.appointmentDate} {currentLead.appointmentTime || ""}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Follow-up Urgency Pill */}
          <div className="flex flex-col sm:items-end gap-1 shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-primary/60">
              Follow-up Status
            </span>
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs ${fwStatus.badgeClass}`}
            >
              {fwStatus.icon}
              <span>{fwStatus.label}</span>
            </div>
          </div>
        </div>

        {/* Contact Details & Assignment Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 pt-4 text-xs">
          {/* Phone */}
          <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-bg-main/50 border border-brand-secondary/40">
            <Phone className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold text-brand-primary/50 uppercase block">
                Phone Number
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <a
                  href={`tel:${currentLead.phone}`}
                  className="font-bold text-brand-primary hover:text-emerald-600 truncate"
                  title="Click to dial"
                >
                  {currentLead.phone || "No phone"}
                </a>
                {currentLead.phone && (
                  <button
                    type="button"
                    onClick={handleCopyPhone}
                    className="p-1 text-brand-primary/50 hover:text-brand-primary transition-colors cursor-pointer"
                    title="Copy phone number"
                    aria-label="Copy phone number"
                  >
                    {copiedPhone ? (
                      <Check className="w-3 h-3 text-emerald-500" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Email */}
          <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-bg-main/50 border border-brand-secondary/40">
            <Mail className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold text-brand-primary/50 uppercase block">
                Email Address
              </span>
              {currentLead.email ? (
                <a
                  href={`mailto:${currentLead.email}`}
                  className="font-semibold text-brand-primary hover:text-purple-600 truncate block mt-0.5"
                  title="Send email"
                >
                  {currentLead.email}
                </a>
              ) : (
                <span className="text-brand-primary/50 block mt-0.5">Not provided</span>
              )}
            </div>
          </div>

          {/* Company */}
          <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-bg-main/50 border border-brand-secondary/40">
            <Building2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold text-brand-primary/50 uppercase block">
                Company / Org
              </span>
              <span className="font-semibold text-brand-primary truncate block mt-0.5">
                {currentLead.company || currentLead.aiQualification?.company || "Not provided"}
              </span>
            </div>
          </div>

          {/* Assigned Representative */}
          <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-bg-main/50 border border-brand-secondary/40">
            <User className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold text-brand-primary/50 uppercase block">
                Assigned Rep
              </span>
              {isManagerRole ? (
                <select
                  value={
                    allUsers.find(
                      (u) =>
                        u.id === currentLead.assignedTo ||
                        u._id === currentLead.assignedTo ||
                        u.name?.toLowerCase() === String(currentLead.assignedTo).toLowerCase()
                    )?.id ||
                    currentLead.assignedTo ||
                    "Unassigned"
                  }
                  onChange={handleAssigneeChange}
                  aria-label="Reassign sales representative"
                  className="bg-brand-light border border-brand-secondary text-xs font-bold text-brand-primary rounded-lg px-2 py-1 mt-0.5 focus:outline-none focus:border-purple-500 cursor-pointer w-full"
                >
                  <option value="Unassigned">Unassigned</option>
                  {allUsers.map((u) => (
                    <option key={u.id || u._id} value={u.id || u._id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="font-semibold text-brand-primary truncate block mt-0.5">
                  {getRepName(currentLead.assignedTo, allUsers)}
                </span>
              )}
            </div>
          </div>

          {/* Registered Date */}
          <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-bg-main/50 border border-brand-secondary/40">
            <Calendar className="w-4 h-4 text-brand-primary/50 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold text-brand-primary/50 uppercase block">
                Enquired Date
              </span>
              <span className="font-semibold text-brand-primary truncate block mt-0.5">
                {formatDate(currentLead.joinedAt || currentLead.createdAt)}
              </span>
            </div>
          </div>

          {/* Total Calls */}
          <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-bg-main/50 border border-brand-secondary/40">
            <PhoneCall className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold text-brand-primary/50 uppercase block">
                Total Calls
              </span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 truncate block mt-0.5">
                {totalCallCount} {totalCallCount === 1 ? "call" : "calls"}
              </span>
            </div>
          </div>
        </div>

        {/* ── Fast Action Command Bar ──────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2.5 pt-4 mt-4 border-t border-brand-secondary/40">
          {currentLead.phone && (
            <a
              href={`tel:${currentLead.phone}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
              aria-label={`Dial ${currentLead.name}`}
            >
              <Phone className="w-4 h-4" />
              <span>Call Client</span>
            </a>
          )}

          <button
            type="button"
            onClick={() =>
              navigate("/whatsapp", {
                state: { selectLeadId: currentLead.id || currentLead._id },
              })
            }
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-2xs transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:outline-none"
            aria-label="Open WhatsApp chat for this lead"
          >
            <MessageSquare className="w-4 h-4" />
            <span>WhatsApp Chat</span>
          </button>

          <button
            type="button"
            onClick={() => setFollowupOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-2xs transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:outline-none"
            aria-label="Schedule a follow-up task"
          >
            <Calendar className="w-4 h-4" />
            <span>Schedule Follow-up</span>
          </button>

          <button
            type="button"
            onClick={() => setActivityOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-brand-light border border-brand-secondary text-brand-primary hover:bg-brand-secondary/40 shadow-2xs transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-pilot-blue focus-visible:outline-none"
            aria-label="Log a completed activity or call note"
          >
            <ClipboardList className="w-4 h-4 text-blue-500" />
            <span>Log Activity / Call</span>
          </button>

          {ENABLE_AI_AUDIO_ANALYSIS && (
            <button
              type="button"
              onClick={() => setIsRecordingsSidebarOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-violet-600/15 hover:bg-violet-600/25 text-violet-700 dark:text-violet-300 border border-violet-500/30 shadow-2xs transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:outline-none"
              aria-label="Open AI audio recordings and coaching analysis"
            >
              <Mic className="w-4 h-4 text-violet-600" />
              <span>Recordings & AI Analysis</span>
              {currentLead.recordings && currentLead.recordings.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-violet-600 text-white text-[10px] font-bold">
                  {currentLead.recordings.length}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* ── 2. Dedicated Overdue Alert Banner (If Applicable) ───────────── */}
      {fwStatus.type === "overdue" && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs"
        >
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-500/20 text-red-500 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs md:text-sm font-bold text-red-600 dark:text-red-400">
                Action Required: Overdue Follow-up
              </h3>
              <p className="text-xs text-brand-primary/70 mt-0.5">
                This lead had a follow-up scheduled for{" "}
                <strong className="text-red-600 dark:text-red-400">
                  {formatDate(fwStatus.date)}
                </strong>{" "}
                that has not been completed.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setFollowupOpen(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-700 text-white transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none"
            >
              Reschedule Follow-up
            </button>
          </div>
        </div>
      )}

      {/* ── 3. Workspace Segmented Navigation ────────────────────────────── */}
      <div className="flex border-b border-brand-secondary/60 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2.5 text-xs md:text-sm font-bold border-b-2 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-pilot-blue focus-visible:outline-none ${
            activeTab === "overview"
              ? "border-purple-600 text-purple-600 dark:text-purple-400 bg-purple-500/5 rounded-t-lg"
              : "border-transparent text-brand-primary/70 hover:text-brand-primary"
          }`}
        >
          Overview & Intelligence
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2.5 text-xs md:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-pilot-blue focus-visible:outline-none ${
            activeTab === "history"
              ? "border-purple-600 text-purple-600 dark:text-purple-400 bg-purple-500/5 rounded-t-lg"
              : "border-transparent text-brand-primary/70 hover:text-brand-primary"
          }`}
        >
          <span>Follow-up & Activity History</span>
          {leadFollowups.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-brand-secondary/50 text-[10px]">
              {leadFollowups.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("update")}
          className={`px-4 py-2.5 text-xs md:text-sm font-bold border-b-2 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-pilot-blue focus-visible:outline-none ${
            activeTab === "update"
              ? "border-purple-600 text-purple-600 dark:text-purple-400 bg-purple-500/5 rounded-t-lg"
              : "border-transparent text-brand-primary/70 hover:text-brand-primary"
          }`}
        >
          Update Status & Schedule
        </button>
      </div>

      {/* ── 4. Tab 1: Overview & Intelligence Workspace ──────────────────── */}
      {activeTab === "overview" && (
        <div className="space-y-5">
          {/* Sales Representative Outreach & Call Tracking Card */}
          <div className="bg-brand-light border border-brand-secondary rounded-2xl p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 pb-3 border-b border-brand-secondary/40">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                  <PhoneCall className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-brand-primary text-sm md:text-base flex items-center gap-2">
                    Sales Representatives Call Tracking
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                      {totalCallCount} {totalCallCount === 1 ? "call" : "calls"}
                    </span>
                  </h3>
                  <p className="text-xs text-brand-primary/60 mt-0.5">
                    How many times each sales representative has called this lead (synced via Mobile App)
                  </p>
                </div>
              </div>

              {currentLead.lastCallAt && (
                <span className="text-xs text-brand-primary/60 flex items-center gap-1 font-medium bg-bg-main px-2.5 py-1 rounded-lg border border-brand-secondary/40">
                  <Clock className="w-3.5 h-3.5 text-brand-primary/50" />
                  Last Call: {formatDateTime(currentLead.lastCallAt)}
                </span>
              )}
            </div>

            {repCallSummary.length === 0 ? (
              <div className="p-6 text-center rounded-xl bg-bg-main/50 border border-dashed border-brand-secondary/60">
                <Phone className="w-8 h-8 text-brand-primary/30 mx-auto mb-2" />
                <p className="text-xs font-bold text-brand-primary">No calls logged yet for this lead</p>
                <p className="text-[11px] text-brand-primary/60 mt-1 max-w-md mx-auto">
                  When representatives make calls or upload audio recordings through the SalesBuster Mobile App, each call attempt will be tracked and displayed here per sales rep.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Sales Rep Outreach Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {repCallSummary.map((rep, idx) => (
                    <div
                      key={rep.salespersonId || rep.salespersonName || idx}
                      className="p-3.5 rounded-xl bg-bg-main border border-brand-secondary/50 flex flex-col justify-between gap-3 hover:border-purple-500/30 transition-all shadow-2xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                            {rep.salespersonName
                              ? rep.salespersonName.slice(0, 2).toUpperCase()
                              : "SR"}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-brand-primary text-xs truncate block">
                              {rep.salespersonName}
                            </span>
                            <span className="text-[11px] text-brand-primary/60 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3 text-brand-primary/40 shrink-0" />
                              {rep.lastCalledAt ? formatDateTime(rep.lastCalledAt) : "Date unrecorded"}
                            </span>
                          </div>
                        </div>

                        <div className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 text-xs font-black shrink-0">
                          {rep.count} {rep.count === 1 ? "call" : "calls"}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-brand-secondary/40 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-brand-primary/70 font-medium flex items-center gap-1">
                          <Mic className="w-3 h-3 text-purple-500" />
                          {rep.recordingsCount} {rep.recordingsCount === 1 ? "recording" : "recordings"}
                        </span>

                        {rep.recordingsCount > 0 && ENABLE_AI_AUDIO_ANALYSIS && (
                          <button
                            type="button"
                            onClick={() => {
                              setRecordingsRepFilter(rep.salespersonId || rep.salespersonName);
                              setIsRecordingsSidebarOpen(true);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-purple-600/10 hover:bg-purple-600/20 text-purple-600 dark:text-purple-400 border border-purple-500/20 transition-colors cursor-pointer"
                          >
                            <FileAudio className="w-3 h-3" />
                            <span>Listen</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* ── Chronological Call History (One call after another) ── */}
                <div className="pt-4 border-t border-brand-secondary/40">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <h4 className="font-bold text-brand-primary text-xs md:text-sm">
                        Call History (Chronological)
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                        {callTimeline.length} {callTimeline.length === 1 ? "call" : "calls"}
                      </span>
                    </div>
                    <span className="text-[10px] text-brand-primary/50 font-medium">
                      One after another • Newest first
                    </span>
                  </div>

                  <div className="space-y-2">
                    {callTimeline.map((call, cIdx) => {
                      const callNumber = callTimeline.length - cIdx;
                      const isConnected = call.status === "connected" || (call.duration > 0);
                      const isMissed = call.status === "missed" || call.callType === "missed";

                      return (
                        <div
                          key={call.id || call._id || `${call.calledAt}-${cIdx}`}
                          className="p-3 rounded-xl bg-bg-main border border-brand-secondary/50 hover:border-purple-500/30 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 shadow-2xs"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Call sequence index badge */}
                            <div className="w-7 h-7 rounded-lg bg-brand-secondary/40 text-brand-primary font-black text-xs flex items-center justify-center shrink-0">
                              #{callNumber}
                            </div>

                            {/* Status Icon */}
                            <div
                              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                isConnected
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                  : isMissed
                                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                  : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                              }`}
                            >
                              {isMissed ? (
                                <PhoneMissed className="w-4 h-4" />
                              ) : (
                                <PhoneCall className="w-4 h-4" />
                              )}
                            </div>

                            {/* Details */}
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-brand-primary text-xs truncate">
                                  {call.salespersonName || "Sales Representative"}
                                </span>

                                <span
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                    isConnected
                                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                                      : isMissed
                                      ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                                      : "bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30"
                                  }`}
                                >
                                  {call.callType || "Call"} • {call.status || (isConnected ? "Connected" : "Completed")}
                                </span>

                                {call.duration > 0 && (
                                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                    ⏱ {formatDurationSeconds(call.duration)}
                                  </span>
                                )}
                              </div>

                              <div className="text-[11px] text-brand-primary/60 flex items-center gap-1.5 mt-0.5">
                                <Clock className="w-3 h-3 text-brand-primary/40 shrink-0" />
                                <span>{call.calledAt ? formatDateTime(call.calledAt) : "Date unrecorded"}</span>
                              </div>
                            </div>
                          </div>

                          {/* Recording button if recording available */}
                          {call.recording && ENABLE_AI_AUDIO_ANALYSIS && (
                            <button
                              type="button"
                              onClick={() => {
                                setRecordingsRepFilter(call.salespersonId || call.salespersonName);
                                setIsRecordingsSidebarOpen(true);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-600/10 hover:bg-purple-600/20 text-purple-600 dark:text-purple-400 border border-purple-500/25 transition-colors cursor-pointer shrink-0 self-end sm:self-center"
                            >
                              <FileAudio className="w-3.5 h-3.5" />
                              <span>Listen Recording</span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Internal Requirements & Notes Section */}
          <div className="bg-brand-light border border-brand-secondary rounded-2xl p-5 shadow-xs">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-purple-600" />
                <h3 className="font-bold text-brand-primary text-sm md:text-base">
                  Special Requirements & Internal Notes
                </h3>
              </div>

              {editingNotes ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingNotes(false);
                      setNotesText(currentLead.notes || "");
                    }}
                    className="px-3 py-1 text-xs font-semibold text-brand-primary/70 hover:text-brand-primary rounded-lg border border-brand-secondary cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveNotes}
                    className="px-3 py-1 text-xs font-bold bg-pilot-blue hover:bg-pilot-blue-hover text-white rounded-lg cursor-pointer"
                  >
                    Save Notes
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setEditingNotes(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold border border-brand-secondary text-brand-primary hover:bg-brand-secondary/30 rounded-lg transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-pilot-blue focus-visible:outline-none"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Notes</span>
                </button>
              )}
            </div>

            {editingNotes ? (
              <textarea
                rows={4}
                className="w-full bg-bg-main border border-brand-secondary text-brand-primary text-xs md:text-sm rounded-xl p-3 focus:outline-none focus:border-pilot-blue resize-y"
                value={notesText}
                onChange={(e) => setNotesText(e.target.value)}
                placeholder="Log internal client requirements, deal value, or context notes..."
              />
            ) : (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                <p className="text-xs md:text-sm text-amber-700 dark:text-amber-400 whitespace-pre-wrap leading-relaxed">
                  {currentLead.notes ||
                    "No operational requirements or customer notes recorded yet. Click 'Edit Notes' to add details."}
                </p>
              </div>
            )}
          </div>

          {/* AI Captured Lead Specifications (If available) */}
          {currentLead.aiQualification &&
            Object.entries(currentLead.aiQualification).some(
              ([k, v]) =>
                !["_id", "__v", "id"].includes(k) &&
                v !== undefined &&
                v !== null &&
                v !== ""
            ) && (
              <div className="bg-brand-light border border-purple-500/30 rounded-2xl shadow-xs overflow-hidden">
                <div className="p-4 border-b border-purple-500/20 bg-purple-500/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <h3 className="font-bold text-purple-600 text-sm md:text-base">
                      AI Captured Lead Intelligence
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 border border-purple-500/25">
                    Extracted via WhatsApp
                  </span>
                </div>

                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
                  {/* Service Intent */}
                  {(currentLead.aiQualification?.intent || currentLead.service) && (
                    <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                      <span className="text-[10px] uppercase font-bold text-purple-600 block mb-1">
                        Service Intent
                      </span>
                      <span className="text-xs md:text-sm font-bold text-purple-700 dark:text-purple-300">
                        {currentLead.service || currentLead.aiQualification?.intent}
                      </span>
                    </div>
                  )}

                  {/* Requested Callback */}
                  {currentLead.aiQualification?.preferredCallDate && (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 col-span-1 sm:col-span-2">
                      <span className="text-[10px] uppercase font-bold text-emerald-600 block mb-1">
                        Requested Callback Time
                      </span>
                      <span className="text-xs md:text-sm font-bold text-emerald-700 dark:text-emerald-300">
                        {currentLead.aiQualification.preferredCallDate}{" "}
                        {currentLead.aiQualification.preferredCallTime || ""}
                      </span>
                    </div>
                  )}

                  {/* City */}
                  {currentLead.aiQualification?.city && (
                    <div className="p-3 rounded-xl bg-bg-main border border-brand-secondary/40">
                      <span className="text-[10px] uppercase font-bold text-brand-primary/50 block mb-1">
                        Location / City
                      </span>
                      <span className="font-semibold text-brand-primary capitalize">
                        {currentLead.aiQualification.city}
                      </span>
                    </div>
                  )}

                  {/* Urgency */}
                  {currentLead.aiQualification?.urgency && (
                    <div className="p-3 rounded-xl bg-bg-main border border-brand-secondary/40">
                      <span className="text-[10px] uppercase font-bold text-brand-primary/50 block mb-1">
                        Urgency Level
                      </span>
                      <span className="font-semibold text-brand-primary capitalize">
                        {currentLead.aiQualification.urgency}
                      </span>
                    </div>
                  )}

                  {/* Requirement Summary */}
                  {currentLead.aiQualification?.issueDescription && (
                    <div className="p-3 rounded-xl bg-bg-main border border-brand-secondary/40 col-span-1 sm:col-span-2 lg:col-span-4">
                      <span className="text-[10px] uppercase font-bold text-brand-primary/50 block mb-1">
                        Requirement Details
                      </span>
                      <span className="text-brand-primary leading-relaxed">
                        {currentLead.aiQualification.issueDescription}
                      </span>
                    </div>
                  )}

                  {/* Dynamic Organization Qualification Fields */}
                  {qualificationFields &&
                    qualificationFields.map((f) => {
                      const val = currentLead.aiQualification?.[f.key];
                      if (val === undefined || val === null || val === "") return null;
                      return (
                        <div
                          key={f.key}
                          className="p-3 rounded-xl bg-bg-main border border-brand-secondary/40"
                        >
                          <span className="text-[10px] uppercase font-bold text-brand-primary/50 block mb-1">
                            {f.label || f.key}
                          </span>
                          <span className="font-semibold text-brand-primary">
                            {String(val)}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
        </div>
      )}

      {/* ── 5. Tab 2: Follow-up & Activity History ──────────────────────── */}
      {activeTab === "history" && (
        <div className="bg-brand-light border border-brand-secondary rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-brand-secondary/40">
            <div>
              <h3 className="font-bold text-brand-primary text-base">
                Follow-Up & Communications Timeline
              </h3>
              <p className="text-xs text-brand-primary/60">
                Track scheduled tasks, call completions, and recorded updates
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Filter pills */}
              <div className="flex rounded-lg border border-brand-secondary/60 p-0.5 bg-bg-main text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setHistoryFilter("all")}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                    historyFilter === "all"
                      ? "bg-purple-600 text-white"
                      : "text-brand-primary/70 hover:text-brand-primary"
                  }`}
                >
                  All ({combinedHistory.length})
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryFilter("pending")}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                    historyFilter === "pending"
                      ? "bg-purple-600 text-white"
                      : "text-brand-primary/70 hover:text-brand-primary"
                  }`}
                >
                  Pending ({combinedHistory.filter((i) => !i.done).length})
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryFilter("completed")}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                    historyFilter === "completed"
                      ? "bg-purple-600 text-white"
                      : "text-brand-primary/70 hover:text-brand-primary"
                  }`}
                >
                  Completed ({combinedHistory.filter((i) => i.done).length})
                </button>
              </div>

              <button
                type="button"
                onClick={() => setFollowupOpen(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white transition-colors cursor-pointer"
              >
                + Schedule New
              </button>
            </div>
          </div>

          {filteredHistory.length === 0 ? (
            <div className="py-12 text-center">
              <ClipboardList className="w-8 h-8 text-brand-primary/40 mx-auto mb-2" />
              <p className="text-sm font-bold text-brand-primary">
                No activity records found
              </p>
              <p className="text-xs text-brand-primary/60 mt-1 max-w-sm mx-auto">
                No follow-ups or activity logs match your current filter. Click "Schedule New" to add a task.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredHistory.map((item) => {
                const isOverdueItem =
                  !item.done && item.scheduledDate && item.scheduledDate < todayStr;
                const isTodayItem =
                  !item.done && item.scheduledDate && item.scheduledDate === todayStr;

                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-xl border transition-all ${
                      item.done
                        ? "bg-bg-main/40 border-brand-secondary/40 opacity-80"
                        : isOverdueItem
                          ? "bg-red-500/5 border-red-500/30"
                          : "bg-bg-main border-brand-secondary"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        {/* Checkbox to toggle done */}
                        <button
                          type="button"
                          onClick={() => toggleFollowupDone(item.id, !item.done)}
                          className="mt-0.5 text-brand-primary/50 hover:text-emerald-600 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-pilot-blue focus-visible:outline-none"
                          title={item.done ? "Mark as pending" : "Mark as completed"}
                          aria-label={item.done ? "Mark as pending" : "Mark as completed"}
                        >
                          {item.done ? (
                            <CheckSquare className="w-5 h-5 text-emerald-500" />
                          ) : (
                            <Square className="w-5 h-5" />
                          )}
                        </button>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-xs font-bold ${
                                item.done ? "line-through text-brand-primary/60" : "text-brand-primary"
                              }`}
                            >
                              {item.type} {item.isFollowup ? "Follow-up" : "Log"}
                            </span>

                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                item.priority === "High"
                                  ? "bg-red-500/10 text-red-500 border border-red-500/20"
                                  : item.priority === "Medium"
                                    ? "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                                    : "bg-brand-secondary/30 text-brand-primary/70 border border-brand-secondary"
                              }`}
                            >
                              {item.priority}
                            </span>

                            {isOverdueItem && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-500/10 px-1.5 py-0.2 rounded border border-red-500/20">
                                <AlertTriangle className="w-3 h-3" />
                                Overdue
                              </span>
                            )}

                            {isTodayItem && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                                <Clock className="w-3 h-3" />
                                Due Today
                              </span>
                            )}

                            {item.done && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                                <Check className="w-3 h-3" />
                                Completed
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-brand-primary/80 mt-1.5 leading-relaxed italic">
                            "{item.notes}"
                          </p>

                          <div className="flex items-center gap-4 mt-2.5 text-[11px] text-brand-primary/60 flex-wrap">
                            {item.scheduledDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                Scheduled: {formatDate(item.scheduledDate)}{" "}
                                {item.scheduledTime ? `at ${item.scheduledTime}` : ""}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <User className="w-3.5 h-3.5 text-purple-500" />
                              By: {item.author}
                            </span>
                            <span>Recorded: {formatDateTime(item.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── 6. Tab 3: Update Lead Form ──────────────────────────────────── */}
      {activeTab === "update" && (
        <div className="bg-brand-light border border-brand-secondary rounded-2xl p-5 md:p-6 shadow-xs">
          <div className="pb-4 mb-4 border-b border-brand-secondary/40">
            <h3 className="font-bold text-brand-primary text-base">
              Update Lead Status & Engagement Schedule
            </h3>
            <p className="text-xs text-brand-primary/60">
              Advance the customer across pipeline stages and log follow-up milestones
            </p>
          </div>

          <form onSubmit={handleUpdateLeadFormSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Status */}
              <div>
                <label
                  htmlFor="update-lead-status"
                  className="block text-xs font-bold text-brand-primary mb-1"
                >
                  Lead Status *
                </label>
                <select
                  id="update-lead-status"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  className="w-full bg-bg-main border border-brand-secondary rounded-xl p-2.5 text-xs md:text-sm text-brand-primary focus:outline-none focus:border-purple-500 cursor-pointer"
                >
                  <option value="New">New</option>
                  <option value="Follow Up">Follow Up</option>
                  <option value="Not Interested">Not Interested</option>
                  <option value="Not Attended">Not Attended</option>
                  <option value="Price Issue">Price Issue</option>
                  <option value="Converted">Converted</option>
                </select>
              </div>

              {/* Service */}
              <div>
                <label
                  htmlFor="update-lead-service"
                  className="block text-xs font-bold text-brand-primary mb-1"
                >
                  Service Offering
                </label>
                <select
                  id="update-lead-service"
                  value={formData.service}
                  onChange={(e) =>
                    setFormData({ ...formData, service: e.target.value })
                  }
                  className="w-full bg-bg-main border border-brand-secondary rounded-xl p-2.5 text-xs md:text-sm text-brand-primary focus:outline-none focus:border-purple-500 cursor-pointer"
                >
                  {activeServices?.map((s) => (
                    <option key={s.code || s.id} value={s.code || s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Follow Up Type (Only when Follow Up) */}
              {formData.status === "Follow Up" && (
                <div>
                  <label
                    htmlFor="update-lead-fwtype"
                    className="block text-xs font-bold text-brand-primary mb-1"
                  >
                    Follow Up Channel *
                  </label>
                  <select
                    id="update-lead-fwtype"
                    value={followupType}
                    onChange={(e) => setFollowupType(e.target.value)}
                    className="w-full bg-bg-main border border-brand-secondary rounded-xl p-2.5 text-xs md:text-sm text-brand-primary focus:outline-none focus:border-purple-500 cursor-pointer"
                  >
                    <option value="Call">Phone Call</option>
                    <option value="WhatsApp">WhatsApp Message</option>
                    <option value="Email">Email Communication</option>
                    <option value="Meeting">Direct Meeting</option>
                    <option value="Consultation">Consultation Assessment</option>
                  </select>
                </div>
              )}

              {/* Follow Up Date (Only when Follow Up) */}
              {formData.status === "Follow Up" && (
                <div>
                  <label
                    htmlFor="update-lead-fwdate"
                    className="block text-xs font-bold text-brand-primary mb-1"
                  >
                    Next Follow Up Date *
                  </label>
                  <DatePicker
                    value={formData.nextFollowUp}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        nextFollowUp: e.target.value,
                      })
                    }
                  />
                </div>
              )}

              {/* Hot Lead Checkbox */}
              <div className="sm:col-span-2 lg:col-span-3 flex items-center pt-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={Boolean(formData.importantLead)}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        importantLead: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                  />
                  <span className="text-xs md:text-sm font-bold text-brand-primary group-hover:text-purple-600 transition-colors">
                    🔥 Mark as Important Hot Lead
                  </span>
                </label>
              </div>

              {/* Comments / Notes */}
              <div className="sm:col-span-2 lg:col-span-3">
                <label
                  htmlFor="update-lead-comments"
                  className="block text-xs font-bold text-brand-primary mb-1"
                >
                  Comments / Transition Summary
                </label>
                <textarea
                  id="update-lead-comments"
                  rows={3}
                  placeholder="Summarize conversation findings, objection handling, or next milestone..."
                  value={formData.comments}
                  onChange={(e) =>
                    setFormData({ ...formData, comments: e.target.value })
                  }
                  className="w-full bg-bg-main border border-brand-secondary text-brand-primary text-xs md:text-sm rounded-xl p-3 focus:outline-none focus:border-purple-500 resize-y"
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-3 pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab("overview")}
                  className="px-4 py-2 rounded-xl border border-brand-secondary text-xs font-bold text-brand-primary/70 hover:bg-brand-secondary/40 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingUpdate}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs md:text-sm rounded-xl transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isSubmittingUpdate ? "Saving..." : "Submit Updates"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ── 7. Schedule Follow-up Modal ─────────────────────────────────── */}
      {followupOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="schedule-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
        >
          <div className="bg-bg-card border border-border-main rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-5 border-b border-border-main">
              <h3 id="schedule-modal-title" className="font-bold text-text-primary text-base">
                Schedule Follow-up Task
              </h3>
              <button
                type="button"
                onClick={() => setFollowupOpen(false)}
                className="p-1 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-pilot-blue focus-visible:outline-none"
                aria-label="Close schedule modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto">
              <form id="schedule-form" onSubmit={handleSaveFollowup} className="space-y-4">
                <div>
                  <label
                    htmlFor="fw-task-type"
                    className="block text-xs font-bold text-text-primary mb-1"
                  >
                    Engagement Channel *
                  </label>
                  <select
                    id="fw-task-type"
                    value={newFw.type}
                    onChange={(e) =>
                      setNewFw({ ...newFw, type: e.target.value })
                    }
                    className="w-full bg-bg-secondary border border-border-main text-text-primary text-xs md:text-sm rounded-xl p-2.5 focus:outline-none focus:border-pilot-blue cursor-pointer"
                  >
                    <option value="Call">Phone Call</option>
                    <option value="WhatsApp">WhatsApp Message</option>
                    <option value="Email">Email Communication</option>
                    <option value="Meeting">Direct Meeting</option>
                    <option value="Consultation">Consultation Assessment</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-text-primary mb-1">
                      Due Date *
                    </label>
                    <DatePicker
                      value={newFw.date}
                      onChange={(e) =>
                        setNewFw({ ...newFw, date: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="fw-task-time"
                      className="block text-xs font-bold text-text-primary mb-1"
                    >
                      Due Time
                    </label>
                    <input
                      id="fw-task-time"
                      type="text"
                      placeholder="e.g. 11:30 AM"
                      value={newFw.time}
                      onChange={(e) =>
                        setNewFw({ ...newFw, time: e.target.value })
                      }
                      className="w-full bg-bg-secondary border border-border-main text-text-primary text-xs md:text-sm rounded-xl p-2.5 focus:outline-none focus:border-pilot-blue"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="fw-priority"
                    className="block text-xs font-bold text-text-primary mb-1"
                  >
                    Priority Level
                  </label>
                  <select
                    id="fw-priority"
                    value={newFw.priority}
                    onChange={(e) =>
                      setNewFw({ ...newFw, priority: e.target.value })
                    }
                    className="w-full bg-bg-secondary border border-border-main text-text-primary text-xs md:text-sm rounded-xl p-2.5 focus:outline-none focus:border-pilot-blue cursor-pointer"
                  >
                    <option value="Low">Low Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="High">High Priority</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="fw-notes"
                    className="block text-xs font-bold text-text-primary mb-1"
                  >
                    Action Agenda Notes *
                  </label>
                  <textarea
                    id="fw-notes"
                    rows={3}
                    placeholder="Describe follow-up objective or questions to ask..."
                    required
                    value={newFw.notes}
                    onChange={(e) =>
                      setNewFw({ ...newFw, notes: e.target.value })
                    }
                    className="w-full bg-bg-secondary border border-border-main text-text-primary text-xs md:text-sm rounded-xl p-2.5 resize-none focus:outline-none focus:border-pilot-blue"
                  />
                </div>
              </form>
            </div>

            <div className="p-4 border-t border-border-main flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setFollowupOpen(false)}
                className="px-4 py-2 text-xs font-bold text-text-secondary hover:text-text-primary rounded-xl border border-border-main transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="schedule-form"
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                Schedule Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 8. Log Activity Modal ────────────────────────────────────────── */}
      {activityOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="activity-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
        >
          <div className="bg-bg-card border border-border-main rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-5 border-b border-border-main">
              <h3 id="activity-modal-title" className="font-bold text-text-primary text-base">
                Log Completed Interaction
              </h3>
              <button
                type="button"
                onClick={() => setActivityOpen(false)}
                className="p-1 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-pilot-blue focus-visible:outline-none"
                aria-label="Close activity log modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto">
              <form id="activity-form" onSubmit={handleSaveActivity} className="space-y-4">
                <div>
                  <label
                    htmlFor="act-type"
                    className="block text-xs font-bold text-text-primary mb-1"
                  >
                    Interaction Type *
                  </label>
                  <select
                    id="act-type"
                    value={newAct.type}
                    onChange={(e) =>
                      setNewAct({ ...newAct, type: e.target.value })
                    }
                    className="w-full bg-bg-secondary border border-border-main text-text-primary text-xs md:text-sm rounded-xl p-2.5 focus:outline-none focus:border-pilot-blue cursor-pointer"
                  >
                    <option value="Call Completed">Phone Call Completed</option>
                    <option value="WhatsApp Sent">WhatsApp Message Sent</option>
                    <option value="Email Sent">Email Sent</option>
                    <option value="Meeting Held">Meeting Held</option>
                    <option value="Site Visit">Site Visit Completed</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="act-content"
                    className="block text-xs font-bold text-text-primary mb-1"
                  >
                    Activity Summary & Notes *
                  </label>
                  <textarea
                    id="act-content"
                    rows={4}
                    placeholder="Summarize discussion points, customer feedback, or outcome..."
                    required
                    value={newAct.content}
                    onChange={(e) =>
                      setNewAct({ ...newAct, content: e.target.value })
                    }
                    className="w-full bg-bg-secondary border border-border-main text-text-primary text-xs md:text-sm rounded-xl p-2.5 resize-none focus:outline-none focus:border-pilot-blue"
                  />
                </div>
              </form>
            </div>

            <div className="p-4 border-t border-border-main flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setActivityOpen(false)}
                className="px-4 py-2 text-xs font-bold text-text-secondary hover:text-text-primary rounded-xl border border-border-main transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="activity-form"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                Save Activity Log
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 9. Call Audio Recordings Sidebar ─────────────────────────────── */}
      <RecordingsSidebar
        isOpen={isRecordingsSidebarOpen}
        onClose={() => {
          setIsRecordingsSidebarOpen(false);
          setRecordingsRepFilter(null);
        }}
        lead={currentLead}
        initialRepFilter={recordingsRepFilter}
      />
    </div>
  );
}
