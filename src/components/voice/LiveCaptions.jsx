import { ChevronRight, FileText } from "lucide-react";

export default function LiveCaptions({
  turns = [],
  liveTranscript = "",
  status = "idle",
  onOpenTranscript,
}) {
  // Find current and previous turns
  const currentText = liveTranscript || (turns.length > 0 ? turns[turns.length - 1]?.text : "");
  const prevTurn = turns.length > 1 ? turns[turns.length - 2] : null;

  const getPlaceholder = () => {
    if (status === "connecting") return "Connecting to voice server...";
    if (status === "reconnecting") return "Reconnecting...";
    if (status === "tool_running") return "Checking CRM pipeline...";
    if (status === "processing") return "Thinking...";
    if (status === "speaking") return "Analyst speaking...";
    return "Speak freely... listening to your question.";
  };

  return (
    <div className="w-full space-y-2 py-2">
      {/* Previous Turn (Dimmed above) */}
      {prevTurn && (
        <div className="text-xs text-text-secondary/60 line-clamp-1 italic px-2">
          <span className="font-semibold uppercase text-[10px] mr-1.5 not-italic">
            {prevTurn.role === "user" ? "You:" : "Analyst:"}
          </span>
          {prevTurn.text}
        </div>
      )}

      {/* Current Turn in Large Crisp Text */}
      <div
        role="region"
        aria-live="polite"
        className="min-h-[64px] flex items-center justify-center p-3 rounded-2xl bg-bg-secondary/40 border border-border-main/60 text-center"
      >
        <p className="text-base sm:text-lg font-medium text-text-primary leading-relaxed">
          {currentText || (
            <span className="text-text-secondary/70 italic text-sm font-normal">
              {getPlaceholder()}
            </span>
          )}
        </p>
      </div>

      {/* Button to expand full transcript */}
      {turns.length > 0 && onOpenTranscript && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={onOpenTranscript}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-bg-secondary/70 hover:bg-bg-secondary text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
            aria-label="View complete conversation transcript"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Full Transcript ({turns.length} turns)</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

