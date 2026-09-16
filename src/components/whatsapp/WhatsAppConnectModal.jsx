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
  Layers,
  Copy,
  Check,
  Info,
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

  if (!isOpen) return null;

  // Extract or default Primary & Secondary session data
  const primarySession = sessions.find((s) => s.isPrimary || !s.sessionId?.includes("device_2")) || {
    sessionId: "device_1",
    status: "disconnected",
    qrCode: "",
    connectedPhone: "",
    connectedName: "",
    label: "Device 1 (Primary)",
    isPrimary: true,
  };

  const secondarySession = whatsappLineLimit >= 2
    ? (sessions.find((s) => !s.isPrimary && s.sessionId?.includes("device_2")) || {
        sessionId: "device_2",
        status: "disconnected",
        qrCode: "",
        connectedPhone: "",
        connectedName: "",
        label: "Device 2 (Secondary)",
        isPrimary: false,
      })
    : null;

  const isPrimaryLoading = !!loadingSessions[primarySession.sessionId];
  const isSecondaryLoading = secondarySession ? !!loadingSessions[secondarySession.sessionId] : false;

  const handleCopy = (text, sId) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedSessionId(sId);
    setTimeout(() => setCopiedSessionId(null), 2000);
  };

  const handleConnectBoth = () => {
    if (primarySession.status === "disconnected" && onConnect) {
      onConnect(primarySession.sessionId, 1);
    }
    if (whatsappLineLimit >= 2 && secondarySession && secondarySession.status === "disconnected" && onConnect) {
      onConnect(secondarySession.sessionId, 2);
    }
  };

  const renderStatusPill = (status) => {
    switch (status) {
      case "connected":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Connected
          </span>
        );
      case "qr":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Ready to Scan
          </span>
        );
      case "connecting":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
            <RefreshCw className="w-3 h-3 animate-spin" />
            Connecting...
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/30">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            Disconnected
          </span>
        );
    }
  };

  const renderDeviceCard = (session, deviceNum, isLoading) => {
    const isPrimary = deviceNum === 1;
    const title = isPrimary ? "Line 1 (Primary WhatsApp)" : "Line 2 (Secondary WhatsApp)";
    const description = isPrimary
      ? "Main channel for incoming customer chats, lead capture & AI replies."
      : "Secondary channel for sales reps, follow-up outreach & team backup.";

    return (
      <div
        className={`flex flex-col rounded-2xl border p-5 transition-all bg-white dark:bg-slate-800/80 shadow-sm ${
          session.status === "qr"
            ? "border-amber-400 dark:border-amber-500/60 ring-2 ring-amber-400/20 shadow-amber-500/10"
            : session.status === "connected"
              ? "border-emerald-500/40 dark:border-emerald-500/40 ring-1 ring-emerald-500/20"
              : "border-slate-200 dark:border-slate-700/80"
        }`}
      >
        {/* Card Header */}
        <div className="flex items-start justify-between gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-700/60">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                isPrimary
                  ? "bg-purple-500/15 text-purple-600 dark:text-purple-400"
                  : "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400"
              }`}
            >
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                  {title}
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                {description}
              </p>
            </div>
          </div>
          <div className="shrink-0">{renderStatusPill(session.status)}</div>
        </div>

        {/* Card Content Area */}
        <div className="flex-1 flex flex-col justify-center items-center py-2 min-h-[280px]">
          {/* STATE 1: QR Code Available */}
          {session.status === "qr" && session.qrCode && (
            <div className="flex flex-col items-center text-center w-full animate-fadeIn">
              <div className="relative p-3 bg-white rounded-2xl shadow-md border border-slate-200 dark:border-slate-600 inline-block mb-3">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=8&data=${encodeURIComponent(
                    session.qrCode,
                  )}`}
                  alt={`${title} QR Code`}
                  className="w-48 h-48 rounded-lg"
                />
                <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-sm">
                  Scan on Phone {deviceNum}
                </div>
              </div>

              {/* Steps guide */}
              <div className="w-full bg-slate-50 dark:bg-slate-900/60 rounded-xl p-3 text-left mb-4 border border-slate-200/70 dark:border-slate-700/50">
                <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <QrCode className="w-3.5 h-3.5 text-amber-500" />
                  How to link Phone {deviceNum}:
                </p>
                <ol className="text-xs text-slate-600 dark:text-slate-400 space-y-1 pl-4 list-decimal">
                  <li>Open WhatsApp on <strong>Phone {deviceNum}</strong></li>
                  <li>Go to <strong>Settings</strong> or <strong>Menu (⋮)</strong> &gt; <strong>Linked Devices</strong></li>
                  <li>Tap <strong>Link a Device</strong> and scan this QR code</li>
                </ol>
              </div>

              <button
                type="button"
                onClick={() => onConnect && onConnect(session.sessionId, deviceNum)}
                disabled={isLoading}
                className="inline-flex items-center gap-2 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 py-1 px-3 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                Refresh QR Code
              </button>
            </div>
          )}

          {/* STATE 2: Connected */}
          {session.status === "connected" && (
            <div className="flex flex-col items-center text-center w-full py-4 animate-fadeIn">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-3 shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                Line {deviceNum} is Online
              </h4>

              {session.connectedPhone && (
                <div className="flex items-center gap-2 mt-1 mb-2 bg-slate-100 dark:bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
                  <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                    +{session.connectedPhone}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(session.connectedPhone, session.sessionId)}
                    title="Copy Phone Number"
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {copiedSessionId === session.sessionId ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              )}

              {session.connectedName && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  Account Name: <span className="font-semibold text-slate-700 dark:text-slate-300">{session.connectedName}</span>
                </p>
              )}

              <p className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-lg py-1.5 px-3 mb-6 max-w-xs">
                ✓ Ready to send &amp; receive leads on this number
              </p>

              <button
                type="button"
                onClick={() => onDisconnect && onDisconnect(session.sessionId)}
                disabled={isLoading}
                className="inline-flex items-center gap-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-bold py-2 px-4 rounded-xl text-xs border border-rose-200 dark:border-rose-900/60 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Disconnect Line {deviceNum}
              </button>
            </div>
          )}

          {/* STATE 3: Connecting / Initializing */}
          {session.status === "connecting" && (
            <div className="flex flex-col items-center text-center py-8 animate-fadeIn">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-4">
                <RefreshCw className="w-7 h-7 animate-spin text-blue-500" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                Initializing Line {deviceNum}...
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
                Starting WhatsApp connection worker and generating secure QR code. This usually takes 3 to 8 seconds.
              </p>
            </div>
          )}

          {/* STATE 4: Disconnected */}
          {session.status === "disconnected" && (
            <div className="flex flex-col items-center text-center py-6 animate-fadeIn">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-900 text-slate-400 flex items-center justify-center mb-3 border border-slate-200 dark:border-slate-800">
                <QrCode className="w-7 h-7" />
              </div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
                Line {deviceNum} Not Connected
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed mb-6">
                Click below to generate the QR code and link your {isPrimary ? "primary" : "secondary"} WhatsApp phone.
              </p>
              <button
                type="button"
                onClick={() => onConnect && onConnect(session.sessionId, deviceNum)}
                disabled={isLoading}
                className={`inline-flex items-center gap-2 font-bold py-2.5 px-5 rounded-xl text-sm text-white shadow-md transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer ${
                  isPrimary
                    ? "bg-purple-600 hover:bg-purple-700 shadow-purple-500/20"
                    : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20"
                }`}
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                Connect Line {deviceNum} (Show QR)
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const hasDisconnected = primarySession.status === "disconnected" ||
    (whatsappLineLimit >= 2 && secondarySession && secondarySession.status === "disconnected");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Connect WhatsApp Channels
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                  {whatsappLineLimit >= 2 ? "2 Lines Allowed" : "1 Line"}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {organizationName ? `Organization: ${organizationName}` : "Multi-channel WhatsApp integration"}
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
                className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
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

        {/* Global Action Banner */}
        {whatsappLineLimit >= 2 && hasDisconnected && (
          <div className="bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-transparent p-3.5 px-5 border-b border-slate-200/60 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
              <Zap className="w-4 h-4 text-purple-500 shrink-0" />
              <span>
                Want to connect both lines now? You can generate QR codes for both devices simultaneously.
              </span>
            </div>
            <button
              type="button"
              onClick={handleConnectBoth}
              disabled={isPrimaryLoading || isSecondaryLoading}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs py-1.5 px-3.5 rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isPrimaryLoading || isSecondaryLoading ? "animate-spin" : ""}`}
              />
              Generate Both QR Codes
            </button>
          </div>
        )}

        {/* Main Content Area: 2 Device Cards Grid */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1">
          <div className={`grid grid-cols-1 ${whatsappLineLimit >= 2 ? 'md:grid-cols-2' : ''} gap-5`}>
            {renderDeviceCard(primarySession, 1, isPrimaryLoading)}
            {whatsappLineLimit >= 2 && secondarySession && renderDeviceCard(secondarySession, 2, isSecondaryLoading)}
          </div>

          {/* Educational Callout */}
          <div className="mt-5 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 flex items-start gap-3">
            <Info className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {whatsappLineLimit >= 2 ? (
                <><strong className="text-slate-800 dark:text-slate-200">How Dual Lines Work:</strong>{" "}
                Both WhatsApp numbers run concurrently. Messages arriving on either device will automatically populate your CRM conversations, trigger AI lead qualification, and alert assigned sales reps. You can switch or reply seamlessly.</>
              ) : (
                <><strong className="text-slate-800 dark:text-slate-200">Single Line Mode:</strong>{" "}
                Your organization is set up with a single WhatsApp line. Messages arriving on this device will automatically populate your CRM conversations, trigger AI lead qualification, and alert assigned sales reps. Contact your admin to upgrade to dual lines.</>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            <span>Encrypted Multi-Device Baileys Connection</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
