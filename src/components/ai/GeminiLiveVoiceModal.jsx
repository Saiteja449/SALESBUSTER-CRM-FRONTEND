import React, { useEffect, useRef } from "react";
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
} from "lucide-react";

/**
 * Visualizer & Interactive Voice Controls for Gemini Multimodal Live API
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

  // Animate dynamic audio wave / orb on HTML5 Canvas
  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;

    let phase = 0;
    const render = () => {
      phase += 0.05;
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      // Determine active audio intensity
      const isSpeaking = status === "speaking";
      const isListening = status === "listening" && !isMuted;
      const isTool = status === "tool_running";
      const currentVol = isSpeaking ? outputVolume : isListening ? inputVolume : 0.05;

      // Base radius with pulsation
      const baseRadius = 65 + currentVol * 45;

      // Outer ambient glowing rings
      for (let i = 3; i >= 1; i--) {
        ctx.beginPath();
        const ringRadius = baseRadius + i * 22 + Math.sin(phase + i) * 6 * (currentVol + 0.2);

        let strokeColor = "rgba(147, 51, 234, 0.15)"; // Purple
        if (isSpeaking) {
          strokeColor = "rgba(99, 102, 241, 0.25)"; // Indigo / Cyan
        } else if (isTool) {
          strokeColor = "rgba(245, 158, 11, 0.25)"; // Amber
        }

        ctx.arc(centerX, centerY, Math.max(10, ringRadius), 0, Math.PI * 2);
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Dynamic central Orb gradient
      const gradient = ctx.createRadialGradient(
        centerX - 15,
        centerY - 15,
        10,
        centerX,
        centerY,
        baseRadius
      );

      if (status === "connecting") {
        gradient.addColorStop(0, "#c084fc");
        gradient.addColorStop(1, "#7e22ce");
      } else if (isTool) {
        gradient.addColorStop(0, "#fde68a"); // Amber glowing tool
        gradient.addColorStop(0.6, "#f59e0b");
        gradient.addColorStop(1, "#b45309");
      } else if (isSpeaking) {
        gradient.addColorStop(0, "#a5f3fc"); // Bright Cyan
        gradient.addColorStop(0.5, "#6366f1"); // Indigo
        gradient.addColorStop(1, "#4338ca");
      } else {
        gradient.addColorStop(0, "#e9d5ff"); // Purple breathing
        gradient.addColorStop(0.5, "#9333ea");
        gradient.addColorStop(1, "#581c87");
      }

      ctx.beginPath();
      // Add slight organic wobble to the orb
      const points = 36;
      for (let p = 0; p < points; p++) {
        const angle = (p / points) * Math.PI * 2;
        const wobble = Math.sin(angle * 4 + phase * 2) * (currentVol * 14);
        const r = baseRadius + wobble;
        const x = centerX + Math.cos(angle) * r;
        const y = centerY + Math.sin(angle) * r;
        if (p === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.shadowColor = isSpeaking ? "#6366f1" : isTool ? "#f59e0b" : "#9333ea";
      ctx.shadowBlur = 35 + currentVol * 40;
      ctx.fill();
      ctx.shadowBlur = 0; // reset

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isOpen, status, inputVolume, outputVolume, isMuted]);

  if (!isOpen) return null;

  // Format tool name into friendly display
  const getToolLabel = (name) => {
    switch (name) {
      case "get_dashboard_kpis":
        return "Calculating Dashboard KPIs & Lead Counts...";
      case "get_salesperson_performance":
        return "Aggregating Sales Rep Leaderboard & Won Deals...";
      case "search_leads":
        return "Searching CRM Database Leads...";
      case "lookup_phone_number":
        return "Looking up Contact Phone Number...";
      case "get_followup_status":
        return "Checking Pending Follow-ups & Reminders...";
      case "get_whatsapp_analytics":
        return "Analyzing Live WhatsApp Messages...";
      default:
        return `Executing CRM Tool (${name})...`;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-xl mx-4 bg-bg-card/95 border border-border-main rounded-3xl shadow-2xl p-6 sm:p-8 flex flex-col items-center justify-between min-h-[520px] overflow-hidden">
        {/* Top Header Bar */}
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-purple-600/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-semibold text-text-primary flex items-center gap-1.5">
                <span>BI Analyst Live Voice</span>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
              <p className="text-[11px] text-text-secondary">Powered by Gemini Multimodal Live API</p>
            </div>
          </div>

          {/* Voice Selector */}
          <div className="flex items-center gap-2">
            <select
              value={voiceName}
              onChange={(e) => onVoiceChange && onVoiceChange(e.target.value)}
              className="text-xs bg-bg-secondary border border-border-main rounded-xl px-2.5 py-1 text-text-primary outline-none focus:border-purple-500 cursor-pointer"
              title="Select Google HD Voice"
            >
              <option value="Aoede">Aoede (Warm Executive)</option>
              <option value="Puck">Puck (Energetic)</option>
              <option value="Charon">Charon (Calm)</option>
              <option value="Fenrir">Fenrir (Authoritative)</option>
              <option value="Kore">Kore (Clear Professional)</option>
            </select>
          </div>
        </div>

        {/* Central Visualizer Area */}
        <div className="flex-1 w-full flex flex-col items-center justify-center my-6 relative">
          <canvas
            ref={canvasRef}
            width={340}
            height={260}
            className="w-[280px] h-[220px] sm:w-[320px] sm:h-[250px]"
          />

          {/* Status Badge */}
          <div className="mt-3 text-center">
            {status === "connecting" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-500 border border-purple-500/20 animate-pulse">
                <Radio className="w-3.5 h-3.5 animate-spin" /> Connecting Live WebSocket...
              </span>
            )}
            {status === "listening" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" /> Listening to you... Speak anytime
              </span>
            )}
            {status === "tool_running" && (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/30 animate-pulse">
                <Database className="w-3.5 h-3.5 animate-spin" /> {getToolLabel(activeToolName)}
              </span>
            )}
            {status === "speaking" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                <Volume2 className="w-3.5 h-3.5 animate-bounce" /> BI Analyst Speaking...
              </span>
            )}
            {isMuted && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20 mt-1">
                <MicOff className="w-3.5 h-3.5" /> Microphone Muted
              </span>
            )}
          </div>

          {/* Real-Time Live Transcript Subtitle */}
          <div className="w-full max-w-md mt-4 min-h-[52px] text-center px-4">
            {liveTranscript ? (
              <p className="text-xs sm:text-sm text-text-primary font-medium leading-relaxed bg-bg-secondary/70 p-2.5 rounded-2xl border border-border-main/50 line-clamp-3">
                "{liveTranscript}"
              </p>
            ) : (
              <p className="text-[11px] text-text-secondary italic">
                Ask anything like: "What is our conversion rate?", "Who won the most leads this month?", or "How many leads came in today?"
              </p>
            )}
          </div>

          {error && (
            <div className="mt-3 p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-2 max-w-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Bottom Interactive Voice Controllers */}
        <div className="w-full flex items-center justify-center gap-4 pt-2 border-t border-border-main/50">
          {/* Mute / Unmute Button */}
          <button
            type="button"
            onClick={onToggleMute}
            className={`p-3.5 rounded-full transition-all cursor-pointer shadow-sm ${
              isMuted
                ? "bg-red-500/20 text-red-500 border border-red-500/30 hover:bg-red-500/30"
                : "bg-bg-secondary text-text-primary hover:bg-bg-secondary/80 border border-border-main"
            }`}
            title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
            aria-label="Toggle Mute"
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Interrupt AI Button */}
          <button
            type="button"
            onClick={onInterrupt}
            className="p-3.5 rounded-full bg-bg-secondary hover:bg-bg-secondary/80 text-text-primary border border-border-main transition-all cursor-pointer shadow-sm"
            title="Interrupt AI Speech"
            aria-label="Interrupt AI"
          >
            <Square className="w-5 h-5 fill-current" />
          </button>

          {/* End Call / Exit Voice Mode Button */}
          <button
            type="button"
            onClick={onClose}
            className="p-3.5 rounded-full bg-red-600 hover:bg-red-700 text-white transition-all cursor-pointer shadow-md"
            title="End Live Voice Chat"
            aria-label="End Call"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
