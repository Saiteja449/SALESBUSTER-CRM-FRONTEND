import { Mic, ShieldCheck } from "lucide-react";

export default function PrePermissionCard({ onAllow, onCancel }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Microphone permission required"
      className="p-6 sm:p-8 rounded-3xl bg-bg-card border border-border-main text-center shadow-xl max-w-md w-full space-y-4 animate-in fade-in zoom-in-95 duration-200"
    >
      <div className="w-16 h-16 rounded-2xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto shadow-sm">
        <Mic className="w-8 h-8" />
      </div>

      <div className="space-y-1.5">
        <h3 className="text-lg font-bold text-text-primary">
          Allow Microphone to Talk to BI Analyst
        </h3>
        <p className="text-xs text-text-secondary leading-relaxed">
          Enable microphone streaming for hands-free conversations with your CRM pipeline and revenue metrics.
        </p>
      </div>

      <div className="p-3 rounded-xl bg-bg-secondary/60 text-xs text-text-secondary flex items-start gap-2.5 text-left border border-border-main/50">
        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <span>
          Audio is streamed securely through tenant-isolated sessions and is never used to train public AI models.
        </span>
      </div>

      <div className="flex items-center gap-2.5 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-text-secondary hover:text-text-primary bg-bg-secondary hover:bg-bg-secondary/80 transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onAllow}
          className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 transition-colors shadow-md shadow-purple-600/20 cursor-pointer"
        >
          Allow &amp; Start
        </button>
      </div>
    </div>
  );
}

