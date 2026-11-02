import { ArrowDown } from "lucide-react";

export default function JumpToLatest({ visible, onClick }) {
  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed bottom-28 right-8 z-30 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-bg-card/95 hover:bg-bg-card text-text-primary text-xs font-semibold shadow-lg border border-border-main backdrop-blur-md transition-all hover:scale-105 active:scale-95 cursor-pointer focus-visible:ring-2 focus-visible:ring-purple-500 animate-in fade-in slide-in-from-bottom-2 duration-200"
      aria-label="Jump to latest message"
    >
      <ArrowDown className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 animate-bounce" />
      <span>Jump to latest</span>
    </button>
  );
}
