import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Send,
  Plus,
  Radio,
  FileText,
  Clock,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Search,
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
  BarChart2,
  Users,
  ShieldAlert,
} from "lucide-react";
import { API_ENDPOINTS } from "../utils/constants.js";
import { socket } from "../utils/socket.js";
import { useAuth } from "../context/AuthContext.jsx";
import CloudSettingsModal from "../components/whatsapp/CloudSettingsModal.jsx";

export default function WhatsAppCampaigns() {
  const navigate = useNavigate();
  const { organization } = useAuth();
  const orgId = organization?.id || organization?._id;

  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    fetchCampaigns();

    if (orgId) {
      socket.emit("join_organization", orgId);
    }

    // Real-time Socket.IO updates
    socket.on("campaign_started", () => fetchCampaigns());
    socket.on("campaign_paused", () => fetchCampaigns());
    socket.on("campaign_resumed", () => fetchCampaigns());
    socket.on("campaign_completed", () => fetchCampaigns());
    socket.on("campaign_cancelled", () => fetchCampaigns());

    socket.on("campaign_progress", (data) => {
      setCampaigns((prev) =>
        prev.map((c) => {
          if (c._id === data.campaignId) {
            return {
              ...c,
              sentCount: (c.sentCount || 0) + 1,
              queuedCount: Math.max(0, (c.queuedCount || 1) - 1),
            };
          }
          return c;
        })
      );
    });

    socket.on("recipient_status_updated", (data) => {
      setCampaigns((prev) =>
        prev.map((c) => {
          if (c._id === data.campaignId) {
            if (data.status === "Delivered") {
              return { ...c, deliveredCount: (c.deliveredCount || 0) + 1 };
            }
            if (data.status === "Read") {
              return { ...c, readCount: (c.readCount || 0) + 1 };
            }
          }
          return c;
        })
      );
    });

    return () => {
      socket.off("campaign_started");
      socket.off("campaign_paused");
      socket.off("campaign_resumed");
      socket.off("campaign_completed");
      socket.off("campaign_cancelled");
      socket.off("campaign_progress");
      socket.off("recipient_status_updated");
    };
  }, [orgId]);

  const fetchCampaigns = async () => {
    try {
      const res = await axios.get(API_ENDPOINTS.WHATSAPP_CLOUD.CAMPAIGNS);
      if (res.data.success) {
        setCampaigns(res.data.data || []);
      }
    } catch (err) {
      console.error("Error loading campaigns:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async (e, id) => {
    e.stopPropagation();
    try {
      await axios.post(API_ENDPOINTS.WHATSAPP_CLOUD.START(id));
      fetchCampaigns();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to start campaign.");
    }
  };

  const handlePause = async (e, id) => {
    e.stopPropagation();
    try {
      await axios.post(API_ENDPOINTS.WHATSAPP_CLOUD.PAUSE(id));
      fetchCampaigns();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to pause campaign.");
    }
  };

  const handleResume = async (e, id) => {
    e.stopPropagation();
    try {
      await axios.post(API_ENDPOINTS.WHATSAPP_CLOUD.RESUME(id));
      fetchCampaigns();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to resume campaign.");
    }
  };

  // KPIs
  const totalCampaigns = campaigns.length;
  const totalSent = campaigns.reduce((acc, c) => acc + (c.sentCount || 0), 0);
  const totalDelivered = campaigns.reduce(
    (acc, c) => acc + (c.deliveredCount || 0),
    0
  );
  const totalRead = campaigns.reduce((acc, c) => acc + (c.readCount || 0), 0);

  const avgDeliveryRate =
    totalSent > 0 ? Math.round((totalDelivered / totalSent) * 100) : 0;
  const avgReadRate =
    totalDelivered > 0 ? Math.round((totalRead / totalDelivered) * 100) : 0;

  const filteredCampaigns = campaigns.filter((c) => {
    const matchStatus = statusFilter === "All" || c.status === statusFilter;
    const matchSearch =
      !search ||
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.templateName?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Send className="w-7 h-7 text-purple-600 dark:text-purple-400" />
            <span>WhatsApp Marketing Campaigns</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Official Meta WhatsApp Business Cloud API bulk broadcasts and tracking
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors flex items-center gap-1.5"
          >
            <Radio className="w-3.5 h-3.5 text-emerald-500" />
            <span>Cloud API Settings</span>
          </button>

          <button
            type="button"
            onClick={() => navigate("/whatsapp/templates")}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5 text-purple-500" />
            <span>Templates</span>
          </button>

          <button
            type="button"
            onClick={() => navigate("/whatsapp/campaigns/create")}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white transition-all shadow-sm flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Campaign</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span className="font-semibold uppercase tracking-wider text-[10px]">
              Total Campaigns
            </span>
            <BarChart2 className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {totalCampaigns}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span className="font-semibold uppercase tracking-wider text-[10px]">
              Total Messages Sent
            </span>
            <Send className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {totalSent.toLocaleString()}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span className="font-semibold uppercase tracking-wider text-[10px]">
              Delivery Rate
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white flex items-baseline gap-1">
            <span>{avgDeliveryRate}%</span>
            <span className="text-[11px] font-medium text-slate-400">avg</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span className="font-semibold uppercase tracking-wider text-[10px]">
              Read Rate
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white flex items-baseline gap-1">
            <span>{avgReadRate}%</span>
            <span className="text-[11px] font-medium text-slate-400">avg</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search campaigns by name or template..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {[
            "All",
            "Running",
            "Draft",
            "Completed",
            "Paused",
            "Cancelled",
          ].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === status
                  ? "bg-purple-600 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Campaigns List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-24 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse border border-slate-200 dark:border-slate-700"
            />
          ))}
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
          <div className="w-14 h-14 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 mx-auto flex items-center justify-center mb-3">
            <Send className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
            No Campaigns Found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-4">
            Start a new broadcast campaign to reach your leads using approved
            WhatsApp templates.
          </p>
          <button
            type="button"
            onClick={() => navigate("/whatsapp/campaigns/create")}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white transition-all inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create First Campaign</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCampaigns.map((campaign) => {
            const total = campaign.totalRecipients || 1;
            const sent = campaign.sentCount || 0;
            const percent = Math.min(100, Math.round((sent / total) * 100));

            return (
              <div
                key={campaign._id}
                onClick={() => navigate(`/whatsapp/campaigns/${campaign._id}`)}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-500/40 dark:hover:border-purple-500/40 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left: Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1.5 ${
                        campaign.status === "Running"
                          ? "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                          : campaign.status === "Completed"
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          : campaign.status === "Paused"
                          ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                      }`}
                    >
                      {campaign.status === "Running" && (
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                      )}
                      <span>{campaign.status}</span>
                    </span>

                    <span className="text-xs text-slate-400 font-medium">
                      Template: {campaign.templateName}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors truncate">
                    {campaign.name}
                  </h3>

                  <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
                    <span>
                      Created: {new Date(campaign.createdAt).toLocaleDateString()}
                    </span>
                    <span>•</span>
                    <span>By: {campaign.createdByName || "Agent"}</span>
                  </div>
                </div>

                {/* Middle: Progress Bar */}
                <div className="w-full md:w-56 shrink-0">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {sent} / {campaign.totalRecipients} Sent
                    </span>
                    <span className="font-bold text-purple-600 dark:text-purple-400">
                      {percent}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        campaign.status === "Completed"
                          ? "bg-emerald-500"
                          : "bg-gradient-to-r from-purple-500 to-blue-500"
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                {/* Right: Quick Action Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  {campaign.status === "Draft" && (
                    <button
                      type="button"
                      onClick={(e) => handleStart(e, campaign._id)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center gap-1 shadow-xs"
                    >
                      <Play className="w-3 h-3" />
                      <span>Start</span>
                    </button>
                  )}

                  {campaign.status === "Running" && (
                    <button
                      type="button"
                      onClick={(e) => handlePause(e, campaign._id)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white transition-colors flex items-center gap-1 shadow-xs"
                    >
                      <Pause className="w-3 h-3" />
                      <span>Pause</span>
                    </button>
                  )}

                  {campaign.status === "Paused" && (
                    <button
                      type="button"
                      onClick={(e) => handleResume(e, campaign._id)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center gap-1 shadow-xs"
                    >
                      <Play className="w-3 h-3" />
                      <span>Resume</span>
                    </button>
                  )}

                  <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 group-hover:bg-purple-500/10 flex items-center justify-center transition-all">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cloud Settings Modal */}
      <CloudSettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onUpdated={fetchCampaigns}
      />
    </div>
  );
}
