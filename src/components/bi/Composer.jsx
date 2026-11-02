import { useRef, useEffect } from "react";
import { ArrowUp, Mic, MicOff, Radio, Square } from "lucide-react";

export default function Composer({
  inputValue,
  onInputChange,
  onSend,
  onStop,
  loading = false,
  disabled = false,
  isVoiceTyping = false,
  onToggleVoiceTyping,
  onOpenLiveVoice,
  isLiveVoiceActive = false,
  onFocusSearch,
}) {
  const textareaRef = useRef(null);

  // Auto-resize textarea height (1-8 lines, max ~180px)
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
    }
  }, [inputValue]);

  // Global keyboard shortcuts: "/" to focus input, "Cmd/Ctrl+K" for search/new chat
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      // Don't trigger if target is an input/textarea/select or modal is open
      const targetTag = e.target?.tagName?.toLowerCase();
      const isInputFocused = targetTag === "input" || targetTag === "textarea" || targetTag === "select";

      if (e.key === "/" && !isInputFocused) {
        e.preventDefault();
        textareaRef.current?.focus();
      }

      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onFocusSearch?.();
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [onFocusSearch]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!loading && inputValue.trim()) {
        onSend();
      }
    } else if (e.key === "Escape") {
      if (loading && onStop) {
        e.preventDefault();
        onStop();
      }
    }
  };

  const showCharCounter = inputValue.length > 1500;
  const isSendDisabled = !inputValue.trim() || disabled;

  return (
    <div className="shrink-0 max-w-3xl sm:max-w-4xl mx-auto w-full px-4 pb-4 pt-1">
      {/* Floating Pill Input Box */}
      <div
        className={`relative rounded-3xl border bg-bg-card shadow-md transition-all p-2 sm:p-3 ${
          isVoiceTyping
            ? "border-rose-500/70 ring-2 ring-rose-500/20 shadow-rose-500/10"
            : disabled
            ? "opacity-60 bg-bg-secondary/40 border-border-main"
            : "border-border-main focus-within:border-border-main focus-within:shadow-lg"
        }`}
      >
        <label htmlFor="bi-analyst-input" className="sr-only">
          Ask BI Analyst a question about leads, revenue, conversion, or team
        </label>

        <textarea
          id="bi-analyst-input"
          ref={textareaRef}
          rows={1}
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            disabled
              ? "Analysis input paused (daily quota reached)"
              : isVoiceTyping
              ? "Listening... Speak your prompt into microphone..."
              : "Ask anything about your leads, revenue, conversion, or team..."
          }
          disabled={disabled}
          className="w-full bg-transparent resize-none border-0 border-none outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 focus:border-0 focus:border-none focus-visible:border-none shadow-none focus:shadow-none text-sm text-text-primary placeholder:text-text-secondary px-2 py-1 max-h-44"
          style={{
            overflowY: inputValue.length > 200 ? "auto" : "hidden",
            outline: "none",
            border: "none",
            boxShadow: "none",
          }}
        />

        {/* Bottom Row inside capsule */}
        <div className="flex items-center justify-between pt-1 px-1">
          {/* Status or Keyboard Hints */}
          {isVoiceTyping ? (
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs animate-pulse">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span className="font-medium">Listening... click Send or Mic when done</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[11px] text-text-secondary">
              <span className="hidden sm:inline">Press</span>
              <kbd className="px-1.5 py-0.5 rounded bg-bg-secondary text-[10px] font-mono border border-border-main hidden sm:inline">
                Enter ↵
              </kbd>
              <span className="hidden sm:inline">to send</span>
              <span className="hidden md:inline text-text-secondary/60">
                • Shift + Enter for new line • / to focus
              </span>
              {showCharCounter && (
                <span className="font-mono text-[10px] ml-2 font-medium">
                  {inputValue.length}/4000
                </span>
              )}
            </div>
          )}

          {/* Action Cluster: Dictation Mic, Live Voice, and Send / Stop button */}
          <div className="flex items-center gap-2">
            {/* Dictation Mic */}
            {onToggleVoiceTyping && (
              <button
                type="button"
                onClick={onToggleVoiceTyping}
                disabled={disabled}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-xs shrink-0 focus-visible:ring-2 focus-visible:ring-purple-500 ${
                  isVoiceTyping
                    ? "bg-rose-500 hover:bg-rose-600 text-white animate-pulse shadow-md shadow-rose-500/30 ring-2 ring-rose-400/60"
                    : "bg-bg-secondary hover:bg-purple-600 hover:text-white text-text-secondary"
                }`}
                title={isVoiceTyping ? "Stop listening" : "Speech-to-text dictation"}
                aria-label={isVoiceTyping ? "Stop voice typing" : "Start voice typing"}
              >
                {isVoiceTyping ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            )}

            {/* Live Voice mode trigger */}
            {onOpenLiveVoice && (
              <button
                type="button"
                onClick={onOpenLiveVoice}
                className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer shadow-2xs focus-visible:ring-2 focus-visible:ring-purple-500 ${
                  isLiveVoiceActive
                    ? "bg-rose-600 text-white animate-pulse"
                    : "bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/20"
                }`}
                title="Activate Gemini Live real-time bidirectional voice"
                aria-label="Toggle Live Voice mode"
              >
                <Radio className={`w-3.5 h-3.5 ${isLiveVoiceActive ? "animate-spin" : ""}`} />
                <span>{isLiveVoiceActive ? "Live" : "Voice"}</span>
              </button>
            )}

            {/* Primary Button: Morphs between Send and Stop */}
            {loading ? (
              <button
                type="button"
                onClick={onStop}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all bg-rose-600 hover:bg-rose-700 text-white cursor-pointer shadow-xs shrink-0 focus-visible:ring-2 focus-visible:ring-rose-500"
                title="Stop response generation (Esc)"
                aria-label="Stop response generation"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onSend}
                disabled={isSendDisabled}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all bg-purple-600 hover:bg-purple-700 text-white disabled:bg-bg-secondary disabled:text-text-secondary/40 cursor-pointer disabled:cursor-not-allowed shadow-xs shrink-0 focus-visible:ring-2 focus-visible:ring-purple-500"
                title="Send query (Enter)"
                aria-label="Send message"
              >
                <ArrowUp className="w-4 h-4 stroke-[2.5]" />
              </button>
            )}
          </div>
        </div>
      </div>

      <p className="text-center text-[11px] text-text-secondary/70 mt-2">
        BI Analyst synthesizes live CRM records. Verify critical financial decisions with primary exports.
      </p>
    </div>
  );
}
