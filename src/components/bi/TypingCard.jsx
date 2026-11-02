import { useState, useEffect } from "react";
import { Bot, Square } from "lucide-react";

const STAGES = [
  "Reading your pipeline...",
  "Crunching numbers & conversion rates...",
  "Synthesizing CRM analytics...",
  "Writing the executive summary...",
];

export default function TypingCard({ onStop }) {
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStageIndex((prev) => (prev + 1) % STAGES.length);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className="flex items-start gap-3.5 pt-2 animate-in fade-in duration-200"
    >
      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-xs">
        <Bot className="w-4 h-4 animate-spin" />
      </div>

      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-text-primary">BI Analyst</span>
          {onStop && (
            <button
              type="button"
              onClick={onStop}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition-all cursor-pointer shadow-2xs focus-visible:ring-2 focus-visible:ring-rose-500"
              title="Stop generating response"
              aria-label="Stop generation"
            >
              <Square className="w-3 h-3 fill-current" />
              <span>Stop</span>
            </button>
          )}
        </div>

        <div className="p-3.5 rounded-2xl bg-bg-card border border-border-main space-y-2 shadow-2xs">
          <div className="flex items-center gap-2.5 text-xs text-text-secondary">
            {/* Animated 3 dots */}
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-bounce" />
            </div>
            <span className="font-medium text-text-primary animate-fadeIn key={stageIndex}">
              {STAGES[stageIndex]}
            </span>
          </div>

          <div className="h-1.5 bg-bg-secondary rounded-full overflow-hidden w-full max-w-sm">
            <div className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-500 animate-pulse w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
