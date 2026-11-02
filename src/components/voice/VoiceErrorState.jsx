import { AlertCircle, RotateCcw, MessageSquare } from "lucide-react";

export default function VoiceErrorState({
  error,
  onRetry,
  onTypeInstead,
  onClose,
}) {
  return (
    <div
      role="alert"
      className="p-6 rounded-3xl bg-bg-card border border-rose-500/30 text-center shadow-xl max-w-md w-full space-y-4 animate-in fade-in zoom-in-95 duration-200"
    >
      <div className="w-14 h-14 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
        <AlertCircle className="w-7 h-7" />
      </div>

      <div className="space-y-1">
        <h3 className="text-base font-bold text-text-primary">
          Voice Connection Interrupted
        </h3>
        <p className="text-xs text-text-secondary leading-relaxed">
          {error || "Could not communicate with the real-time voice server. Check your connection."}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="w-full sm:flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
        )}
        {onTypeInstead && (
          <button
            type="button"
            onClick={onTypeInstead}
            className="w-full sm:flex-1 py-2.5 rounded-xl text-xs font-semibold text-text-primary bg-bg-secondary hover:bg-bg-secondary/80 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Type Instead</span>
          </button>
        )}
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-text-secondary hover:text-text-primary underline pt-1 cursor-pointer"
        >
          Close
        </button>
      )}
    </div>
  );
}
