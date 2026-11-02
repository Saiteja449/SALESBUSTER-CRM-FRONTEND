import { useState, useRef, useEffect } from "react";
import { Copy, Check, X, Bot, User } from "lucide-react";

export default function TranscriptPanel({
  turns = [],
  isOpen = true,
  onClose,
}) {
  const [copied, setCopied] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [turns]);

  const handleCopy = async () => {
    try {
      const text = turns
        .map((t) => `${t.role === "user" ? "You" : "Analyst"}: ${t.text}`)
        .join("\n\n");
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy transcript:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="flex flex-col h-full bg-bg-card border-l border-border-main p-4 w-full md:w-80 lg:w-96">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border-main shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-text-primary">
            Live Transcript
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-bg-secondary text-text-secondary font-mono">
            {turns.length}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleCopy}
            className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-colors cursor-pointer"
            title="Copy entire transcript"
            aria-label="Copy transcript to clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-colors cursor-pointer"
              title="Close transcript"
              aria-label="Close transcript"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Turn list */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto py-3 space-y-3 pr-1">
        {turns.length === 0 ? (
          <div className="text-center py-10 text-xs text-text-secondary">
            No turns spoken yet. Say something to start your analysis.
          </div>
        ) : (
          turns.map((t, idx) => {
            const isUser = t.role === "user";
            return (
              <div
                key={t.id || idx}
                className={`flex gap-2.5 text-xs ${isUser ? "flex-row-reverse" : "flex-row"}`}
              >
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    isUser
                      ? "bg-purple-600 text-white"
                      : "bg-bg-secondary text-purple-600 dark:text-purple-400 border border-border-main"
                  }`}
                >
                  {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>

                <div
                  className={`p-2.5 rounded-2xl max-w-[85%] leading-relaxed ${
                    isUser
                      ? "bg-purple-600/10 text-text-primary border border-purple-500/20"
                      : "bg-bg-secondary/60 text-text-primary border border-border-main/50"
                  }`}
                >
                  <p>{t.text}</p>
                  {t.ts && (
                    <span className="block text-[9px] text-text-secondary/60 mt-1">
                      {new Date(t.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

