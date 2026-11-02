import { useState, useEffect } from "react";
import { Mic, Volume2, X } from "lucide-react";

const VOICE_PERSONAS = [
  { id: "Aoede", label: "Aoede (Brisk & Confident)" },
  { id: "Charon", label: "Charon (Deep & Executive)" },
  { id: "Fenrir", label: "Fenrir (Calm & Analytical)" },
  { id: "Kore", label: "Kore (Warm & Clear)" },
  { id: "Puck", label: "Puck (Energetic & Dynamic)" },
];

export default function VoiceSettingsPopover({
  isOpen,
  onClose,
  voiceName = "Aoede",
  onVoiceChange,
  isLiveActive = false,
}) {
  const [microphones, setMicrophones] = useState([]);
  const [selectedMicId, setSelectedMicId] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    async function loadDevices() {
      try {
        if (navigator?.mediaDevices?.enumerateDevices) {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const audioInputs = devices.filter((d) => d.kind === "audioinput");
          setMicrophones(audioInputs);
          if (audioInputs.length > 0 && !selectedMicId) {
            setSelectedMicId(audioInputs[0].deviceId);
          }
        }
      } catch (err) {
        console.warn("Could not list audio devices:", err);
      }
    }

    loadDevices();
  }, [isOpen, selectedMicId]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Voice settings"
      className="absolute bottom-20 left-1/2 -translate-x-1/2 w-80 sm:w-96 bg-bg-card border border-border-main rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-4"
    >
      <div className="flex items-center justify-between pb-2 border-b border-border-main">
        <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
          Voice &amp; Audio Settings
        </span>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-secondary"
          aria-label="Close voice settings"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Voice Persona Selector */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
          <Volume2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
          <span>Analyst Voice Persona</span>
        </label>
        <select
          value={voiceName}
          onChange={(e) => onVoiceChange?.(e.target.value)}
          disabled={isLiveActive}
          className="w-full bg-bg-secondary/70 border border-border-main rounded-xl px-3 py-2 text-xs font-medium text-text-primary outline-none focus:ring-1 focus:ring-purple-500 disabled:opacity-60"
        >
          {VOICE_PERSONAS.map((vp) => (
            <option key={vp.id} value={vp.id} className="bg-bg-card text-text-primary">
              {vp.label}
            </option>
          ))}
        </select>
        {isLiveActive && (
          <span className="text-[10px] text-text-secondary block">
            Persona selection applies to your next voice session.
          </span>
        )}
      </div>

      {/* Microphone Selection */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
          <Mic className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
          <span>Microphone Input Device</span>
        </label>
        {microphones.length > 0 ? (
          <select
            value={selectedMicId}
            onChange={(e) => setSelectedMicId(e.target.value)}
            className="w-full bg-bg-secondary/70 border border-border-main rounded-xl px-3 py-2 text-xs font-medium text-text-primary outline-none focus:ring-1 focus:ring-purple-500"
          >
            {microphones.map((m, idx) => (
              <option key={m.deviceId || idx} value={m.deviceId} className="bg-bg-card text-text-primary">
                {m.label || `Microphone ${idx + 1}`}
              </option>
            ))}
          </select>
        ) : (
          <p className="text-xs text-text-secondary">Using system default microphone.</p>
        )}
      </div>

      <div className="pt-2 border-t border-border-main flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="px-3.5 py-1.5 rounded-xl bg-purple-600 text-white font-semibold text-xs hover:bg-purple-700 transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  );
}

