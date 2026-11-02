import { useEffect, useRef } from "react";
import { Mic } from "lucide-react";

/**
 * Pixel-Perfect Horizontal Audio Waveform with Center Glowing Microphone Orb
 * Matches reference design:
 * - Left side: blue audio bars reacting to volume
 * - Center: glowing radial blue gradient orb with white microphone icon & concentric ripple rings
 * - Right side: purple/violet audio bars reacting to volume
 */
export default function VoiceOrbCanvas({
  status = "idle",
  inputVolume = 0,
  outputVolume = 0,
  isMuted = false,
  onInterrupt,
}) {
  const canvasRef = useRef(null);
  const smoothedVolRef = useRef(0.06);

  const isSpeaking = status === "speaking";
  const isListening = status === "listening" && !isMuted;
  const isTool = status === "tool_running";
  const isProcessing = status === "processing";
  const isConnecting = status === "connecting" || status === "reconnecting";

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;
    let phase = 0;

    const numBarsPerSide = 18;
    const barWidth = 4;
    const barGap = 4.5;
    const centerOrbRadius = 42; // Space for the center orb

    const render = () => {
      if (document.hidden) {
        animId = requestAnimationFrame(render);
        return;
      }

      phase += 0.05;
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;
      const centerX = width / 2;

      ctx.clearRect(0, 0, width, height);

      // Determine active volume
      const targetVol = isSpeaking
        ? outputVolume
        : isListening
        ? inputVolume
        : isTool || isProcessing
        ? 0.22
        : isConnecting
        ? 0.12
        : 0.05;

      // Damped volume smoothing (fast attack 60ms, smooth decay 220ms)
      const currentVol = smoothedVolRef.current;
      const attackFactor = 0.35;
      const releaseFactor = 0.1;
      const factor = targetVol > currentVol ? attackFactor : releaseFactor;
      smoothedVolRef.current = currentVol + (targetVol - currentVol) * factor;
      const vol = Math.max(0.06, Math.min(1.0, smoothedVolRef.current));

      // 1. Draw Left Waveform (Blue bars: #3B82F6 -> #2563EB)
      for (let i = 0; i < numBarsPerSide; i++) {
        // Position outwards from center orb
        const distanceFromCenter = i; // 0 closest to orb, 17 furthest left
        const x = centerX - centerOrbRadius - 12 - (distanceFromCenter * (barWidth + barGap));

        // Taper: taller near the orb, gently tapering down towards the edge
        const taper = Math.sin(((numBarsPerSide - distanceFromCenter) / numBarsPerSide) * (Math.PI / 2));
        const wave = Math.sin(phase + i * 0.45) * 0.3 + 0.7;
        const barHeight = Math.max(
          6,
          vol * 65 * taper * wave + (isListening || isSpeaking ? 6 : 4)
        );

        ctx.fillStyle = isMuted
          ? "#94A3B8"
          : `rgba(59, 130, 246, ${Math.min(1, 0.45 + taper * 0.55)})`;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x - barWidth, centerY - barHeight / 2, barWidth, barHeight, 2.5);
        } else {
          ctx.rect(x - barWidth, centerY - barHeight / 2, barWidth, barHeight);
        }
        ctx.fill();
      }

      // 2. Draw Right Waveform (Purple/Violet bars: #8B5CF6 -> #A855F7)
      for (let i = 0; i < numBarsPerSide; i++) {
        // Position outwards from center orb to the right
        const distanceFromCenter = i; // 0 closest to orb, 17 furthest right
        const x = centerX + centerOrbRadius + 12 + (distanceFromCenter * (barWidth + barGap));

        // Taper: taller near the orb, tapering down towards the right edge
        const taper = Math.sin(((numBarsPerSide - distanceFromCenter) / numBarsPerSide) * (Math.PI / 2));
        const wave = Math.cos(phase + i * 0.45) * 0.3 + 0.7;
        const barHeight = Math.max(
          6,
          vol * 65 * taper * wave + (isListening || isSpeaking ? 6 : 4)
        );

        ctx.fillStyle = isMuted
          ? "#94A3B8"
          : `rgba(147, 51, 234, ${Math.min(1, 0.45 + taper * 0.55)})`;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x, centerY - barHeight / 2, barWidth, barHeight, 2.5);
        } else {
          ctx.rect(x, centerY - barHeight / 2, barWidth, barHeight);
        }
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animId);
  }, [status, inputVolume, outputVolume, isMuted, isSpeaking, isListening, isTool, isProcessing, isConnecting]);

  return (
    <div className="relative flex items-center justify-center w-full my-2">
      {/* Background HTML5 Canvas for dynamic left/right wave bars */}
      <canvas
        ref={canvasRef}
        width={560}
        height={130}
        className="w-full max-w-[560px] h-[130px] block pointer-events-none"
        aria-hidden="true"
      />

      {/* Center Hero Glowing Orb */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
        {/* Outer Glow Ring 2 */}
        <div
          className={`absolute w-28 h-28 rounded-full pointer-events-none transition-all duration-500 ${
            isMuted
              ? "bg-slate-200/40"
              : isSpeaking
              ? "bg-blue-400/20 animate-pulse scale-110"
              : isListening
              ? "bg-blue-400/15 animate-ping duration-1000"
              : "bg-blue-300/10"
          }`}
        />

        {/* Outer Glow Ring 1 */}
        <div
          className={`absolute w-22 h-22 rounded-full pointer-events-none transition-all duration-300 ${
            isMuted
              ? "bg-slate-200/60"
              : isSpeaking
              ? "bg-blue-400/30 scale-105"
              : "bg-blue-400/20"
          }`}
        />

        {/* Center Orb Button */}
        <button
          type="button"
          onClick={() => {
            if (isSpeaking && onInterrupt) {
              onInterrupt();
            }
          }}
          disabled={!isSpeaking}
          title={isSpeaking ? "Click to interrupt assistant" : undefined}
          aria-label={isSpeaking ? "Interrupt assistant" : "Live voice microphone"}
          className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-transform ${
            isMuted
              ? "bg-slate-400 text-white shadow-slate-300"
              : "bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-blue-500/40 hover:scale-105 active:scale-95 cursor-pointer"
          }`}
        >
          <Mic className="w-7 h-7 text-white stroke-[2.2]" />

          {/* Micro-indicator if speaking to show tap to interrupt */}
          {isSpeaking && (
            <span className="absolute -bottom-1 px-1.5 py-0.5 rounded-full bg-slate-900/80 text-[9px] text-white font-medium whitespace-nowrap shadow-sm">
              Tap to interrupt
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
