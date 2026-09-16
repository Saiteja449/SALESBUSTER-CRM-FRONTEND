import React, { useEffect } from "react";
import { LogOut, X, AlertTriangle } from "lucide-react";

export default function LogoutConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  currentUser = null,
  organization = null,
}) {
  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const displayName = currentUser?.name || "User";
  const userInitial = displayName.charAt(0).toUpperCase();
  const displayEmail = currentUser?.email || "";
  const displayRole = currentUser?.role || "";
  const displayOrg = organization?.name || currentUser?.organizationName || "";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/65 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-modal-title"
    >
      <div
        className="relative w-full max-w-md bg-bg-card border border-border-main rounded-2xl shadow-2xl overflow-hidden animate-scaleUp text-text-primary"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top subtle danger gradient accent line */}
        <div className="h-1.5 w-full bg-gradient-to-r from-red-500 via-rose-500 to-amber-500" />

        {/* Close button in top right */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-secondary/60 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-7">
          {/* Glowing Alert / Sign-out Badge */}
          <div className="flex justify-center mb-5">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 dark:bg-red-500/20 border border-red-500/20 flex items-center justify-center text-red-600 dark:text-red-400 shadow-inner">
                <LogOut className="w-8 h-8 -ml-0.5" />
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-white shadow-sm ring-2 ring-bg-card">
                <AlertTriangle className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          {/* Modal Titles */}
          <div className="text-center space-y-1.5">
            <h2
              id="logout-modal-title"
              className="text-xl font-bold tracking-tight text-text-primary"
            >
              Sign Out of SalesBuster CRM?
            </h2>
            <p className="text-sm text-text-secondary leading-relaxed">
              Are you sure you want to end your session? Any unsaved edits will
              not be preserved.
            </p>
          </div>

          {/* User & Workspace Preview Pill */}
          {currentUser && (
            <div className="mt-5 p-3.5 rounded-xl bg-bg-secondary/60 dark:bg-bg-secondary/40 border border-border-main/80 flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-bold text-base flex items-center justify-center shrink-0 shadow-xs">
                {userInitial}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-text-primary truncate">
                    {displayName}
                  </span>
                  {displayRole && (
                    <span className="shrink-0 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                      {displayRole}
                    </span>
                  )}
                </div>
                <div className="text-xs text-text-secondary truncate mt-0.5">
                  {displayEmail || displayOrg || "Active Session"}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-6 flex flex-col-reverse sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:flex-1 py-2.5 px-4 rounded-xl border border-border-main bg-bg-card hover:bg-bg-secondary text-text-primary font-semibold text-sm transition-all duration-150 active:scale-[0.98] cursor-pointer"
            >
              Stay Logged In
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-semibold text-sm shadow-md shadow-red-500/25 transition-all duration-150 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Yes, Log Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
