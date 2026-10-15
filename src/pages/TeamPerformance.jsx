import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Trophy,
  Star,
  UserPlus,
  Trash2,
  Medal,
  Activity,
  Eye,
  AlertTriangle,
  Users,
  ShieldCheck,
  Calendar,
  Search,
  X,
  ArrowUpDown,
  Phone,
  Mail,
  Target,
  TrendingUp,
  CheckCircle2,
  HelpCircle,
  Filter,
  RotateCcw,
  Sparkles,
  BarChart2,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { useDashboard } from "../context/DashboardContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";

// Custom Accessible Recharts Tooltip
function CustomChartTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const assigned = payload.find((p) => p.dataKey === "assigned")?.value || 0;
    const won = payload.find((p) => p.dataKey === "won")?.value || 0;
    const convRate = assigned > 0 ? Math.round((won / assigned) * 100) : 0;

    return (
      <div className="bg-bg-card border border-border-main p-3 rounded-xl shadow-xl text-xs space-y-1.5 z-50">
        <p className="font-bold text-text-primary text-sm">{label}</p>
        <div className="flex items-center justify-between gap-4 text-text-secondary">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-pilot-blue inline-block" />
            Leads Assigned:
          </span>
          <span className="font-bold text-text-primary">{assigned}</span>
        </div>
        <div className="flex items-center justify-between gap-4 text-text-secondary">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            Deals Won:
          </span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400">{won}</span>
        </div>
        <div className="pt-1 border-t border-border-main flex items-center justify-between gap-4 font-semibold text-text-primary">
          <span>Conversion Rate:</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{convRate}%</span>
        </div>
      </div>
    );
  }
  return null;
}

