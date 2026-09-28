import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Clock,
  TrendingUp,
  Users,
  CheckCircle2,
  Calendar,
  RefreshCw,
  Play,
  Pause,
  Download,
  Sparkles,
  Lock,
  Search,
  Filter,
  ArrowUpRight,
  Settings,
  X,
  Copy,
  Check,
  Key,
  ShieldCheck,
  AlertCircle,
  Save,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { API_BASE_URL } from "../utils/constants.js";
import { useAuth } from "../context/AuthContext.jsx";
import { socket } from "../utils/socket.js";

const OUTCOME_COLORS = [
  "#28a0a4", // Teal
  "#11a139", // Green
  "#3b82f6", // Blue
  "#f59e0b", // Amber
  "#ef4444", // Red
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#64748b", // Slate
];

// Helper to format seconds to "Xh Ym Zs" or "MM:SS"
const formatSeconds = (sec) => {
  if (!sec || isNaN(sec)) return "0s";
  const s = Math.round(sec);
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
};

export default function TelephonyAnalytics() {
  const { currentUser, organization, setOrganization, allUsers, isManager } =
    useAuth();
  const isAddonEnabled = Boolean(organization?.telephony?.isAddonEnabled);
  const isOrgOwner =
    isManager ||
    currentUser?.role === "Sales Manager" ||
    currentUser?.isOrgOwner;

  // Filter States
  const [datePreset, setDatePreset] = useState("today"); // today, 7days, 30days, all
  const [selectedRep, setSelectedRep] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Data States
  const [analyticsData, setAnalyticsData] = useState(null);
  const [callLogs, setCallLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [playingAudioUrl, setPlayingAudioUrl] = useState(null);

  // Settings Modal State
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsTab, setSettingsTab] = useState("api"); // 'api' | 'extensions' | 'webhook'
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsSuccessMsg, setSettingsSuccessMsg] = useState("");
  const [settingsErrorMsg, setSettingsErrorMsg] = useState("");
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  // Organization Telephony Form
  const [orgForm, setOrgForm] = useState({
    telecmiAppId: organization?.telephony?.telecmiAppId || "",
    telecmiSecret: organization?.telephony?.telecmiSecret || "",
    virtualNumber: organization?.telephony?.virtualNumber || "",
    sbcUri: organization?.telephony?.sbcUri || "sbcind.telecmi.com",
  });

  // Agent Extension Mapping Local State
  const [userExtensions, setUserExtensions] = useState({});
  const [savingUserId, setSavingUserId] = useState(null);
  const [provisioningUserId, setProvisioningUserId] = useState(null);

  useEffect(() => {
    if (organization?.telephony) {
      setOrgForm({
        telecmiAppId: organization.telephony.telecmiAppId || "",
        telecmiSecret: organization.telephony.telecmiSecret || "",
        virtualNumber: organization.telephony.virtualNumber || "",
        sbcUri: organization.telephony.sbcUri || "sbcind.telecmi.com",
      });
    }
  }, [organization]);

  useEffect(() => {
    if (allUsers && allUsers.length > 0) {
      const extMap = {};
      allUsers.forEach((u) => {
        extMap[u._id || u.id] = {
          telecmiUserId: u.telephony?.telecmiUserId || "",
          telecmiPassword: u.telephony?.telecmiPassword || "",
          telecmiExtension: u.telephony?.telecmiExtension || "",
        };
      });
      setUserExtensions(extMap);
    }
  }, [allUsers]);

  // Fetch Analytics & Call Logs
  const fetchData = useCallback(async () => {
    if (!isAddonEnabled) {
      setLoading(false);
      return;
    }

    try {
      setIsRefreshing(true);
      const params = {};

      const now = new Date();
      if (datePreset === "today") {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        params.startDate = start.toISOString();
      } else if (datePreset === "7days") {
        const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        params.startDate = start.toISOString();
      } else if (datePreset === "30days") {
        const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        params.startDate = start.toISOString();
      }

      if (selectedRep !== "all") {
        params.salespersonId = selectedRep;
      }

      const [analyticsRes, logsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/telephony/analytics`, { params }),
        axios.get(`${API_BASE_URL}/telephony/call-logs`, {
          params: { ...params, limit: 50 },
        }),
      ]);

      if (analyticsRes.data?.success) {
        setAnalyticsData(analyticsRes.data.data);
      }
      if (logsRes.data?.success) {
        setCallLogs(logsRes.data.data || []);
      }
    } catch (err) {
      console.error("Error fetching telephony data:", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [isAddonEnabled, datePreset, selectedRep]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Real-Time Socket Listener
  useEffect(() => {
    if (!socket || !isAddonEnabled) return;

    const handleCallCompleted = (payload) => {
      console.log("[TelephonyAnalytics] Live call completed received:", payload);
      if (payload?.callLog) {
        setCallLogs((prev) => [payload.callLog, ...prev.slice(0, 49)]);
      }
      fetchData();
    };

    socket.on("call_completed", handleCallCompleted);
    return () => {
      socket.off("call_completed", handleCallCompleted);
    };
  }, [fetchData, isAddonEnabled]);

  // Audio Playback Toggle
  const togglePlayAudio = (url) => {
    if (playingAudioUrl === url) {
      setPlayingAudioUrl(null);
    } else {
      setPlayingAudioUrl(url);
    }
  };

  // Save Organization Telephony Settings
  const handleSaveOrgSettings = async (e) => {
    e.preventDefault();
    setIsSavingSettings(true);
    setSettingsSuccessMsg("");
    setSettingsErrorMsg("");

    try {
      const res = await axios.put(
        `${API_BASE_URL}/telephony/settings/organization`,
        orgForm
      );
      if (res.data?.success) {
        setSettingsSuccessMsg("TeleCMI configuration updated successfully!");
        if (setOrganization) {
          setOrganization((prev) => ({
            ...prev,
            telephony: {
              ...(prev?.telephony || {}),
              ...res.data.data,
            },
          }));
        }
      }
    } catch (err) {
      setSettingsErrorMsg(
        err.response?.data?.message || "Failed to update TeleCMI settings."
      );
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Save Single Agent Extension (Manual Mapping)
  const handleSaveUserExtension = async (userId) => {
    setSavingUserId(userId);
    try {
      const userPayload = userExtensions[userId] || {};
      await axios.put(
        `${API_BASE_URL}/telephony/settings/agent/${userId}`,
        userPayload
      );
      setSettingsSuccessMsg("Agent extension saved successfully!");
      setTimeout(() => setSettingsSuccessMsg(""), 3000);
    } catch (err) {
      setSettingsErrorMsg(
        err.response?.data?.message || "Failed to update agent extension."
      );
      setTimeout(() => setSettingsErrorMsg(""), 4000);
    } finally {
      setSavingUserId(null);
    }
  };

  // Auto-Provision Single Agent Extension via TeleCMI v3 API
  const handleAutoProvisionUserExtension = async (userId) => {
    setProvisioningUserId(userId);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/telephony/settings/agent/${userId}/auto-provision`
      );
      if (res.data?.success && res.data?.data?.telephony) {
        const tele = res.data.data.telephony;
        setUserExtensions((prev) => ({
          ...prev,
          [userId]: {
            telecmiUserId: tele.telecmiUserId || "",
            telecmiPassword: tele.telecmiPassword || "",
            telecmiExtension: tele.telecmiExtension || "",
          },
        }));
        setSettingsSuccessMsg(
          res.data.message || "Agent auto-provisioned successfully in TeleCMI!"
        );
        setTimeout(() => setSettingsSuccessMsg(""), 3500);
      }
    } catch (err) {
      setSettingsErrorMsg(
        err.response?.data?.message ||
          "Failed to auto-provision agent in TeleCMI."
      );
      setTimeout(() => setSettingsErrorMsg(""), 4000);
    } finally {
      setProvisioningUserId(null);
    }
  };

  // Copy Webhook URL
  const webhookUrl = `${window.location.origin.replace(":3000", ":5000").replace(":5173", ":5000")}/api/telephony/webhook/cdr`;
  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2500);
  };

  // If Telephony Add-on is not active for this organization
  if (!isAddonEnabled) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="bg-bg-card border border-border-main rounded-2xl p-8 shadow-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-pilot-teal/10 text-pilot-teal flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">
            Cloud Telephony Add-On
          </h2>
          <p className="text-text-secondary max-w-xl mx-auto mb-6 text-sm">
            Automate sales calls, capture 100% two-way audio recordings directly
            from the carrier network, view live conversation analytics, and
            transcribe conversations with Gemini AI.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left max-w-3xl mx-auto mb-8">
            <div className="p-4 rounded-xl bg-bg-secondary border border-border-main">
              <PhoneCall className="w-6 h-6 text-pilot-teal mb-2" />
              <h4 className="font-semibold text-text-primary text-sm mb-1">
                Zero-Friction Cloud Calling
              </h4>
              <p className="text-xs text-text-secondary">
                Reps dial directly via TeleCMI without relying on OEM recording
                detectors.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-bg-secondary border border-border-main">
              <Sparkles className="w-6 h-6 text-purple-500 mb-2" />
              <h4 className="font-semibold text-text-primary text-sm mb-1">
                AI Call Coaching
              </h4>
              <p className="text-xs text-text-secondary">
                Automatic speech-to-text transcripts, sentiment analysis, and
                objection insights.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-bg-secondary border border-border-main">
              <TrendingUp className="w-6 h-6 text-emerald-500 mb-2" />
              <h4 className="font-semibold text-text-primary text-sm mb-1">
                Live Talk Time KPIs
              </h4>
              <p className="text-xs text-text-secondary">
                Real-time connection rates, average handle times (AHT), and rep
                leaderboards.
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-pilot-teal text-white font-medium text-sm shadow-sm">
            Contact Super Admin to Activate Telephony Add-On
          </div>
        </div>
      </div>
    );
  }

  const kpis = analyticsData?.kpis || {
    totalCalls: 0,
    connectedCalls: 0,
    missedCalls: 0,
    connectionRate: 0,
    totalTalkTime: 0,
    averageHandleTime: 0,
  };

  const hourlyTrend = analyticsData?.hourlyTrend || [];
  const dispositionChart = analyticsData?.dispositionChart || [];
  const leaderboard = analyticsData?.leaderboard || [];

  // Filtered Call Logs
  const filteredLogs = callLogs.filter((log) => {
    if (statusFilter !== "all" && log.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchLead = log.leadName?.toLowerCase().includes(q);
      const matchPhone = log.leadPhone?.includes(q);
      const matchRep = log.salespersonName?.toLowerCase().includes(q);
      const matchDisp = log.disposition?.toLowerCase().includes(q);
      return matchLead || matchPhone || matchRep || matchDisp;
    }
    return true;
  });

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Upper Header & Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-pilot-teal/10 text-pilot-teal flex items-center justify-center">
              <PhoneCall className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">
              Cloud Telephony Analytics
            </h1>
            {organization?.telephony?.isConfigured ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3" /> Live
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                <AlertCircle className="w-3 h-3" /> Setup Needed
              </span>
            )}
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Real-time call performance, duration trends, agent productivity, and
            automated TeleCMI cloud recordings.
          </p>
        </div>

        {/* Date Filter & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex p-1 bg-bg-secondary border border-border-main rounded-xl text-xs font-medium">
            <button
              onClick={() => setDatePreset("today")}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                datePreset === "today"
                  ? "bg-bg-card text-text-primary font-semibold shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setDatePreset("7days")}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                datePreset === "7days"
                  ? "bg-bg-card text-text-primary font-semibold shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setDatePreset("30days")}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                datePreset === "30days"
                  ? "bg-bg-card text-text-primary font-semibold shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              30 Days
            </button>
            <button
              onClick={() => setDatePreset("all")}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                datePreset === "all"
                  ? "bg-bg-card text-text-primary font-semibold shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              All Time
            </button>
          </div>

          <button
            onClick={fetchData}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border-main bg-bg-card text-text-primary text-xs font-medium hover:bg-bg-secondary transition-colors shadow-sm disabled:opacity-50"
            title="Refresh Data"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-pilot-teal ${
                isRefreshing ? "animate-spin" : ""
              }`}
            />
            <span>Refresh</span>
          </button>

          {isOrgOwner && (
            <button
              onClick={() => setShowSettingsModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pilot-teal text-white text-xs font-semibold hover:bg-pilot-teal-hover transition-colors shadow-sm"
              title="Telephony Settings"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Configure TeleCMI</span>
            </button>
          )}
        </div>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Calls */}
        <div className="bg-bg-card border border-border-main rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase text-text-secondary tracking-wider">
              Total Dialed Calls
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <PhoneOutgoing className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-text-primary mb-1">
            {kpis.totalCalls}
          </div>
          <div className="flex items-center gap-2 text-xs text-text-secondary">
            <span className="text-emerald-500 font-semibold">
              {kpis.connectedCalls} connected
            </span>
            <span>•</span>
            <span className="text-red-400 font-medium">
              {kpis.missedCalls} missed
            </span>
          </div>
        </div>

        {/* Card 2: Total Talk Time */}
        <div className="bg-bg-card border border-border-main rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase text-text-secondary tracking-wider">
              Total Talk Time
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-text-primary mb-1">
            {formatSeconds(kpis.totalTalkTime)}
          </div>
          <p className="text-xs text-text-secondary">
            Billed conversation duration
          </p>
        </div>

        {/* Card 3: Connection Rate */}
        <div className="bg-bg-card border border-border-main rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase text-text-secondary tracking-wider">
              Connection Rate
            </span>
            <div className="w-8 h-8 rounded-lg bg-pilot-teal/10 text-pilot-teal flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-text-primary mb-2">
            {kpis.connectionRate}%
          </div>
          <div className="w-full bg-bg-secondary h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-pilot-teal h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, kpis.connectionRate)}%` }}
            />
          </div>
        </div>

        {/* Card 4: Average Handle Time */}
        <div className="bg-bg-card border border-border-main rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase text-text-secondary tracking-wider">
              Avg Handle Time (AHT)
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-text-primary mb-1">
            {formatSeconds(kpis.averageHandleTime)}
          </div>
          <p className="text-xs text-text-secondary">Per connected call</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Hourly Distribution Chart */}
        <div className="lg:col-span-8 bg-bg-card border border-border-main rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-text-primary">
                Call Volume & Peak Hours
              </h3>
              <p className="text-xs text-text-secondary">
                Hourly call distribution across 24 hours
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyTrend}>
                <defs>
                  <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#28a0a4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#28a0a4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="hour"
                  stroke="var(--text-secondary)"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis
                  stroke="var(--text-secondary)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--bg-card)",
                    borderColor: "var(--border)",
                    borderRadius: "0.75rem",
                    color: "var(--text-primary)",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="calls"
                  name="Calls Dialed"
                  stroke="#28a0a4"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCalls)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Outcomes Donut Chart */}
        <div className="lg:col-span-4 bg-bg-card border border-border-main rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-text-primary mb-1">
              Call Outcomes & Dispositions
            </h3>
            <p className="text-xs text-text-secondary mb-4">
              Breakdown of call disposition states
            </p>

            <div className="h-48 w-full">
              {dispositionChart.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dispositionChart}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {dispositionChart.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={OUTCOME_COLORS[index % OUTCOME_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--bg-card)",
                        borderColor: "var(--border)",
                        borderRadius: "0.75rem",
                        color: "var(--text-primary)",
                        fontSize: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-text-secondary">
                  No call outcomes recorded yet
                </div>
              )}
            </div>
          </div>

          {/* Donut Legend */}
          <div className="space-y-1 mt-2 max-h-28 overflow-y-auto pr-1">
            {dispositionChart.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-xs py-0.5"
              >
                <div className="flex items-center gap-2 truncate">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{
                      backgroundColor:
                        OUTCOME_COLORS[idx % OUTCOME_COLORS.length],
                    }}
                  />
                  <span className="text-text-primary truncate">{item.name}</span>
                </div>
                <span className="font-semibold text-text-secondary shrink-0">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Telecaller Leaderboard */}
      <div className="bg-bg-card border border-border-main rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <Users className="w-4 h-4 text-pilot-teal" />
              Telecaller Productivity Leaderboard
            </h3>
            <p className="text-xs text-text-secondary">
              Performance breakdown ranked by total talk time
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border-main text-text-secondary">
                <th className="py-2.5 px-3 font-semibold">Representative</th>
                <th className="py-2.5 px-3 font-semibold text-center">
                  Total Dialed
                </th>
                <th className="py-2.5 px-3 font-semibold text-center">
                  Connected
                </th>
                <th className="py-2.5 px-3 font-semibold text-center">
                  Connect Rate
                </th>
                <th className="py-2.5 px-3 font-semibold text-right">
                  Total Talk Time
                </th>
                <th className="py-2.5 px-3 font-semibold text-right">AHT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-main">
              {leaderboard.length > 0 ? (
                leaderboard.map((rep, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-bg-secondary/50 transition-colors"
                  >
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-pilot-teal/10 text-pilot-teal flex items-center justify-center font-bold text-xs shrink-0">
                          {rep.salespersonName?.charAt(0) || "U"}
                        </div>
                        <span className="font-medium text-text-primary">
                          {rep.salespersonName}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center font-semibold text-text-primary">
                      {rep.totalCalls}
                    </td>
                    <td className="py-3 px-3 text-center text-emerald-500 font-semibold">
                      {rep.connectedCalls}
                    </td>
                    <td className="py-3 px-3 text-center font-semibold text-text-primary">
                      {rep.connectionRate}%
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-text-primary">
                      {formatSeconds(rep.talkTime)}
                    </td>
                    <td className="py-3 px-3 text-right text-text-secondary">
                      {formatSeconds(rep.aht)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="py-6 text-center text-text-secondary text-xs"
                  >
                    No representative activity recorded in this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Call Detail Records Log Table */}
      <div className="bg-bg-card border border-border-main rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-text-primary">
              Recent Call Logs & Recordings
            </h3>
            <p className="text-xs text-text-secondary">
              Chronological log of TeleCMI cloud calls and direct audio archives
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-text-secondary absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search lead, phone, rep..."
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl bg-bg-secondary border border-border-main text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-1 focus:ring-pilot-teal"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-1.5 px-2.5 text-xs rounded-xl bg-bg-secondary border border-border-main text-text-primary focus:outline-none focus:ring-1 focus:ring-pilot-teal"
            >
              <option value="all">All Statuses</option>
              <option value="connected">Connected</option>
              <option value="not-connected">Not Connected</option>
              <option value="busy">Busy</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border-main text-text-secondary">
                <th className="py-2.5 px-3 font-semibold">Date & Time</th>
                <th className="py-2.5 px-3 font-semibold">Lead Contact</th>
                <th className="py-2.5 px-3 font-semibold">Sales Representative</th>
                <th className="py-2.5 px-3 font-semibold text-center">Status</th>
                <th className="py-2.5 px-3 font-semibold text-right">Talk Time</th>
                <th className="py-2.5 px-3 font-semibold">Disposition</th>
                <th className="py-2.5 px-3 font-semibold text-center">
                  Recording
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-main">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log, idx) => (
                  <tr
                    key={log._id || log.id || idx}
                    className="hover:bg-bg-secondary/50 transition-colors"
                  >
                    <td className="py-3 px-3 whitespace-nowrap text-text-secondary">
                      {log.timestamp
                        ? new Date(log.timestamp).toLocaleString("en-IN", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "N/A"}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-text-primary">
                        {log.leadName || "Direct Contact"}
                      </div>
                      <div className="text-[11px] text-text-secondary">
                        {log.leadPhone}
                      </div>
                    </td>
                    <td className="py-3 px-3 font-medium text-text-primary">
                      {log.salespersonName || "Representative"}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          log.status === "connected"
                            ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                            : log.status === "busy"
                            ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                            : "bg-red-500/10 text-red-500 border border-red-500/20"
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-text-primary whitespace-nowrap">
                      {formatSeconds(log.talkTime || log.duration)}
                    </td>
                    <td className="py-3 px-3">
                      {log.disposition ? (
                        <span className="inline-block px-2 py-0.5 rounded-md bg-bg-secondary text-text-primary font-medium text-[11px]">
                          {log.disposition}
                        </span>
                      ) : (
                        <span className="text-text-secondary/50">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {log.recordingUrl ? (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => togglePlayAudio(log.recordingUrl)}
                            className="p-1.5 rounded-lg bg-pilot-teal/10 text-pilot-teal hover:bg-pilot-teal hover:text-white transition-colors"
                            title="Play Recording"
                          >
                            {playingAudioUrl === log.recordingUrl ? (
                              <Pause className="w-3.5 h-3.5" />
                            ) : (
                              <Play className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <a
                            href={log.recordingUrl}
                            download={`call-${log.cmiuid}.mp3`}
                            className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary transition-colors"
                            title="Download Audio"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      ) : (
                        <span className="text-text-secondary/40 text-[11px]">
                          No audio
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="py-8 text-center text-text-secondary text-xs"
                  >
                    No call logs found matching the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Global Floating Audio Player if playing */}
        {playingAudioUrl && (
          <div className="mt-4 p-3 bg-bg-secondary border border-border-main rounded-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-pilot-teal animate-pulse" />
              <span className="text-xs font-semibold text-text-primary">
                Playing Call Recording
              </span>
            </div>
            <audio
              controls
              autoPlay
              src={playingAudioUrl}
              onEnded={() => setPlayingAudioUrl(null)}
              className="h-8 max-w-sm w-full"
            />
            <button
              onClick={() => setPlayingAudioUrl(null)}
              className="text-xs text-text-secondary hover:text-text-primary font-medium"
            >
              Close
            </button>
          </div>
        )}
      </div>

      {/* Telephony Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-bg-card border border-border-main rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b border-border-main flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-pilot-teal/10 text-pilot-teal flex items-center justify-center">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-text-primary">
                    TeleCMI Cloud Telephony Configuration
                  </h3>
                  <p className="text-xs text-text-secondary">
                    Manage API credentials, Webhook endpoints, and agent extensions
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="p-1.5 text-text-secondary hover:text-text-primary rounded-lg hover:bg-bg-secondary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="px-5 pt-3 border-b border-border-main flex gap-4 text-xs font-semibold">
              <button
                onClick={() => setSettingsTab("api")}
                className={`pb-2.5 border-b-2 transition-colors ${
                  settingsTab === "api"
                    ? "border-pilot-teal text-pilot-teal"
                    : "border-transparent text-text-secondary hover:text-text-primary"
                }`}
              >
                1. TeleCMI API Credentials
              </button>
              <button
                onClick={() => setSettingsTab("extensions")}
                className={`pb-2.5 border-b-2 transition-colors ${
                  settingsTab === "extensions"
                    ? "border-pilot-teal text-pilot-teal"
                    : "border-transparent text-text-secondary hover:text-text-primary"
                }`}
              >
                2. Agent Extension Mapping ({allUsers?.length || 0})
              </button>
              <button
                onClick={() => setSettingsTab("webhook")}
                className={`pb-2.5 border-b-2 transition-colors ${
                  settingsTab === "webhook"
                    ? "border-pilot-teal text-pilot-teal"
                    : "border-transparent text-text-secondary hover:text-text-primary"
                }`}
              >
                3. Webhook Dispatcher
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 space-y-4 flex-1">
              {settingsSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{settingsSuccessMsg}</span>
                </div>
              )}
              {settingsErrorMsg && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{settingsErrorMsg}</span>
                </div>
              )}

              {/* Tab 1: API Credentials */}
              {settingsTab === "api" && (
                <form onSubmit={handleSaveOrgSettings} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-text-primary mb-1">
                        TeleCMI App ID *
                      </label>
                      <input
                        type="text"
                        required
                        value={orgForm.telecmiAppId}
                        onChange={(e) =>
                          setOrgForm({ ...orgForm, telecmiAppId: e.target.value })
                        }
                        placeholder="e.g. 10123456"
                        className="w-full px-3 py-2 text-xs rounded-xl bg-bg-secondary border border-border-main text-text-primary focus:outline-none focus:ring-1 focus:ring-pilot-teal"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-text-primary mb-1">
                        TeleCMI App Secret *
                      </label>
                      <input
                        type="password"
                        required
                        value={orgForm.telecmiSecret}
                        onChange={(e) =>
                          setOrgForm({ ...orgForm, telecmiSecret: e.target.value })
                        }
                        placeholder="Enter App Secret"
                        className="w-full px-3 py-2 text-xs rounded-xl bg-bg-secondary border border-border-main text-text-primary focus:outline-none focus:ring-1 focus:ring-pilot-teal"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-text-primary mb-1">
                        Business Virtual Number (DID)
                      </label>
                      <input
                        type="text"
                        value={orgForm.virtualNumber}
                        onChange={(e) =>
                          setOrgForm({ ...orgForm, virtualNumber: e.target.value })
                        }
                        placeholder="e.g. +91 80 4000 1234"
                        className="w-full px-3 py-2 text-xs rounded-xl bg-bg-secondary border border-border-main text-text-primary focus:outline-none focus:ring-1 focus:ring-pilot-teal"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-text-primary mb-1">
                        TeleCMI Session Border Controller (SBC) URI
                      </label>
                      <input
                        type="text"
                        value={orgForm.sbcUri}
                        onChange={(e) =>
                          setOrgForm({ ...orgForm, sbcUri: e.target.value })
                        }
                        placeholder="sbcind.telecmi.com"
                        className="w-full px-3 py-2 text-xs rounded-xl bg-bg-secondary border border-border-main text-text-primary focus:outline-none focus:ring-1 focus:ring-pilot-teal"
                      />
                    </div>
                  </div>

                  <div className="pt-3 flex justify-end">
                    <button
                      type="submit"
                      disabled={isSavingSettings}
                      className="px-4 py-2 rounded-xl bg-pilot-teal text-white font-semibold text-xs hover:bg-pilot-teal-hover transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{isSavingSettings ? "Saving..." : "Save Credentials"}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Tab 2: Agent Extensions Mapping */}
              {settingsTab === "extensions" && (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-pilot-teal/10 border border-pilot-teal/20 text-xs text-text-primary space-y-1">
                    <p className="font-semibold text-pilot-teal">
                      How Extension Assignment Works:
                    </p>
                    <p className="text-text-secondary">
                      • <strong>New Sales Reps:</strong> When you add a new rep in CRM, their TeleCMI extension is <strong>auto-provisioned automatically</strong> via the v3 API.
                    </p>
                    <p className="text-text-secondary">
                      • <strong>Existing Sales Reps:</strong> For reps created previously, enter their TeleCMI User ID & SIP Password below and click <strong>Save</strong>, or click <strong>Auto-Provision (v3)</strong> to generate their extension instantly!
                    </p>
                  </div>

                  <div className="border border-border-main rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-bg-secondary text-text-secondary border-b border-border-main">
                        <tr>
                          <th className="py-2 px-3 font-semibold">Agent Name</th>
                          <th className="py-2 px-3 font-semibold">TeleCMI User ID</th>
                          <th className="py-2 px-3 font-semibold">SIP Password</th>
                          <th className="py-2 px-3 font-semibold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-main">
                        {allUsers && allUsers.length > 0 ? (
                          allUsers.map((user) => {
                            const uId = user._id || user.id;
                            const cur = userExtensions[uId] || {};
                            const hasCredentials = Boolean(cur.telecmiUserId);
                            return (
                              <tr key={uId} className="hover:bg-bg-secondary/40">
                                <td className="py-2.5 px-3">
                                  <div className="flex items-center gap-1.5 font-semibold text-text-primary">
                                    <span>{user.name}</span>
                                    {hasCredentials && (
                                      <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/10 text-emerald-600 font-normal">
                                        Linked
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-text-secondary">
                                    {user.email}
                                  </div>
                                </td>
                                <td className="py-2 px-3">
                                  <input
                                    type="text"
                                    value={cur.telecmiUserId || ""}
                                    onChange={(e) =>
                                      setUserExtensions((prev) => ({
                                        ...prev,
                                        [uId]: {
                                          ...prev[uId],
                                          telecmiUserId: e.target.value,
                                        },
                                      }))
                                    }
                                    placeholder="e.g. 101_1111112"
                                    className="px-2 py-1 text-xs rounded-lg bg-bg-secondary border border-border-main text-text-primary w-36 focus:outline-none focus:ring-1 focus:ring-pilot-teal font-mono"
                                  />
                                </td>
                                <td className="py-2 px-3">
                                  <input
                                    type="password"
                                    value={cur.telecmiPassword || ""}
                                    onChange={(e) =>
                                      setUserExtensions((prev) => ({
                                        ...prev,
                                        [uId]: {
                                          ...prev[uId],
                                          telecmiPassword: e.target.value,
                                        },
                                      }))
                                    }
                                    placeholder="Password"
                                    className="px-2 py-1 text-xs rounded-lg bg-bg-secondary border border-border-main text-text-primary w-28 focus:outline-none focus:ring-1 focus:ring-pilot-teal font-mono"
                                  />
                                </td>
                                <td className="py-2 px-3 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      onClick={() => handleSaveUserExtension(uId)}
                                      disabled={savingUserId === uId || provisioningUserId === uId}
                                      className="px-2.5 py-1 rounded-lg bg-pilot-teal text-white text-[11px] font-semibold hover:bg-pilot-teal-hover transition-colors shadow-sm disabled:opacity-50"
                                      title="Save manual extension credentials"
                                    >
                                      {savingUserId === uId ? "Saving..." : "Save"}
                                    </button>
                                    <button
                                      onClick={() => handleAutoProvisionUserExtension(uId)}
                                      disabled={savingUserId === uId || provisioningUserId === uId}
                                      className="px-2 py-1 rounded-lg bg-bg-secondary border border-border-main text-text-primary text-[10px] font-medium hover:text-pilot-teal hover:border-pilot-teal/40 transition-colors disabled:opacity-50"
                                      title="Auto-generate extension in TeleCMI v3"
                                    >
                                      {provisioningUserId === uId ? "Auto..." : "Auto (v3)"}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={4} className="py-4 text-center text-text-secondary">
                              No team members found in organization.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab 3: Webhook Dispatcher */}
              {settingsTab === "webhook" && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-bg-secondary border border-border-main">
                    <label className="block text-xs font-semibold text-text-primary mb-1">
                      Your TeleCMI Call Detail Record (CDR) Webhook URL:
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={webhookUrl}
                        className="w-full px-3 py-1.5 text-xs rounded-lg bg-bg-card border border-border-main text-text-primary select-all font-mono"
                      />
                      <button
                        onClick={handleCopyWebhook}
                        className="px-3 py-1.5 rounded-lg bg-pilot-teal text-white text-xs font-semibold hover:bg-pilot-teal-hover transition-colors shrink-0 flex items-center gap-1"
                      >
                        {copiedWebhook ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="text-xs text-text-secondary space-y-2">
                    <h5 className="font-bold text-text-primary">
                      Setup Instructions in TeleCMI Portal:
                    </h5>
                    <ol className="list-decimal list-inside space-y-1.5 leading-relaxed">
                      <li>
                        Log in to your{" "}
                        <a
                          href="https://connle.telecmi.com"
                          target="_blank"
                          rel="noreferrer"
                          className="text-pilot-teal font-medium hover:underline inline-flex items-center gap-0.5"
                        >
                          TeleCMI Dashboard <ArrowUpRight className="w-3 h-3" />
                        </a>
                        .
                      </li>
                      <li>
                        Navigate to <strong>SETTINGS ➔ WEBHOOKS</strong>.
                      </li>
                      <li>
                        Click <strong>Add Webhook</strong>, select Event Type:{" "}
                        <strong>Call Report (CDR)</strong>, Method:{" "}
                        <strong>POST</strong>.
                      </li>
                      <li>Paste the Webhook URL above and click Save.</li>
                      <li>
                        All outgoing and incoming calls will now automatically
                        stream recordings and duration metrics to SalesBuster.
                      </li>
                    </ol>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-border-main bg-bg-secondary/40 flex justify-end">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-1.5 rounded-xl border border-border-main bg-bg-card text-text-primary text-xs font-medium hover:bg-bg-secondary transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
