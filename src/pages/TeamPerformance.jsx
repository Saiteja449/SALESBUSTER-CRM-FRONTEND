import React, { useState } from "react";
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
} from "lucide-react";
import { useDashboard } from "../context/DashboardContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function TeamPerformance() {
  const navigate = useNavigate();
  const { performersList } = useDashboard();
  const {
    currentUser,
    organization,
    allUsers = [],
    salesRepCount = 0,
    totalSeats,
    usedSeats,
    remainingSeats,
    isSeatLimitReached,
    isSubscriptionExpired,
    addSalesPerson,
    deleteSalesPerson,
  } = useAuth();

  const isManager = currentUser && currentUser.role === "Sales Manager";

  // ── Sales Rep creation ────────────────────────────────────────────────────
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [createError, setCreateError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ── Rep deletion ───────────────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState("");

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

    if (!newName.trim() || !newEmail.trim() || !newPassword) {
      setCreateError("All fields are required.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setCreateError("Passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      setCreateError("Password must be at least 6 characters.");
      return;
    }

    try {
      setSubmitting(true);
      await addSalesPerson(
        newName.trim(),
        newEmail.trim(),
        newPassword
      );
      setCreateOpen(false);
      setNewName("");
      setNewEmail("");
      setNewPassword("");
      setConfirmPassword("");
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

  // Calculate days until expiration
  const daysUntilExpiry = organization?.subscriptionEndDate
    ? Math.ceil(
        (new Date(organization.subscriptionEndDate) - new Date()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  if (!isManager) {
    return (
      <div className="p-4 md:p-6 mt-6 max-w-2xl mx-auto text-center">
        <div className="bg-brand-light border border-brand-secondary rounded-2xl p-8 shadow-sm">
          <h2 className="text-xl font-bold text-red-500 mb-3">
            Access Restricted
          </h2>
          <p className="text-brand-primary/70 mb-6 leading-relaxed">
            Only designated <strong>Sales Managers / Organization Owners</strong>{" "}
            have clearance to inspect conversion indices, adjust team capacities, or
            manage sales representative seats.
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-purple-600 hover:bg-purple-700 text-brand-light font-bold py-2.5 px-6 rounded-lg transition-colors"
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
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 sm:p-5 flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-bold text-red-600 dark:text-red-400">
              Subscription Expired
            </h3>
            <p className="text-xs text-red-500/90 mt-1">
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
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3">
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

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-brand-light border border-brand-secondary rounded-2xl p-5 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-brand-primary tracking-tight">
            Team Performance & Management
          </h1>
          <p className="text-xs text-brand-primary/70 mt-1">
            Track conversion weights, follow-up index completions, and manage team seats.
          </p>
        </div>

        <div className="flex items-center gap-3">
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
            className={`flex items-center gap-2 font-bold py-2.5 px-5 rounded-xl transition-all text-sm shadow-sm ${
              isSeatLimitReached || isSubscriptionExpired
                ? "bg-slate-400 dark:bg-slate-700 text-slate-200 dark:text-slate-400 cursor-not-allowed opacity-60"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            <UserPlus size={18} />
            Add Sales Representative
          </button>
        </div>
      </div>

      {/* ── License & Seat Allocation Card ───────────────────────────────── */}
      <div className="bg-brand-light border border-brand-secondary rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-brand-secondary/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 shrink-0">
              <Users size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                  {organization?.name || "Organization"} Plan
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  <ShieldCheck size={12} />
                  {currentPlanName} Subscription
                </span>
              </div>
              <h2 className="text-base font-bold text-brand-primary mt-0.5">
                Sales Representative Seat Allocation
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div>
              <span className="text-brand-primary/60 block">Subscription Validity:</span>
              <span className="font-bold text-brand-primary">
                Renews on {formatExpiry(organization?.subscriptionEndDate)}
              </span>
            </div>
            <div className="border-l border-brand-secondary pl-4">
              <span className="text-brand-primary/60 block">License Capacity:</span>
              <span className="font-extrabold text-brand-primary text-sm">
                {totalSeats} {totalSeats === 1 ? "Seat" : "Seats"}
              </span>
            </div>
          </div>
        </div>

        {/* Progress Bar & Seat Statistics */}
        <div className="pt-4 space-y-2">
          <div className="flex justify-between items-center text-xs font-semibold">
            <span className="text-brand-primary">
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

          {/* Animated Bar */}
          <div className="w-full h-3 bg-brand-secondary/40 rounded-full overflow-hidden">
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

          <p className="text-[11px] text-brand-primary/60 pt-1">
            {isSeatLimitReached
              ? "All licensed sales representative seats are in use. Contact your SalesBuster Account Representative to add more seats."
              : `You have utilized ${seatPercentage}% of your total seat quota. ${remainingSeats} more sales representatives can be created.`}
          </p>
        </div>
      </div>

      {/* ── Top Performer Cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {performersList.map((p, index) => {
          const initials = p.name
            .split(" ")
            .map((w) => w[0])
            .join("");
          const isTop = index === 0;
          const isSecond = index === 1;

          return (
            <div
              key={p.name}
              className={`relative bg-brand-light rounded-3xl p-6 text-center transition-all hover:-translate-y-0.5 shadow-xs ${
                isTop
                  ? "border-2 border-amber-400 shadow-[0_4px_20px_-4px_rgba(245,158,11,0.2)]"
                  : "border border-brand-secondary"
              }`}
            >
              {isTop && (
                <div className="absolute top-4 right-4 text-amber-500">
                  <Trophy size={26} strokeWidth={1.8} />
                </div>
              )}

              <div
                className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl mb-3 shadow-xs ${
                  isTop
                    ? "bg-[#f59e0b]"
                    : isSecond
                    ? "bg-blue-600"
                    : "bg-slate-700"
                }`}
              >
                {initials}
              </div>

              <h3 className="text-lg font-bold text-brand-primary leading-tight">
                {p.name}
              </h3>
              <span className="text-xs text-brand-primary/70 block mt-1 mb-3">
                Rank #{index + 1} • {p.assigned} Leads Managed
              </span>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-amber-50/90 text-amber-700 border border-amber-200/80">
                <Activity size={13} className="text-amber-600" />
                <span>Score: {p.activityScore} / 100</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Performance Table ──────────────────────────────────────────────── */}
      <div className="bg-brand-light border border-brand-secondary rounded-2xl shadow-xs overflow-hidden overflow-x-auto">
        <table className="w-full text-left text-sm text-brand-primary border-collapse min-w-[850px]">
          <thead>
            <tr className="border-b border-brand-secondary/70 bg-brand-light text-[11px] font-extrabold uppercase tracking-wider text-brand-primary">
              <th className="py-4 px-6">RANKING</th>
              <th className="py-4 px-6">REPRESENTATIVE NAME</th>
              <th className="py-4 px-6">LEADS ASSIGNED</th>
              <th className="py-4 px-6">LEADS WON</th>
              <th className="py-4 px-6">CALLS MADE</th>
              <th className="py-4 px-6">CONVERSION RATE %</th>
              <th className="py-4 px-6">ACTIVITY RATING</th>
              <th className="py-4 px-6 text-center">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-secondary/40">
            {performersList.map((p, index) => {
              const ratingStars = Math.min(
                5,
                Math.max(1, Math.round((p.activityScore || 0) / 20))
              );

              return (
                <tr
                  key={p.name}
                  className="hover:bg-brand-secondary/20 transition-colors"
                >
                  {/* RANKING */}
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-1.5 font-bold text-sm text-brand-primary">
                      {index === 0 ? (
                        <Medal className="w-5 h-5 text-amber-500 shrink-0" />
                      ) : (
                        <span className="w-5 inline-block"></span>
                      )}
                      <span>#{index + 1}</span>
                    </div>
                  </td>

                  {/* REPRESENTATIVE NAME */}
                  <td className="py-4 px-6">
                    <span className="font-bold text-brand-primary text-sm">
                      {p.name}
                    </span>
                  </td>

                  {/* LEADS ASSIGNED */}
                  <td className="py-4 px-6 text-brand-primary/80 text-sm font-medium">
                    {p.assigned}
                  </td>

                  {/* LEADS WON */}
                  <td className="py-4 px-6 text-brand-primary/80 text-sm font-medium">
                    {p.won ?? p.converted ?? 0}
                  </td>

                  {/* CALLS MADE */}
                  <td className="py-4 px-6 font-bold text-brand-primary text-sm">
                    {p.callsMade ?? p.followupsCompleted ?? 0}
                  </td>

                  {/* CONVERSION RATE % */}
                  <td className="py-4 px-6">
                    <span className="font-bold text-emerald-600 text-sm">
                      {p.conversionRate}%
                    </span>
                  </td>

                  {/* ACTIVITY RATING */}
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={14}
                          className={
                            star <= ratingStars
                              ? "fill-amber-400 text-amber-400"
                              : "text-slate-300 dark:text-slate-600"
                          }
                        />
                      ))}
                    </div>
                  </td>

                  <td className="py-4 px-6 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={() =>
                          navigate(`/salesperson/${p.id || encodeURIComponent(p.name)}`)
                        }
                        className="text-brand-primary/60 hover:text-blue-600 transition-colors"
                        title="View Details"
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
                          (salesRepCount || (allUsers || []).filter((u) => u.role === "Sales Representative").length) <= 1
                        }
                        title={
                          p.name?.toLowerCase() ===
                          currentUser?.name?.toLowerCase()
                            ? "Cannot delete self"
                            : (salesRepCount || (allUsers || []).filter((u) => u.role === "Sales Representative").length) <= 1
                            ? "An organization must maintain at least 1 sales representative"
                            : "Delete representative"
                        }
                        className="text-brand-primary/60 hover:text-red-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
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

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: Add Sales Representative
      ══════════════════════════════════════════════════════════════════════ */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-brand-light border border-brand-secondary rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-brand-secondary">
              <h3 className="font-bold text-brand-primary text-lg">
                Add New Sales Representative
              </h3>
              <p className="text-xs text-brand-primary/60 mt-0.5">
                Occupies 1 of {totalSeats} licensed seats ({remainingSeats} remaining).
              </p>
            </div>

            <form
              id="create-form"
              onSubmit={handleCreateSubmit}
              className="p-5 space-y-4"
            >
              {createError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-3 py-2 rounded-lg text-sm">
                  {createError}
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-brand-primary/70 mb-1.5">
                  Representative Full Name
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Rachel Green"
                  className="w-full bg-brand-light border border-brand-secondary text-brand-primary text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-brand-primary/70 mb-1.5">
                  Email Address (Login ID)
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="e.g. rachel@example.com"
                  className="w-full bg-brand-light border border-brand-secondary text-brand-primary text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-brand-primary/70 mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter a secure password"
                  className="w-full bg-brand-light border border-brand-secondary text-brand-primary text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-brand-primary/70 mb-1.5">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm the password"
                  className="w-full bg-brand-light border border-brand-secondary text-brand-primary text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none"
                  required
                />
              </div>
            </form>

            <div className="p-4 border-t border-brand-secondary bg-brand-light flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="px-4 py-2 text-sm font-medium text-brand-primary/70 hover:text-brand-primary transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="create-form"
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-bold rounded-lg transition-colors shadow-sm"
              >
                {submitting ? "Registering..." : "Register Representative"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: Delete Rep Confirmation
      ══════════════════════════════════════════════════════════════════════ */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-brand-light border border-brand-secondary rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-brand-secondary">
              <h3 className="font-bold text-brand-primary text-lg">
                Delete Representative Confirmation
              </h3>
            </div>
            <div className="p-5">
              {deleteError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-3 py-2 rounded-lg text-sm mb-4">
                  {deleteError}
                </div>
              )}
              <p className="text-sm text-brand-primary leading-relaxed">
                Are you sure you want to delete{" "}
                <strong className="text-brand-primary">
                  {deleteTarget?.name}
                </strong>
                ? Deleting this representative will free up 1 licensed seat in your organization.
              </p>
            </div>
            <div className="p-4 border-t border-brand-secondary bg-brand-light flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-sm font-medium text-brand-primary/70 hover:text-brand-primary transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-lg transition-colors shadow-sm"
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
