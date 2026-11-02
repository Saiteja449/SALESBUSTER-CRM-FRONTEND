import { Mic, MicOff, PhoneOff, Settings, HelpCircle } from "lucide-react";

/**
 * Pixel-Perfect Bottom Voice Controls matching reference mockup:
 * - Mute: Capsule button with icon and "Mute" / "Unmute"
 * - End Call: Hero red pill button with phone icon and "End Call"
 * - Settings: Capsule button with gear icon and "Settings"
 * - Help: Circular button with question mark icon
 */
export default function VoiceControls({
  isMuted = false,
  onToggleMute,
  onEndCall,
  onOpenSettings,
  onToggleHelp,
}) {
  return (
    <div className="flex items-center justify-center gap-4 sm:gap-6 pt-2 pb-1 relative z-10">
      {/* 1. Mute Capsule Button */}
      <button
        type="button"
        onClick={onToggleMute}
        aria-label={
          isMuted ? "Unmute microphone (Space)" : "Mute microphone (Space)"
        }
        title={isMuted ? "Unmute (Space)" : "Mute (Space)"}
        className={`px-6 py-3.5 rounded-full flex flex-col items-center justify-center gap-1 min-w-[76px] transition-all cursor-pointer border shadow-sm ${
          isMuted
            ? "bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100/80"
            : "bg-white hover:bg-slate-50 border-slate-200/90 text-slate-700 hover:text-slate-900"
        }`}
      >
        {isMuted ? (
          <MicOff className="w-5 h-5 text-rose-600 stroke-[2.2]" />
        ) : (
          <Mic className="w-5 h-5 text-slate-700 stroke-[2.2]" />
        )}
      </button>

      <button
        type="button"
        onClick={onEndCall}
        aria-label="End call (Ctrl+Shift+E)"
        title="End call (Ctrl+Shift+E)"
        className="px-8 py-3.5 rounded-full bg-[#E11D48] hover:bg-[#BE123C] text-white flex items-center justify-center gap-2.5 shadow-lg shadow-rose-500/25 transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
      >
        <PhoneOff className="w-5 h-5 stroke-[2.4]" />
        <span className="text-sm font-bold tracking-wide">End Call</span>
      </button>
    </div>
  );
}
