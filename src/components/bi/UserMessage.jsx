import { memo } from "react";
import { Mic, Volume2, VolumeX } from "lucide-react";

function UserMessageComponent({
  message,
  onSpeak,
  onStopSpeaking,
  isSpeaking = false,
}) {
  const { id, content, timestamp, isVoice, failed, errorReason } = message;

  return (
    <div
      data-message-id={id}
      className="w-full flex flex-col items-end gap-1 group/userMsg animate-in fade-in duration-200"
    >
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-text-secondary font-semibold uppercase tracking-wider flex items-center gap-1.5">
          You
          {isVoice && (
            <span className="inline-flex items-center gap-0.5 text-[9px] text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.2 rounded-full border border-indigo-200/50 dark:border-indigo-800/40">
              <Mic className="w-2.5 h-2.5" /> Spoken
            </span>
          )}
          {failed && (
            <span className="inline-flex items-center gap-0.5 text-[9px] text-rose-600 dark:text-rose-400 font-semibold bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.2 rounded-full border border-rose-200/50">
              Failed to send
            </span>
          )}
        </span>
        {timestamp && (
          <span className="text-[10px] text-text-secondary/70">
            {new Date(timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 max-w-[85%]">
        {/* Speak loud button on hover */}
        {onSpeak && (
          <button
            type="button"
            onClick={() => (isSpeaking ? onStopSpeaking?.() : onSpeak?.(id, content))}
            className={`p-1.5 rounded-lg transition-all cursor-pointer focus-visible:ring-1 focus-visible:ring-purple-500 ${
              isSpeaking
                ? "opacity-100 text-purple-600 dark:text-purple-400 bg-purple-500/10"
                : "opacity-0 group-hover/userMsg:opacity-100 text-text-secondary hover:text-text-primary hover:bg-bg-secondary/60"
            }`}
            title={isSpeaking ? "Stop speaking" : "Speak message loud"}
            aria-label={isSpeaking ? "Stop speaking user message" : "Speak user message"}
          >
            {isSpeaking ? (
              <VolumeX className="w-4 h-4 text-purple-600 dark:text-purple-400 animate-pulse" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
        )}

        <div
          className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed border shadow-2xs font-sans ${
            failed
              ? "bg-rose-500/10 border-rose-500/30 text-rose-900 dark:text-rose-200"
              : "bg-bg-secondary/90 border-border-main text-text-primary"
          }`}
        >
          {content}
          {failed && errorReason && (
            <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 font-medium">
              ⚠️ {errorReason}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export const UserMessage = memo(UserMessageComponent);
export default UserMessage;
