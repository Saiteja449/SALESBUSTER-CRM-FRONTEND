import { useState } from "react";
import {
  Mail,
  Send,
  X,
  Check,
  Eye,
  EyeOff,
  Clock,
  TrendingUp,
  Award,
  PhoneCall,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export default function EmailConfirmationCard({
  draft,
  onConfirm,
  isVoice = false,
  onDismiss,
}) {
  const [showPreview, setShowPreview] = useState(false);
  const [submittingAction, setSubmittingAction] = useState(null); // "send" | "cancel" | null

  if (!draft) return null;

  const {
    draftId,
    periodLabel = "Today",
    recipientName = "Sales Representative",
    recipientEmail = "",
    subject = "Sales Performance Report",
    stats = {},
    htmlPreview = "",
    status: draftStatus = "draft",
  } = draft;

  const status = submittingAction === "send" ? "sending" : submittingAction === "cancel" ? "cancelled" : draftStatus;

  const handleAction = async (confirmed) => {
    if (status === "sending") return;
    setSubmittingAction(confirmed ? "send" : "cancel");
    try {
      if (onConfirm) {
        await onConfirm(draftId, confirmed);
      }
    } catch (err) {
      console.error("Failed to execute email confirmation:", err);
      setSubmittingAction(null);
    }
  };

  const {
    totalLeads = 0,
    convertedLeads = 0,
    conversionRate = "0%",
    totalDealValue = "₹0",
    followUps = 0,
    totalCalls = 0,
    connectedCalls = 0,
    talkTime = "0s",
  } = stats || {};

  return (
    <div
      className={`w-full rounded-2xl border transition-all duration-200 overflow-hidden shadow-lg ${
        isVoice
          ? "bg-slate-900/95 border-slate-700 text-slate-100 shadow-2xl backdrop-blur-md"
          : "bg-bg-card border-border-main text-text-primary shadow-md"
      }`}
    >
      {/* Top Banner / Status Header */}
      <div
        className={`px-4 py-3 flex items-center justify-between border-b ${
          isVoice
            ? "bg-slate-800/80 border-slate-700"
            : "bg-bg-secondary/70 border-border-main/70"
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-500 flex items-center justify-center shrink-0">
            <Mail className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold tracking-tight">
              Report Email Confirmation
            </h4>
            <p className="text-[11px] opacity-70">
              Review performance metrics before dispatching
            </p>
          </div>
        </div>

        {/* Status Pill */}
        <div className="flex items-center gap-2">
          {status === "sending" && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30 animate-pulse">
              <Loader2 className="w-3 h-3 animate-spin" />
              Sending...
            </span>
          )}
          {status === "sent" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="w-3 h-3" />
              Sent
            </span>
          )}
          {status === "cancelled" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-500/20 text-slate-400 border border-slate-500/30">
              <AlertCircle className="w-3 h-3" />
              Cancelled
            </span>
          )}
          {status === "draft" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-500 border border-amber-500/30">
              <Clock className="w-3 h-3" />
              Awaiting Confirmation
            </span>
          )}

          {onDismiss && status !== "sending" && (
            <button
              type="button"
              onClick={onDismiss}
              className="p-1 rounded-lg opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
              title="Close card"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Recipient & Subject Summary */}
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2 p-2 rounded-xl bg-blue-500/5 border border-blue-500/10">
            <span className="font-semibold opacity-70">Recipient:</span>
            <span className="font-bold truncate text-blue-600 dark:text-blue-400">
              {recipientName}
            </span>
            {recipientEmail && (
              <span className="opacity-60 text-[10px] truncate">({recipientEmail})</span>
            )}
          </div>

          <div className="flex items-center gap-2 p-2 rounded-xl bg-purple-500/5 border border-purple-500/10">
            <span className="font-semibold opacity-70">Report Period:</span>
            <span className="font-bold text-purple-600 dark:text-purple-400">
              {periodLabel}
            </span>
          </div>
        </div>

        {subject && (
          <div className="text-xs p-2 rounded-xl bg-bg-secondary/40 border border-border-main/40 truncate">
            <span className="font-semibold opacity-70 mr-1.5">Subject:</span>
            <span className="font-mono text-[11px] opacity-90">{subject}</span>
          </div>
        )}

        {/* 4-Box Key Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          {/* 1. Leads Handled */}
          <div className="p-2.5 rounded-xl border bg-bg-secondary/40 border-border-main/60 text-center">
            <div className="flex items-center justify-center gap-1 text-[10px] font-semibold opacity-70 uppercase tracking-wider mb-0.5">
              <TrendingUp className="w-3 h-3 text-blue-500" />
              <span>Leads</span>
            </div>
            <div className="text-lg font-extrabold font-mono">{totalLeads}</div>
            <div className="text-[10px] opacity-60 mt-0.5">Follow-ups: {followUps}</div>
          </div>

          {/* 2. Converted Deals */}
          <div className="p-2.5 rounded-xl border bg-emerald-500/5 border-emerald-500/20 text-center">
            <div className="flex items-center justify-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-0.5">
              <Award className="w-3 h-3" />
              <span>Converted</span>
            </div>
            <div className="text-lg font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
              {convertedLeads}
            </div>
            <div className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">
              Win Rate: {conversionRate}
            </div>
          </div>

          {/* 3. Deal Value */}
          <div className="p-2.5 rounded-xl border bg-blue-500/5 border-blue-500/20 text-center">
            <div className="flex items-center justify-center gap-1 text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-0.5">
              <span>Deal Value</span>
            </div>
            <div className="text-lg font-extrabold font-mono text-blue-600 dark:text-blue-400 truncate">
              {totalDealValue}
            </div>
            <div className="text-[10px] opacity-60 mt-0.5">Pipeline</div>
          </div>

          {/* 4. Calls & Talk Time */}
          <div className="p-2.5 rounded-xl border bg-purple-500/5 border-purple-500/20 text-center">
            <div className="flex items-center justify-center gap-1 text-[10px] font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-0.5">
              <PhoneCall className="w-3 h-3" />
              <span>Calls</span>
            </div>
            <div className="text-lg font-extrabold font-mono text-purple-600 dark:text-purple-400">
              {totalCalls}
            </div>
            <div className="text-[10px] opacity-60 mt-0.5">Talk: {talkTime}</div>
          </div>
        </div>

        {/* Expandable Email HTML Preview */}
        {htmlPreview && (
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowPreview((prev) => !prev)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              {showPreview ? (
                <>
                  <EyeOff className="w-3.5 h-3.5" />
                  Hide Full Email Preview
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  Preview Email Template &rarr;
                </>
              )}
            </button>

            {showPreview && (
              <div className="mt-2 rounded-xl overflow-hidden border border-border-main/70 bg-white shadow-inner max-h-72 overflow-y-auto">
                <iframe
                  title="Report Email Preview"
                  srcDoc={htmlPreview}
                  className="w-full h-64 border-0"
                  sandbox="allow-same-origin"
                />
              </div>
            )}
          </div>
        )}

        {/* Action Buttons Row */}
        {status === "draft" && (
          <div className="flex items-center gap-2 pt-2 border-t border-border-main/50">
            <button
              type="button"
              onClick={() => handleAction(true)}
              disabled={status === "sending"}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] transition-all shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Email Now</span>
            </button>

            <button
              type="button"
              onClick={() => handleAction(false)}
              disabled={status === "sending"}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-text-secondary hover:text-text-primary bg-bg-secondary hover:bg-bg-secondary/80 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
            >
              <X className="w-3.5 h-3.5 inline mr-1" />
              <span>Discard / Cancel</span>
            </button>
          </div>
        )}

        {status === "sent" && (
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>
              This sales performance report email was dispatched successfully.
            </span>
          </div>
        )}

        {status === "cancelled" && (
          <div className="p-2.5 rounded-xl bg-slate-500/10 border border-slate-500/20 text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Email report was cancelled and not sent.</span>
          </div>
        )}
      </div>
    </div>
  );
}

