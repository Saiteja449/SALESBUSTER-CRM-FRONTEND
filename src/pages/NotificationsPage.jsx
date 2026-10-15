import React, { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  AlertTriangle,
  Calendar,
  Users,
  Building2,
  Sparkles,
  Clock,
  ArrowRight,
  Search,
  X,
  RotateCcw,
  RefreshCw,
  Filter,
  ShieldCheck,
  Info,
  ExternalLink,
  Inbox,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import { useNotifications } from "../context/NotificationContext.jsx";

// ── Time & Date Helpers ───────────────────────────────────────────────────────
function parseNotificationDate(timeStr) {
  if (!timeStr) return new Date();
  const parsed = new Date(timeStr);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }
  const now = new Date();
  const lower = String(timeStr).toLowerCase();
  if (lower.includes("hour")) {
    const num = parseInt(lower, 10) || 1;
    return new Date(now.getTime() - num * 3600 * 1000);
  }
  if (lower.includes("day")) {
    const num = parseInt(lower, 10) || 1;
    return new Date(now.getTime() - num * 24 * 3600 * 1000);
  }
  if (lower.includes("min")) {
    const num = parseInt(lower, 10) || 1;
    return new Date(now.getTime() - num * 60 * 1000);
  }
  return now;
}

function getGroupKey(date) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const itemDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((today - itemDate) / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays <= 7) return "This Week";
  return "Earlier";
}

