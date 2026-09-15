import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Send,
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  XCircle,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  CheckCheck,
  TrendingUp,
  BarChart2,
  AlertTriangle,
  RefreshCw,
  Users,
  Repeat,
  CalendarCheck,
  Calendar,
} from "lucide-react";
import { API_ENDPOINTS } from "../utils/constants.js";
import { socket } from "../utils/socket.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function CampaignDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { organization } = useAuth();
  const orgId = organization?.id || organization?._id;

  const [campaign, setCampaign] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [recipients, setRecipients] = useState([]);
  const [loading, setLoading] = useState(true);

  // Recipient filters & pagination
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchCampaign();
    fetchAnalytics();
    fetchRecipients(1);

    if (orgId) {
      socket.emit("join_organization", orgId);
    }

    // Real-time Socket.IO events
    const handleProgress = (data) => {
      if (data.campaignId === id) {
        fetchCampaign();
        fetchAnalytics();
        fetchRecipients(page);
      }
    };

    const handleRecipientUpdate = (data) => {
      if (data.campaignId === id) {
        setRecipients((prev) =>
          prev.map((r) => {
            if (r._id === data.recipientId) {
              return { ...r, status: data.status };
            }
            return r;
          })
        );
        fetchAnalytics();
      }
    };

    socket.on("campaign_progress", handleProgress);
    socket.on("recipient_status_updated", handleRecipientUpdate);
    socket.on("campaign_completed", handleProgress);
    socket.on("campaign_paused", handleProgress);

    return () => {
      socket.off("campaign_progress", handleProgress);
      socket.off("recipient_status_updated", handleRecipientUpdate);
      socket.off("campaign_completed", handleProgress);
      socket.off("campaign_paused", handleProgress);
    };
  }, [id, orgId]);

  const fetchCampaign = async () => {
    try {
      const res = await axios.get(API_ENDPOINTS.WHATSAPP_CLOUD.CAMPAIGN(id));
      if (res.data.success) {
        setCampaign(res.data.data);
      }
    } catch (err) {
      console.error("Error loading campaign:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await axios.get(API_ENDPOINTS.WHATSAPP_CLOUD.ANALYTICS(id));
      if (res.data.success) {
        setAnalytics(res.data.data);
      }
    } catch (err) {
      console.error("Error loading analytics:", err);
    }
  };

  const fetchRecipients = async (targetPage = 1) => {
    try {
      const res = await axios.get(API_ENDPOINTS.WHATSAPP_CLOUD.RECIPIENTS(id), {
        params: {
          page: targetPage,
          limit: 20,
          status: statusFilter !== "All" ? statusFilter : undefined,
          search: search.trim() || undefined,
        },
      });

      if (res.data.success) {
        setRecipients(res.data.data || []);
        setPage(res.data.pagination?.page || 1);
        setTotalPages(res.data.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error("Error loading recipients:", err);
    }
  };

  const handleStart = async () => {
    setActionLoading(true);
    try {
      await axios.post(API_ENDPOINTS.WHATSAPP_CLOUD.START(id));
      fetchCampaign();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to start campaign.");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePause = async () => {
    setActionLoading(true);
    try {
      await axios.post(API_ENDPOINTS.WHATSAPP_CLOUD.PAUSE(id));
      fetchCampaign();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to pause campaign.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleResume = async () => {
    setActionLoading(true);
    try {
      await axios.post(API_ENDPOINTS.WHATSAPP_CLOUD.RESUME(id));
      fetchCampaign();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to resume campaign.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleTriggerRun = async () => {
    setActionLoading(true);
    try {
      await axios.post(API_ENDPOINTS.WHATSAPP_CLOUD.TRIGGER_RUN(id));
      fetchCampaign();
      fetchAnalytics();
      fetchRecipients(page);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to trigger run.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleSchedule = async () => {
    setActionLoading(true);
    try {
      await axios.post(API_ENDPOINTS.WHATSAPP_CLOUD.TOGGLE_SCHEDULE(id));
      fetchCampaign();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update schedule status.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (
      !window.confirm(
        "Are you sure you want to cancel this campaign? Remaining queued messages will not be sent."
      )
    ) {
      return;
    }

    setActionLoading(true);
    try {
      await axios.post(API_ENDPOINTS.WHATSAPP_CLOUD.CANCEL(id));
      fetchCampaign();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to cancel campaign.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRetryFailed = async () => {
    setActionLoading(true);
    try {
      const res = await axios.post(
        API_ENDPOINTS.WHATSAPP_CLOUD.RETRY_FAILED(id)
      );
      alert(res.data.message || "Failed recipients re-queued.");
      fetchCampaign();
      fetchRecipients(1);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to retry.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center text-slate-400 text-xs animate-pulse">
        Loading campaign details...
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="p-8 text-center">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
          Campaign Not Found
        </h3>
        <button
          type="button"
          onClick={() => navigate("/whatsapp/campaigns")}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 text-white"
        >
          Back to Campaigns
        </button>
      </div>
    );
  }

  const total = campaign.totalRecipients || 1;
  const sent = campaign.sentCount || 0;
  const percent = Math.min(100, Math.round((sent / total) * 100));

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => navigate("/whatsapp/campaigns")}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Campaigns</span>
          </button>

          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white truncate">
              {campaign.name}
            </h1>
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                campaign.status === "Running"
                  ? "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                  : campaign.status === "Completed"
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                  : campaign.status === "Paused"
                  ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500"
              }`}
            >
              {campaign.status}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
            <span>Template: {campaign.templateName}</span>
            <span>•</span>
            <span>Created: {new Date(campaign.createdAt).toLocaleString()}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {campaign.status === "Scheduled" && (
            <>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleTriggerRun}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white transition-all flex items-center gap-1.5 shadow-xs"
                title="Trigger an immediate run right now"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Run Now</span>
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleToggleSchedule}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5"
              >
                <Pause className="w-3.5 h-3.5" />
                <span>Pause Schedule</span>
              </button>
            </>
          )}

          {campaign.status === "Draft" && (
            <button
              type="button"
              disabled={actionLoading}
              onClick={handleStart}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all flex items-center gap-1.5 shadow-xs"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Start Sending</span>
            </button>
          )}

          {campaign.status === "Running" && (
            <button
              type="button"
              disabled={actionLoading}
              onClick={handlePause}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white transition-all flex items-center gap-1.5 shadow-xs"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Pause</span>
            </button>
          )}

          {campaign.status === "Paused" && (
            <button
              type="button"
              disabled={actionLoading}
              onClick={
                campaign.campaignType === "automated"
                  ? handleToggleSchedule
                  : handleResume
              }
              className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all flex items-center gap-1.5 shadow-xs"
            >
              <Play className="w-3.5 h-3.5" />
              <span>
                {campaign.campaignType === "automated" ? "Resume Schedule" : "Resume"}
              </span>
            </button>
          )}

          {campaign.status === "Running" && (
            <button
              type="button"
              disabled={actionLoading}
              onClick={handleCancel}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors flex items-center gap-1.5"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </button>
          )}

          {campaign.failedCount > 0 && (
            <button
              type="button"
              disabled={actionLoading}
              onClick={handleRetryFailed}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry Failed ({campaign.failedCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Automation & Schedule Card */}
      {campaign.campaignType === "automated" && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-500/10 via-purple-500/5 to-transparent border border-purple-500/30 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Repeat className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Automated Recurring Campaign (node-cron)
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-600 text-white uppercase">
                {campaign.schedule?.frequency || "WEEKLY"}
              </span>
            </div>
            {campaign.schedule?.nextRunAt && campaign.status === "Scheduled" && (
              <span className="text-xs font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                <CalendarCheck className="w-4 h-4" />
                Next Run: {new Date(campaign.schedule.nextRunAt).toLocaleString()}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
              <div className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Schedule Rule</div>
              <div className="font-bold text-slate-900 dark:text-white">
                {campaign.schedule?.frequency === "weekly"
                  ? `Every ${(campaign.schedule?.daysOfWeek || [1]).map((d) => ["Sun", "Monday", "Tue", "Wed", "Thu", "Fri", "Sat"][d]).join(", ")} at ${campaign.schedule?.timeOfDay || "10:00"}`
                  : campaign.schedule?.frequency === "daily"
                  ? `Daily at ${campaign.schedule?.timeOfDay || "10:00"}`
                  : `${campaign.schedule?.frequency || "Automated"}`}
              </div>
              {campaign.schedule?.cronExpression && (
                <div className="text-[10px] text-purple-600 dark:text-purple-400 font-mono mt-0.5">
                  cron: {campaign.schedule.cronExpression}
                </div>
              )}
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
              <div className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Delivery Policy</div>
              <div className="font-bold text-purple-600 dark:text-purple-400">
                {campaign.audiencePolicy?.mode === "new_leads_only"
                  ? "New Leads Only"
                  : campaign.audiencePolicy?.mode === "cooldown"
                  ? `Cooldown (${campaign.audiencePolicy?.cooldownDays || 7} Days)`
                  : "All Matching Leads"}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {campaign.audiencePolicy?.mode === "new_leads_only"
                  ? "No duplicate sends to past leads"
                  : `Protected from frequent sends`}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
              <div className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Target Pipeline</div>
              <div className="font-semibold text-slate-900 dark:text-white truncate">
                {campaign.audienceCriteria?.leadStatus?.length > 0
                  ? campaign.audienceCriteria.leadStatus.join(", ")
                  : "All Statuses"}
              </div>
              <div className="text-[10px] text-slate-400 truncate mt-0.5">
                {campaign.audienceCriteria?.services?.length > 0
                  ? campaign.audienceCriteria.services.join(", ")
                  : "All Services"}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
              <div className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Execution Runs</div>
              <div className="font-black text-slate-900 dark:text-white text-base">
                #{campaign.schedule?.currentRunCount || 0}
              </div>
              {campaign.schedule?.lastRunAt && (
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Last: {new Date(campaign.schedule.lastRunAt).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Progress & Funnel Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
        <div>
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-bold text-slate-900 dark:text-white">
              Dispatch Progress: {sent} / {campaign.totalRecipients} Messages
            </span>
            <span className="font-black text-purple-600 dark:text-purple-400">
              {percent}%
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                campaign.status === "Completed"
                  ? "bg-emerald-500"
                  : "bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500"
              }`}
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        {/* 5 Funnel Stages */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
          <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/70">
            <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">
              Recipients
            </div>
            <div className="text-xl font-black text-slate-900 dark:text-white">
              {campaign.totalRecipients}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-800/60">
            <div className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 mb-1">
              Sent
            </div>
            <div className="text-xl font-black text-blue-700 dark:text-blue-300">
              {campaign.sentCount || 0}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-800/60">
            <div className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 mb-1">
              Delivered
            </div>
            <div className="text-xl font-black text-indigo-700 dark:text-indigo-300 flex items-baseline justify-between">
              <span>{campaign.deliveredCount || 0}</span>
              <span className="text-xs font-semibold text-indigo-500">
                {analytics?.deliveryRate || 0}%
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/60">
            <div className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 mb-1">
              Read
            </div>
            <div className="text-xl font-black text-emerald-700 dark:text-emerald-300 flex items-baseline justify-between">
              <span>{campaign.readCount || 0}</span>
              <span className="text-xs font-semibold text-emerald-500">
                {analytics?.readRate || 0}%
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-800/60">
            <div className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400 mb-1">
              Failed
            </div>
            <div className="text-xl font-black text-rose-700 dark:text-rose-300">
              {campaign.failedCount || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Error Breakdown if any failures */}
      {analytics?.errorBreakdown && analytics.errorBreakdown.length > 0 && (
        <div className="p-4 rounded-2xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200/70 dark:border-rose-900/60 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-rose-700 dark:text-rose-300">
            <AlertTriangle className="w-4 h-4" />
            <span>Delivery Error Breakdown</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {analytics.errorBreakdown.map((e, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-white dark:bg-slate-850 border border-rose-200/60 dark:border-rose-900/40 text-xs"
              >
                <div className="flex items-center justify-between font-bold mb-0.5">
                  <span className="text-rose-600 dark:text-rose-400">
                    Code {e.code}
                  </span>
                  <span className="text-slate-900 dark:text-white">
                    {e.count} failed
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {e.message || "Meta API delivery failure"}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recipient Delivery Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        {/* Table Header Controls */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-500" />
            <span>Recipients Log</span>
          </h3>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search phone or name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") fetchRecipients(1);
                }}
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setTimeout(() => fetchRecipients(1), 50);
              }}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Queued">Queued</option>
              <option value="Sending">Sending</option>
              <option value="Sent">Sent</option>
              <option value="Delivered">Delivered</option>
              <option value="Read">Read</option>
              <option value="Failed">Failed</option>
              <option value="Skipped">Skipped</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 uppercase font-semibold text-[10px]">
                <th className="py-3 px-4">Recipient</th>
                <th className="py-3 px-4">Phone Number</th>
                <th className="py-3 px-4">Variables</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Sent At</th>
                <th className="py-3 px-4">Delivered At</th>
                <th className="py-3 px-4">Read At</th>
                <th className="py-3 px-4">Error / Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {recipients.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400">
                    No recipients matching filter.
                  </td>
                </tr>
              ) : (
                recipients.map((r) => (
                  <tr
                    key={r._id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      {r.recipientName || "Customer"}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-mono">
                      +{r.recipientPhone}
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                      {Array.isArray(r.renderedParameters)
                        ? r.renderedParameters.join(", ")
                        : "None"}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          r.status === "Read"
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                            : r.status === "Delivered"
                            ? "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400"
                            : r.status === "Sent"
                            ? "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                            : r.status === "Failed"
                            ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {r.sentAt ? new Date(r.sentAt).toLocaleTimeString() : "-"}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {r.deliveredAt
                        ? new Date(r.deliveredAt).toLocaleTimeString()
                        : "-"}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {r.readAt ? new Date(r.readAt).toLocaleTimeString() : "-"}
                    </td>
                    <td className="py-3 px-4 text-rose-500 max-w-xs truncate">
                      {r.errorMessage || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => fetchRecipients(page - 1)}
                className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"
              >
                Prev
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => fetchRecipients(page + 1)}
                className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
