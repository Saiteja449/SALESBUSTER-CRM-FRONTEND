import { CornerDownRight, Sparkles } from "lucide-react";

export default function FollowUpChips({ options = [], onSelectOption, disabled = false }) {
  if (!Array.isArray(options) || options.length === 0) return null;

  return (
    <div
      className="mt-3.5 p-3 rounded-2xl bg-purple-500/5 dark:bg-purple-950/25 border border-purple-500/20 shadow-2xs space-y-2 animate-in fade-in duration-200"
      role="region"
      aria-label="Suggested follow-up questions"
    >
      <div className="flex items-center gap-1.5 text-[11px] font-bold text-purple-700 dark:text-purple-300">
        <Sparkles className="w-3.5 h-3.5" />
        <span>Ask next:</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {options.map((opt, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSelectOption?.(opt)}
            disabled={disabled}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-bg-card border border-border-main hover:border-purple-500 hover:bg-purple-50/50 dark:hover:bg-purple-950/40 text-xs font-semibold text-text-primary hover:text-purple-700 dark:hover:text-purple-300 transition-all duration-150 shadow-2xs hover:shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-left active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:outline-none"
          >
            <CornerDownRight className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0 stroke-[2.5]" />
            <span>{opt}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
