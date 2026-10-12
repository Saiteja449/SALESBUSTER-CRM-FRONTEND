import React, { useEffect, useRef, useState } from "react";
import {
  Mic,
  MicOff,
  PhoneOff,
  Sparkles,
  Bot,
  Database,
  Volume2,
  Square,
  AlertCircle,
  Radio,
  Zap,
  Activity,
  Layers,
  ChevronDown,
} from "lucide-react";

const SUGGESTED_QUERIES = [
  "What is our lead conversion rate this month?",
  "Who is our top salesperson this week?",
  "How many leads came in today vs yesterday?",
  "Are there any overdue follow-ups?",
];

/**
 * Premium Futuristic Voice Modal for Gemini Multimodal Live API
 * Glassmorphic studio aesthetic with multi-layered canvas fluid orb and interactive controls
 */
export default function GeminiLiveVoiceModal({
  isOpen,
  onClose,
  status, // 'idle' | 'connecting' | 'listening' | 'tool_running' | 'speaking' | 'error'
  activeToolName,
  inputVolume = 0,
  outputVolume = 0,
  liveTranscript = "",
  error = null,
  voiceName = "Aoede",
  onVoiceChange,
  isMuted = false,
  onToggleMute,
  onInterrupt,
}) {
  const canvasRef = useRef(null);
  const [activeSuggestionIdx, setActiveSuggestionIdx] = useState(0);

  // Cycle suggestions periodically when idle
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setActiveSuggestionIdx((prev) => (prev + 1) % SUGGESTED_QUERIES.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isOpen]);

  // High-fidelity Multi-layer Fluid Canvas Voice Orb
  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;
    let phase = 0;

    const render = () => {
      phase += 0.04;
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      // Current audio intensity
      const isSpeaking = status === "speaking";
      const isListening = status === "listening" && !isMuted;
      const isTool = status === "tool_running";
      const vol = isSpeaking ? outputVolume : isListening ? inputVolume : 0.06;

      // Dynamic base radius responsive to decibel amplitude
      const baseRadius = 68 + vol * 52;

      // Layer 1: Ambient Outer Glow Atmosphere
      const atmosphereGrad = ctx.createRadialGradient(
        centerX,
        centerY,
        baseRadius * 0.5,
        centerX,
        centerY,
        baseRadius * 2.2
      );
      if (isSpeaking) {
        atmosphereGrad.addColorStop(0, "rgba(99, 102, 241, 0.35)"); // Indigo
        atmosphereGrad.addColorStop(0.5, "rgba(56, 189, 248, 0.15)"); // Cyan
        atmosphereGrad.addColorStop(1, "rgba(15, 23, 42, 0)");
      } else if (isTool) {
        atmosphereGrad.addColorStop(0, "rgba(245, 158, 11, 0.4)"); // Gold
        atmosphereGrad.addColorStop(0.6, "rgba(217, 119, 6, 0.15)");
        atmosphereGrad.addColorStop(1, "rgba(15, 23, 42, 0)");
      } else {
        atmosphereGrad.addColorStop(0, "rgba(168, 85, 247, 0.32)"); // Purple
        atmosphereGrad.addColorStop(0.5, "rgba(147, 51, 234, 0.12)");
        atmosphereGrad.addColorStop(1, "rgba(15, 23, 42, 0)");
      }
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius * 2.2, 0, Math.PI * 2);
      ctx.fillStyle = atmosphereGrad;
      ctx.fill();

      // Layer 2: Harmonic Rippling Energy Rings (4 rings)
      for (let r = 4; r >= 1; r--) {
        ctx.beginPath();
        const ringOffset = r * 18 + Math.sin(phase * 1.5 + r * 1.2) * (8 + vol * 16);
        const ringRadius = baseRadius + ringOffset;

        ctx.arc(centerX, centerY, Math.max(12, ringRadius), 0, Math.PI * 2);
        let ringColor = `rgba(168, 85, 247, ${0.35 - r * 0.07})`;
        if (isSpeaking) {
          ringColor = `rgba(56, 189, 248, ${0.4 - r * 0.08})`;
        } else if (isTool) {
          ringColor = `rgba(245, 158, 11, ${0.45 - r * 0.09})`;
        }
        ctx.strokeStyle = ringColor;
        ctx.lineWidth = 1.6;
        ctx.stroke();
      }

      // Layer 3: Organic Morphing Fluid Orb Core
      const coreGrad = ctx.createRadialGradient(
        centerX - 18,
        centerY - 22,
        12,
        centerX,
        centerY,
        baseRadius
      );

      if (status === "connecting") {
        coreGrad.addColorStop(0, "#e9d5ff");
        coreGrad.addColorStop(0.5, "#9333ea");
        coreGrad.addColorStop(1, "#581c87");
      } else if (isTool) {
        coreGrad.addColorStop(0, "#fef08a"); // Glowing Amber Sun
        coreGrad.addColorStop(0.4, "#f59e0b");
        coreGrad.addColorStop(0.8, "#d97706");
        coreGrad.addColorStop(1, "#78350f");
      } else if (isSpeaking) {
        coreGrad.addColorStop(0, "#e0f2fe"); // Bright Cyan Core
        coreGrad.addColorStop(0.3, "#38bdf8");
        coreGrad.addColorStop(0.7, "#6366f1");
        coreGrad.addColorStop(1, "#312e81");
      } else {
        coreGrad.addColorStop(0, "#f5d0fe"); // Breathing Velvet Orchid
        coreGrad.addColorStop(0.4, "#c084fc");
        coreGrad.addColorStop(0.8, "#7e22ce");
        coreGrad.addColorStop(1, "#3b0764");
      }

      ctx.beginPath();
      const points = 48;
      for (let p = 0; p < points; p++) {
        const angle = (p / points) * Math.PI * 2;
        // Harmonic undulating curves based on volume
        const harmonic =
          Math.sin(angle * 5 + phase * 2.5) * (vol * 18 + 4) +
          Math.cos(angle * 3 - phase * 1.8) * (vol * 12 + 3);
        const radiusWithHarmonic = baseRadius + harmonic;
        const x = centerX + Math.cos(angle) * radiusWithHarmonic;
        const y = centerY + Math.sin(angle) * radiusWithHarmonic;

        if (p === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fillStyle = coreGrad;
      ctx.shadowColor = isSpeaking ? "#38bdf8" : isTool ? "#f59e0b" : "#c084fc";
      ctx.shadowBlur = 40 + vol * 50;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Layer 4: Inner Shimmer Specular Light
      ctx.beginPath();
      const innerShimmer = ctx.createRadialGradient(
        centerX - 24,
        centerY - 24,
        2,
        centerX - 16,
        centerY - 16,
        baseRadius * 0.55
      );
      innerShimmer.addColorStop(0, "rgba(255, 255, 255, 0.75)");
      innerShimmer.addColorStop(0.4, "rgba(255, 255, 255, 0.2)");
      innerShimmer.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.arc(centerX - 18, centerY - 18, baseRadius * 0.55, 0, Math.PI * 2);
      ctx.fillStyle = innerShimmer;
      ctx.fill();

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [isOpen, status, inputVolume, outputVolume, isMuted]);

  if (!isOpen) return null;

  // Tool title formatter
  const getToolLabel = (name) => {
    switch (name) {
      case "get_dashboard_kpis":
        return "Calculating Dashboard KPIs & Lead Counts";
      case "get_salesperson_performance":
        return "Aggregating Sales Rep Leaderboard & Won Deals";
      case "search_leads":
        return "Searching CRM Database Leads";
      case "lookup_phone_number":
        return "Looking up Contact Phone Number";
      case "get_followup_status":
        return "Checking Pending Follow-ups & Reminders";
      case "get_whatsapp_analytics":
        return "Analyzing Live WhatsApp Messages";
      default:
        return `Executing CRM Database Tool (${name})`;
    }
  };

  const isSpeaking = status === "speaking";
  const isListening = status === "listening" && !isMuted;
  const isTool = status === "tool_running";
  const activeVol = isSpeaking ? outputVolume : isListening ? inputVolume : 0.05;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      {/* Immersive Deep Backdrop with Multi-radial Glows */}
      <div
        className="fixed inset-0 bg-slate-950/85 backdrop-blur-2xl transition-opacity animate-in fade-in duration-300"
        onClick={onClose}
      />
      <div className="fixed -top-40 -left-40 w-96 h-96 bg-purple-600/25 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed -bottom-40 -right-40 w-96 h-96 bg-indigo-600/25 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Glass Studio Card */}
      <div
        className="relative w-full max-w-xl bg-slate-900/90 dark:bg-slate-950/90 border border-white/10 dark:border-white/10 rounded-[32px] shadow-[0_25px_80px_-15px_rgba(147,51,234,0.3)] backdrop-blur-3xl p-6 sm:p-8 flex flex-col items-center justify-between min-h-[560px] overflow-hidden transition-all animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle Top Ambient Lighting Line */}
        <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-purple-500/60 to-transparent" />

        {/* =========================================================================
            HEADER BAR: Identity, Latency Badge, Voice Selector
            ========================================================================= */}
        <div className="w-full flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/25 shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  BI Analyst Live
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Gemini Live API
                </span>
              </div>
              <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                <Zap className="w-3 h-3 text-amber-400 inline" />
                <span>Low Latency · Live CRM Grounded</span>
              </p>
            </div>
          </div>

          {/* Voice Persona Dropdown */}
          <div className="relative">
            <select
              value={voiceName}
              onChange={(e) => onVoiceChange && onVoiceChange(e.target.value)}
              className="text-xs font-medium bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-3 py-1.5 text-slate-200 outline-none focus:border-purple-500/80 cursor-pointer transition-all shadow-xs"
              title="Select Google HD Voice Persona"
            >
              <option value="Aoede" className="bg-slate-900 text-white">Aoede (Warm Executive)</option>
              <option value="Puck" className="bg-slate-900 text-white">Puck (Energetic)</option>
              <option value="Charon" className="bg-slate-900 text-white">Charon (Calm Authority)</option>
              <option value="Fenrir" className="bg-slate-900 text-white">Fenrir (Deep Resonance)</option>
              <option value="Kore" className="bg-slate-900 text-white">Kore (Clear Professional)</option>
            </select>
          </div>
        </div>

        {/* =========================================================================
            CENTER VISUALIZER: Fluid Energy Orb + Dynamic Wave Bars
            ========================================================================= */}
        <div className="flex-1 w-full flex flex-col items-center justify-center my-4 relative">
          {/* Canvas Orb */}
          <canvas
            ref={canvasRef}
            width={360}
            height={260}
            className="w-[290px] h-[210px] sm:w-[340px] sm:h-[245px] drop-shadow-2xl"
          />

          {/* Dynamic Audio Equalizer Bars */}
          <div className="flex items-center gap-1.5 h-6 mt-1">
            {[0.4, 0.7, 1.0, 0.8, 1.2, 0.6, 0.3].map((factor, idx) => {
              const barHeight = Math.max(4, Math.min(22, 4 + activeVol * 28 * factor));
              return (
                <div
                  key={idx}
                  className={`w-1 rounded-full transition-all duration-75 ${
                    isSpeaking
                      ? "bg-gradient-to-t from-indigo-500 to-cyan-400"
                      : isTool
                      ? "bg-gradient-to-t from-amber-600 to-yellow-300"
                      : "bg-gradient-to-t from-purple-600 to-fuchsia-400"
                  }`}
                  style={{ height: `${barHeight}px` }}
                />
              );
            })}
          </div>

          {/* Status Badge Pills */}
          <div className="mt-3 text-center">
            {status === "connecting" && (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium bg-purple-500/15 text-purple-300 border border-purple-500/30 animate-pulse shadow-xs">
                <Radio className="w-3.5 h-3.5 animate-spin text-purple-400" />
                <span>Connecting Bidirectional WebSocket...</span>
              </div>
            )}
            {status === "listening" && (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Listening · Speak your question anytime</span>
              </div>
            )}
            {status === "tool_running" && (
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/40 shadow-md animate-pulse">
                <Database className="w-3.5 h-3.5 animate-spin text-amber-400" />
                <span>{getToolLabel(activeToolName)}</span>
              </div>
            )}
            {status === "speaking" && (
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-indigo-500/15 text-cyan-300 border border-cyan-500/30 shadow-xs">
                <Volume2 className="w-3.5 h-3.5 animate-bounce text-cyan-400" />
                <span>BI Analyst Speaking ({voiceName})</span>
              </div>
            )}
            {isMuted && (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30 mt-1 shadow-xs">
                <MicOff className="w-3.5 h-3.5" />
                <span>Microphone Muted</span>
              </div>
            )}
          </div>

          {/* Live Subtitle Transcript Area */}
          <div className="w-full max-w-lg mt-3 min-h-[58px] text-center px-4">
            {liveTranscript ? (
              <div className="relative p-3 rounded-2xl bg-white/5 border border-white/10 text-slate-100 text-xs sm:text-sm font-medium leading-relaxed shadow-inner">
                <span className="text-purple-400 mr-1.5 font-bold">"</span>
                <span>{liveTranscript}</span>
                <span className="text-purple-400 ml-1.5 font-bold">"</span>
              </div>
            ) : (
              <div className="p-2.5 rounded-2xl bg-white/[0.03] border border-white/5 text-slate-400 text-xs flex items-center justify-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span className="italic">Try asking: "{SUGGESTED_QUERIES[activeSuggestionIdx]}"</span>
              </div>
            )}
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mt-3 p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 max-w-md shadow-xs animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* =========================================================================
            BOTTOM STUDIO CONTROLS: Mute, Interrupt, End Call
            ========================================================================= */}
        <div className="w-full flex items-center justify-center gap-5 pt-3 border-t border-white/10">
          {/* Mute Microphone Button */}
          <button
            type="button"
            onClick={onToggleMute}
            className={`group relative p-3.5 sm:p-4 rounded-full transition-all duration-200 cursor-pointer shadow-lg active:scale-95 ${
              isMuted
                ? "bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500/30 shadow-rose-500/20"
                : "bg-white/10 hover:bg-white/15 text-slate-200 border border-white/10 hover:border-white/20 shadow-black/40"
            }`}
            title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
            aria-label="Toggle Mute"
          >
            {isMuted ? <MicOff className="w-5 h-5 sm:w-6 sm:h-6" /> : <Mic className="w-5 h-5 sm:w-6 sm:h-6" />}
          </button>

          {/* Tap to Interrupt Button */}
          <button
            type="button"
            onClick={onInterrupt}
            className="group relative p-3.5 sm:p-4 rounded-full bg-white/10 hover:bg-white/15 text-slate-200 hover:text-white border border-white/10 hover:border-white/20 transition-all duration-200 cursor-pointer shadow-lg shadow-black/40 active:scale-95"
            title="Interrupt AI Speech"
            aria-label="Interrupt AI"
          >
            <Square className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
          </button>

          {/* End Call / Exit Modal Button */}
          <button
            type="button"
            onClick={onClose}
            className="group relative p-3.5 sm:p-4 rounded-full bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white border border-red-500/40 transition-all duration-200 cursor-pointer shadow-xl shadow-red-600/30 active:scale-95 hover:shadow-red-600/50"
            title="End Live Voice Chat"
            aria-label="End Call"
          >
            <PhoneOff className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
