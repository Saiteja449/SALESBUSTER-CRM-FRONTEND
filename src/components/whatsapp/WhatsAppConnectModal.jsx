import { useState, useEffect, useRef } from "react";
import {
  X,
  QrCode,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  LogOut,
  Copy,
  Check,
  ShieldCheck,
} from "lucide-react";

export default function WhatsAppConnectModal({
  isOpen,
  onClose,
  sessions = [],
  onConnect,
  onPairingCodeRequest,
  onDisconnect,
  onRefresh,
  loadingSessions = {},
  organizationName = "",
  whatsappLineLimit = 1,
  currentUser = null,
  repSessionError = "",
  pairingCodeData = null,
}) {
  const [copiedSessionId, setCopiedSessionId] = useState(null);
  const [confirmDisconnectId, setConfirmDisconnectId] = useState(null);
  const [dismissedError, setDismissedError] = useState(false);
  const normalizedRole = String(currentUser?.role || "").toLowerCase().trim();
  const isRepMode = [
    "sales person",
    "sales representative",
    "sales_person",
  ].includes(normalizedRole);

  // Resolve rep session
  const repSession = sessions.find((s) => s.isRepSession) || sessions[0] || {
    sessionId: currentUser?._id
      ? `org_${currentUser.organizationId}_user_${currentUser._id}`
      : "rep_session",
    status: "disconnected",
    qrCode: "",
    connectedPhone: "",
    connectedName: "",
    isRepSession: true,
  };

  const repSessionId =
    repSession.sessionId ||
    (currentUser?._id
      ? `org_${currentUser.organizationId}_user_${currentUser._id}`
      : "rep_session");
  const isRepLoading = !!loadingSessions[repSessionId];

  const primarySession = sessions.find(
    (s) =>
      (isRepMode && s.isRepSession) ||
      s.isPrimary ||
      !s.sessionId?.includes("device_2"),
  ) || {
    sessionId: isRepMode ? repSessionId : "device_1",
    status: "disconnected",
    qrCode: "",
    connectedPhone: "",
    connectedName: "",
    label: isRepMode ? "My WhatsApp Line" : "Line 1 (Primary)",
    isPrimary: true,
  };

  const secondarySession =
    !isRepMode && whatsappLineLimit >= 2
      ? sessions.find((s) => !s.isPrimary && s.sessionId?.includes("device_2")) || {
          sessionId: "device_2",
          status: "disconnected",
          qrCode: "",
          connectedPhone: "",
          connectedName: "",
          label: "Line 2 (Secondary)",
          isPrimary: false,
        }
      : null;

  // Auto-connect QR for Sales Rep when modal opens (QR mode only)
  useEffect(() => {
    if (!isOpen || !isRepMode) return;
    if (
      repSession.status === "disconnected" &&
      !loadingSessions[repSessionId] &&
      onConnect
    ) {
      const currentMode = connectionMode[repSessionId] || "qr";
      if (currentMode === "qr") {
        onConnect(repSessionId, 1);
      }
    }
  }, [isOpen, isRepMode, repSession.status, repSessionId]);

  // Reset dismissed error state when a new error arrives
  useEffect(() => {
    if (repSessionError) setDismissedError(false);
  }, [repSessionError]);

  if (!isOpen) return null;

  const handleCopy = (text, sId) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedSessionId(sId);
    setTimeout(() => setCopiedSessionId(null), 2500);
  };

  function formatPhoneNumber(phone) {
    if (!phone) return "";
    const clean = phone.replace(/\D/g, "");
    if (clean.length === 12 && clean.startsWith("91")) {
      return `+91 ${clean.slice(2, 7)} ${clean.slice(7)}`;
    }
    if (clean.length === 10) {
      return `+${clean.slice(0, 5)} ${clean.slice(5)}`;
    }
    return `+${clean}`;
  }

  function renderStatusPill(status) {
    switch (status) {
      case "connected":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Online &amp; Ready
          </span>
        );
      case "qr":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Scan QR Code
          </span>
        );
      case "connecting":
      case "pairing":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30 shadow-xs">
            <RefreshCw className="w-3 h-3 animate-spin text-sky-500" />
            Connecting...
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/30">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            Offline
          </span>
        );
    }
  }

  function renderDeviceCard(session, deviceNum, isPrimary, isLoading) {
    const title = isRepMode
      ? "Personal Sales Line"
      : deviceNum === 2
      ? "Line 2 (Secondary WhatsApp)"
      : "Line 1 (Primary WhatsApp)";

    const isConnected = session.status === "connected";
    const isQR = session.status === "qr" && session.qrCode;

    const isConnecting =
      !isQR &&
      (session.status === "connecting" || session.status === "pairing" || (isLoading && !isQR && !isConnected));
    const isDisconnected = !isConnected && !isQR && !isConnecting;
    const isConfirming = confirmDisconnectId === session.sessionId;

    return (
      <div className="flex flex-col justify-between rounded-2xl border border-slate-200 dark:border-purple-800/30 bg-slate-50/50 dark:bg-white/[0.02] p-4 sm:p-5 transition-all">
        {/* Card Header */}
        <div className="flex items-center justify-between gap-3 pb-3 mb-4 border-b border-slate-200/80 dark:border-purple-800/20">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                isConnected
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                  : "bg-purple-500/15 text-purple-600 dark:text-purple-400"
              }`}
            >
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                {title}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-purple-300/70">
                {isRepMode
                  ? "Direct customer chat channel"
                  : isPrimary
                  ? "Incoming leads & AI replies"
                  : "Sales rep outreach line"}
              </p>
            </div>
          </div>
          <div className="shrink-0">
            {renderStatusPill(session.status)}
          </div>
        </div>

        {/* Card Body */}
        <div className="flex-1 flex flex-col justify-center items-center py-2 min-h-[280px]">

          {/* ── STATE: Connected ── */}
          {isConnected && (
            <div className="flex flex-col items-center text-center w-full py-2 animate-fadeIn">
              <div className="relative mb-3">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center shadow-inner">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white dark:border-slate-900"></span>
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-0.5">
                {session.connectedName || (isRepMode ? "My WhatsApp" : `Line ${deviceNum}`)}
              </h4>
              <p className="text-xs text-slate-500 dark:text-purple-300/80 mb-2">
                WhatsApp Account Active
              </p>
              {session.connectedPhone && (
                <div className="flex items-center gap-2 mt-1 mb-3 bg-white dark:bg-slate-900/90 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-purple-800/30 shadow-xs">
                  <span className="text-xs font-mono font-bold text-slate-900 dark:text-slate-100">
                    {formatPhoneNumber(session.connectedPhone)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(session.connectedPhone, session.sessionId)}
                    title="Copy Phone Number"
                    className="text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                  >
                    {copiedSessionId === session.sessionId ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              )}
              <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-lg py-1 px-3 mb-4">
                ✓ Ready to send &amp; receive customer leads
              </p>
              {isConfirming ? (
                <div className="w-full p-2.5 bg-rose-500/10 border border-rose-500/25 rounded-xl flex items-center justify-between gap-2 animate-fadeIn">
                  <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                    Disconnect this WhatsApp line?
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onDisconnect && onDisconnect(session.sessionId)}
                      className="py-1 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                    >
                      Yes, Disconnect
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDisconnectId(null)}
                      className="py-1 px-2.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDisconnectId(session.sessionId)}
                  disabled={isLoading}
                  className="inline-flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-bold py-1.5 px-4 rounded-xl text-xs border border-rose-200 dark:border-rose-900/60 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Disconnect Line
                </button>
              )}
            </div>
          )}

          {/* ── STATE: QR Ready ── */}
          {isQR && (
            <div className="flex flex-col items-center text-center w-full py-1 animate-fadeIn">
              {isRepMode && (
                <div className="mb-3 p-2 px-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <p className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                    Scan with your WhatsApp account to link your personal line.
                  </p>
                </div>
              )}
              <div className="relative p-3 bg-white rounded-2xl shadow-lg border border-slate-200 inline-block mb-3.5">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=8&data=${encodeURIComponent(session.qrCode)}`}
                  alt="WhatsApp QR Code"
                  className="w-44 h-44 sm:w-48 sm:h-48 rounded-xl object-contain"
                />
              </div>
              <div className="w-full max-w-sm bg-white dark:bg-slate-800/60 rounded-xl p-3 text-left border border-slate-200/80 dark:border-purple-800/20 text-xs space-y-1.5 text-slate-600 dark:text-slate-300 mb-3">
                {[
                  <span key="s1">Open <strong>WhatsApp</strong> on your mobile phone.</span>,
                  <span key="s2">Tap <strong>Menu (⋮)</strong> or <strong>Settings</strong> &gt; <strong>Linked Devices</strong>.</span>,
                  <span key="s3">Tap <strong>Link a Device</strong> and point your camera at this QR code.</span>,
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-[10px] shrink-0">
                      {i + 1}
                    </span>
                    {step}
                  </div>
                ))}
              </div>
              <div className="w-full max-w-sm p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-left text-xs text-amber-800 dark:text-amber-300">
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong className="font-bold">Important Note:</strong> Do not close or minimize WhatsApp on your mobile phone until the sync is fully completed.
                </div>
              </div>
            </div>
          )}

          {/* ── STATE: Connecting / Generating QR ── */}
          {isConnecting && (
            <div className="flex flex-col items-center text-center py-6 w-full max-w-sm mx-auto animate-fadeIn">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3 shadow-inner">
                <RefreshCw className="w-7 h-7 animate-spin text-emerald-500" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                {isRepMode ? "Generating your WhatsApp QR code..." : `Connecting Line ${deviceNum}...`}
              </h4>
              <p className="text-xs text-slate-500 dark:text-purple-300/80 max-w-xs mb-4">
                Establishing a secure connection with WhatsApp. The QR code will appear automatically in a moment.
              </p>
              <div className="w-full p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2 text-left text-xs text-amber-700 dark:text-amber-300">
                <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <span>Please keep your mobile WhatsApp open and ready to scan once the QR code loads.</span>
              </div>
            </div>
          )}

          {/* ── STATE: Disconnected — show QR connect button ── */}
          {isDisconnected && (
            <div className="flex flex-col items-center text-center py-3 w-full max-w-sm mx-auto animate-fadeIn">
              <div className="w-full flex flex-col items-center animate-fadeIn">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mb-3">
                  <QrCode className="w-7 h-7" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                  {isRepMode ? "WhatsApp Line Offline" : `Line ${deviceNum} is Offline`}
                </h4>
                <p className="text-xs text-slate-500 dark:text-purple-300/80 max-w-xs mb-5">
                  {isRepMode
                    ? "Scan a QR code to connect your WhatsApp account and receive lead inquiries."
                    : `Connect ${deviceNum === 1 ? "primary" : "secondary"} channel for real-time CRM sync.`}
                </p>
                <button
                  type="button"
                  onClick={() => onConnect && onConnect(session.sessionId, deviceNum)}
                  disabled={isLoading}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-2.5 px-5 rounded-xl text-xs shadow-md shadow-emerald-600/25 transition-all cursor-pointer disabled:opacity-50"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Show QR Code</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const isDualLine = !isRepMode && whatsappLineLimit >= 2;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div
        className={`relative w-full ${
          isDualLine ? "max-w-3xl" : "max-w-lg"
        } bg-white dark:bg-[#130b24] rounded-3xl shadow-2xl border border-slate-200 dark:border-purple-800/40 overflow-hidden flex flex-col max-h-[92vh]`}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200/80 dark:border-purple-800/30 bg-slate-50/70 dark:bg-white/[0.02] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-500/20">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                  WhatsApp Connection
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/25">
                  {isRepMode
                    ? "Personal Line"
                    : isDualLine
                    ? "2 Channels"
                    : "1 Channel"}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-purple-300/80 mt-0.5">
                {isRepMode
                  ? repSession.connectedPhone
                    ? `Active Line: ${formatPhoneNumber(repSession.connectedPhone)}`
                    : "Personal sales line"
                  : `Organization: ${organizationName || "Multi-channel WhatsApp"}`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {/* Error Banner */}
          {repSessionError &&
            repSession.status === "disconnected" &&
            !dismissedError && (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/40 flex items-start justify-between gap-2.5 animate-fadeIn">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-red-700 dark:text-red-400 mb-0.5">
                      Connection Error
                    </p>
                    <p className="text-xs text-red-600 dark:text-red-300">
                      {repSessionError}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDismissedError(true)}
                  className="text-red-400 hover:text-red-600 dark:hover:text-white p-1 cursor-pointer"
                  title="Dismiss error"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

          {/* Device Cards Grid */}
          <div className={`grid grid-cols-1 ${isDualLine ? "md:grid-cols-2" : ""} gap-4`}>
            {isRepMode ? (
              renderDeviceCard(repSession, 1, true, isRepLoading)
            ) : (
              <>
                {renderDeviceCard(
                  primarySession,
                  1,
                  true,
                  !!loadingSessions[primarySession.sessionId],
                )}
                {isDualLine &&
                  secondarySession &&
                  renderDeviceCard(
                    secondarySession,
                    2,
                    false,
                    !!loadingSessions[secondarySession.sessionId],
                  )}
              </>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 sm:p-4 border-t border-slate-200/80 dark:border-purple-800/30 bg-slate-50/70 dark:bg-white/[0.02] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-purple-300/70">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>End-to-End Encrypted via WhatsApp Multi-Device</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-purple-900/40 dark:hover:bg-purple-900/70 text-slate-800 dark:text-purple-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
