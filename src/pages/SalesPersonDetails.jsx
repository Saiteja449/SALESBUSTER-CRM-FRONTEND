import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ExternalLink,
  Calendar,
  Inbox,
  Download,
  Phone,
  Mail,
  Clock,
  TrendingUp,
  BarChart2,
  Users,
  Search,
  X,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  ArrowRight,
  UserCheck,
} from "lucide-react";
import axios from "axios";
import { API_ENDPOINTS } from "../utils/constants.js";
import { useLeads } from "../context/LeadsContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import {
  getServiceColor,
  formatDate,
  formatDateTime,
  exportToCSV,
  getRepName,
  getLocalTodayDateString,
} from "../utils/helpers.js";

// Helper for call duration formatting
function formatTalkTime(seconds) {
  if (!seconds || isNaN(seconds)) return "00:00";
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) {
    return `${hrs}h ${mins.toString().padStart(2, "0")}m ${secs.toString().padStart(2, "0")}s`;
  }
  return `${mins.toString().padStart(2, "0")}m ${secs.toString().padStart(2, "0")}s`;
}

// Status badge styling
function getStatusBadgeStyle(statusName) {
  switch (statusName?.toLowerCase()) {
    case "new":
      return "bg-pilot-blue/10 text-pilot-blue border border-pilot-blue/20 font-bold";
    case "follow up":
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-bold";
    case "converted":
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-extrabold";
    case "not attended":
      return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-bold";
    case "price issue":
    case "not interested":
      return "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 font-bold";
    default:
      return "bg-bg-secondary text-text-secondary border border-border-main font-semibold";
  }
}

