import { Mic, MicOff, Maximize2, PhoneOff, Radio } from "lucide-react";

export default function VoiceDock({
  isOpen = false,
  status = "idle",
  liveTranscript = "",
  isMuted = false,
  onToggleMute,
  onExpand,
  onEndCall,
}) {
  if (!isOpen) return null;

  const isSpeaking = status === "speaking";
  const isTool = status === "tool_running";
  const isProcessing = status === "processing";

  let statusText = "Listening";
  if (isSpeaking) statusText = "Speaking";
  else if (isTool) statusText = "Checking CRM...";
  else if (isProcessing) statusText = "Thinking...";
  else if (isMuted) statusText = "Muted";
  else if (status === "connecting") statusText = "Connecting...";

  return (
    <div
      role="region"
      aria-label="Active voice session dock"
      className="fixed bottom-24 right-4 sm:right-6 z-40 max-w-sm w-full bg-bg-card/95 border border-border-main rounded-2xl shadow-2xl p-3 backdrop-blur-md transition-all animate-in slide-in-from-bottom-3 duration-200"
    >
      <div className="flex items-center justify-between gap-3">
        {/* Left: Indicator & Status */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Radio className={`w-4 h-4 ${isSpeaking ? "animate-spin" : "animate-pulse"}`} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-text-primary truncate">Live Voice</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-300 font-semibold font-mono">
                {statusText}
              </span>
            </div>
            <p className="text-[11px] text-text-secondary truncate mt-0.5">
              {liveTranscript || "Analyst is connected"}
            </p>
          </div>
        </div>

        {/* Right Controls: Mute, Expand, End */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onToggleMute}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              isMuted
                ? "bg-rose-500/15 text-rose-600"
                : "text-text-secondary hover:text-text-primary hover:bg-bg-secondary"
            }`}
            title={isMuted ? "Unmute" : "Mute"}
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={onExpand}
            className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-colors cursor-pointer"
            title="Expand to full screen"
            aria-label="Expand voice view"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onEndCall}
            className="p-2 rounded-xl bg-rose-600 text-white hover:bg-rose-700 transition-colors cursor-pointer"
            title="End voice session"
            aria-label="End call"
          >
            <PhoneOff className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
