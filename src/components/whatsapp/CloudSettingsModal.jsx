import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  X,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Zap,
  Radio,
  Trash2,
  RefreshCw,
  ExternalLink,
  Eye,
  EyeOff,
  HelpCircle,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { API_ENDPOINTS } from "../../utils/constants.js";

export default function CloudSettingsModal({ isOpen, onClose, onUpdated }) {
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [testingConnection, setTestingConnection] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const [copiedField, setCopiedField] = useState("");

  const [statusData, setStatusData] = useState({
    isConfigured: false,
    wabaId: "",
    phoneNumberId: "",
    displayPhoneNumber: "",
    verifiedName: "",
    qualityRating: "UNKNOWN",
    messagingLimitTier: "TIER_1K",
    messagesPerSecond: 5,
    hasToken: false,
    maskedToken: "",
  });

  const [formData, setFormData] = useState({
    wabaId: "",
    phoneNumberId: "",
    accessToken: "",
    messagesPerSecond: 5,
  });

  const fetchStatus = useCallback(async (isTest = false) => {
    if (isTest) {
      setTestingConnection(true);
    } else {
      setFetchLoading(true);
    }
    setError("");
    try {
      const res = await axios.get(API_ENDPOINTS.WHATSAPP_CLOUD.STATUS);
      if (res.data.success) {
        const d = res.data.data;
        setStatusData(d);
        setFormData((prev) => ({
          ...prev,
          wabaId: d.wabaId || "",
          phoneNumberId: d.phoneNumberId || "",
          accessToken: "", // Do not fill with masked token so user enters new or keeps existing
          messagesPerSecond: d.messagesPerSecond || 5,
        }));
        if (isTest) {
          if (d.isConfigured) {
            setSuccess("Meta Cloud API connection is active and verified healthy!");
          } else {
            setError("Meta Cloud API is not configured yet. Please enter credentials below.");
          }
        }
      }
    } catch (err) {
      console.error("Error fetching Cloud API status:", err);
      setError(err.response?.data?.message || "Failed to load connection status.");
    } finally {
      setFetchLoading(false);
      setTestingConnection(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
      setError("");
      setSuccess("");
      setShowDisconnectConfirm(false);
    }
  }, [isOpen, fetchStatus]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen && !loading) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, loading, onClose]);

  const copyToClipboard = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(""), 2000);
  };

  const handleConnect = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.wabaId?.trim() || !formData.phoneNumberId?.trim()) {
      setError("WABA ID and Phone Number ID are required.");
      return;
    }

    if (!formData.accessToken?.trim() && !statusData.hasToken) {
      setError("Meta System User Access Token is required.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        wabaId: formData.wabaId.trim(),
        phoneNumberId: formData.phoneNumberId.trim(),
        accessToken: formData.accessToken.trim() || undefined,
        messagesPerSecond: Number(formData.messagesPerSecond) || 5,
      };

      const res = await axios.post(
        API_ENDPOINTS.WHATSAPP_CLOUD.CONNECT,
        payload
      );
      if (res.data.success) {
        setSuccess("Connected and verified successfully with Meta Graph API!");
        await fetchStatus();
        if (onUpdated) onUpdated();
      }
    } catch (err) {
      console.error("Connect error:", err);
      setError(
        err.response?.data?.message ||
          "Failed to verify credentials with Meta. Check WABA ID, Phone Number ID, and Access Token."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await axios.post(API_ENDPOINTS.WHATSAPP_CLOUD.DISCONNECT);
      if (res.data.success) {
        setSuccess("Disconnected successfully from Meta WhatsApp Cloud API.");
        setShowDisconnectConfirm(false);
        await fetchStatus();
        if (onUpdated) onUpdated();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to disconnect.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cloud-settings-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
    >
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="cloud-settings-title"
                className="text-lg font-bold text-slate-900 dark:text-white"
              >
                WhatsApp Cloud API Settings
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure official Meta Business Account &amp; throughput limits
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings modal"
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:ring-2 focus:ring-purple-500 outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {error && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-700 dark:text-rose-300 leading-relaxed font-medium">
                {error}
              </div>
            </div>
          )}

          {success && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">
                {success}
              </div>
            </div>
          )}

          {/* Current Connection Status Banner */}
          {fetchLoading ? (
            <div className="p-6 text-center text-slate-400 text-sm animate-pulse rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              Checking Meta Cloud API connection...
            </div>
          ) : statusData.isConfigured ? (
            <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                    Connected to WhatsApp Business Platform
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                    {statusData.messagingLimitTier || "TIER_1K"}
                  </span>
                  <button
                    type="button"
                    onClick={() => fetchStatus(true)}
                    disabled={testingConnection}
                    className="text-xs px-2.5 py-1 rounded-lg border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 flex items-center gap-1 transition-colors"
                  >
                    <RefreshCw className={`w-3 h-3 ${testingConnection ? "animate-spin" : ""}`} />
                    <span>Test Connection</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3 pt-3 border-t border-emerald-500/15 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                    Verified Name
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                    {statusData.verifiedName || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                    Sender Phone
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                    {statusData.displayPhoneNumber || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                    Quality Rating
                  </span>
                  <span
                    className={`font-bold capitalize ${
                      statusData.qualityRating === "GREEN"
                        ? "text-emerald-500"
                        : statusData.qualityRating === "YELLOW"
                        ? "text-amber-500"
                        : statusData.qualityRating === "RED"
                        ? "text-rose-500"
                        : "text-slate-400"
                    }`}
                  >
                    {statusData.qualityRating || "UNKNOWN"}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800 dark:text-amber-300">
                <p className="font-bold mb-1">WhatsApp Cloud API is not connected</p>
                <p>
                  Enter your Meta WABA ID, Phone Number ID, and System User Access
                  Token from your Meta Developer Portal to start sending campaigns.
                </p>
              </div>
            </div>
          )}

          {/* Quick Guide Accordion */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-800/20">
            <button
              type="button"
              onClick={() => setShowGuide(!showGuide)}
              className="w-full px-4 py-3 text-left flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/40 transition-colors"
            >
              <span className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                Where do I find my Meta Cloud API credentials?
              </span>
              {showGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showGuide && (
              <div className="px-4 pb-4 pt-1 text-xs text-slate-600 dark:text-slate-300 space-y-2.5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    1
                  </span>
                  <div>
                    <span className="font-semibold block text-slate-800 dark:text-slate-100">
                      Open Meta Developer Portal
                    </span>
                    <span>
                      Go to developers.facebook.com &gt; My Apps &gt; select your WhatsApp Business App.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    2
                  </span>
                  <div>
                    <span className="font-semibold block text-slate-800 dark:text-slate-100">
                      Navigate to WhatsApp &gt; API Setup
                    </span>
                    <span>
                      Under <strong>Step 1</strong>, copy your <strong>Phone number ID</strong> and <strong>WhatsApp Business Account ID</strong>. <span className="text-amber-500 font-semibold">Important: Do not use the general App ID in the header bar.</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    3
                  </span>
                  <div>
                    <span className="font-semibold block text-slate-800 dark:text-slate-100">
                      Generate Permanent System User Token
                    </span>
                    <span>
                      In Meta Business Suite &gt; Settings &gt; System Users &gt; Generate Token with <code>whatsapp_business_messaging</code> and <code>whatsapp_business_management</code> permissions.
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleConnect} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  WhatsApp Business Account ID (WABA ID)
                </label>
                {formData.wabaId && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(formData.wabaId, "wabaId")}
                    className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1"
                  >
                    {copiedField === "wabaId" ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-500" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" /> Copy
                      </>
                    )}
                  </button>
                )}
              </div>
              <input
                type="text"
                required
                placeholder="e.g. 109823489123456"
                value={formData.wabaId}
                onChange={(e) =>
                  setFormData({ ...formData, wabaId: e.target.value })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Found in Meta Developer Dashboard &rarr; WhatsApp &rarr; API Setup (under Step 1).{" "}
                <span className="text-amber-500 font-medium">Do not use the &quot;App ID&quot; from the top bar.</span>
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Phone Number ID
                </label>
                {formData.phoneNumberId && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(formData.phoneNumberId, "phoneId")}
                    className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1"
                  >
                    {copiedField === "phoneId" ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-500" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" /> Copy
                      </>
                    )}
                  </button>
                )}
              </div>
              <input
                type="text"
                required
                placeholder="e.g. 981723048912345"
                value={formData.phoneNumberId}
                onChange={(e) =>
                  setFormData({ ...formData, phoneNumberId: e.target.value })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Found in Meta Developer Dashboard &rarr; WhatsApp &rarr; API Setup
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Meta System User Access Token
                </label>
                {statusData.hasToken && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Token securely stored
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type={showToken ? "text" : "password"}
                  placeholder={
                    statusData.hasToken
                      ? "Leave blank to keep existing encrypted token"
                      : "Paste permanent EAAG... token"
                  }
                  value={formData.accessToken}
                  onChange={(e) =>
                    setFormData({ ...formData, accessToken: e.target.value })
                  }
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-purple-500 outline-none font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  aria-label={showToken ? "Hide access token" : "Show access token"}
                >
                  {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Encrypted at rest via hardware AES-256-GCM. Never exposed in plain text.
              </span>
            </div>

            {/* Rate Limiter Note */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    Sending Rate Limit
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Safe dispatch throttle protecting your WhatsApp Business phone quality rating.
                  </span>
                </div>
              </div>
              <span className="text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-lg shrink-0">
                5 msg/s (Default)
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
              {statusData.isConfigured ? (
                <button
                  type="button"
                  onClick={() => setShowDisconnectConfirm(true)}
                  disabled={loading}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Disconnect
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{loading ? "Verifying..." : "Save & Verify"}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Disconnect Confirmation Modal */}
      {showDisconnectConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Disconnect WhatsApp Business Account?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                Disconnecting will remove your credentials. Active and scheduled WhatsApp campaigns will be paused and will not broadcast until reconnected.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDisconnectConfirm(false)}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Keep Connected
              </button>
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm Disconnect</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