export default function SalesPersonDetails() {
  const { id, name } = useParams();
  const navigate = useNavigate();
  const { leads = [] } = useLeads();
  const { allUsers = [] } = useAuth();

  const paramVal = id || name;
  const decodedParam = decodeURIComponent(paramVal || "");

  // Resolve representative
  const repUser = (allUsers || []).find(
    (u) =>
      String(u.id || u._id) === decodedParam ||
      u.name?.toLowerCase() === decodedParam?.toLowerCase(),
  );

  const repId = repUser ? repUser.id || repUser._id : decodedParam;
  const repName = repUser ? repUser.name : decodedParam;

  // Local state
  const [activeTab, setActiveTab] = useState("All Leads");
  const [searchQuery, setSearchQuery] = useState("");
  const [analytics, setAnalytics] = useState([]);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(true);
  const [exportFeedback, setExportFeedback] = useState(false);

  // Fetch call analytics
  useEffect(() => {
    let isMounted = true;
    const fetchAnalytics = async () => {
      try {
        setIsLoadingAnalytics(true);
        const res = await axios.get(`${API_ENDPOINTS.ANALYTICS.BASE}/${repId}`);
        if (isMounted) {
          setAnalytics(res.data.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch analytics for rep:", error);
      } finally {
        if (isMounted) setIsLoadingAnalytics(false);
      }
    };

    if (repId) {
      fetchAnalytics();
    } else {
      setIsLoadingAnalytics(false);
    }

    return () => {
      isMounted = false;
    };
  }, [repId]);

  // Call analytics aggregates
  const todayStrDate = getLocalTodayDateString();
  const todayAnalytics = analytics.find((a) => a.date === todayStrDate) || {
    totalCalls: 0,
    talkTime: 0,
    incoming: 0,
    outgoing: 0,
    missed: 0,
    connected: 0,
    rejected: 0,
    notConnected: 0,
  };

  const weeklyAnalytics = analytics.reduce(
    (acc, curr) => ({
      totalCalls: acc.totalCalls + (curr.totalCalls || 0),
      talkTime: acc.talkTime + (curr.talkTime || 0),
      incoming: acc.incoming + (curr.incoming || 0),
      outgoing: acc.outgoing + (curr.outgoing || 0),
      missed: acc.missed + (curr.missed || 0),
      connected: acc.connected + (curr.connected || 0),
      rejected: acc.rejected + (curr.rejected || 0),
      notConnected: acc.notConnected + (curr.notConnected || 0),
    }),
    {
      totalCalls: 0,
      talkTime: 0,
      incoming: 0,
      outgoing: 0,
      missed: 0,
      connected: 0,
      rejected: 0,
      notConnected: 0,
    },
  );

  // Filter leads assigned to representative
  const repLeads = useMemo(() => {
    return leads.filter((l) => {
      const assigned = String(l.assignedTo || "");
      return (
        assigned === String(repId) ||
        (repName && assigned.toLowerCase() === repName.toLowerCase())
      );
    });
  }, [leads, repId, repName]);

  // Lead Buckets
  const newLeads = useMemo(
    () => repLeads.filter((l) => l.status?.toLowerCase() === "new"),
    [repLeads],
  );

  const todayFollowups = useMemo(() => {
    return repLeads.filter((l) => {
      if (l.status?.toLowerCase() !== "follow up") return false;
      const fDate = l.nextFollowUp?.split("T")[0];
      return !fDate || fDate <= todayStrDate;
    });
  }, [repLeads, todayStrDate]);

  const upcomingFollowups = useMemo(() => {
    return repLeads.filter((l) => {
      if (l.status?.toLowerCase() !== "follow up") return false;
      const fDate = l.nextFollowUp?.split("T")[0];
      return fDate && fDate > todayStrDate;
    });
  }, [repLeads, todayStrDate]);

  const convertedLeads = useMemo(
    () => repLeads.filter((l) => l.status?.toLowerCase() === "converted"),
    [repLeads],
  );

  const notAttendedLeads = useMemo(
    () => repLeads.filter((l) => l.status?.toLowerCase() === "not attended"),
    [repLeads],
  );

  const lostLeads = useMemo(() => {
    return repLeads.filter((l) => {
      const s = l.status?.toLowerCase();
      return s === "price issue" || s === "not interested";
    });
  }, [repLeads]);

  // Conversion metrics
  const conversionRate =
    repLeads.length > 0
      ? Math.round((convertedLeads.length / repLeads.length) * 100)
      : 0;

  // Selected tab list
  const tabFilteredLeads = useMemo(() => {
    switch (activeTab) {
      case "New Leads":
        return newLeads;
      case "Today Followups":
        return todayFollowups;
      case "Upcoming Followups":
        return upcomingFollowups;
      case "Converted Leads":
        return convertedLeads;
      case "Not Attended":
        return notAttendedLeads;
      case "Lost / Dropped":
        return lostLeads;
      default:
        return repLeads;
    }
  }, [
    activeTab,
    newLeads,
    todayFollowups,
    upcomingFollowups,
    convertedLeads,
    notAttendedLeads,
    lostLeads,
    repLeads,
  ]);

  // Final search filtered leads
  const displayedLeads = useMemo(() => {
    if (!searchQuery.trim()) return tabFilteredLeads;
    const q = searchQuery.toLowerCase().trim();
    return tabFilteredLeads.filter((lead) => {
      const nameMatch = (lead.name || "").toLowerCase().includes(q);
      const phoneMatch = (lead.phone || "").toLowerCase().includes(q);
      const emailMatch = (lead.email || "").toLowerCase().includes(q);
      const serviceMatch = (lead.service || "").toLowerCase().includes(q);
      return nameMatch || phoneMatch || emailMatch || serviceMatch;
    });
  }, [tabFilteredLeads, searchQuery]);

  // Handle Export CSV
  const handleExport = () => {
    const formattedData = (displayedLeads || []).map((lead) => ({
      "Lead Name": lead.name || "N/A",
      Phone: lead.phone || "N/A",
      Email: lead.email || "N/A",
      Service: lead.service || "N/A",
      Status: lead.status || "N/A",
      Source: lead.source || "N/A",
      "Sales Representative": repName || getRepName(lead.assignedTo, allUsers),
      "Enquired On": formatDateTime(lead.joinedAt || lead.createdAt),
      "Next Follow Up": formatDate(lead.nextFollowUp),
      "Deal Value": lead.dealValue ?? lead.value ?? 0,
      Notes: lead.notes || "",
    }));

    exportToCSV(
      formattedData,
      `${(repName || "sales_rep").replace(/\s+/g, "_")}_leads.csv`,
    );

    setExportFeedback(true);
    setTimeout(() => setExportFeedback(false), 3000);
  };

  // If rep doesn't exist and has no leads
  if (!repUser && repLeads.length === 0 && !isLoadingAnalytics) {
    return (
      <div className="w-full max-w-5xl mx-auto min-w-0 p-4 sm:p-6 lg:p-8 space-y-6">
        <button
          type="button"
          onClick={() => navigate("/performance")}
          className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors text-xs font-bold"
        >
          <ArrowLeft size={16} />
          <span>Back to Team Performance</span>
        </button>

        <div className="bg-bg-card border border-border-main rounded-3xl p-10 sm:p-14 text-center shadow-xs space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
            <AlertTriangle size={32} />
          </div>
          <h2 className="text-lg font-black text-text-primary">
            Sales Representative Not Found
          </h2>
          <p className="text-xs text-text-secondary max-w-md mx-auto leading-relaxed">
            We couldn't locate any representative matching identifier "
            <strong>{decodedParam}</strong>" in your organization.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => navigate("/performance")}
              className="px-5 py-2.5 rounded-xl bg-pilot-blue hover:bg-pilot-blue-hover text-white text-xs font-bold transition-all shadow-xs inline-flex items-center gap-2"
            >
              <Users size={15} />
              <span>Return to Sales Leaderboard</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto min-w-0 p-4 sm:p-6 space-y-6">
      {/* ── Top Navigation Link ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => navigate("/performance")}
          className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors text-xs font-bold p-1 rounded-lg focus-visible:ring-2 focus-visible:ring-pilot-blue"
        >
          <ArrowLeft size={16} />
          <span>Back to Team Performance</span>
        </button>

        <span className="text-[11px] font-bold text-text-secondary">
          Member Profile & Pipeline
        </span>
      </div>

      {/* ── 1. Representative Profile Summary Card ─────────────────────────── */}
      <div className="bg-bg-card border border-border-main rounded-3xl p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          {/* Avatar and Identity */}
          <div className="flex items-center gap-4 sm:gap-5 min-w-0">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-pilot-blue to-blue-700 text-white flex items-center justify-center font-black text-2xl shadow-sm shrink-0">
              {(repName || "S").substring(0, 1).toUpperCase()}
            </div>

            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-text-primary tracking-tight truncate">
                  {repName}
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active
                </span>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-pilot-blue/10 text-pilot-blue border border-pilot-blue/20 shrink-0">
                  {repUser?.role || "Sales Representative"}
                </span>
              </div>

              {/* Direct Contact Links */}
              <div className="flex items-center gap-3 text-xs text-text-secondary flex-wrap">
                {repUser?.phone ? (
                  <a
                    href={`tel:${repUser.phone}`}
                    className="inline-flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                    title="Click to call representative"
                  >
                    <Phone size={13} className="shrink-0" />
                    <span>{repUser.phone}</span>
                  </a>
                ) : (
                  <span className="text-text-secondary/70">No phone registered</span>
                )}

                {repUser?.email && (
                  <>
                    <span className="text-border-main">•</span>
                    <a
                      href={`mailto:${repUser.email}`}
                      className="inline-flex items-center gap-1.5 hover:text-text-primary hover:underline truncate"
                      title="Click to email representative"
                    >
                      <Mail size={13} className="shrink-0" />
                      <span className="truncate">{repUser.email}</span>
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap w-full lg:w-auto">
            <button
              type="button"
              onClick={() => navigate(`/salesperson/${repId}/reports`)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-pilot-blue hover:bg-pilot-blue-hover text-white text-xs font-bold transition-all shadow-md shadow-pilot-blue/20 cursor-pointer focus-visible:ring-2 focus-visible:ring-pilot-blue"
              title="View daily call breakdown, talk time charts, and timeline logs"
            >
              <BarChart2 size={15} className="shrink-0" />
              <span>Call Analytics & Reports</span>
            </button>

            <button
              type="button"
              onClick={handleExport}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-bg-secondary hover:bg-bg-secondary/70 border border-border-main text-text-primary text-xs font-bold transition-all shadow-2xs cursor-pointer focus-visible:ring-2 focus-visible:ring-pilot-blue"
              title="Download currently filtered assigned leads as CSV"
            >
              <Download size={15} className="shrink-0" />
              <span>{exportFeedback ? "Exported!" : "Export Leads"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. Performance & Call Activity KPI Grid ─────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Today's Calls */}
        <div className="bg-bg-card border border-border-main rounded-2xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-text-secondary">
            <span className="uppercase tracking-wider text-[10px]">Today's Calls</span>
            <div className="w-8 h-8 rounded-xl bg-pilot-blue/10 text-pilot-blue flex items-center justify-center">
              <PhoneCall size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-text-primary">
              {todayAnalytics.totalCalls}
            </span>
            <span className="text-xs text-text-secondary font-medium">calls logged</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-text-secondary pt-1 border-t border-border-main/50">
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
              {todayAnalytics.connected} connected
            </span>
            <span>•</span>
            <span className="text-rose-500 font-bold">{todayAnalytics.missed} missed</span>
          </div>
        </div>

        {/* Metric 2: Today's Talk Time */}
        <div className="bg-bg-card border border-border-main rounded-2xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-text-secondary">
            <span className="uppercase tracking-wider text-[10px]">Talk Time (Today)</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Clock size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-text-primary">
              {formatTalkTime(todayAnalytics.talkTime)}
            </span>
          </div>
          <div className="text-[11px] text-text-secondary pt-1 border-t border-border-main/50 truncate">
            Total logged:{" "}
            <strong className="text-text-primary font-bold">
              {formatTalkTime(weeklyAnalytics.talkTime)}
            </strong>
          </div>
        </div>

        {/* Metric 3: Active Assigned Leads */}
        <div className="bg-bg-card border border-border-main rounded-2xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-text-secondary">
            <span className="uppercase tracking-wider text-[10px]">Pipeline Assigned</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Users size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-text-primary">{repLeads.length}</span>
            <span className="text-xs text-text-secondary font-medium">total leads</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-text-secondary pt-1 border-t border-border-main/50">
            <span className="text-pilot-blue font-bold">{newLeads.length} new</span>
            <span>•</span>
            <span className="text-amber-600 dark:text-amber-400 font-bold">
              {todayFollowups.length} follow-ups due
            </span>
          </div>
        </div>

        {/* Metric 4: Win / Conversion Rate */}
        <div className="bg-bg-card border border-border-main rounded-2xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-text-secondary">
            <span className="uppercase tracking-wider text-[10px]">Win / Conversion Rate</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {conversionRate}%
            </span>
            <span className="text-xs text-text-secondary font-medium">win rate</span>
          </div>
          <div className="text-[11px] text-text-secondary pt-1 border-t border-border-main/50">
            <strong className="text-emerald-600 dark:text-emerald-400 font-bold">
              {convertedLeads.length}
            </strong>{" "}
            converted of {repLeads.length} assigned
          </div>
        </div>
      </div>

      {/* ── 3. Leads Repository Section with Search & Filter Tabs ─────────── */}
      <div className="bg-bg-card border border-border-main rounded-3xl p-5 sm:p-7 shadow-xs space-y-5">
        {/* Section Header & Search */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-border-main">
          <div>
            <h2 className="text-base font-black text-text-primary tracking-tight">
              Assigned Leads Repository
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Inspect leads assigned to {repName}, track next follow-up dates, and check deal outcomes.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search leads by name, phone, service…"
              className="w-full bg-bg-secondary/40 border border-border-main text-text-primary text-xs rounded-xl pl-9 pr-9 py-2 outline-none focus:border-pilot-blue focus:ring-1 focus:ring-pilot-blue transition-all"
              aria-label="Search representative leads"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-secondary hover:text-text-primary rounded-lg transition-colors cursor-pointer"
                aria-label="Clear search"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div
          className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none"
          role="tablist"
          aria-label="Filter leads by stage"
        >
          {[
            { name: "All Leads", count: repLeads.length },
            { name: "New Leads", count: newLeads.length },
            { name: "Today Followups", count: todayFollowups.length },
            { name: "Upcoming Followups", count: upcomingFollowups.length },
            { name: "Converted Leads", count: convertedLeads.length },
            { name: "Not Attended", count: notAttendedLeads.length },
            { name: "Lost / Dropped", count: lostLeads.length },
          ].map((tab) => {
            const isActive = activeTab === tab.name;
            return (
              <button
                key={tab.name}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.name)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pilot-blue ${
                  isActive
                    ? "bg-pilot-blue text-white shadow-xs"
                    : "bg-bg-secondary/50 text-text-secondary hover:text-text-primary hover:bg-bg-secondary border border-border-main/60"
                }`}
              >
                <span>{tab.name}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono font-bold ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-bg-card text-text-secondary border border-border-main/60"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── 4. Leads Presentation (Desktop Table + Mobile Cards) ─────────── */}
        {displayedLeads.length === 0 ? (
          <div className="p-10 sm:p-14 text-center rounded-2xl bg-bg-secondary/20 border border-border-main/60 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-bg-secondary text-text-secondary mx-auto flex items-center justify-center">
              <Inbox size={22} />
            </div>
            <h3 className="text-sm font-black text-text-primary">
              No leads found in this view
            </h3>
            <p className="text-xs text-text-secondary max-w-sm mx-auto leading-relaxed">
              {searchQuery
                ? `No leads matched your search query "${searchQuery}".`
                : `There are currently no leads under "${activeTab}" for this representative.`}
            </p>
            {(searchQuery || activeTab !== "All Leads") && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setActiveTab("All Leads");
                }}
                className="px-4 py-2 rounded-xl bg-bg-secondary hover:bg-bg-secondary/70 border border-border-main text-text-primary text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
              >
                <RotateCcw size={13} />
                <span>Reset View to All Leads</span>
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table View (>= 768px) */}
            <div className="hidden md:block overflow-hidden rounded-2xl border border-border-main">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[750px]">
                  <thead className="bg-bg-secondary/50 border-b border-border-main text-[11px] font-bold text-text-secondary uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Client / Organization</th>
                      <th className="px-4 py-3">Phone & Contact</th>
                      <th className="px-4 py-3 text-center">Calls by this Rep</th>
                      <th className="px-4 py-3">Service</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Follow-up / Enquired</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-main text-xs">
                    {displayedLeads.map((lead) => {
                      const repCallsCount = (() => {
                        if (Array.isArray(lead.repCallCounts)) {
                          const entry = lead.repCallCounts.find((r) => {
                            if (repId && r.salespersonId) {
                              return (
                                String(r.salespersonId).toLowerCase() ===
                                String(repId).toLowerCase()
                              );
                            }
                            if (repUser?.name && r.salespersonName) {
                              return (
                                r.salespersonName.toLowerCase() ===
                                repUser.name.toLowerCase()
                              );
                            }
                            return false;
                          });
                          if (entry) return entry.count || 0;
                        }
                        if (Array.isArray(lead.recordings)) {
                          const recCount = lead.recordings.filter((r) => {
                            if (repId && r.salespersonId) {
                              return (
                                String(r.salespersonId).toLowerCase() ===
                                String(repId).toLowerCase()
                              );
                            }
                            if (repUser?.name && r.salespersonName) {
                              return (
                                r.salespersonName.toLowerCase() ===
                                repUser.name.toLowerCase()
                              );
                            }
                            return false;
                          }).length;
                          if (recCount > 0) return recCount;
                        }
                        return 0;
                      })();

                      return (
                      <tr
                        key={lead.id}
                        className="hover:bg-bg-secondary/40 transition-colors group"
                      >
                        {/* Client Name */}
                        <td className="px-4 py-3.5">
                          <button
                            type="button"
                            onClick={() => navigate(`/lead-details/${lead.id}`)}
                            className="font-bold text-text-primary hover:text-pilot-blue text-left transition-colors cursor-pointer group-hover:underline block"
                          >
                            {lead.name || "Unnamed Client"}
                          </button>
                          {lead.company && (
                            <span className="text-[11px] text-text-secondary block">
                              {lead.company}
                            </span>
                          )}
                        </td>

                        {/* Phone & Email */}
                        <td className="px-4 py-3.5">
                          {lead.phone ? (
                            <a
                              href={`tel:${lead.phone}`}
                              className="font-medium text-text-primary hover:text-pilot-blue flex items-center gap-1.5"
                            >
                              <Phone size={12} className="text-text-secondary shrink-0" />
                              <span>{lead.phone}</span>
                            </a>
                          ) : (
                            <span className="text-text-secondary">—</span>
                          )}
                        </td>

                        {/* Calls by this Rep */}
                        <td className="px-4 py-3.5 text-center">
                          {repCallsCount > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                              <PhoneCall size={11} />
                              <span>
                                {repCallsCount}{" "}
                                {repCallsCount === 1 ? "call" : "calls"}
                              </span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium text-text-secondary/60 bg-bg-secondary/40 border border-border-main/50">
                              0 calls
                            </span>
                          )}
                        </td>

                        {/* Service Offering */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{
                                backgroundColor: getServiceColor(lead.service),
                              }}
                            />
                            <span className="font-semibold text-text-primary truncate max-w-[150px]">
                              {lead.service || "General"}
                            </span>
                          </div>
                        </td>

                        {/* Status Badge */}
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] ${getStatusBadgeStyle(
                              lead.status,
                            )}`}
                          >
                            {lead.status || "New"}
                          </span>
                        </td>

                        {/* Follow-up Date */}
                        <td className="px-4 py-3.5 text-text-secondary">
                          {lead.nextFollowUp ? (
                            <span className="flex items-center gap-1 font-semibold text-text-primary">
                              <Calendar size={12} className="text-amber-500 shrink-0" />
                              <span>{formatDate(lead.nextFollowUp)}</span>
                            </span>
                          ) : (
                            <span>{formatDate(lead.joinedAt || lead.createdAt)}</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => navigate(`/lead-details/${lead.id}`)}
                            className="p-1.5 rounded-lg bg-bg-secondary hover:bg-pilot-blue hover:text-white text-text-secondary transition-all cursor-pointer inline-flex items-center justify-center shadow-2xs"
                            title="Open lead workspace details"
                            aria-label={`Open details for ${lead.name || "lead"}`}
                          >
                            <ExternalLink size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards View (< 768px) */}
            <div className="md:hidden space-y-3">
              {displayedLeads.map((lead) => (
                <div
                  key={lead.id}
                  onClick={() => navigate(`/lead-details/${lead.id}`)}
                  className="p-4 rounded-2xl bg-bg-card border border-border-main hover:border-pilot-blue/40 shadow-xs transition-all cursor-pointer space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-text-primary">
                        {lead.name || "Unnamed Client"}
                      </h4>
                      {lead.company && (
                        <p className="text-[11px] text-text-secondary">{lead.company}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {(() => {
                        const count =
                          lead.repCallCounts?.find(
                            (r) =>
                              (repId &&
                                String(r.salespersonId).toLowerCase() ===
                                  String(repId).toLowerCase()) ||
                              (repUser?.name &&
                                r.salespersonName?.toLowerCase() ===
                                  repUser.name.toLowerCase()),
                          )?.count || 0;
                        return count > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                            <PhoneCall size={9} />
                            {count} {count === 1 ? "call" : "calls"}
                          </span>
                        ) : null;
                      })()}
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] shrink-0 ${getStatusBadgeStyle(
                          lead.status,
                        )}`}
                      >
                        {lead.status || "New"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-text-secondary pt-2 border-t border-border-main/50">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: getServiceColor(lead.service) }}
                      />
                      <span className="font-medium text-text-primary">
                        {lead.service || "General"}
                      </span>
                    </div>

                    {lead.phone && (
                      <a
                        href={`tel:${lead.phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold"
                      >
                        <Phone size={12} />
                        <span>{lead.phone}</span>
                      </a>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-text-secondary pt-1">
                    <span>
                      {lead.nextFollowUp
                        ? `Next: ${formatDate(lead.nextFollowUp)}`
                        : `Enquired: ${formatDate(lead.joinedAt || lead.createdAt)}`}
                    </span>
                    <span className="text-pilot-blue font-bold flex items-center gap-1">
                      <span>View</span>
                      <ArrowRight size={12} />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