export default function TeamPerformance() {
  const navigate = useNavigate();
  const { performersList = [] } = useDashboard();
  const {
    currentUser,
    organization,
    allUsers = [],
    salesRepCount = 0,
    totalSeats = 1,
    usedSeats = 0,
    remainingSeats = 0,
    isSeatLimitReached = false,
    isSubscriptionExpired = false,
    addSalesPerson,
    deleteSalesPerson,
  } = useAuth();

  const isManager = currentUser && currentUser.role === "Sales Manager";

  // ── Search & Filter State ─────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("rank");
  const [filterTier, setFilterTier] = useState("all");

  // ── Sales Rep Creation Modal ──────────────────────────────────────────────
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newMobile, setNewMobile] = useState("");
  const [createError, setCreateError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ── Rep Deletion Modal ────────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState("");

  // Close modals on Escape key & lock body scroll
  useEffect(() => {
    if (!createOpen && !deleteTarget) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setCreateOpen(false);
        setDeleteTarget(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [createOpen, deleteTarget]);

  // ── Team Executive Aggregates ─────────────────────────────────────────────
  const teamAggregates = useMemo(() => {
    const totalReps = performersList.length;
    const totalAssigned = performersList.reduce(
      (sum, p) => sum + (p.assigned || 0),
      0
    );
    const totalWon = performersList.reduce(
      (sum, p) => sum + (p.won || p.converted || 0),
      0
    );
    const totalCallsToday = performersList.reduce(
      (sum, p) => sum + (p.callsMade || p.followupsCompleted || 0),
      0
    );
    const teamConversionRate =
      totalAssigned > 0 ? Math.round((totalWon / totalAssigned) * 100) : 0;
    const avgActivityScore =
      totalReps > 0
        ? Math.round(
            performersList.reduce((sum, p) => sum + (p.activityScore || 0), 0) /
              totalReps
          )
        : 0;

    return {
      totalReps,
      totalAssigned,
      totalWon,
      totalCallsToday,
      teamConversionRate,
      avgActivityScore,
    };
  }, [performersList]);

  // ── Filtering & Sorting Logic ─────────────────────────────────────────────
  const filteredAndSortedPerformers = useMemo(() => {
    return performersList
      .filter((p) => {
        // Search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const nameMatch = (p.name || "").toLowerCase().includes(q);
          const emailMatch = (p.email || "").toLowerCase().includes(q);
          const phoneMatch = (p.phone || "").toLowerCase().includes(q);
          if (!nameMatch && !emailMatch && !phoneMatch) return false;
        }

        // Performance Tier filter
        if (filterTier === "closers") {
          return (p.won || 0) > 0;
        }
        if (filterTier === "needsOutreach") {
          return (p.callsMade || 0) === 0;
        }
        if (filterTier === "needsCoaching") {
          return (
            (p.conversionRate || 0) < 15 ||
            ((p.assigned || 0) >= 5 && (p.won || 0) === 0)
          );
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "conversionRate") {
          return (b.conversionRate || 0) - (a.conversionRate || 0);
        }
        if (sortBy === "callsMade") {
          return (
            (b.callsMade ?? b.followupsCompleted ?? 0) -
            (a.callsMade ?? a.followupsCompleted ?? 0)
          );
        }
        if (sortBy === "assigned") {
          return (b.assigned || 0) - (a.assigned || 0);
        }
        if (sortBy === "activityScore") {
          return (b.activityScore || 0) - (a.activityScore || 0);
        }
        // Default: Rank by deals won
        return (
          (b.won ?? b.converted ?? 0) - (a.won ?? a.converted ?? 0)
        );
      });
  }, [performersList, searchQuery, filterTier, sortBy]);

  // Recharts Chart Dataset
  const chartData = useMemo(() => {
    return filteredAndSortedPerformers.slice(0, 10).map((p) => ({
      name: p.name ? p.name.split(" ")[0] : "Rep",
      fullName: p.name,
      assigned: p.assigned || 0,
      won: p.won || p.converted || 0,
    }));
  }, [filteredAndSortedPerformers]);

  const hasActiveFilters =
    searchQuery.trim() !== "" || filterTier !== "all" || sortBy !== "rank";

  const handleResetFilters = () => {
    setSearchQuery("");
    setFilterTier("all");
    setSortBy("rank");
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreateError("");

    if (isSeatLimitReached) {
      setCreateError(
        `Seat limit reached (${usedSeats}/${totalSeats} seats allocated). Upgrade plan to add more seats.`
      );
      return;
    }

    if (isSubscriptionExpired) {
      setCreateError(
        "Subscription expired. Please contact SalesBuster Admin to renew."
      );
      return;
    }

    if (!newName.trim() || !newEmail.trim() || !newMobile.trim()) {
      setCreateError("Please provide name, email, and mobile number.");
      return;
    }

    const digits = newMobile.replace(/\D/g, "");
    if (digits.length !== 10) {
      setCreateError("Enter a valid 10-digit Indian mobile number.");
      return;
    }

    try {
      setSubmitting(true);
      await addSalesPerson(
        newName.trim(),
        newEmail.trim(),
        `+91${digits}`
      );
      setCreateOpen(false);
      setNewName("");
      setNewEmail("");
      setNewMobile("");
    } catch (err) {
      setCreateError(err.message || "Failed to create representative.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteError("");

    const currentSalesCount =
      salesRepCount ||
      (allUsers || []).filter((u) => u.role === "Sales Representative").length;
    if (currentSalesCount <= 1) {
      setDeleteError(
        "An organization must have at least 1 sales representative. You cannot delete the only representative."
      );
      return;
    }

    try {
      await deleteSalesPerson(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(err.message || "Failed to delete representative.");
    }
  };

  const formatExpiry = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const daysUntilExpiry = organization?.subscriptionEndDate
    ? Math.ceil(
        (new Date(organization.subscriptionEndDate) - new Date()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  if (!isManager) {
    return (
      <div className="p-4 md:p-6 mt-6 max-w-2xl mx-auto text-center">
        <div className="bg-bg-card border border-border-main rounded-2xl p-8 shadow-sm">
          <h2 className="text-xl font-bold text-red-500 mb-3">
            Access Restricted
          </h2>
          <p className="text-text-secondary mb-6 leading-relaxed">
            Only designated <strong>Sales Managers / Organization Owners</strong>{" "}
            have clearance to inspect conversion indices, adjust team capacities, or
            manage sales representative seats.
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 px-6 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-pilot-blue focus-visible:outline-none"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const seatPercentage = Math.min(
    100,
    Math.round((usedSeats / Math.max(1, totalSeats)) * 100)
  );

  const currentPlanRaw = organization?.subscriptionPlan || "monthly";
  const currentPlanName =
    currentPlanRaw.charAt(0).toUpperCase() + currentPlanRaw.slice(1);

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* ── Subscription Expired Alert Banner ─────────────────────────────── */}
      {isSubscriptionExpired && (
        <div
          role="alert"
          className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 sm:p-5 flex items-start gap-4"
        >
          <AlertTriangle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-bold text-red-600 dark:text-red-400">
              Subscription Expired
            </h3>
            <p className="text-xs text-red-600/90 dark:text-red-400/90 mt-1 leading-relaxed">
              Your organization's {currentPlanRaw.toLowerCase()} plan expired on{" "}
              <strong>{formatExpiry(organization?.subscriptionEndDate)}</strong>.
              Adding new sales representatives and leads is currently locked.
              Please contact your SalesBuster Administrator to renew your subscription.
            </p>
          </div>
        </div>
      )}

      {/* ── Subscription Expiring Soon Banner (< 5 days) ──────────────────── */}
      {!isSubscriptionExpired &&
        daysUntilExpiry !== null &&
        daysUntilExpiry <= 5 &&
        daysUntilExpiry >= 0 && (
          <div
            role="status"
            className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3"
          >
            <Calendar className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-bold text-amber-700 dark:text-amber-400">
                Subscription Renews in {daysUntilExpiry} {daysUntilExpiry === 1 ? "day" : "days"}
              </h3>
              <p className="text-xs text-amber-600/90 dark:text-amber-400/80 mt-0.5">
                Your {currentPlanRaw.toLowerCase()} plan will renew on{" "}
                <strong>{formatExpiry(organization?.subscriptionEndDate)}</strong>.
              </p>
            </div>
          </div>
        )}

      {/* ── Page Header with Reporting Scope ─────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-bg-card border border-border-main rounded-2xl p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-black text-text-primary tracking-tight">
              Team Performance & Productivity
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              Pipeline Lifetime Deals • Today's Calls
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Compare representative conversion efficiency, daily phone outreach, and manage licensed team capacity.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => {
              setCreateError("");
              setCreateOpen(true);
            }}
            disabled={isSeatLimitReached || isSubscriptionExpired}
            title={
              isSubscriptionExpired
                ? "Subscription expired. Renewal required."
                : isSeatLimitReached
                ? `Seat limit reached (${usedSeats}/${totalSeats}). Contact admin to upgrade.`
                : "Add a new sales representative"
            }
            aria-label="Add new sales representative"
            className={`flex items-center gap-2 font-bold py-2.5 px-5 rounded-xl transition-all text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-pilot-blue focus-visible:outline-none cursor-pointer ${
              isSeatLimitReached || isSubscriptionExpired
                ? "bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed opacity-60"
                : "bg-gradient-to-tr from-purple-600 to-indigo-600 hover:opacity-95 text-white"
            }`}
          >
            <UserPlus size={18} />
            Add Sales Representative
          </button>
        </div>
      </div>

      {/* ── Executive Team Summary KPI Deck ──────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Active Representatives */}
        <div className="bg-bg-card border border-border-main rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-text-secondary mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Active Team</span>
            <Users size={16} className="text-purple-600 dark:text-purple-400" />
          </div>
          <p className="text-2xl font-black text-text-primary">
            {teamAggregates.totalReps}
          </p>
          <p className="text-[11px] text-text-secondary mt-0.5">
            {usedSeats} / {totalSeats} seats utilized
          </p>
        </div>

        {/* Total Leads Managed */}
        <div className="bg-bg-card border border-border-main rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-text-secondary mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Leads</span>
            <Target size={16} className="text-pilot-blue" />
          </div>
          <p className="text-2xl font-black text-text-primary">
            {teamAggregates.totalAssigned}
          </p>
          <p className="text-[11px] text-text-secondary mt-0.5">
            Active in team pipeline
          </p>
        </div>

        {/* Deals Won / Converted */}
        <div className="bg-bg-card border border-border-main rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-text-secondary mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Deals Won</span>
            <CheckCircle2 size={16} className="text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {teamAggregates.totalWon}
          </p>
          <p className="text-[11px] text-text-secondary mt-0.5">
            Successfully converted
          </p>
        </div>

        {/* Team Conversion Rate */}
        <div className="bg-bg-card border border-border-main rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-text-secondary mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Win Rate</span>
            <TrendingUp size={16} className="text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {teamAggregates.teamConversionRate}%
          </p>
          <p className="text-[11px] text-text-secondary mt-0.5">
            Won ÷ assigned leads
          </p>
        </div>

        {/* Outbound Calls Today */}
        <div className="bg-bg-card border border-border-main rounded-2xl p-4 shadow-2xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-text-secondary mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Calls Today</span>
            <Phone size={16} className="text-amber-500" />
          </div>
          <p className="text-2xl font-black text-text-primary">
            {teamAggregates.totalCallsToday}
          </p>
          <p className="text-[11px] text-text-secondary mt-0.5">
            Outbound calls logged
          </p>
        </div>
      </div>

      {/* ── License & Seat Allocation Card ───────────────────────────────── */}
      <div className="bg-bg-card border border-border-main rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border-main">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
              <Users size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                  {organization?.name || "Organization"} Plan
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck size={12} />
                  {currentPlanName} Subscription
                </span>
              </div>
              <h2 className="text-base font-bold text-text-primary mt-0.5">
                Sales Representative Seat Allocation
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div>
              <span className="text-text-secondary block">Subscription Validity:</span>
              <span className="font-bold text-text-primary">
                Renews on {formatExpiry(organization?.subscriptionEndDate)}
              </span>
            </div>
            <div className="border-l border-border-main pl-4">
              <span className="text-text-secondary block">License Capacity:</span>
              <span className="font-extrabold text-text-primary text-sm">
                {totalSeats} {totalSeats === 1 ? "Seat" : "Seats"}
              </span>
            </div>
          </div>
        </div>

        {/* Progress Bar & Seat Statistics */}
        <div className="pt-4 space-y-2">
          <div className="flex justify-between items-center text-xs font-semibold">
            <span className="text-text-primary">
              Seats Allocated:{" "}
              <strong className="text-sm font-extrabold text-purple-600 dark:text-purple-400">
                {usedSeats}
              </strong>{" "}
              / {totalSeats}
            </span>

            {isSeatLimitReached ? (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-500/10 text-red-500 border border-red-500/20">
                Seat Limit Reached (0 Available)
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                {remainingSeats} {remainingSeats === 1 ? "Seat" : "Seats"} Available
              </span>
            )}
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2.5 bg-bg-secondary rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                seatPercentage >= 100
                  ? "bg-red-500"
                  : seatPercentage >= 80
                  ? "bg-amber-500"
                  : "bg-purple-600"
              }`}
              style={{ width: `${seatPercentage}%` }}
            />
          </div>

          <p className="text-[11px] text-text-secondary pt-0.5">
            {isSeatLimitReached
              ? "All licensed sales representative seats are in use. Contact your SalesBuster Account Representative to add more seats."
              : `You have utilized ${seatPercentage}% of your total seat quota. ${remainingSeats} more sales representatives can be created.`}
          </p>
        </div>
      </div>

      {/* ── Empty State ──────────────────────────────────────────────────── */}
      {performersList.length === 0 && (
        <div className="bg-bg-card border border-dashed border-border-main rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto">
            <Users size={24} />
          </div>
          <h3 className="text-base font-bold text-text-primary">
            No Sales Representatives Found
          </h3>
          <p className="text-xs text-text-secondary max-w-sm mx-auto leading-relaxed">
            Your organization currently has no active sales representatives. Add team members to assign leads, track call activities, and measure conversion performance.
          </p>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl inline-flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <UserPlus size={14} /> Add First Representative
          </button>
        </div>
      )}

      {/* Filtered 0 results empty state */}
      {performersList.length > 0 && filteredAndSortedPerformers.length === 0 && (
        <div className="bg-bg-card border border-border-main rounded-2xl p-8 text-center space-y-2">
          <Search size={24} className="mx-auto text-text-secondary mb-1" />
          <h3 className="text-sm font-bold text-text-primary">
            No representatives match your active filters
          </h3>
          <p className="text-xs text-text-secondary">
            Try adjusting your search query or selecting a different performance tier.
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="mt-2 text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline"
          >
            Reset All Filters
          </button>
        </div>
      )}

      {/* ── Desktop Performance Table (md:block) ─────────────────────────── */}
      {filteredAndSortedPerformers.length > 0 && (
        <div className="hidden md:block bg-bg-card border border-border-main rounded-2xl shadow-xs overflow-hidden overflow-x-auto">
          <table className="w-full text-left text-sm text-text-primary border-collapse min-w-[850px]">
            <thead>
              <tr className="border-b border-border-main bg-bg-secondary/40 text-[11px] font-extrabold uppercase tracking-wider text-text-primary">
                <th scope="col" className="py-4 px-5">RANKING</th>
                <th scope="col" className="py-4 px-5">REPRESENTATIVE NAME</th>
                <th scope="col" className="py-4 px-5">
                  <div className="flex items-center gap-1" title="Total active leads assigned to this representative">
                    LEADS ASSIGNED
                    <HelpCircle size={12} className="text-text-secondary" />
                  </div>
                </th>
                <th scope="col" className="py-4 px-5">
                  <div className="flex items-center gap-1" title="Leads successfully marked as Converted">
                    DEALS WON
                    <HelpCircle size={12} className="text-text-secondary" />
                  </div>
                </th>
                <th scope="col" className="py-4 px-5">
                  <div className="flex items-center gap-1" title="Outbound calls logged through CRM today">
                    CALLS TODAY
                    <HelpCircle size={12} className="text-text-secondary" />
                  </div>
                </th>
                <th scope="col" className="py-4 px-5">
                  <div className="flex items-center gap-1" title="Won Deals ÷ Total Assigned Leads">
                    CONVERSION RATE
                    <HelpCircle size={12} className="text-text-secondary" />
                  </div>
                </th>
                <th scope="col" className="py-4 px-5">
                  <div className="flex items-center gap-1" title="Composite benchmark: 60% Conversion + 40% Followup Completion">
                    ACTIVITY SCORE
                    <HelpCircle size={12} className="text-text-secondary" />
                  </div>
                </th>
                <th scope="col" className="py-4 px-5 text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-main">
              {filteredAndSortedPerformers.map((p, index) => {
                const ratingStars = Math.min(
                  5,
                  Math.max(1, Math.round((p.activityScore || 0) / 20))
                );
                const isFirst = index === 0 && sortBy === "rank";
                const isSecond = index === 1 && sortBy === "rank";
                const isThird = index === 2 && sortBy === "rank";

                return (
                  <tr
                    key={p.id || p.name}
                    className="hover:bg-bg-secondary/40 transition-colors"
                  >
                    {/* RANKING */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-1.5 font-bold text-sm text-text-primary">
                        {isFirst && (
                          <Medal className="w-5 h-5 text-amber-500 shrink-0" title="Rank 1" />
                        )}
                        {isSecond && (
                          <Medal className="w-5 h-5 text-slate-400 shrink-0" title="Rank 2" />
                        )}
                        {isThird && (
                          <Medal className="w-5 h-5 text-amber-700 shrink-0" title="Rank 3" />
                        )}
                        {!isFirst && !isSecond && !isThird && (
                          <span className="w-5 text-center inline-block text-text-secondary font-mono text-xs">
                            #{index + 1}
                          </span>
                        )}
                        {(isFirst || isSecond || isThird) && <span>#{index + 1}</span>}
                      </div>
                    </td>

                    {/* REPRESENTATIVE NAME & CONTACT */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-xs shrink-0">
                          {p.name
                            ? p.name
                                .split(" ")
                                .map((w) => w[0])
                                .slice(0, 2)
                                .join("")
                            : "SR"}
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-text-primary text-sm block truncate">
                            {p.name}
                          </span>
                          {(p.phone || p.email) && (
                            <div className="flex items-center gap-1.5 text-xs text-text-secondary font-normal mt-0.5 flex-wrap">
                              {p.phone && <span>{p.phone}</span>}
                              {p.phone && p.email && <span>•</span>}
                              {p.email && <span className="truncate max-w-[160px]">{p.email}</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* LEADS ASSIGNED */}
                    <td className="py-4 px-5 text-text-primary text-sm font-semibold">
                      {p.assigned}
                    </td>

                    {/* DEALS WON */}
                    <td className="py-4 px-5">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                        {p.won ?? p.converted ?? 0}
                      </span>
                    </td>

                    {/* CALLS MADE TODAY */}
                    <td className="py-4 px-5">
                      <span
                        className={`text-sm font-bold ${
                          (p.callsMade ?? p.followupsCompleted ?? 0) > 0
                            ? "text-text-primary"
                            : "text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {p.callsMade ?? p.followupsCompleted ?? 0}
                      </span>
                    </td>

                    {/* CONVERSION RATE % */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                          {p.conversionRate}%
                        </span>
                        <div className="w-16 h-1.5 bg-bg-secondary rounded-full overflow-hidden hidden lg:block">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${Math.min(100, p.conversionRate)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* ACTIVITY RATING & SCORE */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={13}
                              className={
                                star <= ratingStars
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-slate-300 dark:text-slate-600"
                              }
                            />
                          ))}
                        </div>
                        <span className="text-xs font-semibold text-text-secondary ml-1 font-mono">
                          {p.activityScore}/100
                        </span>
                      </div>
                    </td>

                    {/* ACTIONS */}
                    <td className="py-4 px-5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() =>
                            navigate(`/salesperson/${p.id || encodeURIComponent(p.name)}`)
                          }
                          className="p-1.5 rounded-lg text-text-secondary hover:text-purple-600 dark:hover:text-purple-400 hover:bg-bg-secondary transition-colors focus-visible:ring-2 focus-visible:ring-pilot-blue focus-visible:outline-none"
                          title="View representative profile and lead pipeline"
                          aria-label={`View profile for ${p.name}`}
                        >
                          <Eye size={17} />
                        </button>
                        <button
                          onClick={() => {
                            const currentSalesCount =
                              salesRepCount ||
                              (allUsers || []).filter(
                                (u) => u.role === "Sales Representative"
                              ).length;
                            if (currentSalesCount <= 1) {
                              setDeleteError(
                                "An organization must have at least 1 sales representative. You cannot delete the only representative."
                              );
                              setDeleteTarget(p);
                              return;
                            }
                            setDeleteError("");
                            setDeleteTarget(p);
                          }}
                          disabled={
                            p.name?.toLowerCase() ===
                              currentUser?.name?.toLowerCase() ||
                            p.id === currentUser?.id ||
                            (salesRepCount ||
                              (allUsers || []).filter(
                                (u) => u.role === "Sales Representative"
                              ).length) <= 1
                          }
                          title={
                            p.name?.toLowerCase() ===
                            currentUser?.name?.toLowerCase()
                              ? "Cannot delete self"
                              : (salesRepCount ||
                                  (allUsers || []).filter(
                                    (u) => u.role === "Sales Representative"
                                  ).length) <= 1
                              ? "An organization must maintain at least 1 sales representative"
                              : `Delete ${p.name}`
                          }
                          aria-label={`Delete representative ${p.name}`}
                          className="p-1.5 rounded-lg text-text-secondary hover:text-red-600 hover:bg-red-500/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-pilot-blue focus-visible:outline-none"
                        >
                          <Trash2 size={17} />
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

      {/* ── Mobile Responsive Cards View (md:hidden) ─────────────────────── */}
      {filteredAndSortedPerformers.length > 0 && (
        <div className="md:hidden space-y-3">
          {filteredAndSortedPerformers.map((p, index) => {
            const ratingStars = Math.min(
              5,
              Math.max(1, Math.round((p.activityScore || 0) / 20))
            );

            return (
              <div
                key={p.id || p.name}
                className="bg-bg-card border border-border-main rounded-2xl p-4 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-sm shrink-0">
                      {p.name
                        ? p.name
                            .split(" ")
                            .map((w) => w[0])
                            .slice(0, 2)
                            .join("")
                        : "SR"}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-text-primary text-sm truncate">
                          {p.name}
                        </span>
                        <span className="text-[11px] font-bold text-text-secondary bg-bg-secondary px-1.5 py-0.5 rounded shrink-0">
                          #{index + 1}
                        </span>
                      </div>
                      {p.email && (
                        <p className="text-xs text-text-secondary truncate mt-0.5">
                          {p.email}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() =>
                        navigate(`/salesperson/${p.id || encodeURIComponent(p.name)}`)
                      }
                      className="p-2 rounded-lg bg-bg-secondary text-text-secondary hover:text-purple-600 transition-colors"
                      aria-label={`View profile for ${p.name}`}
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => {
                        const currentSalesCount =
                          salesRepCount ||
                          (allUsers || []).filter(
                            (u) => u.role === "Sales Representative"
                          ).length;
                        if (currentSalesCount <= 1) {
                          setDeleteError(
                            "An organization must have at least 1 sales representative. You cannot delete the only representative."
                          );
                          setDeleteTarget(p);
                          return;
                        }
                        setDeleteError("");
                        setDeleteTarget(p);
                      }}
                      disabled={
                        p.name?.toLowerCase() ===
                          currentUser?.name?.toLowerCase() ||
                        p.id === currentUser?.id ||
                        (salesRepCount ||
                          (allUsers || []).filter(
                            (u) => u.role === "Sales Representative"
                          ).length) <= 1
                      }
                      className="p-2 rounded-lg bg-bg-secondary text-text-secondary hover:text-red-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label={`Delete representative ${p.name}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Mobile Metrics 4-Box Grid */}
                <div className="grid grid-cols-4 gap-2 text-center bg-bg-secondary/40 p-2.5 rounded-xl border border-border-main/60">
                  <div>
                    <span className="text-[10px] text-text-secondary block uppercase font-bold">Assigned</span>
                    <span className="text-xs font-bold text-text-primary">{p.assigned}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-text-secondary block uppercase font-bold">Won</span>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{p.won ?? 0}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-text-secondary block uppercase font-bold">Calls</span>
                    <span className="text-xs font-bold text-text-primary">{p.callsMade ?? 0}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-text-secondary block uppercase font-bold">Win %</span>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{p.conversionRate}%</span>
                  </div>
                </div>

                {/* Score & Stars */}
                <div className="flex items-center justify-between text-xs pt-0.5">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={12}
                        className={
                          star <= ratingStars
                            ? "fill-amber-400 text-amber-400"
                            : "text-slate-300 dark:text-slate-600"
                        }
                      />
                    ))}
                  </div>
                  <span className="text-[11px] font-semibold text-text-secondary">
                    Activity: <strong className="text-text-primary">{p.activityScore}/100</strong>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: Add Sales Representative
      ══════════════════════════════════════════════════════════════════════ */}
      {createOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-rep-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="bg-bg-card border border-border-main rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-border-main flex items-center justify-between">
              <div>
                <h3 id="add-rep-modal-title" className="font-bold text-text-primary text-base">
                  Add New Sales Representative
                </h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  Occupies 1 of {totalSeats} licensed seats ({remainingSeats} available).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="p-1 rounded-lg text-text-secondary hover:text-text-primary cursor-pointer"
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            <form
              id="create-form"
              onSubmit={handleCreateSubmit}
              className="p-5 space-y-4"
            >
              {createError && (
                <div
                  role="alert"
                  className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 px-3 py-2 rounded-lg text-xs"
                >
                  {createError}
                </div>
              )}
              <div>
                <label
                  htmlFor="rep-full-name-input"
                  className="block text-xs font-medium text-text-secondary mb-1.5"
                >
                  Representative Full Name
                </label>
                <input
                  id="rep-full-name-input"
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Rachel Green"
                  className="w-full bg-bg-secondary/40 border border-border-main text-text-primary text-xs rounded-xl focus:border-purple-500 block p-2.5 outline-none"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="rep-email-input"
                  className="block text-xs font-medium text-text-secondary mb-1.5"
                >
                  Email Address (Login ID)
                </label>
                <input
                  id="rep-email-input"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="e.g. rachel@example.com"
                  className="w-full bg-bg-secondary/40 border border-border-main text-text-primary text-xs rounded-xl focus:border-purple-500 block p-2.5 outline-none"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="rep-mobile-input"
                  className="block text-xs font-medium text-text-secondary mb-1.5"
                >
                  Mobile Number
                </label>
                <div className="flex rounded-xl bg-bg-secondary/40 border border-border-main focus-within:border-purple-500">
                  <span className="px-3 py-2.5 text-xs font-medium text-text-secondary border-r border-border-main">
                    +91
                  </span>
                  <input
                    id="rep-mobile-input"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={newMobile}
                    onChange={(e) =>
                      setNewMobile(e.target.value.replace(/\D/g, "").slice(0, 10))
                    }
                    placeholder="98765 43210"
                    className="w-full min-w-0 bg-transparent text-text-primary text-xs rounded-r-xl block p-2.5 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="bg-purple-500/10 border border-purple-500/20 text-purple-700 dark:text-purple-300 p-3 rounded-xl text-xs flex items-start gap-2">
                <span className="text-sm shrink-0 mt-0.5">🔐</span>
                <span className="leading-relaxed text-[11px]">
                  A temporary password will be securely generated and emailed to the representative.
                </span>
              </div>
            </form>

            <div className="p-4 border-t border-border-main bg-bg-secondary/30 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="create-form"
                disabled={submitting}
                className="px-4 py-2 bg-gradient-to-tr from-purple-600 to-indigo-600 hover:opacity-95 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer focus-visible:ring-2 focus-visible:ring-pilot-blue"
              >
                {submitting ? "Registering..." : "Register & Send Credentials"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: Delete Rep Confirmation
      ══════════════════════════════════════════════════════════════════════ */}
      {deleteTarget && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-rep-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="bg-bg-card border border-border-main rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-border-main flex items-center justify-between">
              <h3 id="delete-rep-modal-title" className="font-bold text-text-primary text-base">
                Delete Representative Confirmation
              </h3>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="p-1 rounded-lg text-text-secondary hover:text-text-primary cursor-pointer"
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5">
              {deleteError && (
                <div
                  role="alert"
                  className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 px-3 py-2 rounded-lg text-xs mb-3"
                >
                  {deleteError}
                </div>
              )}
              <p className="text-xs text-text-primary leading-relaxed">
                Are you sure you want to delete{" "}
                <strong className="text-text-primary font-bold">
                  {deleteTarget?.name}
                </strong>
                ? Deleting this representative will free up 1 licensed seat in your organization.
              </p>
            </div>
            <div className="p-4 border-t border-border-main bg-bg-secondary/30 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm cursor-pointer"
              >
                Confirm Delete & Free Seat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
