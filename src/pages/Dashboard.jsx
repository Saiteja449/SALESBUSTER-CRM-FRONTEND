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
  UserPlus,
  X,
  ShieldAlert,
  CheckCheck,
  Lock,
  Settings,
  RotateCcw,
  Smartphone,
  Wifi,
  WifiOff,
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

const CHART_COLORS = ["#28a0a4", "#245070", "#11a139", "#f59e0b", "#36799f"];

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
  const {
    currentUser,
    organization,
    isAiConfigured,
    hasSalesPerson,
    salesRepCount,
    isOrgSetupComplete,
    isManager,
    addSalesPerson,
  } = useAuth();

  const [aiLimits, setAiLimits] = useState(null);
  const [aiLimitsLoading, setAiLimitsLoading] = useState(true);

  // ── WhatsApp Dashboard Widget State ─────────────────────────────────
  const [repWaStatus, setRepWaStatus] = useState(null);       // Sales rep's own session status
  const [teamWaStatuses, setTeamWaStatuses] = useState([]);   // Admin team overview
  const [waWidgetLoading, setWaWidgetLoading] = useState(false);

  useEffect(() => {
    const fetchWaWidget = async () => {
      setWaWidgetLoading(true);
      try {
        if (currentUser?.role === "sales person") {
          const res = await axios.get(API_ENDPOINTS.WHATSAPP.STATUS);
          const sessions = res.data?.sessions || [];
          setRepWaStatus(sessions[0] || null);
        } else if (currentUser?.role === "sales manager" || currentUser?.role === "super_admin") {
          const res = await axios.get(API_ENDPOINTS.WHATSAPP.TEAM_STATUS);
          setTeamWaStatuses(res.data?.data || []);
        }
      } catch (err) {
        // Non-fatal — widget just won't show data
      } finally {
        setWaWidgetLoading(false);
      }
    };
    if (currentUser) fetchWaWidget();
  }, [currentUser]);

  const connectedTeamCount = teamWaStatuses.filter((r) => r.status === "connected").length;

  // Quick Add Sales Person Modal State
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    mobile: "",
  });
  const [addUserLoading, setAddUserLoading] = useState(false);
  const [addUserError, setAddUserError] = useState("");
  const [addUserSuccess, setAddUserSuccess] = useState("");

  const handleQuickAddUser = async (e) => {
    e?.preventDefault();
    setAddUserError("");
    setAddUserSuccess("");

    if (!newUser.name.trim() || !newUser.email.trim() || !newUser.mobile.trim()) {
      setAddUserError("Please provide name, email, and mobile number.");
      return;
    }

    const digitsOnly = newUser.mobile.replace(/\D/g, "");
    if (digitsOnly.length !== 10) {
      setAddUserError("Enter a valid 10-digit Indian mobile number.");
      return;
    }

    try {
      setAddUserLoading(true);
      await addSalesPerson(
        newUser.name.trim(),
        newUser.email.trim(),
        `+91${digitsOnly}`,
      );
      setAddUserSuccess("Sales representative added! Login credentials sent via email.");
      setNewUser({ name: "", email: "", mobile: "" });
      setTimeout(() => {
        setShowAddUserModal(false);
        setAddUserSuccess("");
      }, 1500);
    } catch (err) {
      setAddUserError(err.message || "Failed to add sales representative.");
    } finally {
      setAddUserLoading(false);
    }
  };

  // Master Automation Controls
  const [globalSettings, setGlobalSettings] = useState({
    globalAIEnabled: true,
    welcomeMessageEnabled: true,
    welcomeMessageTemplate: "",
    welcomeMessageFallbackService: "",
    companyName: "",
    primaryService: "",
    defaultTemplate: "",
  });

  // Welcome Message Modal State
  const [welcomeModalOpen, setWelcomeModalOpen] = useState(false);
  const [modalTemplate, setModalTemplate] = useState("");
  const [modalFallbackService, setModalFallbackService] = useState("");
  const [modalEnabled, setModalEnabled] = useState(true);
  const [isSavingWelcome, setIsSavingWelcome] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  const handleOpenWelcomeModal = () => {
    setModalTemplate(
      globalSettings.welcomeMessageTemplate || globalSettings.defaultTemplate || "",
    );
    setModalFallbackService(
      globalSettings.welcomeMessageFallbackService ||
        globalSettings.primaryService ||
        "",
    );
    setModalEnabled(globalSettings.welcomeMessageEnabled !== false);
    setSaveSuccessNotice(false);
    setWelcomeModalOpen(true);
  };

  const handleSaveWelcomeModal = async (e) => {
    e?.preventDefault?.();
    setIsSavingWelcome(true);
    try {
      const res = await axios.post(API_ENDPOINTS.WHATSAPP.SETTINGS, {
        welcomeMessageEnabled: modalEnabled,
        welcomeMessageTemplate: modalTemplate,
        welcomeMessageFallbackService: modalFallbackService,
      });
      if (res.data.success && res.data.data) {
        setGlobalSettings((prev) => ({ ...prev, ...res.data.data }));
      }
      setSaveSuccessNotice(true);
      setTimeout(() => {
        setSaveSuccessNotice(false);
        setWelcomeModalOpen(false);
      }, 1000);
    } catch (err) {
      console.error("Failed to save welcome message template:", err);
    } finally {
      setIsSavingWelcome(false);
    }
  };

  const handleResetWelcomeDefault = () => {
    setModalTemplate(globalSettings.defaultTemplate || "");
  };

  const insertVariableChip = (chip) => {
    setModalTemplate((prev) => `${prev ? prev + " " : ""}{{${chip}}}`);
  };

  const getWelcomePreviewText = () => {
    const raw = modalTemplate || globalSettings.defaultTemplate || "";
    const comp = globalSettings.companyName || "Our Company";
    const serv =
      modalFallbackService || globalSettings.primaryService || "our services";
    return raw
      .replace(/\{\{?\s*name\s*\}?\}/gi, "John Doe")
      .replace(/\{\{?\s*firstname\s*\}?\}/gi, "John")
      .replace(/\{\{?\s*service\s*\}?\}/gi, serv)
      .replace(/\{\{?\s*company(name)?\s*\}?\}/gi, comp)
      .replace(/\{\{?\s*city\s*\}?\}/gi, "New York")
      .replace(/\{\{?\s*phone\s*\}?\}/gi, "+91 98765 43210")
      .replace(/\{\{?\s*source\s*\}?\}/gi, "Website Form");
  };

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
      setGlobalSettings((prev) => ({
        ...prev,
        welcomeMessageEnabled: !newVal,
      }));
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
            Real-time analytical performance summary for{" "}
            {organization?.name || "SalesBuster AI"}.
          </p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-lg transition-colors cursor-pointer"
        >
          <Download className="w-4 h-4" /> Export Data
        </button>
      </div>

      {/* ── Organization Setup & Onboarding Validation Card ────────────────── */}
      {!isOrgSetupComplete && isManager ? (
        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent p-5 md:p-6 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pb-4 border-b border-amber-500/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-brand-primary flex items-center gap-2">
                  {!hasSalesPerson && !isAiConfigured
                    ? "Action Required: Complete Organization Setup"
                    : !isAiConfigured
                      ? "Action Required: Configure AI Setup"
                      : "Action Required: Add Sales Representative"}
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    {!hasSalesPerson && !isAiConfigured
                      ? "2 Actions Remaining"
                      : "1 Action Remaining"}
                  </span>
                </h3>
                <p className="text-xs text-brand-primary/70 mt-0.5">
                  {!hasSalesPerson && !isAiConfigured
                    ? "Your organization must configure AI and add at least 1 sales representative to unlock automatic routing and operations."
                    : !isAiConfigured
                      ? "Define your company persona, services catalog, and lead qualification schema so our AI can automatically handle customer inquiries."
                      : "Your organization currently has 0 sales representatives. Add at least 1 representative so incoming leads can be assigned and managed."}
                </p>
              </div>
            </div>

            {/* Progress bar pill */}
            <div className="w-full md:w-48 shrink-0">
              <div className="flex justify-between text-[10px] font-bold text-brand-primary/70 mb-1">
                <span>Setup Progress</span>
                <span>
                  {((hasSalesPerson ? 1 : 0) + (isAiConfigured ? 1 : 0)) * 50}%
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-bg-main border border-brand-secondary overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-500 rounded-full"
                  style={{
                    width: `${((hasSalesPerson ? 1 : 0) + (isAiConfigured ? 1 : 0)) * 50}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div
            className={`grid gap-4 pt-4 ${!hasSalesPerson && !isAiConfigured ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}
          >
            {/* Requirement 1: AI Setup - Only shown if NOT configured */}
            {!isAiConfigured && (
              <div className="p-4 rounded-xl border border-amber-500/40 bg-bg-main/90 shadow-sm transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      <Bot className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-brand-primary">
                          You haven't configured AI
                        </h4>
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                          Not Configured
                        </span>
                      </div>
                      <p className="text-xs text-brand-primary/70 mt-1 leading-relaxed">
                        Define your company persona, services catalog, and lead
                        qualification schema so our AI can automatically handle
                        customer inquiries and qualify leads.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-brand-secondary/60 flex items-center justify-between">
                  <span className="text-[11px] text-brand-primary/60">
                    Setup required before auto-replies
                  </span>
                  <button
                    onClick={() => navigate("/organization")}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer bg-pilot-blue hover:bg-pilot-blue-hover text-white shadow-sm shadow-pilot-blue/20"
                  >
                    <span>Configure AI Setup</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Requirement 2: Sales Representative - Only shown if 0 sales reps added */}
            {!hasSalesPerson && (
              <div className="p-4 rounded-xl border border-amber-500/40 bg-bg-main/90 shadow-sm transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      <Users className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-brand-primary">
                          Add at least 1 sales person
                        </h4>
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                          0 Added
                        </span>
                      </div>
                      <p className="text-xs text-brand-primary/70 mt-1 leading-relaxed">
                        Your organization currently has 0 sales representatives.
                        Add a representative so incoming leads can be assigned
                        and managed.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-brand-secondary/60 flex items-center justify-between">
                  <span className="text-[11px] text-brand-primary/60">
                    Required for lead distribution
                  </span>
                  <button
                    onClick={() => setShowAddUserModal(true)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Add Sales Person</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* WhatsApp Connection Widget */}
      {currentUser?.role === "sales person" && (
        <div className="bg-brand-light border border-brand-secondary rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${
                repWaStatus?.status === "connected"
                  ? "bg-green-500/10 border-green-500/30 text-green-500"
                  : "bg-purple-500/10 border-purple-500/30 text-purple-400"
              }`}>
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-brand-primary">My WhatsApp Line</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    repWaStatus?.status === "connected" ? "bg-green-500 animate-pulse" :
                    repWaStatus?.status === "qr" ? "bg-amber-400 animate-pulse" :
                    repWaStatus?.status === "connecting" ? "bg-blue-400" : "bg-slate-400"
                  }`} />
                  <span className="text-xs text-brand-primary/70 capitalize">
                    {repWaStatus?.status === "connected"
                      ? `Connected · +${repWaStatus.connectedPhone}`
                      : repWaStatus?.status === "qr"
                        ? "QR Code Ready to Scan"
                        : repWaStatus?.status === "connecting"
                          ? "Connecting..."
                          : "Not Connected"}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => navigate("/whatsapp")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white transition-colors"
            >
              {repWaStatus?.status === "connected" ? "Manage" : "Connect"}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {(currentUser?.role === "sales manager" || currentUser?.role === "super_admin") && teamWaStatuses.length > 0 && (
        <div className="bg-brand-light border border-brand-secondary rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center shrink-0">
                <Smartphone className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-brand-primary">Team WhatsApp Lines</p>
                <p className="text-xs text-brand-primary/70 mt-0.5">
                  <span className="font-bold text-green-500">{connectedTeamCount}</span> of{" "}
                  <span className="font-bold">{teamWaStatuses.length}</span> reps connected
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Rep status mini-pills */}
              <div className="flex items-center gap-1">
                {teamWaStatuses.slice(0, 5).map((rep) => (
                  <div
                    key={rep.userId}
                    title={`${rep.name}: ${rep.status}`}
                    className={`w-2 h-2 rounded-full ${
                      rep.status === "connected" ? "bg-green-500" :
                      rep.status === "qr" ? "bg-amber-400" :
                      "bg-slate-400"
                    }`}
                  />
                ))}
                {teamWaStatuses.length > 5 && (
                  <span className="text-[10px] text-brand-primary/60 ml-1">+{teamWaStatuses.length - 5}</span>
                )}
              </div>
              <button
                onClick={() => navigate("/whatsapp")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white transition-colors"
              >
                View All <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

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
                Instantly control global AI auto-replies and automated enquiry
                greetings across all channels.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 shrink-0">
            {/* Toggle 1: Global AI Chatbot */}
            <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-bg-main border border-brand-secondary min-w-[240px]">
              <div className="flex items-center gap-2.5 min-w-0">
                <Bot
                  className={`w-4 h-4 shrink-0 ${
                    globalSettings.globalAIEnabled
                      ? "text-emerald-500"
                      : "text-amber-500"
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
                  globalSettings.globalAIEnabled
                    ? "bg-emerald-500"
                    : "bg-brand-secondary/70"
                }`}
                title={
                  globalSettings.globalAIEnabled
                    ? "Pause Global AI"
                    : "Enable Global AI"
                }
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    globalSettings.globalAIEnabled
                      ? "translate-x-5"
                      : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Toggle 2: Automated Welcome Messages */}
            <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-bg-main border border-brand-secondary min-w-[260px]">
              <div className="flex items-center gap-2.5 min-w-0">
                <MessageCircle
                  className={`w-4 h-4 shrink-0 ${
                    globalSettings.welcomeMessageEnabled
                      ? "text-teal-500"
                      : "text-brand-primary/40"
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

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleOpenWelcomeModal}
                  className="p-1.5 rounded-lg border border-brand-secondary hover:bg-brand-secondary/40 text-brand-primary/70 hover:text-teal-500 transition-colors cursor-pointer"
                  title="Customize Welcome Message Template"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={handleToggleWelcomeMessage}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    globalSettings.welcomeMessageEnabled
                      ? "bg-teal-500"
                      : "bg-brand-secondary/70"
                  }`}
                  title={
                    globalSettings.welcomeMessageEnabled
                      ? "Pause Welcome Messages"
                      : "Enable Welcome Messages"
                  }
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      globalSettings.welcomeMessageEnabled
                        ? "translate-x-5"
                        : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
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

      {/* ── Quick Add Sales Representative Modal ─────────────────────────────── */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-bg-card border border-border-main rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <div className="flex justify-between items-center pb-4 border-b border-border-main">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-text-primary">
                    Add Sales Representative
                  </h3>
                  <p className="text-xs text-text-secondary">
                    Create a sales team member to assign incoming leads
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAddUserModal(false);
                  setAddUserError("");
                  setAddUserSuccess("");
                }}
                className="p-1 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {addUserError && (
              <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs font-semibold text-red-500 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{addUserError}</span>
              </div>
            )}

            {addUserSuccess && (
              <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-semibold text-emerald-500 flex items-center gap-2">
                <CheckCheck className="w-4 h-4 shrink-0" />
                <span>{addUserSuccess}</span>
              </div>
            )}

            <form onSubmit={handleQuickAddUser} className="mt-4 space-y-3.5">
              <div>
                <label className="text-xs font-bold text-text-primary block mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Kumar"
                  value={newUser.name}
                  onChange={(e) =>
                    setNewUser({ ...newUser, name: e.target.value })
                  }
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-bg-secondary border border-border-main text-xs text-text-primary focus:outline-none focus:border-pilot-blue"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-text-primary block mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="ramesh@company.com"
                  value={newUser.email}
                  onChange={(e) =>
                    setNewUser({ ...newUser, email: e.target.value })
                  }
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-bg-secondary border border-border-main text-xs text-text-primary focus:outline-none focus:border-pilot-blue"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-text-primary block mb-1">
                  Mobile Number
                </label>
                <div className="flex rounded-xl bg-bg-secondary border border-border-main focus-within:border-pilot-blue">
                  <span className="px-3.5 py-2.5 text-xs font-semibold text-text-secondary border-r border-border-main">+91</span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="98765 43210"
                    value={newUser.mobile}
                    onChange={(e) => setNewUser({ ...newUser, mobile: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                    required
                    className="w-full min-w-0 px-3.5 py-2.5 rounded-r-xl bg-transparent text-xs text-text-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-600 dark:text-blue-400 flex items-start gap-2">
                <span className="text-sm shrink-0 mt-0.5">🔐</span>
                <span className="leading-relaxed">
                  A secure login password will be automatically generated and sent to this email address.
                </span>
              </div>

              <div className="pt-3 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 rounded-xl border border-border-main text-xs font-bold text-text-secondary hover:bg-bg-secondary transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addUserLoading}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-sm transition-all disabled:opacity-60 cursor-pointer"
                >
                  {addUserLoading ? "Creating & Sending..." : "Add & Send Credentials"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Customize Welcome Message */}
      {welcomeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-bg-main border border-brand-secondary rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-brand-secondary flex items-center justify-between shrink-0 bg-bg-main">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-500">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-brand-primary">
                    Automated Welcome Message
                  </h3>
                  <p className="text-xs text-brand-primary/60">
                    Customize the instant WhatsApp greeting sent to brand new enquiry leads
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setWelcomeModalOpen(false)}
                className="p-2 rounded-xl text-brand-primary/60 hover:text-brand-primary hover:bg-brand-secondary/40 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveWelcomeModal} className="flex-1 overflow-y-auto p-5 space-y-5">
              {saveSuccessNotice && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-semibold text-emerald-500 flex items-center gap-2">
                  <CheckCheck className="w-4 h-4 shrink-0" />
                  <span>Welcome message settings saved successfully!</span>
                </div>
              )}

              {/* Status Switcher Bar */}
              <div className="p-3.5 rounded-xl bg-brand-light border border-brand-secondary flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-bold text-brand-primary">
                    Automated Greetings Status
                  </div>
                  <div className="text-[11px] text-brand-primary/60">
                    When enabled, leads from Website, Meta Ads, Calls, and Mobile App automatically receive this greeting.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setModalEnabled(!modalEnabled)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    modalEnabled ? "bg-teal-500" : "bg-brand-secondary/70"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      modalEnabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Left: Configuration Inputs */}
                <div className="space-y-4">
                  {/* Dynamic Variable Chips */}
                  <div>
                    <label className="text-xs font-bold text-brand-primary block mb-1.5">
                      Insert Dynamic Placeholders
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { key: "name", label: "{{name}}" },
                        { key: "firstName", label: "{{firstName}}" },
                        { key: "service", label: "{{service}}" },
                        { key: "company", label: "{{company}}" },
                        { key: "city", label: "{{city}}" },
                        { key: "phone", label: "{{phone}}" },
                      ].map((item) => (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => insertVariableChip(item.key)}
                          className="px-2 py-1 text-[11px] font-semibold bg-brand-secondary/40 hover:bg-teal-500/20 text-brand-primary hover:text-teal-600 rounded-lg border border-brand-secondary transition-colors cursor-pointer"
                          title={`Click to insert ${item.label}`}
                        >
                          + {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Template Textarea */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-brand-primary">
                        Message Template
                      </label>
                      <button
                        type="button"
                        onClick={handleResetWelcomeDefault}
                        className="text-[11px] font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1 cursor-pointer"
                        title="Reset message to standard default"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Reset Default
                      </button>
                    </div>
                    <textarea
                      rows={8}
                      value={modalTemplate}
                      onChange={(e) => setModalTemplate(e.target.value)}
                      placeholder="Type your WhatsApp greeting template..."
                      className="w-full p-3 rounded-xl bg-bg-secondary border border-border-main text-xs text-brand-primary focus:outline-none focus:border-teal-500 resize-none font-mono leading-relaxed"
                    />
                    <div className="mt-1 flex items-center justify-between text-[10px] text-brand-primary/50">
                      <span>WhatsApp formatting: *bold*, _italic_, ~strikethrough~</span>
                      <span>{modalTemplate.length} characters</span>
                    </div>
                  </div>

                  {/* Fallback Service */}
                  <div>
                    <label className="text-xs font-bold text-brand-primary block mb-1">
                      Fallback Service Name
                    </label>
                    <input
                      type="text"
                      value={modalFallbackService}
                      onChange={(e) => setModalFallbackService(e.target.value)}
                      placeholder="e.g. Consultation & Services"
                      className="w-full px-3 py-2 rounded-xl bg-bg-secondary border border-border-main text-xs text-brand-primary focus:outline-none focus:border-teal-500"
                    />
                    <span className="text-[10px] text-brand-primary/50 block mt-1">
                      Used when an incoming lead does not specify a specific product or service.
                    </span>
                  </div>
                </div>

                {/* Right: Real-time WhatsApp Chat Preview */}
                <div>
                  <label className="text-xs font-bold text-brand-primary block mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-teal-500" />
                    Live Customer WhatsApp Preview
                  </label>

                  <div className="rounded-2xl border border-brand-secondary bg-[#0b141a] p-4 text-white min-h-[320px] flex flex-col justify-between shadow-inner">
                    {/* Simulated Chat Header */}
                    <div className="pb-3 border-b border-white/10 flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-teal-600 flex items-center justify-center font-bold text-xs">
                        {(globalSettings.companyName || "S")[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate">
                          {globalSettings.companyName || "Your Organization"}
                        </div>
                        <div className="text-[9px] text-white/60">Official WhatsApp</div>
                      </div>
                    </div>

                    {/* Simulated Message Bubble */}
                    <div className="my-auto py-3">
                      <div className="max-w-[90%] ml-auto bg-[#005c4b] text-white text-xs p-3 rounded-2xl rounded-tr-sm shadow-md whitespace-pre-line leading-relaxed">
                        {getWelcomePreviewText()}
                        <div className="mt-1.5 flex items-center justify-end gap-1 text-[9px] text-white/60">
                          <span>Just now</span>
                          <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 text-[10px] text-white/40 text-center border-t border-white/5">
                      Sample preview populated with customer placeholders
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-brand-secondary flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setWelcomeModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-brand-secondary text-xs font-bold text-brand-primary/70 hover:bg-brand-secondary/30 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingWelcome}
                  className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {isSavingWelcome ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCheck className="w-3.5 h-3.5" />
                      Save Template
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
