import { useState, useEffect } from "react";
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
  Clock,
  ArrowRight,
  Info,
  Sparkles,
} from "lucide-react";

export default function WhatsAppConnectModal({
  isOpen,
  onClose,
  sessions = [],
  onConnect,
  // onPairingCodeRequest, // Pairing code feature currently disabled
  onDisconnect,
  onRefresh,
  loadingSessions = {},
  organizationName = "",
  whatsappLineLimit = 1,
  currentUser = null,
  repSessionError = "",
  // pairingCodeData = null, // Pairing code feature currently disabled
}) {
  const [copiedSessionId, setCopiedSessionId] = useState(null);
  const [confirmDisconnectId, setConfirmDisconnectId] = useState(null);
  const [dismissedError, setDismissedError] = useState(false);
  const [qrLoadFailedMap, setQrLoadFailedMap] = useState({});
  const [qrCountdown, setQrCountdown] = useState(60);

  const normalizedRole = String(currentUser?.role || "")
    .toLowerCase()
    .trim();
  const isRepMode = [
    "sales person",
    "sales representative",
    "sales_person",
  ].includes(normalizedRole);

  // Resolve rep session
  const repSession = sessions.find((s) => s.isRepSession) ||
    sessions[0] || {
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
      ? sessions.find(
          (s) => !s.isPrimary && s.sessionId?.includes("device_2"),
        ) || {
          sessionId: "device_2",
          status: "disconnected",
          qrCode: "",
          connectedPhone: "",
          connectedName: "",
          label: "Line 2 (Secondary)",
          isPrimary: false,
        }
      : null;

  // Background scroll lock and Escape key listener
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Auto-connect QR for Sales Rep when modal opens
  useEffect(() => {
    if (!isOpen || !isRepMode) return;
    if (
      repSession.status === "disconnected" &&
      !loadingSessions[repSessionId] &&
      onConnect
    ) {
      onConnect(repSessionId, 1);
    }
  }, [isOpen, isRepMode, repSession.status, repSessionId, onConnect, loadingSessions]);

  // Reset dismissed error state when a new error arrives
  useEffect(() => {
    if (repSessionError) setDismissedError(false);
  }, [repSessionError]);

  // 60-second QR freshness countdown
  const anyHasQr =
    primarySession.status === "qr" ||
    secondarySession?.status === "qr" ||
    repSession?.status === "qr";

  useEffect(() => {
    let timer;
    if (isOpen && anyHasQr) {
      setQrCountdown(60);
      timer = setInterval(() => {
        setQrCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isOpen, anyHasQr, primarySession.qrCode, secondarySession?.qrCode, repSession.qrCode]);

  if (!isOpen) return null;

  const handleCopy = (text, sId) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedSessionId(sId);
    setTimeout(() => setCopiedSessionId(null), 2500);
  };

  function formatPhoneNumber(phone) {
    if (!phone) return "";
    const clean = String(phone).replace(/\D/g, "");
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

  // Mini step progression bar
  function renderStepIndicator(currentStage) {
    const steps = [
      { id: "init", label: "1. Generate Code" },
      { id: "scan", label: "2. Scan with Phone" },
      { id: "ready", label: "3. Ready" },
    ];

    const getStepState = (stepId) => {
      if (currentStage === "connected") return "complete";
      if (currentStage === "qr") {
        if (stepId === "init") return "complete";
        if (stepId === "scan") return "active";
        return "pending";
      }
      if (currentStage === "connecting") {
        if (stepId === "init") return "active";
        return "pending";
      }
      // disconnected
      return "pending";
    };

    return (
      <div className="w-full bg-slate-100/80 dark:bg-slate-800/50 rounded-xl p-2 px-3 mb-3 border border-slate-200/60 dark:border-purple-800/20">
        <div className="flex items-center justify-between text-[11px] font-semibold">
          {steps.map((st, idx) => {
            const state = getStepState(st.id);
            return (
              <div key={st.id} className="flex items-center gap-1.5">
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    state === "complete"
                      ? "bg-emerald-500 text-white"
                      : state === "active"
                        ? "bg-purple-600 text-white animate-pulse"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {state === "complete" ? "✓" : idx + 1}
                </span>
                <span
                  className={`${
                    state === "complete"
                      ? "text-emerald-700 dark:text-emerald-400"
                      : state === "active"
                        ? "text-purple-700 dark:text-purple-300 font-bold"
                        : "text-slate-400 dark:text-slate-500"
                  } hidden sm:inline`}
                >
                  {st.label}
                </span>
                {idx < steps.length - 1 && (
                  <ArrowRight className="w-3 h-3 text-slate-300 dark:text-slate-600 ml-1 sm:ml-2" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
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
      (session.status === "connecting" ||
        session.status === "pairing" ||
        (isLoading && !isQR && !isConnected));
    const isDisconnected = !isConnected && !isQR && !isConnecting;
    const isConfirming = confirmDisconnectId === session.sessionId;

    const currentStage = isConnected
      ? "connected"
      : isQR
        ? "qr"
        : isConnecting
          ? "connecting"
          : "disconnected";

    return (
      <div className="flex flex-col justify-between rounded-2xl border border-slate-200 dark:border-purple-800/30 bg-slate-50/50 dark:bg-white/[0.02] p-4 sm:p-5 transition-all">
        {/* Card Header */}
        <div className="pb-3 mb-3 border-b border-slate-200/80 dark:border-purple-800/20">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                  isConnected
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                    : "bg-purple-500/15 text-purple-600 dark:text-purple-400"
                }`}
              >
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                  {title}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-purple-300/70">
                  {isRepMode
                    ? "Direct customer chat channel for your assigned leads"
                    : isPrimary
                      ? "Primary inbox: incoming leads & AI bot replies"
                      : "Secondary outreach: rep campaigns & broadcasts"}
                </p>
              </div>
            </div>
            <div className="shrink-0">{renderStatusPill(session.status)}</div>
          </div>

          {/* Connection Step Progression Bar */}
          {renderStepIndicator(currentStage)}
        </div>

        {/* Card Body */}
        <div className="flex-1 flex flex-col justify-center items-center py-2 min-h-[290px]">
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
                {session.connectedName ||
                  (isRepMode ? "My WhatsApp" : `Line ${deviceNum}`)}
              </h4>
              <p className="text-xs text-slate-500 dark:text-purple-300/80 mb-2">
                WhatsApp Account Active &amp; Synced
              </p>
              {session.connectedPhone && (
                <div className="flex items-center gap-2 mt-1 mb-3 bg-white dark:bg-slate-900/90 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-purple-800/30 shadow-xs">
                  <span className="text-xs font-mono font-bold text-slate-900 dark:text-slate-100">
                    {formatPhoneNumber(session.connectedPhone)}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(session.connectedPhone, session.sessionId)
                    }
                    aria-label="Copy phone number"
                    title="Copy Phone Number"
                    className="text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer p-0.5 rounded focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
                  >
                    {copiedSessionId === session.sessionId ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              )}
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-lg py-1 px-3 mb-4">
                <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Ready to send &amp; receive customer leads in real time</span>
              </div>

              {isConfirming ? (
                <div className="w-full p-3 bg-rose-500/10 border border-rose-500/25 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-2.5 animate-fadeIn">
                  <div className="text-left">
                    <span className="text-xs font-bold text-rose-600 dark:text-rose-400 block">
                      Disconnect this WhatsApp line?
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Incoming &amp; outgoing messages will pause until reconnected.
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        onDisconnect && onDisconnect(session.sessionId)
                      }
                      disabled={isLoading}
                      className="py-1.5 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
                    >
                      {isLoading ? "Disconnecting..." : "Yes, Disconnect"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDisconnectId(null)}
                      disabled={isLoading}
                      className="py-1.5 px-2.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold transition-all cursor-pointer disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:outline-none"
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
                  className="inline-flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-bold py-1.5 px-4 rounded-xl text-xs border border-rose-200 dark:border-rose-900/60 transition-colors disabled:opacity-50 cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Disconnect Line</span>
                </button>
              )}
            </div>
          )}

          {/* ── STATE: QR Ready ── */}
          {isQR && (
            <div className="flex flex-col items-center text-center w-full py-1 animate-fadeIn">
              {isRepMode && (
                <div className="mb-2.5 p-2 px-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <p className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                    Scan with your WhatsApp account to link your personal sales line.
                  </p>
                </div>
              )}

              {/* QR Container with high-contrast background and expiry countdown */}
              <div className="relative p-3.5 bg-white rounded-2xl shadow-md border border-slate-200/90 inline-block mb-3">
                {qrLoadFailedMap[session.sessionId] ? (
                  <div className="w-44 h-44 sm:w-48 sm:h-48 flex flex-col items-center justify-center p-3 text-center bg-slate-50 rounded-xl">
                    <AlertCircle className="w-8 h-8 text-rose-500 mb-2" />
                    <p className="text-xs font-semibold text-slate-700 mb-2">
                      Failed to render QR code image.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setQrLoadFailedMap((prev) => ({
                          ...prev,
                          [session.sessionId]: false,
                        }));
                        onConnect && onConnect(session.sessionId, deviceNum);
                      }}
                      className="text-xs px-3 py-1 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 cursor-pointer"
                    >
                      Retry QR
                    </button>
                  </div>
                ) : (
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=8&data=${encodeURIComponent(session.qrCode)}`}
                    alt="WhatsApp QR Code"
                    onError={() =>
                      setQrLoadFailedMap((prev) => ({
                        ...prev,
                        [session.sessionId]: true,
                      }))
                    }
                    className="w-44 h-44 sm:w-48 sm:h-48 rounded-xl object-contain"
                  />
                )}

                {/* Expiry / Freshness badge */}
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-600 px-1 font-medium">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {qrCountdown > 0 ? (
                      <span>Code refreshes in {qrCountdown}s</span>
                    ) : (
                      <span className="text-amber-600 font-bold">Code may be expired</span>
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => onConnect && onConnect(session.sessionId, deviceNum)}
                    disabled={isLoading}
                    title="Request a fresh QR code"
                    className="text-purple-600 hover:text-purple-800 font-bold flex items-center gap-1 hover:underline cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>

              {/* Step-by-Step Instructions */}
              <div className="w-full max-w-sm bg-white dark:bg-slate-800/60 rounded-xl p-3 text-left border border-slate-200/80 dark:border-purple-800/20 text-xs space-y-2 text-slate-600 dark:text-slate-300 mb-3 shadow-xs">
                {[
                  <span key="s1">
                    Open <strong>WhatsApp</strong> on your mobile phone.
                  </span>,
                  <span key="s2">
                    Tap <strong>Menu (⋮)</strong> on Android or <strong>Settings</strong> on iPhone &gt; <strong>Linked Devices</strong>.
                  </span>,
                  <span key="s3">
                    Tap <strong>Link a Device</strong> and point your phone camera at this QR code.
                  </span>,
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold text-[11px] shrink-0 border border-purple-200 dark:border-purple-800">
                      {i + 1}
                    </span>
                    <span className="leading-tight">{step}</span>
                  </div>
                ))}
              </div>

              {/* Active Connection Notice */}
              <div className="w-full max-w-sm p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-left text-xs text-amber-800 dark:text-amber-300">
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong className="font-bold">Keep Phone Active:</strong> Do not minimize or close WhatsApp on your phone until the linking handshake completes.
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
                {isRepMode
                  ? "Generating your WhatsApp QR code..."
                  : `Connecting Line ${deviceNum}...`}
              </h4>
              <p className="text-xs text-slate-500 dark:text-purple-300/80 max-w-xs mb-4">
                Establishing a secure multi-device session with WhatsApp servers. The QR code will appear automatically in a moment.
              </p>
              <div className="w-full p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2 text-left text-xs text-amber-700 dark:text-amber-300">
                <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <span>
                  Please keep your mobile WhatsApp open and ready to scan once the QR code loads.
                </span>
              </div>
            </div>
          )}

          {/* ── STATE: Disconnected — show QR connect button ── */}
          {isDisconnected && (
            <div className="flex flex-col items-center text-center py-4 w-full max-w-sm mx-auto animate-fadeIn">
              <div className="w-full flex flex-col items-center animate-fadeIn">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mb-3">
                  <QrCode className="w-7 h-7" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                  {isRepMode
                    ? "WhatsApp Line Offline"
                    : `Line ${deviceNum} is Offline`}
                </h4>
                <p className="text-xs text-slate-500 dark:text-purple-300/80 max-w-xs mb-4">
                  {isRepMode
                    ? "Connect your WhatsApp account to receive customer inquiries and chat with leads."
                    : `Connect ${deviceNum === 1 ? "primary" : "secondary"} channel for CRM messaging and automated sync.`}
                </p>

                <div className="flex items-center gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() =>
                      onConnect && onConnect(session.sessionId, deviceNum)
                    }
                    disabled={isLoading}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-2.5 px-5 rounded-xl text-xs shadow-md shadow-emerald-600/25 transition-all cursor-pointer disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>{isLoading ? "Generating QR..." : "Show QR Code"}</span>
                  </button>
                  {onRefresh && (
                    <button
                      type="button"
                      onClick={onRefresh}
                      disabled={isLoading}
                      title="Check if session is already active"
                      className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer disabled:opacity-50"
                      aria-label="Refresh status"
                    >
                      <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                    </button>
                  )}
                </div>

                <p className="text-[11px] text-slate-400 dark:text-purple-300/60 max-w-xs">
                  Clicking &ldquo;Show QR Code&rdquo; generates a one-time secure QR code to scan with your phone.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const isDualLine = !isRepMode && whatsappLineLimit >= 2;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="whatsapp-connect-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm overflow-y-auto animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose?.();
        }
      }}
    >
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
                <h2
                  id="whatsapp-connect-modal-title"
                  className="text-base font-bold text-slate-900 dark:text-white leading-tight"
                >
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
                  ? "Scan the QR code to link your personal WhatsApp line to CRM chats."
                  : organizationName
                    ? `Managing WhatsApp connections for ${organizationName}`
                    : "Manage your multi-channel WhatsApp connections"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {/* Error Banner with Retry & Troubleshooting */}
          {repSessionError &&
            repSession.status === "disconnected" &&
            !dismissedError && (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/40 flex items-start justify-between gap-2.5 animate-fadeIn">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-red-700 dark:text-red-400 mb-0.5">
                      Connection Failed
                    </p>
                    <p className="text-xs text-red-600 dark:text-red-300 mb-2">
                      {repSessionError}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setDismissedError(false);
                          onConnect && onConnect(repSessionId, 1);
                        }}
                        disabled={isRepLoading}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3 h-3 ${isRepLoading ? "animate-spin" : ""}`} />
                        <span>Retry Connection</span>
                      </button>
                      <span className="text-[11px] text-red-600/80 dark:text-red-400/80">
                        Check phone Wi-Fi/mobile data
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDismissedError(true)}
                  aria-label="Dismiss error"
                  className="text-red-400 hover:text-red-600 dark:hover:text-white p-1 cursor-pointer focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none"
                  title="Dismiss error"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

          {/* Quick Explanatory Banner for Multi-Line or Rep */}
          <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-start gap-2.5 text-xs text-purple-900 dark:text-purple-200">
            <Info className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold">How WhatsApp Multi-Device works: </span>
              {isRepMode ? (
                <span>
                  Linking connects your phone directly using official WhatsApp Web protocols. Your phone remains the primary device and messages stay encrypted.
                </span>
              ) : (
                <span>
                  Connect your business numbers using WhatsApp Web. Line 1 handles inbound leads and automated AI responses. Line 2 (if enabled) is reserved for outbound broadcasts.
                </span>
              )}
            </div>
          </div>

          {/* Device Cards Grid */}
          <div
            className={`grid grid-cols-1 ${isDualLine ? "md:grid-cols-2" : ""} gap-4`}
          >
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
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-purple-900/40 dark:hover:bg-purple-900/70 text-slate-800 dark:text-purple-100 rounded-xl text-xs font-bold transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:outline-none"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

