import React, { useState, useEffect } from "react";
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
  Lock,
} from "lucide-react";
import { API_ENDPOINTS } from "../../utils/constants.js";

export default function CloudSettingsModal({ isOpen, onClose, onUpdated }) {
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
    }
  }, [isOpen]);

  const fetchStatus = async () => {
    setFetchLoading(true);
    setError("");
    try {
      const res = await axios.get(API_ENDPOINTS.WHATSAPP_CLOUD.STATUS);
      if (res.data.success) {
        const d = res.data.data;
        setStatusData(d);
        setFormData({
          wabaId: d.wabaId || "",
          phoneNumberId: d.phoneNumberId || "",
          accessToken: "", // Do not fill with masked token so user enters new or keeps existing
          messagesPerSecond: d.messagesPerSecond || 5,
        });
      }
    } catch (err) {
      console.error("Error fetching Cloud API status:", err);
      setError(err.response?.data?.message || "Failed to load connection status.");
    } finally {
      setFetchLoading(false);
    }
  };

  const handleConnect = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.wabaId || !formData.phoneNumberId) {
      setError("WABA ID and Phone Number ID are required.");
      return;
    }

    if (!formData.accessToken && !statusData.hasToken) {
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
        fetchStatus();
        if (onUpdated) onUpdated();
      }
    } catch (err) {
      console.error("Connect error:", err);
      setError(
        err.response?.data?.message ||
          "Failed to verify credentials with Meta. Check WABA ID and Access Token."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (
      !window.confirm(
        "Are you sure you want to disconnect this WhatsApp Business Account? Campaigns will not be able to send until reconnected."
      )
    ) {
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await axios.post(API_ENDPOINTS.WHATSAPP_CLOUD.DISCONNECT);
      if (res.data.success) {
        setSuccess("Disconnected successfully.");
        fetchStatus();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                WhatsApp Cloud API Settings
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure official Meta Business Account & throughput limits
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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

          {/* Current Connection Banner */}
          {fetchLoading ? (
            <div className="p-6 text-center text-slate-400 text-sm animate-pulse">
              Checking Meta Cloud API connection...
            </div>
          ) : statusData.isConfigured ? (
            <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                    Connected to WhatsApp Business Platform
                  </span>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  {statusData.messagingLimitTier}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3 pt-3 border-t border-emerald-500/15 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                    Verified Name
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {statusData.verifiedName || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                    Sender Phone
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
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
                        : "text-slate-400"
                    }`}
                  >
                    {statusData.qualityRating}
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

          {/* Form */}
          <form onSubmit={handleConnect} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                WhatsApp Business Account ID (WABA ID)
              </label>
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
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Phone Number ID
              </label>
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
                Found in Meta Developer Dashboard → WhatsApp → API Setup
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
              <input
                type="password"
                placeholder={
                  statusData.hasToken
                    ? "Leave blank to keep existing encrypted token"
                    : "Paste permanent EAAG... token"
                }
                value={formData.accessToken}
                onChange={(e) =>
                  setFormData({ ...formData, accessToken: e.target.value })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-purple-500 outline-none font-mono"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Encrypted at rest via hardware AES-256-GCM. Never exposed to the client.
              </span>
            </div>

            {/* Rate Limiter Slider */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  Sending Rate Limit (Messages / Second)
                </label>
                <span className="text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md">
                  {formData.messagesPerSecond} msg/s
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="80"
                step="1"
                value={formData.messagesPerSecond}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    messagesPerSecond: parseInt(e.target.value) || 5,
                  })
                }
                className="w-full accent-purple-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>1 msg/s (Slow)</span>
                <span>5 msg/s (Recommended)</span>
                <span>80 msg/s (High Throughput)</span>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
              {statusData.isConfigured ? (
                <button
                  type="button"
                  onClick={handleDisconnect}
                  disabled={loading}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors flex items-center gap-1.5"
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
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{loading ? "Verifying..." : "Save & Verify"}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
