import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useLeads } from "../context/LeadsContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import {
  formatDate,
  getRepName,
  getLocalTodayDateString,
} from "../utils/helpers.js";
import {
  Search,
  Bot,
  Calendar,
  User,
  Phone,
  Mail,
  ExternalLink,
  MessageCircle,
  Sparkles,
  ClipboardList,
  CheckCircle,
  AlertCircle,
  Clock,
  CalendarDays,
  X,
  RefreshCw,
  Copy,
  Check,
  ArrowLeft,
  Filter,
  CheckCircle2,
  ShieldAlert,
  Flame,
} from "lucide-react";

// Helper to sanitize display text and prevent literal 'null', 'undefined', etc.
const cleanDisplay = (val, fallback = "") => {
  if (val === null || val === undefined) return fallback;
  const s = String(val).trim();
  if (
    !s ||
    s.toLowerCase() === "null" ||
    s.toLowerCase() === "undefined" ||
    s.toLowerCase() === "none" ||
    s.toLowerCase() === "n/a"
  ) {
    return fallback;
  }
  return s;
};

// Calculate due date urgency and status
const getFollowupDueInfo = (followup) => {
  if (followup.done) {
    return {
      type: "completed",
      label: "Completed",
      shortLabel: "Done",
      colorClass:
        "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
      badgeColor: "bg-emerald-500",
      icon: CheckCircle2,
      priorityRank: 5,
    };
  }

  const rawDate = followup.date || followup.createdAt;
  if (!rawDate) {
    return {
      type: "pending",
      label: "Pending",
      shortLabel: "Pending",
      colorClass:
        "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/25",
      badgeColor: "bg-slate-400",
      icon: Clock,
      priorityRank: 4,
    };
  }

  const now = new Date();
  const todayStr = getLocalTodayDateString(now);

  const targetDate = new Date(rawDate);
  if (isNaN(targetDate.getTime())) {
    return {
      type: "pending",
      label: "Pending",
      shortLabel: "Pending",
      colorClass:
        "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/25",
      badgeColor: "bg-slate-400",
      icon: Clock,
      priorityRank: 4,
    };
  }

  const targetStr = getLocalTodayDateString(targetDate);

  if (targetStr < todayStr) {
    const diffTime =
      new Date(todayStr).getTime() - new Date(targetStr).getTime();
    const diffDays = Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)));
    return {
      type: "overdue",
      label: diffDays === 1 ? "Overdue (1 day)" : `Overdue (${diffDays} days)`,
      shortLabel: "Overdue",
      colorClass:
        "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
      badgeColor: "bg-rose-500",
      icon: AlertCircle,
      priorityRank: 1,
    };
  }

  if (targetStr === todayStr) {
    return {
      type: "today",
      label: "Due Today",
      shortLabel: "Due Today",
      colorClass:
        "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
      badgeColor: "bg-amber-500",
      icon: Clock,
      priorityRank: 2,
    };
  }

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const tomorrowStr = getLocalTodayDateString(tomorrow);
  if (targetStr === tomorrowStr) {
    return {
      type: "tomorrow",
      label: "Due Tomorrow",
      shortLabel: "Tomorrow",
      colorClass:
        "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30",
      badgeColor: "bg-sky-500",
      icon: Calendar,
      priorityRank: 3,
    };
  }

  return {
    type: "upcoming",
    label: "Upcoming",
    shortLabel: "Upcoming",
    colorClass:
      "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/25",
    badgeColor: "bg-purple-500",
    icon: CalendarDays,
    priorityRank: 4,
  };
};

