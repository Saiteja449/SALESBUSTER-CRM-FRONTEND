import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Users,
  DollarSign,
  TrendingUp,
  CheckSquare,
  AlertTriangle,
  ArrowRight,
  Calendar,
  Star,
  CheckCircle2,
  Download,
  Bot,
  RefreshCw,
  Phone,
  MessageCircle,
  Mail,
  Clock,
  Sparkles,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend,
} from "recharts";
import { useDashboard } from "../context/DashboardContext.jsx";
import { useLeads } from "../context/LeadsContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { formatDate, getServiceColor, exportToCSV } from "../utils/helpers.js";
import { API_ENDPOINTS } from "../utils/constants.js";
import { socket } from "../utils/socket.js";

const CHART_COLORS = ["#0c7dfd", "#11a139", "#f59e0b", "#0c1f37", "#0ea5e9"];

const Instagram = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

export default function Dashboard() {
  const navigate = useNavigate();
  const stats = useDashboard();
  const { leads } = useLeads();
  const { currentUser } = useAuth();

  const [aiLimits, setAiLimits] = useState(null);
  const [aiLimitsLoading, setAiLimitsLoading] = useState(true);

  // Master Automation Controls
  const [globalSettings, setGlobalSettings] = useState({
    globalAIEnabled: true,
    welcomeMessageEnabled: true,
  });

  useEffect(() => {
    const fetchGlobalSettings = async () => {
      try {
        const res = await axios.get(API_ENDPOINTS.WHATSAPP.SETTINGS);
        if (res.data.success && res.data.data) {
          setGlobalSettings(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch global AI settings:", err);
      }
    };
    fetchGlobalSettings();

    const handleSettingsUpdate = (data) => {
      if (data) setGlobalSettings((prev) => ({ ...prev, ...data }));
    };

    socket.on("global_settings_updated", handleSettingsUpdate);

    return () => {
      socket.off("global_settings_updated", handleSettingsUpdate);
    };
  }, []);

  const handleToggleGlobalAI = async () => {
    const newVal = !globalSettings.globalAIEnabled;
    setGlobalSettings((prev) => ({ ...prev, globalAIEnabled: newVal }));
    try {
      await axios.post(API_ENDPOINTS.WHATSAPP.SETTINGS, {
        globalAIEnabled: newVal,
      });
    } catch (err) {
      console.error("Failed to update global AI setting:", err);
      setGlobalSettings((prev) => ({ ...prev, globalAIEnabled: !newVal }));
    }
  };

  const handleToggleWelcomeMessage = async () => {
    const newVal = !globalSettings.welcomeMessageEnabled;
    setGlobalSettings((prev) => ({ ...prev, welcomeMessageEnabled: newVal }));
    try {
      await axios.post(API_ENDPOINTS.WHATSAPP.SETTINGS, {
        welcomeMessageEnabled: newVal,
      });
    } catch (err) {
      console.error("Failed to update welcome message setting:", err);
      setGlobalSettings((prev) => ({ ...prev, welcomeMessageEnabled: !newVal }));
    }
  };

  useEffect(() => {
    const fetchAILimits = async () => {
      try {
        const res = await axios.get(API_ENDPOINTS.ANALYTICS.AI_LIMITS);
        if (res.data.success) {
          setAiLimits(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch previous AI limits:", err);
      } finally {
        setAiLimitsLoading(false);
      }
    };
    fetchAILimits();
  }, []);

  const handleRefreshAILimits = async () => {
    setAiLimitsLoading(true);
    try {
      const res = await axios.post(API_ENDPOINTS.ANALYTICS.AI_LIMITS_REFRESH);
      if (res.data.success) {
        setAiLimits(res.data.data);
      }
    } catch (err) {
      console.error("Failed to refresh AI limits:", err);
    } finally {
      setAiLimitsLoading(false);
    }
  };

  const handleExport = () => {
    exportToCSV(leads, "dashboard_leads_export.csv");
  };

  const getLatestEnquiryTime = (sourceFilters) => {
    if (!leads || leads.length === 0) return "N/A";
    const filtered = leads.filter((l) => sourceFilters.includes(l.source));
    if (filtered.length === 0) return "N/A";

    const latest = filtered.reduce((latestLead, currentLead) => {
      const current = new Date(currentLead.joinedAt || currentLead.createdAt);
      const latestDt = new Date(latestLead.joinedAt || latestLead.createdAt);
      return current > latestDt ? currentLead : latestLead;
    });

    const dt = new Date(latest.joinedAt || latest.createdAt);
    if (isNaN(dt.getTime())) return "N/A";
    return dt.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Top Banner section */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-primary tracking-tight">
            Executive Dashboard
          </h1>
          <p className="text-sm text-brand-primary/70">
            Real-time analytical performance summary for Kranthi Elevators sales
            representatives.
          </p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-brand-primary text-sm font-bold rounded-lg transition-colors"
        >
          <Download className="w-4 h-4" /> Export Data
        </button>
      </div>

      {/* AI & Automation Master Control Card */}
      <div className="bg-brand-light border border-brand-secondary rounded-2xl p-4 md:p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-teal-500" />
            </div>
            <div>
              <h2 className="text-base font-bold text-brand-primary flex items-center gap-2">
                AI & Automation Master Controls
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-600 border border-teal-500/20">
                  Live Master Switches
                </span>
              </h2>
              <p className="text-xs text-brand-primary/70">
                Instantly control global AI auto-replies and automated enquiry greetings across all channels.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 shrink-0">
            {/* Toggle 1: Global AI Chatbot */}
            <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-bg-main border border-brand-secondary min-w-[240px]">
              <div className="flex items-center gap-2.5 min-w-0">
                <Bot
                  className={`w-4 h-4 shrink-0 ${
                    globalSettings.globalAIEnabled ? "text-emerald-500" : "text-amber-500"
                  }`}
                />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-brand-primary truncate">
                    Global AI Auto-Reply
                  </div>
                  <div className="text-[10px] text-brand-primary/60 truncate">
                    {globalSettings.globalAIEnabled
                      ? "AI responding automatically"
                      : "AI auto-responses paused"}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleToggleGlobalAI}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  globalSettings.globalAIEnabled ? "bg-emerald-500" : "bg-brand-secondary/70"
                }`}
                title={globalSettings.globalAIEnabled ? "Pause Global AI" : "Enable Global AI"}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    globalSettings.globalAIEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Toggle 2: Automated Welcome Messages */}
            <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-bg-main border border-brand-secondary min-w-[240px]">
              <div className="flex items-center gap-2.5 min-w-0">
                <MessageCircle
                  className={`w-4 h-4 shrink-0 ${
                    globalSettings.welcomeMessageEnabled ? "text-teal-500" : "text-brand-primary/40"
                  }`}
                />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-brand-primary truncate">
                    Welcome Greetings
                  </div>
                  <div className="text-[10px] text-brand-primary/60 truncate">
                    {globalSettings.welcomeMessageEnabled
                      ? "Sending on new leads"
                      : "Welcome greetings paused"}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleToggleWelcomeMessage}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  globalSettings.welcomeMessageEnabled ? "bg-teal-500" : "bg-brand-secondary/70"
                }`}
                title={globalSettings.welcomeMessageEnabled ? "Pause Welcome Messages" : "Enable Welcome Messages"}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    globalSettings.welcomeMessageEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>


      {/* Latest Enquiry Times Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-brand-light border border-brand-secondary rounded-xl p-3 flex items-center gap-3 shadow-sm">
          <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
            <MessageCircle className="w-4 h-4 text-green-500" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-brand-primary/60 uppercase">
              WhatsApp
            </div>
            <div className="text-xs font-semibold text-brand-primary flex items-center gap-1">
              <Clock className="w-3 h-3 text-brand-primary/40" />
              {getLatestEnquiryTime(["WhatsApp"])}
            </div>
          </div>
        </div>
        <div className="bg-brand-light border border-brand-secondary rounded-xl p-3 flex items-center gap-3 shadow-sm">
          <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
            <Phone className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-brand-primary/60 uppercase">
              Mobile
            </div>
            <div className="text-xs font-semibold text-brand-primary flex items-center gap-1">
              <Clock className="w-3 h-3 text-brand-primary/40" />
              {getLatestEnquiryTime(["Call", "Manual Entry", "Mobile App"])}
            </div>
          </div>
        </div>
        <div className="bg-brand-light border border-brand-secondary rounded-xl p-3 flex items-center gap-3 shadow-sm">
          <div className="w-8 h-8 rounded-full bg-pink-500/10 flex items-center justify-center">
            <Instagram className="w-4 h-4 text-pink-500" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-brand-primary/60 uppercase">
              Instagram / Meta
            </div>
            <div className="text-xs font-semibold text-brand-primary flex items-center gap-1">
              <Clock className="w-3 h-3 text-brand-primary/40" />
              {getLatestEnquiryTime(["Meta Ads"])}
            </div>
          </div>
        </div>
        <div className="bg-brand-light border border-brand-secondary rounded-xl p-3 flex items-center gap-3 shadow-sm">
          <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center">
            <Mail className="w-4 h-4 text-orange-500" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-brand-primary/60 uppercase">
              Email / Web
            </div>
            <div className="text-xs font-semibold text-brand-primary flex items-center gap-1">
              <Clock className="w-3 h-3 text-brand-primary/40" />
              {getLatestEnquiryTime(["Email", "Website Form"])}
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total Leads */}
        <div className="bg-brand-light border border-brand-secondary rounded-2xl p-5 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-brand-primary/70 uppercase tracking-wider">
              Total Leads
            </h3>
            <div className="text-3xl font-extrabold text-brand-primary mt-1">
              {stats.totalLeads}
            </div>
            <div className="text-xs font-semibold text-purple-500 flex items-center mt-1">
              Active and tracked clients
            </div>
          </div>
          <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center">
            <Users className="w-6 h-6 text-purple-500" />
          </div>
        </div>
        <div className="bg-brand-light border border-brand-secondary rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-brand-primary/70 uppercase tracking-wider">
                Lead Conversion %
              </h3>
              <div className="text-3xl font-extrabold text-brand-primary mt-1">
                {stats.conversionRate}%
              </div>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-500" />
            </div>
          </div>
          <div className="mt-4 w-full bg-blue-500/10 rounded-full h-1.5">
            <div
              className="bg-blue-500 h-1.5 rounded-full"
              style={{ width: `${stats.conversionRate}%` }}
            ></div>
          </div>
        </div>

        {/* Converted Leads */}
        <div className="bg-brand-light border border-brand-secondary rounded-2xl p-5 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-brand-primary/70 uppercase tracking-wider">
              Converted Leads
            </h3>
            <div className="text-3xl font-extrabold text-emerald-600 mt-1">
              {stats.convertedCount ?? stats.totalWonCount}
            </div>
            <div className="text-xs font-semibold text-brand-primary/70 flex items-center mt-1">
              Successfully converted leads
            </div>
          </div>
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          </div>
        </div>
      </div>

      {/* service level stats grid summaries */}
      <div>
        <h2 className="text-lg font-bold text-brand-primary mb-4">
          Service Performance Hubs
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.wonLeadsByServiceData.map((s, index) => {
            const numLeads = s.pipeline;
            const wonLeads = s.won;
            const sColor = getServiceColor(s.name);
            return (
              <div
                key={s.name}
                className="relative bg-brand-light border border-brand-secondary rounded-2xl overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, var(--bg-card) 60%, ${sColor}1a 100%)`,
                }}
              >
                <div
                  className="absolute left-0 top-0 bottom-0 w-1"
                  style={{ backgroundColor: sColor }}
                />
                <div className="p-4 pl-6">
                  <h3 className="text-base font-bold text-brand-primary leading-tight">
                    {s.name}
                  </h3>
                  <div className="flex justify-between items-end mt-4">
                    <div>
                      <span className="block text-xs font-medium text-brand-primary/70">
                        Total Leads:
                      </span>
                      <span className="block text-lg font-extrabold text-brand-primary leading-tight mt-0.5">
                        {numLeads}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="block text-xs font-medium text-brand-primary/70">
                        Won Leads:
                      </span>
                      <span className="block text-lg font-extrabold text-emerald-500 leading-tight mt-0.5">
                        {wonLeads}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Analytics Pie Charts */}
      {currentUser?.role === "Sales Manager" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-brand-light border border-brand-secondary rounded-3xl p-5 h-[400px]">
            <h3 className="text-base font-bold text-brand-primary mb-4">
              Leads by Service
            </h3>
            <ResponsiveContainer width="100%" height="85%">
              <PieChart>
                <Pie
                  data={stats.leadsByServiceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {stats.leadsByServiceData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "var(--bg-card)",
                    borderColor: "var(--border)",
                    color: "var(--text-primary)",
                    borderRadius: "8px",
                  }}
                  itemStyle={{ color: "var(--text-primary)" }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  wrapperStyle={{
                    fontSize: "12px",
                    color: "var(--text-primary)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-brand-light border border-brand-secondary rounded-3xl p-5 h-[400px]">
            <h3 className="text-base font-bold text-brand-primary mb-4">
              Leads by Source
            </h3>
            <ResponsiveContainer width="100%" height="85%">
              <PieChart>
                <Pie
                  data={stats.leadSourceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {stats.leadSourceData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={CHART_COLORS[(index + 2) % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "var(--bg-card)",
                    borderColor: "var(--border)",
                    color: "var(--text-primary)",
                    borderRadius: "8px",
                  }}
                  itemStyle={{ color: "var(--text-primary)" }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  wrapperStyle={{
                    fontSize: "12px",
                    color: "var(--text-primary)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      <div
        className={
          currentUser?.role === "Sales Manager"
            ? "grid grid-cols-1 lg:grid-cols-2 gap-6"
            : "grid grid-cols-1"
        }
      >
        {currentUser?.role === "Sales Manager" && (
          <div className="bg-brand-light border border-brand-secondary rounded-3xl p-5 min-h-[400px]">
            <div className="flex justify-between items-center mb-6 px-2">
              <h3 className="text-base font-bold text-brand-primary flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" fill="currentColor" />{" "}
                Sales Leaderboard
              </h3>
              <button
                onClick={() => navigate("/performance")}
                className="text-sm font-bold text-purple-500 hover:text-purple-400 flex items-center gap-1 transition-colors"
              >
                View Report <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <ul className="space-y-0">
              {stats.performersList.map((p, index) => (
                <React.Fragment key={p.name}>
                  {index > 0 && (
                    <li className="h-px bg-brand-secondary/30 my-2" />
                  )}
                  <li className="flex items-center px-2 py-3">
                    <div className="relative shrink-0 mr-4">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-brand-light ${
                          index === 0
                            ? "bg-purple-500"
                            : "bg-brand-secondary/30 text-brand-primary"
                        }`}
                      >
                        {p.name
                          .split(" ")
                          .map((w) => w[0])
                          .join("")}
                      </div>
                      <div
                        className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-brand-light border-2 border-brand-secondary ${
                          index === 0
                            ? "bg-yellow-500"
                            : index === 1
                              ? "bg-brand-primary/50"
                              : "bg-amber-700"
                        }`}
                      >
                        {index + 1}
                      </div>
                    </div>
                    <div className="flex-1 flex items-center justify-between min-w-0">
                      <div className="min-w-0 truncate pr-4">
                        <div className="font-bold text-brand-primary text-sm truncate">
                          {p.name}
                        </div>
                        <div className="text-xs text-brand-primary/70 mt-0.5 truncate">
                          {p.assigned} assigned • {p.won} converted
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-bold text-emerald-500 text-sm">
                          {p.conversionRate}% Conv.
                        </div>
                      </div>
                    </div>
                  </li>
                </React.Fragment>
              ))}
            </ul>
          </div>
        )}

        {/* Recent timeline feed */}
        <div className="bg-brand-light border border-brand-secondary rounded-3xl p-5 min-h-[400px]">
          <h3 className="text-base font-bold text-brand-primary mb-6 px-2">
            Recent Action timeline
          </h3>

          <ul className="space-y-0">
            {stats.recentActivities.slice(0, 5).map((act, index) => (
              <React.Fragment key={act.id}>
                {index > 0 && (
                  <li className="h-px bg-brand-secondary/30 my-2" />
                )}
                <li className="flex items-start px-2 py-3">
                  <div className="shrink-0 mr-4 mt-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        act.type.includes("Stage")
                          ? "bg-orange-500/10 text-orange-500"
                          : act.type.includes("Created")
                            ? "bg-purple-500/10 text-purple-500"
                            : "bg-slate-500/10 text-slate-400"
                      }`}
                    >
                      {act.type.includes("Stage") ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : act.type.includes("Created") ? (
                        <Users className="w-4 h-4" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start flex-wrap gap-1">
                      <div className="font-bold text-brand-primary text-sm truncate pr-2">
                        {act.leadName} ({act.author})
                      </div>
                      <div className="text-xs text-brand-primary/70 whitespace-nowrap">
                        {formatDate(act.date)}
                      </div>
                    </div>
                    <div className="text-sm text-brand-primary/70 mt-1">
                      {act.content}
                    </div>
                  </div>
                </li>
              </React.Fragment>
            ))}
          </ul>
          {stats.recentActivities.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10">
              <p className="text-sm text-brand-primary/70">
                No recent audit events logged.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
