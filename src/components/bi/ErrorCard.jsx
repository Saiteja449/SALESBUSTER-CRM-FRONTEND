import { AlertCircle, RotateCcw, X } from "lucide-react";

export default function ErrorCard({ error, onRetry, onDismiss }) {
  if (!error) return null;

  return (
    <div
      role="alert"
      className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between gap-3 shadow-2xs animate-in fade-in duration-200"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
        <span className="truncate font-medium">{error}</span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-600 text-white hover:bg-rose-700 font-semibold transition-colors cursor-pointer shadow-2xs focus-visible:ring-1 focus-visible:ring-rose-500"
            title="Retry failed query"
            aria-label="Retry query"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Retry</span>
          </button>
        )}
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="p-1 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer focus-visible:ring-1 focus-visible:ring-rose-500"
            title="Dismiss error message"
            aria-label="Dismiss error"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