export default function AIFollowUps() {
  const { leads, followups, toggleFollowupDone, refreshData } = useLeads();
  const { allUsers, currentUser, isSalesPerson } = useAuth();
  const navigate = useNavigate();

  // Search & Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all_active"); // "all_active", "overdue", "today", "upcoming", "completed"
  const [priorityFilter, setPriorityFilter] = useState("all"); // "all", "High", "Medium", "Low"
  const [repFilter, setRepFilter] = useState("all"); // "all", "my_assigned", or specific rep id
  const [selectedFollowupId, setSelectedFollowupId] = useState(null);
  const [resolvingId, setResolvingId] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);
  const [showMobileDetail, setShowMobileDetail] = useState(false);

  // Manual refresh with animation feedback
  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      if (refreshData) {
        await refreshData();
      }
    } catch (err) {
      console.error("Error refreshing follow-ups:", err);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  // Copy to clipboard helper
  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey((prev) => (prev === key ? null : prev));
    }, 2000);
  };

  // Toggle Handled / Reopen status
  const handleToggleHandled = async (followupId, leadId, currentDone) => {
    if (!followupId) return;
    setResolvingId(followupId);
    try {
      if (toggleFollowupDone) {
        await toggleFollowupDone(followupId);
      }
      // When marking as handled (not reopening), also mark any duplicate pending AI followups for this lead
      if (!currentDone && leadId) {
        const leadIdStr = String(leadId);
        followups.forEach((f) => {
          const fid = f.id || f._id;
          if (
            String(f.leadId) === leadIdStr &&
            fid !== followupId &&
            !f.done &&
            f.author === "AI Agent"
          ) {
            toggleFollowupDone(fid);
          }
        });
      }
    } catch (err) {
      console.error("Error toggling follow-up status:", err);
    } finally {
      setResolvingId(null);
    }
  };

  // Process all AI-generated follow-ups with lead details & rep attribution
  const allAiFollowups = useMemo(() => {
    const aiItems = followups.filter((f) => f.author === "AI Agent");

    // Separate active vs completed
    const active = aiItems.filter((f) => !f.done);
    const completed = aiItems.filter((f) => f.done);

    // Deduplicate active items to 1 immediate action per lead
    const seenActiveLeads = new Set();
    const uniqueActive = [];
    // Sort by latest created/scheduled first for deduplication selection
    const sortedActive = [...active].sort(
      (a, b) =>
        new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date),
    );
    for (const f of sortedActive) {
      const key = String(f.leadId);
      if (!seenActiveLeads.has(key)) {
        seenActiveLeads.add(key);
        uniqueActive.push(f);
      }
    }

    // Merge active & completed, pairing with lead details
    const combined = [...uniqueActive, ...completed]
      .map((f) => {
        const lead = leads.find((l) => l.id === f.leadId || l._id === f.leadId);
        const dueInfo = getFollowupDueInfo(f);
        const repName = lead
          ? getRepName(lead.assignedTo, allUsers)
          : "Unassigned";

        return {
          ...f,
          id: f.id || f._id,
          lead,
          dueInfo,
          repName,
        };
      })
      .filter((f) => f.lead); // Ensure associated lead exists

    // Sort: Overdue first (rank 1), Due Today (rank 2), Due Tomorrow (rank 3), Upcoming (rank 4), Completed (rank 5)
    return combined.sort((a, b) => {
      if (a.dueInfo.priorityRank !== b.dueInfo.priorityRank) {
        return a.dueInfo.priorityRank - b.dueInfo.priorityRank;
      }
      // If same due urgency, prioritize High > Medium > Low
      const priorityOrder = { High: 1, Medium: 2, Low: 3 };
      const pA = priorityOrder[a.priority] || 2;
      const pB = priorityOrder[b.priority] || 2;
      if (pA !== pB) return pA - pB;

      // Otherwise sort by date
      return new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date);
    });
  }, [followups, leads, allUsers]);

  // Counts for tabs & summary
  const metrics = useMemo(() => {
    let activeCount = 0;
    let overdueCount = 0;
    let todayCount = 0;
    let upcomingCount = 0;
    let completedCount = 0;

    for (const f of allAiFollowups) {
      if (f.done) {
        completedCount++;
      } else {
        activeCount++;
        if (f.dueInfo.type === "overdue") overdueCount++;
        else if (f.dueInfo.type === "today") todayCount++;
        else upcomingCount++;
      }
    }

    return {
      activeCount,
      overdueCount,
      todayCount,
      upcomingCount,
      completedCount,
      totalCount: allAiFollowups.length,
    };
  }, [allAiFollowups]);

  // Filtered dataset
  const filteredData = useMemo(() => {
    return allAiFollowups.filter((f) => {
      // 1. Status Filter
      if (statusFilter === "all_active" && f.done) return false;
      if (
        statusFilter === "overdue" &&
        (f.done || f.dueInfo.type !== "overdue")
      )
        return false;
      if (statusFilter === "today" && (f.done || f.dueInfo.type !== "today"))
        return false;
      if (
        statusFilter === "upcoming" &&
        (f.done ||
          (f.dueInfo.type !== "tomorrow" && f.dueInfo.type !== "upcoming"))
      )
        return false;
      if (statusFilter === "completed" && !f.done) return false;

      // 2. Priority Filter
      if (priorityFilter !== "all" && f.priority !== priorityFilter)
        return false;

      // 3. Representative Filter
      if (repFilter === "my_assigned") {
        const currentId = currentUser?.id || currentUser?._id;
        const currentName = currentUser?.name?.toLowerCase();
        const leadAssigned = String(f.lead?.assignedTo || "");
        const isAssigned =
          leadAssigned === String(currentId) ||
          (currentName && leadAssigned.toLowerCase() === currentName);
        if (!isAssigned) return false;
      } else if (repFilter !== "all") {
        const leadAssigned = String(f.lead?.assignedTo || "");
        if (leadAssigned !== String(repFilter)) return false;
      }

      // 4. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = f.lead?.name?.toLowerCase().includes(q);
        const phoneMatch = f.lead?.phone && f.lead.phone.includes(q);
        const emailMatch = f.lead?.email?.toLowerCase().includes(q);
        const serviceMatch = f.lead?.service?.toLowerCase().includes(q);
        const notesMatch = f.notes?.toLowerCase().includes(q);
        const repMatch = f.repName?.toLowerCase().includes(q);
        const cityMatch = (f.lead?.city || f.lead?.aiQualification?.city)
          ?.toLowerCase()
          .includes(q);

        if (
          !nameMatch &&
          !phoneMatch &&
          !emailMatch &&
          !serviceMatch &&
          !notesMatch &&
          !repMatch &&
          !cityMatch
        ) {
          return false;
        }
      }

      return true;
    });
  }, [
    allAiFollowups,
    statusFilter,
    priorityFilter,
    repFilter,
    searchQuery,
    currentUser,
  ]);

  // Selected item
  const selectedData = useMemo(() => {
    if (!selectedFollowupId) return null;
    return filteredData.find((f) => f.id === selectedFollowupId) || null;
  }, [selectedFollowupId, filteredData]);

  // Keep selection synchronized with filtered data
  useEffect(() => {
    if (filteredData.length === 0) {
      setSelectedFollowupId(null);
    } else if (
      !selectedFollowupId ||
      !filteredData.some((f) => f.id === selectedFollowupId)
    ) {
      setSelectedFollowupId(filteredData[0].id);
    }
  }, [filteredData, selectedFollowupId]);

  // Reset all filters helper
  const handleClearFilters = useCallback(() => {
    setSearchQuery("");
    setStatusFilter("all_active");
    setPriorityFilter("all");
    setRepFilter("all");
  }, []);

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    statusFilter !== "all_active" ||
    priorityFilter !== "all" ||
    repFilter !== "all";

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-65px)] overflow-hidden bg-bg-main text-brand-primary">
      {/* ── Left Sidebar: Search, Filters & Action List ────────────────── */}
      <aside
        aria-label="Immediate follow-ups list"
        className={`w-full md:w-80  border-r border-brand-secondary bg-brand-light flex flex-col shrink-0 transition-all ${
          showMobileDetail ? "hidden md:flex" : "flex"
        }`}
      >
        {/* Top Header & Search Bar */}
        <div className="p-3.5 sm:p-4 border-b border-brand-secondary space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold text-brand-primary leading-tight flex items-center gap-1.5">
                  AI Follow-ups
                  {metrics.activeCount > 0 && (
                    <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold rounded-full bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/30">
                      {metrics.activeCount}
                    </span>
                  )}
                </h1>
                <p className="text-[11px] text-brand-primary/60">
                  {metrics.overdueCount > 0 ? (
                    <span className="text-rose-600 dark:text-rose-400 font-semibold">
                      {metrics.overdueCount} overdue action
                      {metrics.overdueCount > 1 ? "s" : ""} need attention
                    </span>
                  ) : (
                    "Smart customer callbacks & reminders"
                  )}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              title="Refresh follow-ups list"
              aria-label="Refresh follow-ups list"
              className="p-2 rounded-lg text-brand-primary/70 hover:text-brand-primary hover:bg-brand-secondary/40 transition-colors cursor-pointer disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:outline-none"
            >
              <RefreshCw
                className={`w-4 h-4 ${isRefreshing ? "animate-spin text-teal-500" : ""}`}
              />
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-primary/50"
              size={16}
              aria-hidden="true"
            />
            <input
              type="text"
              id="followup-search-input"
              placeholder="Search by lead, service, phone, note..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-bg-main border border-brand-secondary text-brand-primary text-xs sm:text-sm rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 pl-9 pr-8 py-2 outline-none transition-all placeholder:text-brand-primary/40"
              aria-label="Search leads or follow-up notes"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search query"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-primary/40 hover:text-brand-primary p-0.5 rounded cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Status Filter Tabs */}
          <div
            role="tablist"
            aria-label="Follow-up status tabs"
            className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none text-xs"
          >
            <button
              type="button"
              role="tab"
              aria-selected={statusFilter === "all_active"}
              onClick={() => setStatusFilter("all_active")}
              className={`px-2.5 py-1 rounded-lg font-semibold shrink-0 transition-all cursor-pointer ${
                statusFilter === "all_active"
                  ? "bg-teal-500 text-white shadow-xs"
                  : "bg-bg-main text-brand-primary/70 hover:bg-brand-secondary/40 hover:text-brand-primary"
              }`}
            >
              Active ({metrics.activeCount})
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={statusFilter === "overdue"}
              onClick={() => setStatusFilter("overdue")}
              className={`px-2.5 py-1 rounded-lg font-semibold shrink-0 transition-all flex items-center gap-1 cursor-pointer ${
                statusFilter === "overdue"
                  ? "bg-rose-600 text-white shadow-xs"
                  : metrics.overdueCount > 0
                    ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20"
                    : "bg-bg-main text-brand-primary/70 hover:bg-brand-secondary/40"
              }`}
            >
              <AlertCircle size={12} />
              Overdue ({metrics.overdueCount})
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={statusFilter === "today"}
              onClick={() => setStatusFilter("today")}
              className={`px-2.5 py-1 rounded-lg font-semibold shrink-0 transition-all flex items-center gap-1 cursor-pointer ${
                statusFilter === "today"
                  ? "bg-amber-500 text-white shadow-xs"
                  : "bg-bg-main text-brand-primary/70 hover:bg-brand-secondary/40"
              }`}
            >
              <Clock size={12} />
              Today ({metrics.todayCount})
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={statusFilter === "upcoming"}
              onClick={() => setStatusFilter("upcoming")}
              className={`px-2.5 py-1 rounded-lg font-semibold shrink-0 transition-all cursor-pointer ${
                statusFilter === "upcoming"
                  ? "bg-purple-600 text-white shadow-xs"
                  : "bg-bg-main text-brand-primary/70 hover:bg-brand-secondary/40"
              }`}
            >
              Upcoming ({metrics.upcomingCount})
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={statusFilter === "completed"}
              onClick={() => setStatusFilter("completed")}
              className={`px-2.5 py-1 rounded-lg font-semibold shrink-0 transition-all flex items-center gap-1 cursor-pointer ${
                statusFilter === "completed"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-bg-main text-brand-primary/70 hover:bg-brand-secondary/40"
              }`}
            >
              <CheckCircle2 size={12} />
              Done ({metrics.completedCount})
            </button>
          </div>

          {/* Secondary Filter Row: Priority & Representative */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-brand-secondary/50 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-brand-primary/50">
                Priority:
              </span>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                aria-label="Filter by priority level"
                className="bg-bg-main border border-brand-secondary rounded-lg px-2 py-0.5 text-xs text-brand-primary font-medium focus:ring-1 focus:ring-teal-500 outline-none cursor-pointer"
              >
                <option value="all">All Priorities</option>
                <option value="High">High Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="Low">Low Priority</option>
              </select>
            </div>

            {/* Rep filter: My Assigned vs All */}
            <div className="flex items-center gap-1">
              {isSalesPerson ? (
                <button
                  type="button"
                  onClick={() =>
                    setRepFilter((prev) =>
                      prev === "my_assigned" ? "all" : "my_assigned",
                    )
                  }
                  className={`px-2 py-0.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                    repFilter === "my_assigned"
                      ? "bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30"
                      : "bg-bg-main text-brand-primary/60 border-brand-secondary hover:text-brand-primary"
                  }`}
                >
                  My Assigned
                </button>
              ) : (
                <select
                  value={repFilter}
                  onChange={(e) => setRepFilter(e.target.value)}
                  aria-label="Filter by assigned representative"
                  className="bg-bg-main border border-brand-secondary rounded-lg px-2 py-0.5 text-xs text-brand-primary font-medium focus:ring-1 focus:ring-teal-500 outline-none cursor-pointer max-w-[130px] truncate"
                >
                  <option value="all">All Reps</option>
                  <option value="my_assigned">Assigned to Me</option>
                  {allUsers?.map((u) => (
                    <option key={u.id || u._id} value={u.id || u._id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Active Filter Indicator & Clear Button */}
          {hasActiveFilters && (
            <div className="flex items-center justify-between gap-2 pt-1 text-[11px] text-brand-primary/60">
              <span>
                Showing <strong>{filteredData.length}</strong> of{" "}
                {allAiFollowups.length} follow-ups
              </span>
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-teal-600 dark:text-teal-400 hover:underline font-semibold cursor-pointer"
              >
                Reset filters
              </button>
            </div>
          )}
        </div>

        {/* Action Items List */}
        <div
          role="feed"
          aria-label="Follow-up cards"
          className="flex-1 overflow-y-auto p-2.5 sm:p-3 space-y-2"
        >
          {filteredData.length === 0 ? (
            <div className="p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-brand-secondary/40 text-brand-primary/40 flex items-center justify-center mx-auto">
                <Search size={22} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-brand-primary">
                  {hasActiveFilters
                    ? "No matching follow-ups"
                    : "No AI follow-ups found"}
                </h3>
                <p className="text-xs text-brand-primary/60 mt-1 max-w-[220px] mx-auto">
                  {hasActiveFilters
                    ? "Try adjusting your search query or reset your filters."
                    : "When leads request assistance or scheduled callbacks on WhatsApp, immediate actions will appear here."}
                </p>
              </div>
              {hasActiveFilters ? (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-500 text-white shadow-xs cursor-pointer hover:bg-teal-600 transition-colors"
                >
                  Reset all filters
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleRefresh}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-bg-main border border-brand-secondary text-brand-primary hover:bg-brand-secondary/30 transition-colors cursor-pointer"
                >
                  <RefreshCw size={12} /> Check for new actions
                </button>
              )}
            </div>
          ) : (
            filteredData.map((f) => {
              const isSelected = selectedFollowupId === f.id;
              const DueIcon = f.dueInfo.icon;
              const leadName = f.lead?.name || "Unnamed Lead";
              const serviceText = cleanDisplay(
                f.lead?.service || f.lead?.services?.[0],
                "General Inquiry",
              );

              return (
                <div
                  key={f.id}
                  onClick={() => {
                    setSelectedFollowupId(f.id);
                    setShowMobileDetail(true);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedFollowupId(f.id);
                      setShowMobileDetail(true);
                    }
                  }}
                  aria-pressed={isSelected}
                  aria-label={`Follow-up for ${leadName}, ${f.dueInfo.label}, priority ${f.priority || "Medium"}`}
                  className={`w-full text-left p-3 rounded-2xl transition-all border relative cursor-pointer group focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:outline-none ${
                    isSelected
                      ? "bg-teal-500/10 border-teal-500/60 shadow-xs"
                      : "bg-bg-main/60 hover:bg-brand-secondary/30 border-brand-secondary/60"
                  } ${f.done ? "opacity-75" : ""}`}
                >
                  {/* Left Accent Bar when Selected */}
                  {isSelected && (
                    <span
                      className="absolute left-0 top-3 bottom-3 w-1 rounded-r-md bg-teal-500"
                      aria-hidden="true"
                    />
                  )}

                  {/* Header Row: Lead Name & Urgency Status */}
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-brand-primary truncate text-sm">
                          {leadName}
                        </span>
                        {f.done && (
                          <span
                            title="Handled / Completed"
                            className="inline-flex items-center text-emerald-600 dark:text-emerald-400 shrink-0"
                          >
                            <CheckCircle2 size={14} />
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-brand-primary/60 truncate flex items-center gap-1.5 mt-0.5">
                        <span className="truncate">{serviceText}</span>
                        <span>•</span>
                        <span className="truncate text-teal-600 dark:text-teal-400 font-medium">
                          {f.repName}
                        </span>
                      </div>
                    </div>

                    {/* Due Urgency Badge */}
                    <span
                      className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border tracking-tight ${f.dueInfo.colorClass}`}
                    >
                      <DueIcon size={11} className="shrink-0" />
                      <span>{f.dueInfo.shortLabel}</span>
                    </span>
                  </div>

                  {/* AI Follow-up Reason Snippet */}
                  <p className="text-xs text-brand-primary/80 line-clamp-2 italic bg-brand-light/70 dark:bg-bg-card p-2 rounded-lg border border-brand-secondary/40 my-2">
                    {cleanDisplay(
                      f.notes,
                      `Follow-up scheduled by AI for ${serviceText}`,
                    ).slice(0, 25) +
                      (cleanDisplay(
                        f.notes,
                        `Follow-up scheduled by AI for ${serviceText}`,
                      ).length > 25
                        ? "..."
                        : "")}
                  </p>

                  {/* Footer Row: Scheduled Date/Time & Priority Badge */}
                  <div className="flex items-center justify-between text-[11px] text-brand-primary/60 pt-1">
                    <div className="flex items-center gap-1">
                      <Calendar size={12} className="shrink-0" />
                      <span>{formatDate(f.date || f.createdAt)}</span>
                      {cleanDisplay(f.time) && (
                        <span className="font-medium text-teal-600 dark:text-teal-400">
                          • {cleanDisplay(f.time)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider ${
                          f.priority === "High"
                            ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25"
                            : f.priority === "Medium"
                              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/25"
                              : "bg-brand-secondary/40 text-brand-primary/70 border border-brand-secondary"
                        }`}
                      >
                        {f.priority || "Medium"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* ── Right Workspace Area: Follow-up Details & Action Center ───────── */}
      <main
        aria-label="Follow-up details workspace"
        className={`flex-1 bg-bg-main overflow-y-auto p-4 md:p-6 lg:p-8 ${
          showMobileDetail ? "flex flex-col" : "hidden md:flex md:flex-col"
        }`}
      >
        {selectedData ? (
          <div className="max-w-3xl w-full mx-auto space-y-6 animate-fadeIn">
            {/* Mobile Back Button to list */}
            <div className="md:hidden pb-2">
              <button
                type="button"
                onClick={() => setShowMobileDetail(false)}
                className="inline-flex items-center gap-2 text-xs font-bold text-teal-600 dark:text-teal-400 hover:text-teal-700 p-1 rounded-lg focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:outline-none"
              >
                <ArrowLeft size={16} /> Back to follow-ups list
              </button>
            </div>

            {/* ── 1. Lead Summary & Action Card ──────────────────────────── */}
            <div className="bg-brand-light border border-brand-secondary rounded-3xl p-5 sm:p-6 shadow-xs">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-brand-secondary">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0">
                      {selectedData.lead.name
                        ? selectedData.lead.name.substring(0, 2).toUpperCase()
                        : "LD"}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl sm:text-2xl font-extrabold text-brand-primary tracking-tight truncate">
                          {selectedData.lead.name}
                        </h2>
                        {selectedData.done && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 size={13} />
                            Handled
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-brand-primary/70 flex flex-wrap items-center gap-2 mt-1">
                        <span>Assigned Representative:</span>
                        <span className="font-bold text-teal-600 dark:text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-md">
                          {selectedData.repName}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Contact Chips */}
                  <div className="flex flex-wrap items-center gap-2 mt-4 text-xs">
                    {selectedData.lead.phone && (
                      <div className="inline-flex items-center gap-1.5 bg-bg-main border border-brand-secondary px-3 py-1 rounded-xl text-brand-primary">
                        <Phone size={13} className="text-teal-500 shrink-0" />
                        <a
                          href={`tel:${selectedData.lead.phone}`}
                          title="Call phone number"
                          className="font-medium hover:text-teal-600 hover:underline"
                        >
                          {selectedData.lead.phone}
                        </a>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(selectedData.lead.phone, "phone")
                          }
                          title="Copy phone number"
                          aria-label="Copy phone number"
                          className="ml-1 text-brand-primary/40 hover:text-brand-primary p-0.5 cursor-pointer"
                        >
                          {copiedKey === "phone" ? (
                            <Check size={12} className="text-emerald-500" />
                          ) : (
                            <Copy size={12} />
                          )}
                        </button>
                      </div>
                    )}

                    {selectedData.lead.email && (
                      <div className="inline-flex items-center gap-1.5 bg-bg-main border border-brand-secondary px-3 py-1 rounded-xl text-brand-primary">
                        <Mail size={13} className="text-teal-500 shrink-0" />
                        <a
                          href={`mailto:${selectedData.lead.email}`}
                          title="Send email"
                          className="font-medium hover:text-teal-600 hover:underline truncate max-w-[200px]"
                        >
                          {selectedData.lead.email}
                        </a>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(selectedData.lead.email, "email")
                          }
                          title="Copy email address"
                          aria-label="Copy email address"
                          className="ml-1 text-brand-primary/40 hover:text-brand-primary p-0.5 cursor-pointer"
                        >
                          {copiedKey === "email" ? (
                            <Check size={12} className="text-emerald-500" />
                          ) : (
                            <Copy size={12} />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Primary Action Buttons */}
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0 pt-2 lg:pt-0">
                  {/* Mark Handled / Reopen Button */}
                  <button
                    type="button"
                    onClick={() =>
                      handleToggleHandled(
                        selectedData.id,
                        selectedData.lead.id,
                        selectedData.done,
                      )
                    }
                    disabled={resolvingId === selectedData.id}
                    className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 font-bold py-2.5 px-4 rounded-xl text-xs sm:text-sm transition-all shadow-xs cursor-pointer disabled:opacity-50 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:outline-none ${
                      selectedData.done
                        ? "bg-bg-main hover:bg-brand-secondary/40 text-brand-primary border border-brand-secondary"
                        : "bg-teal-600 hover:bg-teal-700 text-white"
                    }`}
                  >
                    {resolvingId === selectedData.id ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        <span>Updating...</span>
                      </>
                    ) : selectedData.done ? (
                      <>
                        <RefreshCw size={16} />
                        <span>Reopen Action</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle size={16} />
                        <span>Mark Handled</span>
                      </>
                    )}
                  </button>

                  {/* Open WhatsApp Chat */}
                  <button
                    type="button"
                    onClick={() =>
                      navigate("/whatsapp", {
                        state: { openChatId: selectedData.lead.id },
                      })
                    }
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs sm:text-sm transition-all shadow-xs cursor-pointer active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
                  >
                    <MessageCircle size={16} />
                    <span>WhatsApp</span>
                  </button>

                  {/* View Lead Details Workspace */}
                  <button
                    type="button"
                    onClick={() =>
                      navigate(`/lead-details/${selectedData.lead.id}`)
                    }
                    title="View full lead workspace"
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-bg-main border border-brand-secondary hover:bg-brand-secondary/30 text-brand-primary font-bold py-2.5 px-4 rounded-xl text-xs sm:text-sm transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:outline-none"
                  >
                    <ExternalLink size={16} />
                    <span>Lead Details</span>
                  </button>
                </div>
              </div>

              {/* Lead Summary Properties Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
                <div className="bg-bg-main p-3.5 rounded-2xl border border-brand-secondary">
                  <span className="block text-[10px] font-bold text-brand-primary/50 uppercase tracking-wider mb-1">
                    Required Service
                  </span>
                  <span className="font-bold text-brand-primary text-xs sm:text-sm truncate block">
                    {cleanDisplay(
                      selectedData.lead.service ||
                        selectedData.lead.services?.join(", "),
                      "General Inquiry",
                    )}
                  </span>
                </div>

                <div className="bg-bg-main p-3.5 rounded-2xl border border-brand-secondary">
                  <span className="block text-[10px] font-bold text-brand-primary/50 uppercase tracking-wider mb-1">
                    Location / City
                  </span>
                  <span className="font-bold text-brand-primary text-xs sm:text-sm truncate block">
                    {cleanDisplay(
                      selectedData.lead.city ||
                        selectedData.lead.aiQualification?.city,
                      "Not Specified",
                    )}
                  </span>
                </div>

                <div className="bg-bg-main p-3.5 rounded-2xl border border-brand-secondary">
                  <span className="block text-[10px] font-bold text-brand-primary/50 uppercase tracking-wider mb-1">
                    Pipeline Stage
                  </span>
                  <span
                    className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider ${
                      selectedData.lead.status === "Converted"
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30"
                        : selectedData.lead.status === "New"
                          ? "bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30"
                          : "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30"
                    }`}
                  >
                    {selectedData.lead.status || "New"}
                  </span>
                </div>

                <div className="bg-bg-main p-3.5 rounded-2xl border border-brand-secondary">
                  <span className="block text-[10px] font-bold text-brand-primary/50 uppercase tracking-wider mb-1">
                    Lead Created
                  </span>
                  <span className="font-bold text-brand-primary text-xs sm:text-sm block">
                    {formatDate(selectedData.lead.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* ── 2. AI Recommended Action & Analysis Card ────────────────── */}
            <div className="bg-brand-light border border-teal-500/40 rounded-3xl overflow-hidden shadow-xs">
              {/* Card Banner */}
              <div className="p-4 sm:p-5 bg-gradient-to-r from-teal-500/10 via-emerald-500/5 to-transparent border-b border-brand-secondary/80 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-teal-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Bot size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-brand-primary flex items-center gap-2">
                      AI Agent Analysis &amp; Recommended Action
                    </h3>
                    <p className="text-[11px] text-brand-primary/60">
                      Generated automatically by Sales AI based on customer
                      inquiry
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${selectedData.dueInfo.colorClass}`}
                  >
                    <selectedData.dueInfo.icon size={13} />
                    <span>{selectedData.dueInfo.label}</span>
                  </span>

                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      selectedData.priority === "High"
                        ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25"
                        : selectedData.priority === "Medium"
                          ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/25"
                          : "bg-brand-secondary/40 text-brand-primary/70 border border-brand-secondary"
                    }`}
                  >
                    {selectedData.priority || "Medium"} Priority
                  </span>
                </div>
              </div>

              {/* Recommendation Content */}
              <div className="p-5 sm:p-6 space-y-5">
                {/* Timing & Channel Metadata Row */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-bg-main rounded-2xl border border-brand-secondary text-xs">
                  <div className="flex items-center gap-2">
                    <MessageCircle size={15} className="text-teal-500" />
                    <span className="text-brand-primary/70">
                      Engagement Channel:
                    </span>
                    <span className="font-bold text-brand-primary">
                      {selectedData.type || "WhatsApp"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar size={15} className="text-teal-500" />
                    <span className="text-brand-primary/70">
                      Scheduled Callback:
                    </span>
                    <span className="font-bold text-teal-600 dark:text-teal-400">
                      {formatDate(selectedData.date || selectedData.createdAt)}
                      {cleanDisplay(selectedData.time) && (
                        <span> • {cleanDisplay(selectedData.time)}</span>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock size={15} className="text-brand-primary/50" />
                    <span className="text-brand-primary/60">
                      Logged:{" "}
                      {new Date(
                        selectedData.createdAt || selectedData.date,
                      ).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>

                {/* AI Reason / Follow-up Prompt Callout */}
                <div className="relative bg-bg-main p-4 sm:p-5 rounded-2xl border border-brand-secondary space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-brand-primary/60 uppercase tracking-wider flex items-center gap-1.5">
                      <ClipboardList size={14} className="text-teal-500" />
                      Follow-up Reason &amp; Conversation Summary
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(selectedData.notes, "ai_prompt")
                      }
                      title="Copy AI recommendation note"
                      aria-label="Copy AI recommendation note"
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
                    >
                      {copiedKey === "ai_prompt" ? (
                        <>
                          <Check size={12} className="text-emerald-500" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          <span>Copy note</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-sm font-medium text-brand-primary italic leading-relaxed pt-1">
                    "
                    {cleanDisplay(
                      selectedData.notes,
                      `Follow-up scheduled by AI Agent for ${cleanDisplay(
                        selectedData.lead?.service,
                        "lead inquiry",
                      )}`,
                    )}
                    "
                  </p>
                </div>

                {/* AI Extracted Qualification Insights (if available) */}
                {selectedData.lead.aiQualification && (
                  <div className="p-4 bg-teal-500/5 rounded-2xl border border-teal-500/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-teal-700 dark:text-teal-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles size={14} />
                        AI Qualification Insights
                      </h4>

                      {/* Interest Score Gauge */}
                      {selectedData.lead.aiQualification.interestScore !==
                        undefined && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-brand-primary/70 font-medium">
                            Interest Score:
                          </span>
                          <span className="font-extrabold text-xs px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30">
                            {selectedData.lead.aiQualification.interestScore} /
                            10
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                      {selectedData.lead.aiQualification.urgency && (
                        <div className="bg-bg-main p-2.5 rounded-xl border border-brand-secondary/70">
                          <span className="block text-[10px] text-brand-primary/50 font-bold uppercase">
                            Customer Urgency
                          </span>
                          <span className="font-bold text-brand-primary mt-0.5 block">
                            {selectedData.lead.aiQualification.urgency}
                          </span>
                        </div>
                      )}

                      {selectedData.lead.aiQualification.budget && (
                        <div className="bg-bg-main p-2.5 rounded-xl border border-brand-secondary/70">
                          <span className="block text-[10px] text-brand-primary/50 font-bold uppercase">
                            Indicated Budget
                          </span>
                          <span className="font-bold text-brand-primary mt-0.5 block">
                            {cleanDisplay(
                              selectedData.lead.aiQualification.budget,
                              "Not Stated",
                            )}
                          </span>
                        </div>
                      )}

                      {selectedData.lead.aiQualification.questions &&
                        Object.keys(selectedData.lead.aiQualification.questions)
                          .length > 0 && (
                          <div className="bg-bg-main p-2.5 rounded-xl border border-brand-secondary/70 sm:col-span-3">
                            <span className="block text-[10px] text-brand-primary/50 font-bold uppercase mb-1">
                              Extracted Answers
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(
                                selectedData.lead.aiQualification.questions,
                              ).map(([qKey, qVal]) => (
                                <span
                                  key={qKey}
                                  className="inline-block bg-brand-light px-2 py-1 rounded-md text-[11px] border border-brand-secondary text-brand-primary"
                                >
                                  <strong className="text-teal-600 dark:text-teal-400 capitalize">
                                    {qKey}:
                                  </strong>{" "}
                                  {cleanDisplay(qVal, "—")}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                    </div>
                  </div>
                )}

                {/* Helpful Representative Guidance */}
                <div className="text-xs text-brand-primary/70 bg-bg-main/60 p-3.5 rounded-2xl border border-brand-secondary/60 flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-teal-500/10 text-teal-600 flex items-center justify-center shrink-0 mt-0.5">
                    💡
                  </div>
                  <div>
                    <strong className="text-brand-primary">
                      Recommended Next Step:
                    </strong>{" "}
                    Review the customer's previous chat history on WhatsApp or
                    place a direct call. Once you've followed up with{" "}
                    {selectedData.lead.name}, click{" "}
                    <strong>Mark Handled</strong> above to keep your immediate
                    action agenda clean.
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Empty Workspace State (No item selected) */
          <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shadow-xs">
              <Sparkles size={32} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-brand-primary">
                Select an Immediate Follow-up
              </h2>
              <p className="text-xs sm:text-sm text-brand-primary/60 max-w-sm mt-1">
                Choose a customer callback or reminder from the list on the left
                to review the AI's suggestion, contact the lead, and resolve the
                action.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
