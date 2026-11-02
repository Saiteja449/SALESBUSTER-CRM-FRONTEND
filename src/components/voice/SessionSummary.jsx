import { MessageSquareCheck, Clock, Sparkles } from "lucide-react";

export default function SessionSummary({
  durationMs = 0,
  turns = [],
  onSaveToChat,
  onDone,
}) {
  const mins = Math.floor(durationMs / 60000);
  const secs = Math.floor((durationMs % 60000) / 1000);
  const durationLabel = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Voice session completed summary"
      className="p-6 sm:p-8 rounded-3xl bg-bg-card border border-border-main text-center shadow-2xl max-w-md w-full space-y-4 animate-in fade-in zoom-in-95 duration-200"
    >
      <div className="w-14 h-14 rounded-2xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto shadow-xs">
        <Sparkles className="w-7 h-7" />
      </div>

      <div className="space-y-1">
        <h3 className="text-lg font-bold text-text-primary">
          Voice Session Completed
        </h3>
        <p className="text-xs text-text-secondary leading-relaxed">
          Great conversation! You can review or save this voice session directly into your BI Analyst chat thread.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-3 py-1">
        <div className="p-3 rounded-2xl bg-bg-secondary/60 border border-border-main/50">
          <div className="flex items-center justify-center gap-1.5 text-xs text-text-secondary mb-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Duration</span>
          </div>
          <span className="text-base font-bold font-mono text-text-primary">
            {durationLabel}
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-bg-secondary/60 border border-border-main/50">
          <div className="flex items-center justify-center gap-1.5 text-xs text-text-secondary mb-1">
            <MessageSquareCheck className="w-3.5 h-3.5" />
            <span>Spoken Turns</span>
          </div>
          <span className="text-base font-bold font-mono text-text-primary">
            {turns.length}
          </span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
        {onSaveToChat && (
          <button
            type="button"
            onClick={onSaveToChat}
            className="w-full sm:flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 transition-colors shadow-md shadow-purple-600/20 cursor-pointer"
          >
            Save to Chat
          </button>
        )}
        <button
          type="button"
          onClick={onDone}
          className="w-full sm:flex-1 py-2.5 rounded-xl text-xs font-semibold text-text-primary bg-bg-secondary hover:bg-bg-secondary/80 transition-colors cursor-pointer"
        >
          Done
        </button>
      </div>
    </div>
  );
}
