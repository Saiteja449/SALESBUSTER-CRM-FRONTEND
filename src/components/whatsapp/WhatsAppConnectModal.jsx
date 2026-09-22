import React, { useState } from "react";
import {
  X,
  QrCode,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  LogOut,
  Zap,
  Copy,
  Check,
  Info,
  ShieldCheck,
  Bot,
  Sparkles,
  Wifi,
  Activity,
  MessageSquare,
  Users,
  CheckCheck,
  PhoneCall,
  Lock,
} from "lucide-react";

export default function WhatsAppConnectModal({
  isOpen,
  onClose,
  sessions = [],
  onConnect,
  onDisconnect,
  onRefresh,
  loadingSessions = {},
  organizationName = "",
  whatsappLineLimit = 1,
}) {
  const [copiedSessionId, setCopiedSessionId] = useState(null);
  const [confirmDisconnectId, setConfirmDisconnectId] = useState(null);

  if (!isOpen) return null;

  // Extract or default Primary & Secondary session data
  const primarySession = sessions.find(
    (s) => s.isPrimary || !s.sessionId?.includes("device_2"),
  ) || {
    sessionId: "device_1",
    status: "disconnected",
    qrCode: "",
    connectedPhone: "",
    connectedName: "",
    label: "Device 1 (Primary)",
    isPrimary: true,
  };

  const secondarySession =
    whatsappLineLimit >= 2
      ? sessions.find(
          (s) => !s.isPrimary && s.sessionId?.includes("device_2"),
        ) || {
          sessionId: "device_2",
          status: "disconnected",
          qrCode: "",
          connectedPhone: "",
          connectedName: "",
          label: "Device 2 (Secondary)",
          isPrimary: false,
        }
      : null;

  const isPrimaryLoading = !!loadingSessions[primarySession.sessionId];
  const isSecondaryLoading = secondarySession
    ? !!loadingSessions[secondarySession.sessionId]
    : false;

  const handleCopy = (text, sId) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedSessionId(sId);
    setTimeout(() => setCopiedSessionId(null), 2500);
  };

  const handleConnectBoth = () => {
    if (primarySession.status === "disconnected" && onConnect) {
      onConnect(primarySession.sessionId, 1);
    }
    if (
      whatsappLineLimit >= 2 &&
      secondarySession &&
      secondarySession.status === "disconnected" &&
      onConnect
    ) {
      onConnect(secondarySession.sessionId, 2);
    }
  };

  const formatPhoneNumber = (phone) => {
    if (!phone) return "";
    const clean = phone.replace(/\D/g, "");
    if (clean.length === 12 && clean.startsWith("91")) {
      return `+91 ${clean.slice(2, 7)} ${clean.slice(7)}`;
    }
    if (clean.length === 10) {
      return `+${clean.slice(0, 5)} ${clean.slice(5)}`;
    }
    return `+${clean}`;
  };

  const renderStatusPill = (status) => {
    switch (status) {
      case "connected":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Online & Ready
          </span>
        );
      case "qr":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Scan QR Code
          </span>
        );
      case "connecting":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30 shadow-xs">
            <RefreshCw className="w-3 h-3 animate-spin text-sky-500" />
            Connecting...
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/30">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            Disconnected
          </span>
        );
    }
  };

  // Render QR Code View with HUD Viewfinder Frame
  const renderQRCodeView = (session, deviceNum, isLoading) => (
    <div className="flex flex-col items-center text-center w-full py-2">
      {/* Scanner Viewport */}
      <div className="relative p-4 bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200/80 dark:border-slate-700/80 inline-block mb-4 group">
        {/* Viewfinder Corners */}
        <div className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-emerald-500 rounded-tl-lg pointer-events-none" />
        <div className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-emerald-500 rounded-tr-lg pointer-events-none" />
        <div className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-emerald-500 rounded-bl-lg pointer-events-none" />
        <div className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-emerald-500 rounded-br-lg pointer-events-none" />

        <div className="relative overflow-hidden rounded-2xl bg-white p-2">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(
              session.qrCode,
            )}`}
            alt={`Line ${deviceNum} QR Code`}
            className="w-48 h-48 sm:w-52 sm:h-52 rounded-xl object-contain"
          />
          {/* Animated Laser Scan Line */}
          <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-scan-line pointer-events-none" />
        </div>

        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-md flex items-center gap-1.5 whitespace-nowrap">
          <QrCode className="w-3.5 h-3.5" />
          Scan via WhatsApp Phone {deviceNum}
        </div>
      </div>

      {/* Instructions Card */}
      <div className="w-full max-w-md bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 text-left mb-4 border border-slate-200/80 dark:border-slate-700/60 mt-1">
        <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2.5 flex items-center gap-2">
          <span className="w-5 h-5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-xs">
            ✓
          </span>
          Quick 3-Step Setup:
        </p>
        <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
          <div className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
              1
            </span>
            <span>
              Open <strong>WhatsApp</strong> on your mobile phone.
            </span>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
              2
            </span>
            <span>
              Tap <strong>Menu (⋮)</strong> or <strong>Settings</strong> &gt;{" "}
              <strong>Linked Devices</strong>.
            </span>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
              3
            </span>
            <span>
              Tap <strong>Link a Device</strong> and point your camera at this
              QR code.
            </span>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onConnect && onConnect(session.sessionId, deviceNum)}
        disabled={isLoading}
        className="inline-flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 py-1.5 px-3.5 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
      >
        <RefreshCw
          className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`}
        />
        Refresh QR Code
      </button>
    </div>
  );

  // Render Connecting / Initializing State with Activity Steps
  const renderConnectingView = (deviceNum) => (
    <div className="flex flex-col items-center text-center py-8 w-full max-w-sm mx-auto animate-fadeIn">
      {/* Animated Orbit Loader */}
      <div className="relative mb-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-teal-500/20 via-emerald-500/20 to-sky-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-inner">
          <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
        </div>
        <div className="absolute -inset-1.5 rounded-2xl border-2 border-emerald-500/30 animate-ping opacity-40 pointer-events-none" />
      </div>

      <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1">
        Connecting Line {deviceNum}...
      </h4>
      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed mb-5">
        Establishing a secure WebSocket handshake with WhatsApp servers.
      </p>

      {/* Activity Status Timeline */}
      <div className="w-full bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-700/60 text-left space-y-2.5 shadow-xs">
        <div className="flex items-center gap-2.5 text-xs">
          <span className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-[11px] shrink-0">
            ✓
          </span>
          <span className="text-slate-700 dark:text-slate-200 font-medium">
            Core Engine &amp; Cryptographic Keys Initialized
          </span>
        </div>
        <div className="flex items-center gap-2.5 text-xs">
          <RefreshCw className="w-5 h-5 p-0.5 text-sky-500 animate-spin shrink-0" />
          <span className="text-sky-600 dark:text-sky-400 font-medium">
            Exchanging WhatsApp Auth Handshake...
          </span>
        </div>
        <div className="flex items-center gap-2.5 text-xs text-slate-400 dark:text-slate-500">
          <span className="w-5 h-5 rounded-full border border-slate-300 dark:border-slate-600 flex items-center justify-center text-[10px] shrink-0">
            3
          </span>
          <span>Awaiting QR stream for device pairing</span>
        </div>
      </div>
    </div>
  );

  // Render Disconnected State
  const renderDisconnectedView = (session, deviceNum, isPrimary, isLoading) => (
    <div className="flex flex-col items-center text-center py-8 w-full max-w-md mx-auto">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 text-slate-400 dark:text-slate-500 flex items-center justify-center mb-4 border border-slate-200 dark:border-slate-700/80 shadow-inner">
        <QrCode className="w-8 h-8" />
      </div>
      <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1">
        Line {deviceNum} is Offline
      </h4>
      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed mb-6">
        Connect your {isPrimary ? "primary" : "secondary"} WhatsApp account to
        activate automated lead capture, AI conversations, and real-time CRM
        sync.
      </p>
      <button
        type="button"
        onClick={() => onConnect && onConnect(session.sessionId, deviceNum)}
        disabled={isLoading}
        className={`inline-flex items-center gap-2.5 font-bold py-2.5 px-6 rounded-xl text-sm text-white shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer ${
          isPrimary
            ? "bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-600/25"
            : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-indigo-600/25"
        }`}
      >
        <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
        Connect Line {deviceNum} (Show QR)
      </button>
    </div>
  );

  // Render Single-Line Connected Command Center (Rich Two-Column Layout)
  const renderSingleLineConnectedHub = (session, isLoading) => {
    const formattedPhone = formatPhoneNumber(session.connectedPhone);
    const isCopied = copiedSessionId === session.sessionId;
    const isConfirmingDisconnect = confirmDisconnectId === session.sessionId;

    return (
      <div className="flex flex-col gap-5 w-full">
        {/* Main 2-Column Hub */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Device Identity & Connection Telemetry (5 Cols) */}
          <div className="lg:col-span-12 flex flex-col justify-between rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-emerald-500/[0.06] via-white to-white dark:from-emerald-950/30 dark:via-slate-800/80 dark:to-slate-800/80 p-5 shadow-sm">
            <div>
              {/* Header Status */}
              <div className="flex items-center justify-between gap-2 pb-4 border-b border-emerald-500/15 dark:border-emerald-500/20">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    Live Channel 1
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25">
                  <Activity className="w-3 h-3 text-emerald-500" />
                  Active
                </span>
              </div>

              {/* Avatar & Phone Hero */}
              <div className="flex flex-col items-center text-center py-5">
                <div className="relative mb-3.5">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25">
                    <MessageSquare className="w-8 h-8" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white dark:bg-slate-800 border-2 border-emerald-500 flex items-center justify-center text-emerald-500 shadow-xs">
                    <CheckCheck className="w-3.5 h-3.5 font-bold" />
                  </div>
                </div>

                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold mb-1.5">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  WhatsApp Verified Account
                </div>

                {/* Account Name */}
                <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                  {session.connectedName || "WhatsApp Business"}
                </h3>

                {/* Formatted Phone Number Pill */}
                {session.connectedPhone && (
                  <div className="mt-2.5 inline-flex items-center gap-2 bg-white dark:bg-slate-900 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
                    <span className="text-sm font-mono font-bold text-slate-900 dark:text-slate-100 tracking-wide">
                      {formattedPhone}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(session.connectedPhone, session.sessionId)
                      }
                      title="Copy phone number"
                      className="p-1 rounded-lg text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      {isCopied ? (
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Copied!
                        </span>
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Actions & Disconnect */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-700/60 flex flex-col gap-2">
              {isConfirmingDisconnect ? (
                <div className="p-3 bg-rose-500/10 border border-rose-500/25 rounded-xl flex flex-col gap-2 animate-fadeIn">
                  <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 text-center">
                    Disconnect this WhatsApp channel?
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        onDisconnect && onDisconnect(session.sessionId)
                      }
                      disabled={isLoading}
                      className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                    >
                      Yes, Disconnect
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDisconnectId(null)}
                      className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {onRefresh && (
                    <button
                      type="button"
                      onClick={onRefresh}
                      disabled={isLoading}
                      title="Refresh Connection"
                      className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition-colors cursor-pointer"
                    >
                      <RefreshCw
                        className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
                      />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setConfirmDisconnectId(session.sessionId)}
                    disabled={isLoading}
                    className="flex-1 inline-flex items-center justify-center gap-2 py-2 px-3.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/60 border border-rose-200 dark:border-rose-900/50 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Disconnect Line 1
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Active Capabilities & Live Telemetry (7 Cols) */}
          {/* <div className="lg:col-span-7 flex flex-col justify-between rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/60 dark:bg-slate-800/40 p-5">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Live Channel Capabilities
                  </h4>
                </div>
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
                  Protocol: Baileys v6 Multi-Device
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <div className="p-3 bg-white dark:bg-slate-900/80 rounded-xl border border-slate-200/70 dark:border-slate-800 shadow-xs flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        AI Sales Pilot
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                      Instant 24/7 lead replies & qualification
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-white dark:bg-slate-900/80 rounded-xl border border-slate-200/70 dark:border-slate-800 shadow-xs flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        Lead Auto-Capture
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                      Auto-registers contacts into CRM pipeline
                    </p>
                  </div>
                </div>
                <div className="p-3 bg-white dark:bg-slate-900/80 rounded-xl border border-slate-200/70 dark:border-slate-800 shadow-xs flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        Shared Team Inbox
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                      Sales team can reply concurrently
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-white dark:bg-slate-900/80 rounded-xl border border-slate-200/70 dark:border-slate-800 shadow-xs flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        Cloud Multi-Device
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                      Stays online even when phone is offline
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3.5 border-t border-slate-200/70 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-2 text-[11px]">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium">
                <Wifi className="w-3.5 h-3.5 text-emerald-500" />
                <span>Socket Handshake: <strong className="text-slate-900 dark:text-white">Stable WebSocket</strong></span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                <Check className="w-3 h-3" />
                Ready to Send &amp; Receive Leads
              </div>
            </div>
          </div> */}
        </div>
      </div>
    );
  };

  // Render Card in Dual-Line Grid Mode
  const renderDeviceCard = (session, deviceNum, isLoading) => {
    const isPrimary = deviceNum === 1;
    const title = isPrimary
      ? "Line 1 (Primary WhatsApp)"
      : "Line 2 (Secondary WhatsApp)";
    const description = isPrimary
      ? "Main channel for incoming customer chats, lead capture & AI replies."
      : "Secondary channel for sales reps, follow-up outreach & team backup.";
    const formattedPhone = formatPhoneNumber(session.connectedPhone);
    const isCopied = copiedSessionId === session.sessionId;
    const isConfirmingDisconnect = confirmDisconnectId === session.sessionId;

    return (
      <div
        className={`flex flex-col justify-between rounded-2xl border p-5 transition-all bg-white dark:bg-slate-800/80 shadow-sm ${
          session.status === "qr"
            ? "border-amber-400 dark:border-amber-500/60 ring-2 ring-amber-400/20 shadow-amber-500/10"
            : session.status === "connected"
              ? "border-emerald-500/40 dark:border-emerald-500/40 ring-1 ring-emerald-500/20"
              : "border-slate-200 dark:border-slate-700/80"
        }`}
      >
        <div>
          {/* Card Header */}
          <div className="flex items-start justify-between gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-700/60">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 shadow-xs ${
                  isPrimary
                    ? "bg-gradient-to-tr from-emerald-500/15 to-teal-500/15 text-emerald-600 dark:text-emerald-400"
                    : "bg-gradient-to-tr from-indigo-500/15 to-purple-500/15 text-indigo-600 dark:text-indigo-400"
                }`}
              >
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                  {title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                  {description}
                </p>
              </div>
            </div>
            <div className="shrink-0">{renderStatusPill(session.status)}</div>
          </div>

          {/* Card Body */}
          <div className="flex-1 flex flex-col justify-center items-center py-2 min-h-[260px]">
            {/* STATE: QR */}
            {session.status === "qr" &&
              session.qrCode &&
              renderQRCodeView(session, deviceNum, isLoading)}

            {/* STATE: Connected */}
            {session.status === "connected" && (
              <div className="flex flex-col items-center text-center w-full py-2">
                <div className="relative mb-3">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center shadow-inner">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white dark:border-slate-800"></span>
                  </span>
                </div>

                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-0.5">
                  Line {deviceNum} is Online
                </h4>

                {session.connectedPhone && (
                  <div className="flex items-center gap-2 mt-1 mb-2 bg-slate-100 dark:bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-xs font-mono font-bold text-slate-900 dark:text-slate-100">
                      {formattedPhone}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(session.connectedPhone, session.sessionId)
                      }
                      title="Copy Phone Number"
                      className="text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                    >
                      {isCopied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                )}

                {session.connectedName && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                    Account:{" "}
                    <strong className="text-slate-800 dark:text-slate-200">
                      {session.connectedName}
                    </strong>
                  </p>
                )}

                <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-lg py-1 px-3 mb-4">
                  ✓ Ready to send &amp; receive leads on this number
                </p>

                {isConfirmingDisconnect ? (
                  <div className="w-full p-2.5 bg-rose-500/10 border border-rose-500/25 rounded-xl flex items-center justify-between gap-2 animate-fadeIn">
                    <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                      Disconnect line?
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          onDisconnect && onDisconnect(session.sessionId)
                        }
                        className="py-1 px-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDisconnectId(null)}
                        className="py-1 px-2.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold transition-all cursor-pointer"
                      >
                        No
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDisconnectId(session.sessionId)}
                    disabled={isLoading}
                    className="inline-flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-bold py-1.5 px-3.5 rounded-xl text-xs border border-rose-200 dark:border-rose-900/60 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Disconnect Line {deviceNum}
                  </button>
                )}
              </div>
            )}

            {/* STATE: Connecting or Initializing */}
            {(session.status === "connecting" || (isLoading && session.status === "disconnected")) &&
              renderConnectingView(deviceNum)}

            {/* STATE: Disconnected and not loading */}
            {session.status === "disconnected" && !isLoading &&
              renderDisconnectedView(session, deviceNum, isPrimary, isLoading)}
          </div>
        </div>
      </div>
    );
  };

  const hasDisconnected =
    primarySession.status === "disconnected" ||
    (whatsappLineLimit >= 2 &&
      secondarySession &&
      secondarySession.status === "disconnected");

  const isSingleLineConnected =
    whatsappLineLimit === 1 && primarySession.status === "connected";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/65 backdrop-blur-md animate-fadeIn">
      {/* Inline styles for laser scan animation */}
      <style>{`
        @keyframes scanLine {
          0% { top: 0%; opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-scan-line {
          animation: scanLine 2.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}</style>

      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200/80 dark:border-slate-800 bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-slate-900/90 dark:via-slate-900 dark:to-slate-900/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-500/20">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                  Connect WhatsApp Channels
                </h2>
                {/* <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25">
                  {whatsappLineLimit >= 2 ? "Dual-Line Mode" : "1 Line Active"}
                </span> */}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
                <span>Organization:</span>
                <strong className="text-slate-700 dark:text-slate-300 font-semibold">
                  {organizationName || "Multi-channel WhatsApp"}
                </strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Refresh */}
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                title="Refresh Status"
                className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Global Action Banner for Dual-Line Mode */}
        {whatsappLineLimit >= 2 && hasDisconnected && (
          <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 p-3 px-5 border-b border-slate-200/60 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
              <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>
                Want to connect both lines now? You can generate QR codes for
                both devices simultaneously.
              </span>
            </div>
            <button
              type="button"
              onClick={handleConnectBoth}
              disabled={isPrimaryLoading || isSecondaryLoading}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs py-1.5 px-3.5 rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${
                  isPrimaryLoading || isSecondaryLoading ? "animate-spin" : ""
                }`}
              />
              Generate Both QR Codes
            </button>
          </div>
        )}

        {/* Main Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {isSingleLineConnected ? (
            // Dedicated Single-Line Connected Command Center
            renderSingleLineConnectedHub(primarySession, isPrimaryLoading)
          ) : (
            // Grid View (Dual-line mode or QR/Connecting/Disconnected states)
            <div
              className={`grid grid-cols-1 ${
                whatsappLineLimit >= 2 ? "md:grid-cols-2" : "max-w-2xl mx-auto"
              } gap-5`}
            >
              {renderDeviceCard(primarySession, 1, isPrimaryLoading)}
              {whatsappLineLimit >= 2 &&
                secondarySession &&
                renderDeviceCard(secondarySession, 2, isSecondaryLoading)}
            </div>
          )}

          {/* Educational Callout */}
          <div className="mt-5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 mt-0.5">
              <Info className="w-4 h-4" />
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {whatsappLineLimit >= 2 ? (
                <>
                  <strong className="text-slate-800 dark:text-slate-200">
                    How Dual Lines Work:
                  </strong>{" "}
                  Both WhatsApp numbers run concurrently. Messages arriving on
                  either device will automatically populate your CRM
                  conversations, trigger AI lead qualification, and alert
                  assigned sales reps.
                </>
              ) : (
                <>
                  <strong className="text-slate-800 dark:text-slate-200">
                    Seamless AI &amp; CRM Sync:
                  </strong>{" "}
                  Your linked WhatsApp account operates via WhatsApp
                  Multi-Device Protocol. It stays online independently without
                  requiring your phone to be continuously powered on or
                  connected to Wi-Fi.
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>End-to-End Encrypted via WhatsApp Multi-Device Protocol</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