function formatRelativeTime(timeStr) {
  if (!timeStr) return "";
  const date = parseNotificationDate(timeStr);
  const now = new Date();
  const diffSeconds = Math.round((now - date) / 1000);

  if (diffSeconds < 45) return "Just now";
  if (diffSeconds < 3600) {
    const mins = Math.max(1, Math.floor(diffSeconds / 60));
    return `${mins}m ago`;
  }
  if (diffSeconds < 86400) {
    const hours = Math.floor(diffSeconds / 3600);
    return `${hours}h ago`;
  }
  if (diffSeconds < 172800) {
    return `Yesterday at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  }
  return `${date.toLocaleDateString([], { month: "short", day: "numeric" })} at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

function getExactTimestamp(timeStr) {
  const date = parseNotificationDate(timeStr);
  return date.toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

// ── Notification Visual Profile ──────────────────────────────────────────────
function getNotificationProfile(type) {
  switch (type) {
    case "followup_overdue":
    case "overdue":
      return {
        category: "Follow-up Overdue",
        badgeClass: "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20",
        iconContainer: "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400",
        icon: AlertTriangle,
        borderColor: "border-l-rose-500",
      };
    case "lead_inactive":
      return {
        category: "Inactive Lead",
        badgeClass: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
        iconContainer: "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400",
        icon: Clock,
        borderColor: "border-l-amber-500",
      };
    case "new_lead":
      return {
        category: "Inbound Lead",
        badgeClass: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
        iconContainer: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
        icon: Sparkles,
        borderColor: "border-l-emerald-500",
      };
    case "insurance_renewal":
    case "amc_renewal":
      return {
        category: "Agreement Renewal",
        badgeClass: "text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20",
        iconContainer: "bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400",
        icon: ShieldCheck,
        borderColor: "border-l-purple-500",
      };
    case "site_visit":
    case "quote_expiring":
      return {
        category: "Sales Milestone",
        badgeClass: "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20",
        iconContainer: "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400",
        icon: Calendar,
        borderColor: "border-l-blue-500",
      };
    default:
      return {
        category: "System Notice",
        badgeClass: "text-pilot-blue bg-pilot-blue/10 border-pilot-blue/20",
        iconContainer: "bg-pilot-blue/10 border-pilot-blue/20 text-pilot-blue",
        icon: Bell,
        borderColor: "border-l-pilot-blue",
      };
  }
}

function getRelatedAction(n) {
  const type = String(n.type || "").toLowerCase();
  const text = `${n.title || ""} ${n.message || ""}`.toLowerCase();

  if (
    type.includes("followup") ||
    type === "site_visit" ||
    type === "quote_expiring" ||
    text.includes("follow-up") ||
    text.includes("followup") ||
    text.includes("proposal") ||
    text.includes("inspection")
  ) {
    return {
      label: "Open Follow-up Agenda",
      path: "/followups",
      icon: Calendar,
    };
  }

  if (
    type === "new_lead" ||
    type.includes("lead") ||
    text.includes("lead") ||
    text.includes("chat") ||
    text.includes("demo")
  ) {
    return {
      label: "View in Leads Repository",
      path: "/leads",
      icon: Users,
    };
  }

  if (
    type === "insurance_renewal" ||
    type === "amc_renewal" ||
    text.includes("renewal") ||
    text.includes("subscription") ||
    text.includes("license")
  ) {
    return {
      label: "View Organization & Plan",
      path: "/organization",
      icon: Building2,
    };
  }

  return null;
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function NotificationsPage() {
  const navigate = useNavigate();
  const {
    notifications = [],
    unreadCount = 0,
    loading = false,
    isRefreshing = false,
    error = null,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    deleteNotification,
    restoreNotification,
    refreshNotifications,
    loadMore,
    hasMore,
  } = useNotifications();

  // Local state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all"); // 'all' | 'unread' | 'leads' | 'followups' | 'system'
  const [showClearReadModal, setShowClearReadModal] = useState(false);
  const [undoToast, setUndoToast] = useState(null); // { notification, index, title }

  const undoTimeoutRef = useRef(null);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    };
  }, []);

  // Filter Categories
  const filterCounts = useMemo(() => {
    let unread = 0;
    let leads = 0;
    let followups = 0;
    let system = 0;

    notifications.forEach((n) => {
      if (!n.read) unread += 1;
      const type = String(n.type || "").toLowerCase();
      const text = `${n.title || ""} ${n.message || ""}`.toLowerCase();

      if (type === "new_lead" || type.includes("lead") || text.includes("lead")) {
        leads += 1;
      } else if (
        type.includes("followup") ||
        type === "site_visit" ||
        type === "quote_expiring" ||
        text.includes("follow")
      ) {
        followups += 1;
      } else {
        system += 1;
      }
    });

    return {
      all: notifications.length,
      unread,
      leads,
      followups,
      system,
    };
  }, [notifications]);

  // Filtered Notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      // 1. Category Filter
      if (selectedFilter === "unread" && n.read) return false;
      if (selectedFilter === "leads") {
        const type = String(n.type || "").toLowerCase();
        const text = `${n.title || ""} ${n.message || ""}`.toLowerCase();
        if (!(type === "new_lead" || type.includes("lead") || text.includes("lead"))) return false;
      }
      if (selectedFilter === "followups") {
        const type = String(n.type || "").toLowerCase();
        const text = `${n.title || ""} ${n.message || ""}`.toLowerCase();
        if (
          !(
            type.includes("followup") ||
            type === "site_visit" ||
            type === "quote_expiring" ||
            text.includes("follow")
          )
        )
          return false;
      }
      if (selectedFilter === "system") {
        const type = String(n.type || "").toLowerCase();
        const text = `${n.title || ""} ${n.message || ""}`.toLowerCase();
        const isLead = type === "new_lead" || type.includes("lead") || text.includes("lead");
        const isFollowup =
          type.includes("followup") ||
          type === "site_visit" ||
          type === "quote_expiring" ||
          text.includes("follow");
        if (isLead || isFollowup) return false;
      }

      // 2. Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = (n.title || "").toLowerCase().includes(q);
        const matchMessage = (n.message || "").toLowerCase().includes(q);
        const matchType = (n.type || "").toLowerCase().includes(q);
        if (!matchTitle && !matchMessage && !matchType) return false;
      }

      return true;
    });
  }, [notifications, selectedFilter, searchQuery]);

  // Chronological Grouping
  const groupedNotifications = useMemo(() => {
    const groups = {
      Today: [],
      Yesterday: [],
      "This Week": [],
      Earlier: [],
    };

    filteredNotifications.forEach((n) => {
      const date = parseNotificationDate(n.time);
      const key = getGroupKey(date);
      if (groups[key]) {
        groups[key].push(n);
      } else {
        groups.Earlier.push(n);
      }
    });

    return groups;
  }, [filteredNotifications]);

  // Handle Dismiss with 5-Second Undo Toast
  const handleDismissNotification = (n) => {
    const originalIndex = notifications.findIndex((item) => item.id === n.id);
    deleteNotification(n.id);

    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);

    setUndoToast({
      notification: n,
      index: originalIndex >= 0 ? originalIndex : 0,
      title: n.title,
    });

    undoTimeoutRef.current = setTimeout(() => {
      setUndoToast(null);
    }, 5000);
  };

  const handleUndoDismiss = () => {
    if (undoToast && undoToast.notification) {
      if (typeof restoreNotification === "function") {
        restoreNotification(undoToast.notification, undoToast.index);
      }
      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
      setUndoToast(null);
    }
  };

  // Handle Clear All Read Confirm
  const handleConfirmClearAllRead = () => {
    const readNotifications = notifications.filter((n) => n.read);
    readNotifications.forEach((n) => deleteNotification(n.id));
    setShowClearReadModal(false);
  };

  const readCount = notifications.filter((n) => n.read).length;

  return (
    <div className="w-full max-w-7xl mx-auto min-w-0 p-4 sm:p-6  space-y-6">
      {/* ── 1. Page Header with Real-Time Counters & Action Controls ─────────── */}
      <div className="bg-bg-card border border-border-main rounded-3xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="w-10 h-10 rounded-2xl bg-pilot-blue/10 text-pilot-blue flex items-center justify-center shrink-0">
                <Bell size={20} />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-text-primary tracking-tight">
                Alerts & System Notifications
              </h1>
              {unreadCount > 0 ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-pilot-blue text-white shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  {unreadCount} Unread
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <Check size={13} />
                  All Caught Up
                </span>
              )}
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              Real-time feed of pending customer follow-ups, inbound chat inquiries, and system renewals.
            </p>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
            <button
              type="button"
              onClick={refreshNotifications}
              disabled={isRefreshing}
              className="p-2.5 rounded-xl bg-bg-secondary border border-border-main text-text-secondary hover:text-text-primary hover:border-pilot-blue/40 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-pilot-blue"
              title="Refresh alerts feed"
              aria-label="Refresh notification feed"
            >
              <RefreshCw
                size={16}
                className={`text-text-secondary ${isRefreshing ? "animate-spin text-pilot-blue" : ""}`}
              />
            </button>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-bg-secondary hover:bg-bg-secondary/70 border border-border-main text-xs font-bold text-text-primary transition-all cursor-pointer shadow-2xs focus-visible:ring-2 focus-visible:ring-pilot-blue"
                title="Mark all notifications as read"
                aria-label="Mark all notifications as read"
              >
                <CheckCheck size={16} className="text-pilot-blue shrink-0" />
                <span>Mark All Read</span>
              </button>
            )}

            {readCount > 0 && (
              <button
                type="button"
                onClick={() => setShowClearReadModal(true)}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-bg-secondary hover:bg-rose-500/10 hover:text-rose-600 border border-border-main hover:border-rose-500/20 text-xs font-bold text-text-secondary transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-500"
                title="Clear all read notifications"
                aria-label="Clear all read notifications"
              >
                <Trash2 size={16} className="shrink-0" />
                <span className="hidden sm:inline">Clear Read ({readCount})</span>
                <span className="sm:hidden">Clear Read</span>
              </button>
            )}
          </div>
        </div>

        {/* ── 2. Search & Category Filter Navigation Bar ────────────────────── */}
        <div className="mt-5 pt-4 border-t border-border-main space-y-3.5">
          {/* Search Box */}
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notifications by title, lead name, or details…"
              className="w-full bg-bg-secondary/40 border border-border-main text-text-primary text-xs rounded-xl pl-9 pr-9 py-2.5 outline-none focus:border-pilot-blue focus:ring-1 focus:ring-pilot-blue transition-all"
              aria-label="Search notifications"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-secondary hover:text-text-primary rounded-lg transition-colors cursor-pointer"
                title="Clear search query"
                aria-label="Clear search input"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div
            className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none"
            role="tablist"
            aria-label="Filter notifications by category"
          >
            {[
              { id: "all", label: "All Alerts", count: filterCounts.all },
              { id: "unread", label: "Unread Only", count: filterCounts.unread },
              { id: "leads", label: "Leads & Enquiries", count: filterCounts.leads },
              { id: "followups", label: "Follow-ups & Tasks", count: filterCounts.followups },
              { id: "system", label: "System & Renewals", count: filterCounts.system },
            ].map((tab) => {
              const isActive = selectedFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setSelectedFilter(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pilot-blue ${
                    isActive
                      ? "bg-pilot-blue text-white shadow-xs"
                      : "bg-bg-secondary/60 text-text-secondary hover:text-text-primary hover:bg-bg-secondary border border-border-main/60"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
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
        </div>
      </div>

      {/* ── 3. Error Alert Banner ────────────────────────────────────────────── */}
      {error && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 flex items-center justify-between gap-3 text-xs shadow-xs animate-fadeIn"
        >
          <div className="flex items-center gap-2.5">
            <AlertCircle size={18} className="text-rose-500 shrink-0" />
            <div>
              <span className="font-bold block">Failed to sync notifications</span>
              <span className="text-[11px] opacity-90">{error}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={refreshNotifications}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition-all cursor-pointer shrink-0 shadow-xs"
          >
            <RotateCcw size={13} />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* ── 4. Main Notification Feed ────────────────────────────────────────── */}
      <main role="region" aria-label="Notifications Feed" className="space-y-6">
        {/* Loading Skeletons */}
        {loading && notifications.length === 0 ? (
          <div className="space-y-3" aria-label="Loading notifications">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="p-5 rounded-2xl bg-bg-card border border-border-main animate-pulse flex items-start gap-4"
              >
                <div className="w-10 h-10 rounded-2xl bg-bg-secondary shrink-0" />
                <div className="flex-1 space-y-2.5 min-w-0">
                  <div className="h-4 bg-bg-secondary rounded w-1/3" />
                  <div className="h-3 bg-bg-secondary rounded w-3/4" />
                  <div className="h-2.5 bg-bg-secondary rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredNotifications.length === 0 ? (
          /* Contextual Empty State */
          <div className="bg-bg-card border border-border-main rounded-3xl p-10 sm:p-14 text-center shadow-xs">
            {searchQuery || selectedFilter !== "all" ? (
              <div className="max-w-sm mx-auto space-y-3">
                <div className="w-14 h-14 rounded-3xl bg-bg-secondary text-text-secondary mx-auto flex items-center justify-center">
                  <Filter size={24} />
                </div>
                <h3 className="text-base font-black text-text-primary">
                  No matching notifications found
                </h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  We couldn’t find any notifications matching your current filters.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedFilter("all");
                  }}
                  className="px-4 py-2 rounded-xl bg-pilot-blue hover:bg-pilot-blue-hover text-white text-xs font-bold transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                >
                  <RotateCcw size={13} />
                  <span>Reset Filters</span>
                </button>
              </div>
            ) : (
              <div className="max-w-sm mx-auto space-y-3">
                <div className="w-14 h-14 rounded-3xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                  <Inbox size={26} />
                </div>
                <h3 className="text-base font-black text-text-primary">
                  Your notification feed is empty
                </h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  You’re completely up to date! System alerts, new website leads, and scheduled follow-ups will appear here as they occur.
                </p>
                <button
                  type="button"
                  onClick={refreshNotifications}
                  className="px-4 py-2 rounded-xl bg-bg-secondary hover:bg-bg-secondary/70 border border-border-main text-text-primary text-xs font-bold transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                >
                  <RefreshCw size={13} />
                  <span>Check for New Alerts</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Grouped Chronological List */
          <div className="space-y-6">
            {["Today", "Yesterday", "This Week", "Earlier"].map((groupName) => {
              const items = groupedNotifications[groupName] || [];
              if (items.length === 0) return null;

              return (
                <section key={groupName} className="space-y-3" aria-labelledby={`group-${groupName}`}>
                  {/* Group Header */}
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <h2
                        id={`group-${groupName}`}
                        className="text-xs font-black uppercase tracking-wider text-text-secondary"
                      >
                        {groupName}
                      </h2>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-bg-secondary text-text-secondary border border-border-main/60">
                        {items.length} {items.length === 1 ? "alert" : "alerts"}
                      </span>
                    </div>
                  </div>

                  {/* Notification Items List */}
                  <ul className="space-y-2.5" role="list">
                    {items.map((n) => {
                      const profile = getNotificationProfile(n.type);
                      const relatedAction = getRelatedAction(n);
                      const ItemIcon = profile.icon;
                      const isUnread = !n.read;

                      return (
                        <li
                          key={n.id}
                          className={`rounded-2xl p-4 sm:p-5 transition-all border relative flex flex-col sm:flex-row items-start justify-between gap-4 ${
                            isUnread
                              ? "bg-pilot-blue/5 dark:bg-pilot-blue/10 border-pilot-blue/30 dark:border-pilot-blue/40 shadow-xs"
                              : "bg-bg-card border-border-main hover:border-border-main/90"
                          }`}
                          role="listitem"
                          aria-label={`${isUnread ? "Unread" : "Read"} notification: ${n.title}`}
                        >
                          {/* Left: Icon & Textual Content */}
                          <div className="flex items-start gap-3.5 min-w-0 flex-1">
                            {/* Visual Avatar */}
                            <div
                              className={`w-10 h-10 rounded-2xl border flex items-center justify-center shrink-0 mt-0.5 ${profile.iconContainer}`}
                              aria-hidden="true"
                            >
                              <ItemIcon size={18} />
                            </div>

                            {/* Text Body */}
                            <div className="space-y-1.5 min-w-0 flex-1">
                              {/* Metadata Badges Header */}
                              <div className="flex items-center gap-2 flex-wrap">
                                {isUnread ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-pilot-blue text-white shadow-2xs">
                                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                    UNREAD
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-bg-secondary text-text-secondary">
                                    Read
                                  </span>
                                )}

                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${profile.badgeClass}`}
                                >
                                  {profile.category}
                                </span>

                                <span
                                  className="text-[11px] text-text-secondary flex items-center gap-1 font-medium"
                                  title={getExactTimestamp(n.time)}
                                >
                                  <Clock size={11} className="shrink-0" />
                                  <span>{formatRelativeTime(n.time)}</span>
                                </span>
                              </div>

                              {/* Notification Title */}
                              <h3
                                className={`text-sm tracking-tight leading-snug ${
                                  isUnread
                                    ? "font-black text-text-primary"
                                    : "font-bold text-text-primary/90"
                                }`}
                              >
                                {n.title}
                              </h3>

                              {/* Notification Message */}
                              <p className="text-xs text-text-secondary leading-relaxed">
                                {n.message}
                              </p>

                              {/* Deep Action Link if applicable */}
                              {relatedAction && (
                                <div className="pt-1.5">
                                  <button
                                    type="button"
                                    onClick={() => navigate(relatedAction.path)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-bg-secondary/70 hover:bg-pilot-blue hover:text-white border border-border-main text-xs font-bold text-text-primary transition-all cursor-pointer shadow-2xs focus-visible:ring-2 focus-visible:ring-pilot-blue"
                                  >
                                    <relatedAction.icon size={13} className="shrink-0" />
                                    <span>{relatedAction.label}</span>
                                    <ArrowRight size={13} className="shrink-0" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Right: Quick Item Action Controls */}
                          <div className="flex items-center gap-1.5 self-end sm:self-start shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-border-main/50 w-full sm:w-auto justify-end">
                            {isUnread ? (
                              <button
                                type="button"
                                onClick={() => markAsRead(n.id)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-bg-secondary hover:bg-emerald-500/15 hover:text-emerald-600 text-text-secondary text-xs font-bold transition-all cursor-pointer border border-border-main focus-visible:ring-2 focus-visible:ring-emerald-500"
                                title="Mark this alert as read"
                                aria-label={`Mark "${n.title}" as read`}
                              >
                                <Check size={14} className="text-emerald-500" />
                                <span className="sm:hidden lg:inline text-[11px]">Mark Read</span>
                              </button>
                            ) : (
                              typeof markAsUnread === "function" && (
                                <button
                                  type="button"
                                  onClick={() => markAsUnread(n.id)}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-bg-secondary hover:bg-pilot-blue/15 hover:text-pilot-blue text-text-secondary text-xs font-bold transition-all cursor-pointer border border-border-main focus-visible:ring-2 focus-visible:ring-pilot-blue"
                                  title="Mark this alert as unread"
                                  aria-label={`Mark "${n.title}" as unread`}
                                >
                                  <EyeOff size={14} />
                                  <span className="sm:hidden lg:inline text-[11px]">Mark Unread</span>
                                </button>
                              )
                            )}

                            <button
                              type="button"
                              onClick={() => handleDismissNotification(n)}
                              className="p-1.5 rounded-xl text-text-secondary hover:text-rose-600 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-500"
                              title="Dismiss notification"
                              aria-label={`Dismiss notification "${n.title}"`}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })}
          </div>
        )}

        {/* Load More Pagination */}
        {hasMore && (
          <div className="pt-4 flex justify-center">
            <button
              type="button"
              onClick={loadMore}
              className="px-6 py-2.5 bg-pilot-blue hover:bg-pilot-blue-hover text-white text-xs font-black rounded-2xl transition-all shadow-md shadow-pilot-blue/20 cursor-pointer focus-visible:ring-2 focus-visible:ring-pilot-blue"
            >
              Load Older Notifications
            </button>
          </div>
        )}
      </main>

      {/* ── 5. Transient Undo Snackbar ───────────────────────────────────────── */}
      {undoToast && (
        <aside
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 max-w-sm w-full p-4 rounded-2xl bg-text-primary text-bg-main shadow-2xl flex items-center justify-between gap-3 animate-fadeIn border border-border-main/20"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <Trash2 size={16} className="text-rose-400 shrink-0" />
            <span className="text-xs truncate">
              Alert <strong>"{undoToast.title}"</strong> dismissed.
            </span>
          </div>
          <button
            type="button"
            onClick={handleUndoDismiss}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pilot-blue hover:bg-pilot-blue-hover text-white text-xs font-black transition-all shrink-0 cursor-pointer shadow-xs"
          >
            <RotateCcw size={13} />
            <span>Undo</span>
          </button>
        </aside>
      )}

      {/* ── 6. Confirmation Modal: Clear All Read Notifications ───────────────── */}
      {showClearReadModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
          role="dialog"
          aria-modal="true"
          aria-labelledby="clear-read-title"
        >
          <div className="bg-bg-card border border-border-main rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                <Trash2 size={22} />
              </div>
              <div className="space-y-1">
                <h3 id="clear-read-title" className="text-base font-black text-text-primary">
                  Clear All Read Notifications?
                </h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Are you sure you want to dismiss all <strong>{readCount} read notifications</strong>? Unread notifications will remain in your feed.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border-main">
              <button
                type="button"
                onClick={() => setShowClearReadModal(false)}
                className="px-4 py-2.5 rounded-xl border border-border-main text-xs font-bold text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmClearAllRead}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black transition-all shadow-md shadow-rose-600/20 cursor-pointer"
              >
                Yes, Clear {readCount} Alerts
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
