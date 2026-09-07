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
} from "lucide-react";
import { useDashboard } from "../context/DashboardContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function TeamPerformance() {
  const navigate = useNavigate();
  const { performersList } = useDashboard();
  const { currentUser, addSalesPerson, deleteSalesPerson } = useAuth();

  const isManager = currentUser && currentUser.role === "Sales Manager";

  // ── Sales Rep creation ────────────────────────────────────────────────────
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [createError, setCreateError] = useState("");

  // ── Rep deletion ───────────────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState("");

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreateError("");

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

    const res = await addSalesPerson(
      newName.trim(),
      newEmail.trim(),
      newPassword,
    );
    if (res.success) {
      setCreateOpen(false);
      setNewName("");
      setNewEmail("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      setCreateError(res.message || "Failed to create representative.");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteError("");
    const res = await deleteSalesPerson(deleteTarget.id);
    if (res.success) {
      setDeleteTarget(null);
    } else {
      setDeleteError(res.message || "Failed to delete representative.");
    }
  };

  if (!isManager) {
    return (
      <div className="p-4 md:p-6 mt-6 max-w-2xl mx-auto text-center">
        <div className="bg-brand-light border border-brand-secondary rounded-2xl p-8 shadow-sm">
          <h2 className="text-xl font-bold text-red-500 mb-3">
            Access Restricted
          </h2>
          <p className="text-brand-primary/70 mb-6 leading-relaxed">
            Only designated <strong>Sales Managers</strong> have clearance to
            inspect individual conversion indices, adjust team capacities, or
            manage sales representative accounts.
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

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-brand-light border border-brand-secondary rounded-2xl p-5 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-brand-primary tracking-tight">
            Team Performance & Management
          </h1>
          <p className="text-xs text-brand-primary/70 mt-1">
            Track conversion weights, follow-up index completions, and converted
            leads per representative.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setCreateError("");
              setCreateOpen(true);
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-5 rounded-xl transition-colors text-sm shadow-sm"
          >
            <UserPlus size={18} />
            Add Sales Representative
          </button>
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
                Math.max(1, Math.round((p.activityScore || 0) / 20)),
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
                          navigate(`/salesperson/${encodeURIComponent(p.name)}`)
                        }
                        className="text-brand-primary/60 hover:text-blue-600 transition-colors"
                        title="View Details"
                      >
                        <Eye size={17} />
                      </button>
                      <button
                        onClick={() => {
                          setDeleteError("");
                          setDeleteTarget(p);
                        }}
                        disabled={
                          p.name?.toLowerCase() ===
                            currentUser?.name?.toLowerCase() ||
                          p.id === currentUser?.id
                        }
                        title={
                          p.name?.toLowerCase() ===
                          currentUser?.name?.toLowerCase()
                            ? "Cannot delete self"
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
                  System/Inbox Email Address
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="e.g. rachel@kranthielevators.com"
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
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-colors shadow-sm"
              >
                Register Representative
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
                </strong>{" "}
                from Kranthi Elevators Workspace? This will remove their profile
                from the dynamic leaderboards and team allocations.
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
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
