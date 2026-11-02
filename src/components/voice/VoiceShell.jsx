import { useState, useEffect, useRef } from "react";
import {
  X,
  FileText,
  Clock,
  ExternalLink,
  Signal,
  Building2,
  Sparkles,
  Bot,
  AudioWaveform,
} from "lucide-react";
import VoiceOrbCanvas from "./VoiceOrbCanvas.jsx";
import VoiceControls from "./VoiceControls.jsx";
import VoiceSettingsPopover from "./VoiceSettingsPopover.jsx";
import TranscriptPanel from "./TranscriptPanel.jsx";
import VoiceErrorState from "./VoiceErrorState.jsx";
import SessionSummary from "./SessionSummary.jsx";
import EmailConfirmationCard from "../bi/EmailConfirmationCard.jsx";

const SUGGESTED_HINTS = [
  "What is our lead conversion rate this month?",
  "Who is the top performing salesperson this week?",
  "How many follow-ups are overdue today?",
  "How many new leads arrived this morning vs yesterday?",
  "Which active leads have unreplied WhatsApp inquiries?",
];

export default function VoiceShell({
  isOpen,
  onClose,
  onMinimize,
  status = "idle",
  toolDetails = null,
  inputVolume = 0,
  outputVolume = 0,
  liveTranscript = "",
  turns = [],
  error = null,
  voiceName = "Aoede",
  onVoiceChange,
  isMuted = false,
  onToggleMute,
  onInterrupt,
  onRetry,
  onTypeInstead,
  onSaveToChat,
  onDoneSummary,
  summaryData = null,
  leadName = "Acme Enterprises",
  pendingEmailDraft = null,
  onConfirmEmailReport = null,
  onDismissEmailReport = null,
}) {
  const [showTranscript, setShowTranscript] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [hintIndex, setHintIndex] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);

  const containerRef = useRef(null);

  // Rotate hint every 5s if idle or listening
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setHintIndex((prev) => (prev + 1) % SUGGESTED_HINTS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Session timer
  useEffect(() => {
    if (!isOpen || status === "idle") return;
    const startTime = Date.now();
    const timer = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => {
      clearInterval(timer);
    };
  }, [isOpen, status]);

  // Keyboard shortcuts (Space = mute, I = interrupt, Esc = minimize/close, ? = help)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      const tag = e.target?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;

      if (e.code === "Space") {
        e.preventDefault();
        onToggleMute?.();
      } else if (e.key === "Escape") {
        e.preventDefault();
        if (onMinimize) onMinimize();
        else onClose?.();
      } else if (e.key === "i" || e.key === "I") {
        if (status === "speaking") {
          e.preventDefault();
          onInterrupt?.();
        }
      } else if (e.key === "?") {
        e.preventDefault();
        setShowHelp((prev) => !prev);
      } else if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === "e" || e.key === "E")) {
        e.preventDefault();
        onClose?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onToggleMute, onMinimize, onInterrupt, onClose, status]);

  if (!isOpen && !summaryData) return null;

  // Format timer (M:SS)
  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Format Call-in-progress timer (MM:SS)
  const formatCallTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const isSpeaking = status === "speaking";
  const isTool = status === "tool_running";
  const isProcessing = status === "processing";
  const isConnecting = status === "connecting" || status === "reconnecting";

  // Center status label
  let liveStatusTitle = "Live • Listening...";
  let liveStatusColor = "bg-emerald-500";
  let liveStatusSubtitle = "Speak naturally — I'm here to help!";

  if (isMuted) {
    liveStatusTitle = "Microphone Muted";
    liveStatusColor = "bg-rose-500";
    liveStatusSubtitle = "Unmute or press Space to continue speaking";
  } else if (isConnecting) {
    liveStatusTitle = "Connecting to Gemini...";
    liveStatusColor = "bg-blue-500 animate-pulse";
    liveStatusSubtitle = "Establishing secure real-time audio channel";
  } else if (isProcessing) {
    liveStatusTitle = "Thinking...";
    liveStatusColor = "bg-blue-500 animate-pulse";
    liveStatusSubtitle = "Analyzing your query...";
  } else if (isTool) {
    liveStatusTitle = toolDetails?.friendlyLabel || "Querying CRM Database...";
    liveStatusColor = "bg-amber-500 animate-spin";
    liveStatusSubtitle = "Checking pipeline & sales records";
  } else if (isSpeaking) {
    liveStatusTitle = "Analyst Speaking...";
    liveStatusColor = "bg-purple-500 animate-ping";
    liveStatusSubtitle = liveTranscript ? `"${liveTranscript}"` : "Click the center orb to interrupt";
  } else if (liveTranscript) {
    liveStatusSubtitle = `"${liveTranscript}"`;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="SalesBuster AI Live Voice Assistant"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-hidden select-none"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onMinimize || onClose}
      />

      {/* Main Pixel-Perfect Card Container */}
      <div
        ref={containerRef}
        className="relative w-full max-w-2xl bg-white/95 backdrop-blur-md rounded-[32px] border border-slate-200/80 shadow-2xl overflow-hidden flex flex-col justify-between p-6 sm:p-8 min-h-[500px] z-10 animate-in zoom-in-95 duration-200"
      >
        {/* Layered Wavy Gradient Hills Backdrop (Bottom) */}
        <div className="absolute inset-x-0 bottom-0 pointer-events-none overflow-hidden h-44 opacity-75 z-0">
          <svg
            viewBox="0 0 1200 240"
            className="w-full h-full"
            preserveAspectRatio="none"
          >
            <path
              d="M0,130 C240,190 480,90 720,140 C960,190 1080,110 1200,130 L1200,240 L0,240 Z"
              fill="url(#wave-grad-1)"
              opacity="0.6"
            />
            <path
              d="M0,165 C300,110 600,210 900,150 C1050,120 1140,175 1200,165 L1200,240 L0,240 Z"
              fill="url(#wave-grad-2)"
              opacity="0.85"
            />
            <defs>
              <linearGradient id="wave-grad-1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#DBEAFE" />
                <stop offset="50%" stopColor="#EDE9FE" />
                <stop offset="100%" stopColor="#F3E8FF" />
              </linearGradient>
              <linearGradient id="wave-grad-2" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#EFF6FF" />
                <stop offset="50%" stopColor="#F5F3FF" />
                <stop offset="100%" stopColor="#FAF5FF" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Post-Session Summary View */}
        {summaryData ? (
          <div className="relative z-10 w-full flex items-center justify-center py-6">
            <SessionSummary
              durationMs={summaryData.durationMs}
              turns={summaryData.turns}
              onSaveToChat={onSaveToChat}
              onDone={onDoneSummary || onClose}
            />
          </div>
        ) : error && status === "error" ? (
          <div className="relative z-10 w-full flex items-center justify-center py-8">
            <VoiceErrorState
              error={error}
              onRetry={onRetry}
              onTypeInstead={onTypeInstead}
              onClose={onClose}
            />
          </div>
        ) : (
          <>
            {/* 1. Top Header Row */}
            <div className="relative z-10 flex items-center justify-between pb-4">
              {/* Left: Audio waveform logo + Brand Title */}
              <div className="flex items-center gap-3">
                {/* 5-bar Sound Wave Logo Icon */}
                <div className="flex items-center gap-0.5 h-6 text-blue-600">
                  <span className="w-1 h-3.5 bg-blue-500 rounded-full" />
                  <span className="w-1 h-5 bg-blue-600 rounded-full" />
                  <span className="w-1 h-6 bg-blue-600 rounded-full" />
                  <span className="w-1 h-4 bg-blue-500 rounded-full" />
                  <span className="w-1 h-2.5 bg-blue-400 rounded-full" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 tracking-tight leading-tight">
                    SalesBuster AI
                  </h2>
                  <p className="text-[11px] font-normal text-slate-500 leading-tight">
                    Live Sales Assistant
                  </p>
                </div>
              </div>

              {/* Center: Connected Pill Badge with Signal bars */}
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Connected</span>
                <Signal className="w-3.5 h-3.5 text-emerald-600 stroke-[2.2] ml-0.5" />
              </div>

              {/* Right: Timer pill, Transcript icon button, Close button */}
              <div className="flex items-center gap-2">
                {/* Timer Badge */}
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100/90 border border-slate-200/70 text-slate-700 text-xs font-semibold">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span className="font-mono">{formatTimer(elapsedSec)}</span>
                </div>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close voice modal"
                  title="Close"
                  className="w-8 h-8 rounded-lg bg-slate-100/90 hover:bg-slate-200/70 border border-slate-200/70 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4 stroke-[2.2]" />
                </button>
              </div>
            </div>

            {/* Email Report Confirmation Card (when staged via voice) */}
            {pendingEmailDraft && (
              <div className="relative z-20 w-full max-w-xl mx-auto my-2 animate-in fade-in zoom-in-95 duration-200">
                <EmailConfirmationCard
                  draft={pendingEmailDraft}
                  onConfirm={onConfirmEmailReport}
                  isVoice={true}
                  onDismiss={onDismissEmailReport}
                />
              </div>
            )}

            {/* 2. Middle Row: 3-Column Floating Cards & Hero Waveform */}
            <div className="relative z-10 flex flex-col  items-center justify-between gap-4 sm:gap-6 my-auto py-2">
             

              {/* Center Column: Hero Waveform & Glowing Microphone Orb */}
              <div className="flex-1 w-full flex flex-col items-center justify-center px-2 order-1 lg:order-2">
                <VoiceOrbCanvas
                  status={status}
                  inputVolume={inputVolume}
                  outputVolume={outputVolume}
                  isMuted={isMuted}
                  onInterrupt={onInterrupt}
                />

                {/* Status Line: Green dot + Live • Listening... */}
                <div className="flex items-center justify-center gap-2 mt-1">
                  <span className={`w-2.5 h-2.5 rounded-full ${liveStatusColor}`} />
                  <span className="text-sm font-bold text-slate-900 tracking-tight">
                    {liveStatusTitle}
                  </span>
                </div>

                {/* Subtitle / Live speech caption */}
                <p className="text-xs sm:text-sm text-slate-500 font-normal text-center mt-1 max-w-lg truncate">
                  {liveStatusSubtitle}
                </p>
              </div>

              {/* Right Column: Try Saying Suggestion Card */}
              <div className="w-full lg:w-64 bg-blue-50/80 backdrop-blur-sm border border-blue-100/90 rounded-2xl p-3.5 shadow-sm shrink-0 relative flex items-start gap-3 order-3">
                {/* Robot Assistant Avatar */}
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Bot className="w-5 h-5 stroke-[2.2]" />
                </div>

                {/* Prompt Info */}
                <div className="flex-1 min-w-0 pr-4">
                  <span className="text-[11px] font-medium text-slate-500 block leading-tight">
                    Try saying:
                  </span>
                  <p className="text-xs font-semibold text-blue-950 mt-0.5 line-clamp-2 leading-snug">
                    "{SUGGESTED_HINTS[hintIndex]}"
                  </p>
                </div>

                {/* Sparkle/Sound accent in top-right */}
                <div className="absolute top-2.5 right-2.5 text-blue-500">
                  <Sparkles className="w-3.5 h-3.5 opacity-80" />
                </div>
              </div>
            </div>

            {/* 3. Bottom Controls Row */}
            <div className="relative z-10 pt-2">
              <VoiceControls
                isMuted={isMuted}
                onToggleMute={onToggleMute}
                onEndCall={onClose}
                onOpenSettings={() => setShowSettings((prev) => !prev)}
                onToggleHelp={() => setShowHelp((prev) => !prev)}
              />
            </div>
          </>
        )}

        {/* Slide-over Full Transcript Panel */}
        {showTranscript && (
          <TranscriptPanel
            isOpen={showTranscript}
            onClose={() => setShowTranscript(false)}
            turns={turns}
            onClearTranscript={null}
          />
        )}

        {/* Voice Persona & Audio Settings Popover */}
        {showSettings && (
          <VoiceSettingsPopover
            isOpen={showSettings}
            onClose={() => setShowSettings(false)}
            voiceName={voiceName}
            onVoiceChange={onVoiceChange}
            inputVolume={inputVolume}
          />
        )}

        {/* Shortcuts & Help Popover */}
        {showHelp && (
          <div className="absolute bottom-20 right-8 z-50 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 w-64 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="text-xs font-bold text-slate-900">Voice Shortcuts</h4>
              <button
                type="button"
                onClick={() => setShowHelp(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-2 mt-2.5 text-xs text-slate-600">
              <div className="flex justify-between items-center">
                <span>Toggle mute</span>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border text-[10px] font-mono">
                  Space
                </kbd>
              </div>
              <div className="flex justify-between items-center">
                <span>Interrupt assistant</span>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border text-[10px] font-mono">
                  I
                </kbd>
              </div>
              <div className="flex justify-between items-center">
                <span>Minimise / Close</span>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border text-[10px] font-mono">
                  Esc
                </kbd>
              </div>
              <div className="flex justify-between items-center">
                <span>End call</span>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border text-[10px] font-mono">
                  Ctrl+Shift+E
                </kbd>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
