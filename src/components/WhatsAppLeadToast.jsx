import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare, ExternalLink, X, User, Phone, Briefcase, UserCheck } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Web Audio API notification chime generator (D5 -> A5 pleasant chord)
export const playLeadAlertChime = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // Tone 1: 587.33 Hz (D5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.18, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.3);

    // Tone 2: 880.00 Hz (A5)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(880.0, now + 0.1);
    gain2.gain.setValueAtTime(0.22, now + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.1);
    osc2.stop(now + 0.6);
  } catch (err) {
    // Gracefully handle browser policy or audio disabled
    console.debug("[Toast] Audio chime error:", err);
  }
};

const WhatsAppIcon = ({ className = "w-4 h-4" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm.01 1.67c2.2 0 4.26.86 5.82 2.42a8.2 8.2 0 0 1 2.41 5.82c0 4.54-3.7 8.24-8.24 8.24-1.46 0-2.89-.39-4.15-1.13l-.3-.18-3.1.81.83-3.02-.19-.31A8.2 8.2 0 0 1 3.8 11.91c0-4.54 3.7-8.24 8.25-8.24zm4.51 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.65.81-.8 1-.15.18-.3.2-.55.08-.25-.13-1.07-.39-2.03-1.25-.75-.67-1.26-1.5-1.4-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.3.38-.45.13-.15.17-.25.25-.42.08-.17.04-.32-.02-.45-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.16 0-.43.06-.66.31-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.57.13.17 1.75 2.67 4.24 3.75.59.26 1.06.41 1.42.53.6.19 1.14.16 1.57.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.11-.23-.18-.48-.3z" />
  </svg>
);

export function WhatsAppLeadToastItem({ toast, onDismiss }) {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);
  const duration = 10000; // 10 seconds auto-dismiss
  const intervalRef = useRef(null);

  useEffect(() => {
    if (isPaused) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    const stepMs = 100;
    const decrement = (stepMs / duration) * 100;

    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(intervalRef.current);
          onDismiss(toast.id);
          return 0;
        }
        return Math.max(0, prev - decrement);
      });
    }, stepMs);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPaused, toast.id, onDismiss]);

  const handleOpenChat = () => {
    onDismiss(toast.id);
    const leadId = toast.lead?.id || toast.lead?._id;
    navigate(`/whatsapp?leadId=${leadId}`, {
      state: { selectLeadId: leadId },
    });
  };

  const handleViewLead = () => {
    onDismiss(toast.id);
    const leadId = toast.lead?.id || toast.lead?._id;
    navigate(`/lead-details/${leadId}`);
  };

  const leadName = toast.lead?.name || toast.lead?.phone || "New WhatsApp Contact";
  const leadPhone = toast.lead?.phone || "";
  const service = toast.lead?.service || "General Enquiry";
  const assignedRep = toast.assignedRepName || "Sales Representative";
  const messagePreview = toast.message || "First message from WhatsApp";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.92, transition: { duration: 0.2 } }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative pointer-events-auto w-full max-w-sm sm:max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-emerald-500/40 dark:border-emerald-500/50 shadow-2xl shadow-emerald-500/10 dark:shadow-emerald-900/20 rounded-2xl p-4 overflow-hidden text-slate-800 dark:text-slate-100 select-none group"
      role="alert"
      aria-live="assertive"
    >
      {/* Subtle top accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600" />

      {/* Header Bar */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2">
          {/* Animated WhatsApp badge */}
          <span className="relative flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500 text-white shadow-sm shadow-emerald-500/40">
            <WhatsAppIcon className="w-3.5 h-3.5" />
            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </span>

          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            New WhatsApp Lead
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
            Just now
          </span>
          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            className="p-1 -mr-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Dismiss notification"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Lead Information Card */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-300 font-bold text-xs shrink-0">
              {leadName.charAt(0).toUpperCase()}
            </div>
            <div className="truncate">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                {leadName}
              </h4>
              {leadPhone && (
                <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 font-mono">
                  <Phone className="w-3 h-3 text-emerald-500 shrink-0" />
                  <span>{leadPhone}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Badges row: Service & Assigned Agent */}
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          {service && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60">
              <Briefcase className="w-3 h-3 text-emerald-500 shrink-0" />
              <span className="truncate max-w-[140px]">{service}</span>
            </span>
          )}

          {assignedRep && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/60">
              <UserCheck className="w-3 h-3 text-purple-500 shrink-0" />
              <span className="truncate max-w-[140px]">{assignedRep}</span>
            </span>
          )}
        </div>

        {/* Message preview speech bubble */}
        <div className="relative mt-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300">
          <div className="flex items-start gap-1.5">
            <span className="text-emerald-500 font-bold text-sm leading-none select-none">“</span>
            <p className="line-clamp-2 italic font-normal text-[12px] flex-1 leading-relaxed">
              {messagePreview}
            </p>
            <span className="text-emerald-500 font-bold text-sm leading-none select-none">”</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
        <button
          type="button"
          onClick={handleOpenChat}
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white shadow-sm shadow-emerald-600/30 transition-all cursor-pointer"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Open Chat</span>
        </button>

        <button
          type="button"
          onClick={handleViewLead}
          className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/60 transition-colors cursor-pointer"
        >
          <span>View Lead</span>
          <ExternalLink className="w-3 h-3 text-slate-400" />
        </button>
      </div>

      {/* Auto-dismiss progress countdown line */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <div
          className="h-full bg-emerald-500/70 transition-all ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </motion.div>
  );
}

export default function WhatsAppLeadToastContainer({ toasts = [], onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-5 right-5 z-[9999] flex flex-col-reverse gap-3 pointer-events-none max-w-sm sm:max-w-md w-full px-4 sm:px-0"
      aria-live="polite"
      aria-label="New WhatsApp Lead Notifications"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <WhatsAppLeadToastItem
            key={toast.id}
            toast={toast}
            onDismiss={onDismiss}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
