import React, { useState, useEffect, useMemo } from "react";
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
  Flame,
  ListTodo,
  ExternalLink,
  Layers,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
} from "recharts";
import { useDashboard } from "../context/DashboardContext.jsx";
import { useLeads } from "../context/LeadsContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { formatDate, getServiceColor, exportToCSV } from "../utils/helpers.js";
import { API_ENDPOINTS } from "../utils/constants.js";
import { socket } from "../utils/socket.js";

const CHART_COLORS = ["#28a0a4", "#245070", "#11a139", "#f59e0b", "#36799f", "#8b5cf6", "#ec4899"];

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
    aria-hidden="true"
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

// High-readability Chart Tooltip with exact counts and percentages
const CustomChartTooltip = ({ active, payload, total }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    const value = data.value || 0;
    const pct = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
    return (
      <div className="bg-bg-card border border-border-main p-2.5 rounded-xl shadow-xl text-xs z-20">
        <div className="font-bold text-text-primary flex items-center gap-1.5">
          <span
            className="w-2.5 h-2.5 rounded-full inline-block"
            style={{ backgroundColor: data.payload?.fill || data.color }}
          />
          {data.name}
        </div>
        <div className="text-text-secondary mt-1 flex items-center justify-between gap-3">
          <span>Lead count:</span>
          <span className="font-bold text-text-primary">{value}</span>
        </div>
        <div className="text-text-secondary flex items-center justify-between gap-3">
          <span>Share:</span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400">{pct}%</span>
        </div>
      </div>
    );
  }
  return null;
};

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
    isSalesPerson,
    addSalesPerson,
  } = useAuth();

  const isRepUser =
    Boolean(isSalesPerson) ||
    ["sales person", "sales representative", "sales_person"].includes(
      (currentUser?.role || "").toLowerCase()
    );

  const isManagerRole = Boolean(
    isManager ||
    ["sales manager", "super_admin", "admin", "super admin"].includes(
      (currentUser?.role || "").toLowerCase()
    ) ||
    currentUser?.isOrgOwner
  );

  const [aiLimits, setAiLimits] = useState(null);
  const [aiLimitsLoading, setAiLimitsLoading] = useState(true);

  // ── WhatsApp Dashboard Widget State ─────────────────────────────────
  const [repWaStatus, setRepWaStatus] = useState(null); // Sales rep's own session status
  const [teamWaStatuses, setTeamWaStatuses] = useState([]); // Admin team overview
  const [waWidgetLoading, setWaWidgetLoading] = useState(false);
  const [waWidgetError, setWaWidgetError] = useState(null);

  const fetchWaWidget = async () => {
    setWaWidgetLoading(true);
    setWaWidgetError(null);
    try {
      if (isRepUser) {
        const res = await axios.get(API_ENDPOINTS.WHATSAPP.STATUS);
        const sessions = res.data?.sessions || [];
        setRepWaStatus(sessions[0] || null);
      } else if (isManagerRole) {
        const res = await axios.get(API_ENDPOINTS.WHATSAPP.TEAM_STATUS);
        setTeamWaStatuses(res.data?.data || []);
      }
    } catch (err) {
      console.error("Failed to load WhatsApp status:", err);
      const errMsg =
        err.response?.status === 403
          ? "Access restricted: Manager permissions required."
          : err.response?.data?.message || err.message || "Failed to load WhatsApp status.";
      setWaWidgetError(errMsg);
    } finally {
      setWaWidgetLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) fetchWaWidget();
  }, [currentUser, isRepUser, isManagerRole]);

  const connectedTeamCount = useMemo(() => {
    return (teamWaStatuses || []).filter((r) => r.status === "connected").length;
  }, [teamWaStatuses]);

  const disconnectedReps = useMemo(() => {
    return (teamWaStatuses || []).filter((r) => r.status !== "connected");
  }, [teamWaStatuses]);

  const connectedReps = useMemo(() => {
    return (teamWaStatuses || []).filter((r) => r.status === "connected");
  }, [teamWaStatuses]);

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

    if (
      !newUser.name.trim() ||
      !newUser.email.trim() ||
      !newUser.mobile.trim()
    ) {
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
        `+91${digitsOnly}`
      );
      setAddUserSuccess(
        "Sales representative added! Login credentials sent via email."
      );
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
      globalSettings.welcomeMessageTemplate ||
        globalSettings.defaultTemplate ||
        ""
    );
    setModalFallbackService(
      globalSettings.welcomeMessageFallbackService ||
        globalSettings.primaryService ||
        ""
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
      if (data) {
        setGlobalSettings((prev) => ({
          ...prev,
          ...data,
          effectiveAIEnabled: Boolean(
            (data.globalAIEnabled !== undefined
              ? data.globalAIEnabled
              : prev.globalAIEnabled) && prev.repAIEnabled !== false
          ),
        }));
      }
    };

    const handleRepAISettingsUpdate = (data) => {
      if (data && (!data.userId || data.userId === currentUser?._id)) {
        setGlobalSettings((prev) => ({
          ...prev,
          repAIEnabled: data.aiAutoReplyEnabled,
          effectiveAIEnabled: Boolean(
            prev.globalAIEnabled && data.aiAutoReplyEnabled
          ),
        }));
      }
    };

    const handleWaStatusUpdate = (data) => {
      if (!data) return;

      if (isRepUser) {
        if (!data.sessionId || (currentUser?._id && data.sessionId.includes(String(currentUser._id)))) {
          setRepWaStatus((prev) => ({
            ...(prev || {}),
            status: data.status,
            connectedPhone: data.connectedPhone !== undefined ? data.connectedPhone : prev?.connectedPhone,
            connectedName: data.connectedName !== undefined ? data.connectedName : prev?.connectedName,
            qrCode: data.qrCode !== undefined ? data.qrCode : prev?.qrCode,
          }));
        }
      } else if (isManagerRole) {
        setTeamWaStatuses((prev) => {
          let matched = false;
          const updated = prev.map((rep) => {
            const isMatch =
              (data.userId && String(rep.userId) === String(data.userId)) ||
              (data.sessionId && rep.sessionId === data.sessionId) ||
              (data.sessionId && rep.userId && data.sessionId.includes(String(rep.userId)));

            if (isMatch) {
              matched = true;
              return {
                ...rep,
                status: data.status,
                connectedPhone: data.connectedPhone !== undefined ? data.connectedPhone : rep.connectedPhone,
                connectedName: data.connectedName !== undefined ? data.connectedName : rep.connectedName,
                errorMessage: data.status === "connected" ? "" : rep.errorMessage,
              };
            }
            return rep;
          });

          // If session was not yet in array, trigger fresh fetch to populate complete record
          if (!matched && data.sessionId) {
            fetchWaWidget();
          }

          return updated;
        });
      }
    };

    socket.on("global_settings_updated", handleSettingsUpdate);
    socket.on("rep_ai_settings_updated", handleRepAISettingsUpdate);
    socket.on("whatsapp_status", handleWaStatusUpdate);

    return () => {
      socket.off("global_settings_updated", handleSettingsUpdate);
      socket.off("rep_ai_settings_updated", handleRepAISettingsUpdate);
      socket.off("whatsapp_status", handleWaStatusUpdate);
    };
  }, [currentUser, isRepUser, isManagerRole]);

  const handleToggleGlobalAI = async () => {
    const newVal = !globalSettings.globalAIEnabled;
    setGlobalSettings((prev) => ({
      ...prev,
      globalAIEnabled: newVal,
      effectiveAIEnabled: Boolean(newVal && prev.repAIEnabled !== false),
    }));
    try {
      await axios.post(API_ENDPOINTS.WHATSAPP.SETTINGS, {
        globalAIEnabled: newVal,
      });
    } catch (err) {
      console.error("Failed to update global AI setting:", err);
      setGlobalSettings((prev) => ({
        ...prev,
        globalAIEnabled: !newVal,
        effectiveAIEnabled: Boolean(!newVal && prev.repAIEnabled !== false),
      }));
    }
  };

  const handleToggleRepAI = async () => {
    if (!globalSettings.globalAIEnabled) return; // Locked by manager

    const currentRepVal = globalSettings.repAIEnabled !== false;
    const newVal = !currentRepVal;
    setGlobalSettings((prev) => ({
      ...prev,
      repAIEnabled: newVal,
      effectiveAIEnabled: Boolean(prev.globalAIEnabled && newVal),
    }));
    try {
      await axios.post(API_ENDPOINTS.WHATSAPP.MY_AI_TOGGLE, {
        enabled: newVal,
      });
    } catch (err) {
      console.error("Failed to update rep AI setting:", err);
      setGlobalSettings((prev) => ({
        ...prev,
        repAIEnabled: currentRepVal,
        effectiveAIEnabled: Boolean(prev.globalAIEnabled && currentRepVal),
      }));
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

  // ── Derived High-Impact Metrics & Urgent Action Data ───────────────────
  const unassignedLeads = useMemo(() => {
    return leads.filter(
      (l) =>
        !l.assignedTo ||
        l.assignedTo.trim() === "" ||
        l.assignedTo.toLowerCase() === "unassigned"
    );
  }, [leads]);

  const activePipelineLeadsCount = useMemo(() => {
    return leads.filter((l) => l.status !== "Converted" && l.status !== "Lost")
      .length;
  }, [leads]);

  const overdueFollowupsCount = stats.overdueFollowupsCount || 0;
  const todaysFollowupsCount = stats.todaysFollowupsCount || 0;

  // WhatsApp connection check (suppressed if an API error occurred to prevent false alarm)
  const isWaDisconnected =
    !waWidgetError &&
    (isRepUser
      ? Boolean(repWaStatus && repWaStatus.status !== "connected")
      : Boolean(
          isManagerRole &&
            teamWaStatuses.length > 0 &&
            connectedTeamCount < teamWaStatuses.length
        ));

  const hasUrgentWork =
    overdueFollowupsCount > 0 ||
    (isManagerRole && unassignedLeads.length > 0) ||
    isWaDisconnected ||
    (!isOrgSetupComplete && isManagerRole);

  // Totals for Charts
  const totalServiceLeads = useMemo(() => {
    return (stats.leadsByServiceData || []).reduce(
      (acc, curr) => acc + (curr.value || 0),
      0
    );
  }, [stats.leadsByServiceData]);

  const totalSourceLeads = useMemo(() => {
    return (stats.leadSourceData || []).reduce(
      (acc, curr) => acc + (curr.value || 0),
      0
    );
  }, [stats.leadSourceData]);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* ── 1. Top Header Banner ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-brand-secondary/40">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl md:text-3xl font-extrabold text-brand-primary tracking-tight">
              Executive Dashboard
            </h1>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-pilot-blue/15 text-pilot-blue border border-pilot-blue/30 capitalize">
              {isRepUser ? "Representative View" : "Manager Overview"}
            </span>
          </div>
          <p className="text-xs md:text-sm text-brand-primary/70 mt-1">
            Real-time performance metrics and lead intelligence for{" "}
            <span className="font-semibold text-brand-primary">
              {organization?.name || "SalesBuster AI"}
            </span>
            .
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {isManagerRole && (
            <button
              type="button"
              onClick={() => setShowAddUserModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
              aria-label="Add a new sales representative to team"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Sales Rep</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-2 px-3.5 py-2 bg-brand-light hover:bg-brand-secondary/40 border border-brand-secondary text-brand-primary text-xs font-bold rounded-xl transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-pilot-blue focus-visible:outline-none"
            aria-label="Export leads dataset to CSV format"
          >
            <Download className="w-4 h-4 text-purple-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* ── 2. Primary Lead KPIs (Near Top for Immediate Scanability) ─────── */}
      <section aria-label="Key Performance Indicators">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* KPI 1: Total Leads */}
          <div className="bg-brand-light border border-brand-secondary rounded-2xl p-4 md:p-5 flex items-center justify-between shadow-xs transition-shadow hover:shadow-sm">
            <div>
              <span className="text-[11px] font-bold text-brand-primary/60 uppercase tracking-wider block">
                Total Leads
              </span>
              <div className="text-2xl md:text-3xl font-extrabold text-brand-primary mt-1 tracking-tight">
                {stats.totalLeads}
              </div>
              <p className="text-xs font-medium text-brand-primary/60 mt-1 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-purple-500" />
                Active tracked contacts
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-purple-500" />
            </div>
          </div>

          {/* KPI 2: Converted Leads & Conversion Rate */}
          <div className="bg-brand-light border border-brand-secondary rounded-2xl p-4 md:p-5 shadow-xs transition-shadow hover:shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-brand-primary/60 uppercase tracking-wider block">
                  Converted Leads
                </span>
                <div className="text-2xl md:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 tracking-tight">
                  {stats.convertedCount ?? stats.totalWonCount}
                </div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>

            <div className="mt-3">
              <div className="flex justify-between items-center text-xs font-bold mb-1">
                <span className="text-brand-primary/70">Win Rate</span>
                <span className="text-emerald-600 dark:text-emerald-400">
                  {stats.conversionRate}%
                </span>
              </div>
              <div className="w-full bg-brand-secondary/40 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(stats.conversionRate || 0, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* KPI 3: In-Pipeline Leads */}
          <div className="bg-brand-light border border-brand-secondary rounded-2xl p-4 md:p-5 flex items-center justify-between shadow-xs transition-shadow hover:shadow-sm">
            <div>
              <span className="text-[11px] font-bold text-brand-primary/60 uppercase tracking-wider block">
                In Pipeline
              </span>
              <div className="text-2xl md:text-3xl font-extrabold text-blue-600 dark:text-blue-400 mt-1 tracking-tight">
                {activePipelineLeadsCount}
              </div>
              <p className="text-xs font-medium text-brand-primary/60 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
                Active discussions
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5 text-blue-500" />
            </div>
          </div>

          {/* KPI 4: Follow-up Velocity */}
          <div className="bg-brand-light border border-brand-secondary rounded-2xl p-4 md:p-5 flex items-center justify-between shadow-xs transition-shadow hover:shadow-sm">
            <div>
              <span className="text-[11px] font-bold text-brand-primary/60 uppercase tracking-wider block">
                Today's Follow-ups
              </span>
              <div className="text-2xl md:text-3xl font-extrabold text-brand-primary mt-1 tracking-tight">
                {todaysFollowupsCount}
              </div>
              <div className="mt-1 flex items-center gap-2">
                {overdueFollowupsCount > 0 ? (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-500 border border-amber-500/30 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {overdueFollowupsCount} Overdue
                  </span>
                ) : (
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCheck className="w-3.5 h-3.5" />
                    On schedule
                  </span>
                )}
              </div>
            </div>
            <div
              className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${
                overdueFollowupsCount > 0
                  ? "bg-amber-500/10 border-amber-500/20 text-amber-500"
                  : "bg-teal-500/10 border-teal-500/20 text-teal-600"
              }`}
            >
              <Calendar className="w-5 h-5" />
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Action Required & Priority Work Center ────────────────────── */}
      <section aria-label="Action Required and Priority Work">
        {hasUrgentWork ? (
          <div className="bg-brand-light border border-amber-500/30 rounded-2xl p-4 md:p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-brand-secondary/40">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm md:text-base font-extrabold text-brand-primary">
                    Action Required & Priority Work
                  </h2>
                  <p className="text-xs text-brand-primary/60">
                    High-priority operational tasks requiring prompt attention
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-3.5">
              {/* Item C: WhatsApp Disconnected Warning */}
              {isWaDisconnected && (
                <div
                  className={`p-3.5 sm:p-4 rounded-xl bg-bg-main border border-red-500/40 flex flex-col justify-between shadow-2xs ${
                    isManagerRole && disconnectedReps.length > 1
                      ? "col-span-1 md:col-span-2"
                      : ""
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-500 shrink-0 mt-0.5">
                        <WifiOff className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-sm font-bold text-brand-primary">
                            {isRepUser
                              ? "WhatsApp Line Offline"
                              : `WhatsApp Offline (${disconnectedReps.length} Sales ${
                                  disconnectedReps.length === 1 ? "Rep" : "Reps"
                                })`}
                          </span>
                          <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400">
                            Action Needed
                          </span>
                        </div>
                        <p className="text-xs text-brand-primary/70 mt-1 leading-relaxed">
                          {isRepUser
                            ? "Your WhatsApp session is disconnected. Reconnect now so incoming messages and auto-replies remain active."
                            : "The following sales representatives have not connected their WhatsApp accounts. Incoming messages and automated replies cannot run through their lines."}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => navigate("/whatsapp")}
                      className="self-start sm:self-auto flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors cursor-pointer shrink-0 shadow-2xs"
                    >
                      <span>{isRepUser ? "Reconnect" : "Open WhatsApp Hub"}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Explicit list of disconnected sales persons for manager view */}
                  {isManagerRole && disconnectedReps.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-brand-secondary/40">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-red-500 mb-2 flex items-center gap-1.5">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Disconnected Sales Persons ({disconnectedReps.length}):</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {disconnectedReps.map((rep) => (
                          <div
                            key={rep.userId || rep.sessionId || rep.email}
                            className="p-2.5 rounded-lg bg-brand-light border border-red-500/20 flex items-center justify-between gap-2 shadow-2xs"
                          >
                            <div className="min-w-0 pr-1">
                              <div className="text-xs font-bold text-brand-primary truncate flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 animate-pulse" />
                                <span className="truncate">{rep.name || "Sales Rep"}</span>
                              </div>
                              <div className="text-[10px] text-brand-primary/60 truncate pl-3">
                                {rep.profilePhone || rep.email || "No contact info"}
                              </div>
                            </div>
                            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-red-500/15 text-red-500 shrink-0 capitalize">
                              {rep.status === "qr"
                                ? "QR Needed"
                                : rep.status || "Offline"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {/* Item D: Organization Setup Checklist (if incomplete) */}
              {!isOrgSetupComplete && isManagerRole && (
                <div className="p-3.5 rounded-xl bg-bg-main border border-amber-500/40 flex flex-col justify-between shadow-2xs col-span-1 md:col-span-2 lg:col-span-3">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
                        <ShieldAlert className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs md:text-sm font-bold text-brand-primary">
                          Complete Organization Onboarding
                        </h3>
                        <p className="text-xs text-brand-primary/70 mt-0.5">
                          {!hasSalesPerson && !isAiConfigured
                            ? "Configure AI setup and add at least 1 sales representative to unlock automatic routing."
                            : !isAiConfigured
                              ? "Define company services and qualification schema to activate AI handling."
                              : "Add at least 1 sales representative so incoming leads can be assigned."}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {!isAiConfigured && (
                        <button
                          type="button"
                          onClick={() => navigate("/organization")}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-pilot-blue hover:bg-pilot-blue-hover text-white transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-pilot-blue focus-visible:outline-none"
                        >
                          <span>Setup AI</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {!hasSalesPerson && (
                        <button
                          type="button"
                          onClick={() => setShowAddUserModal(true)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Add Rep</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-brand-light border border-emerald-500/30 rounded-2xl p-3.5 md:p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs md:text-sm font-bold text-brand-primary">
                  All Priority Work On Track
                </p>
                <p className="text-[11px] text-brand-primary/65">
                  No overdue follow-ups, leads are properly assigned, and
                  communication lines are healthy.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-brand-primary/70">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-bg-main border border-brand-secondary/40 text-[11px]">
                <CheckCheck className="w-3.5 h-3.5 text-emerald-500" />
                Follow-ups Up to Date
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-bg-main border border-brand-secondary/40 text-[11px]">
                <CheckCheck className="w-3.5 h-3.5 text-emerald-500" />
                All Leads Assigned
              </span>
            </div>
          </div>
        )}
      </section>

      {/* ── 4. Unified WhatsApp & AI Automations Hub ─────────────────────── */}
      <section aria-label="WhatsApp and AI Automations Hub">
        <div className="bg-brand-light border border-brand-secondary rounded-2xl p-4 md:p-5 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-brand-secondary/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-600 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-brand-primary flex items-center gap-2">
                  <span>Communications & AI Automations</span>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-600 border border-teal-500/20">
                    {isRepUser ? "Personal Controls" : "Master Controls"}
                  </span>
                </h2>
                <p className="text-xs text-brand-primary/70 mt-0.5">
                  {isRepUser
                    ? "Manage your WhatsApp line connectivity and AI auto-reply preferences."
                    : "Centralized live switches for organization-wide WhatsApp lines and automated responses."}
                </p>
              </div>
            </div>

            {/* Quick Action to WhatsApp Chat */}
            <button
              type="button"
              onClick={() => navigate("/whatsapp")}
              className="self-start lg:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-brand-primary bg-bg-main border border-brand-secondary hover:border-teal-500/40 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-pilot-blue focus-visible:outline-none"
              aria-label="Open WhatsApp live chat manager"
            >
              <Smartphone className="w-3.5 h-3.5 text-teal-600" />
              <span>Open WhatsApp Hub</span>
              <ArrowRight className="w-3.5 h-3.5 text-brand-primary/60" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-4">
            {/* Control 1: WhatsApp Line Status */}
            <div className="p-3.5 rounded-xl bg-bg-main border border-brand-secondary flex flex-col justify-between">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 ${
                      (isRepUser && repWaStatus?.status === "connected") ||
                      (!isRepUser && connectedTeamCount > 0)
                        ? "bg-green-500/10 border-green-500/30 text-green-500"
                        : "bg-purple-500/10 border-purple-500/30 text-purple-400"
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-brand-primary block truncate">
                      {isRepUser ? "My WhatsApp Line" : "Team WhatsApp Lines"}
                    </span>
                    <span className="text-[11px] text-brand-primary/60 block truncate">
                      {isRepUser
                        ? repWaStatus?.status === "connected"
                          ? `Connected · +${repWaStatus.connectedPhone || ""}`
                          : repWaStatus?.status === "qr"
                            ? "QR ready to scan"
                            : "Offline"
                        : `${connectedTeamCount} of ${teamWaStatuses.length} reps connected`}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate("/whatsapp")}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-brand-secondary/40 hover:bg-brand-secondary text-brand-primary transition-colors cursor-pointer shrink-0 focus-visible:ring-2 focus-visible:ring-pilot-blue focus-visible:outline-none"
                >
                  {isRepUser
                    ? repWaStatus?.status === "connected"
                      ? "Manage"
                      : "Connect"
                    : "View All"}
                </button>
              </div>

              {/* Status indicator line */}
              <div className="mt-3 pt-2.5 border-t border-brand-secondary/30 flex items-center justify-between text-[11px]">
                <span className="text-brand-primary/60">Connection health</span>
                <span className="flex items-center gap-1.5 font-bold">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      (isRepUser && repWaStatus?.status === "connected") ||
                      (!isRepUser && connectedTeamCount === teamWaStatuses.length && teamWaStatuses.length > 0)
                        ? "bg-green-500"
                        : "bg-amber-400 animate-pulse"
                    }`}
                  />
                  <span className="capitalize">
                    {isRepUser
                      ? repWaStatus?.status || "Not connected"
                      : `${connectedTeamCount}/${teamWaStatuses.length} Active`}
                  </span>
                </span>
              </div>
            </div>

            {/* Control 2: AI Auto-Reply Switch */}
            <div className="p-3.5 rounded-xl bg-bg-main border border-brand-secondary flex flex-col justify-between">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-600 shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-brand-primary truncate flex items-center gap-1.5">
                      <span>{isRepUser ? "My AI Auto-Reply" : "Org AI Auto-Reply"}</span>
                      {isRepUser && !globalSettings.globalAIEnabled && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-500 font-semibold">
                          Locked
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-brand-primary/60 block truncate">
                      {isRepUser
                        ? !globalSettings.globalAIEnabled
                          ? "Paused globally by manager"
                          : globalSettings.repAIEnabled !== false
                            ? "Active for assigned leads"
                            : "Paused for your leads"
                        : globalSettings.globalAIEnabled
                          ? "Master: Active for all reps"
                          : "Master: Paused for all reps"}
                    </span>
                  </div>
                </div>

                {isRepUser ? (
                  !globalSettings.globalAIEnabled ? (
                    <button
                      type="button"
                      disabled
                      role="switch"
                      aria-checked={false}
                      aria-label="AI Auto-Reply locked by manager"
                      className="relative inline-flex h-6 w-11 shrink-0 cursor-not-allowed rounded-full border-2 border-amber-500/30 bg-amber-500/20 opacity-70 transition-colors focus-visible:outline-none"
                      title="Disabled globally by Sales Manager"
                    >
                      <span className="pointer-events-none inline-flex h-5 w-5 transform items-center justify-center rounded-full bg-amber-500 text-[10px] text-white shadow ring-0 transition duration-200 ease-in-out translate-x-0">
                        <Lock className="w-2.5 h-2.5" />
                      </span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      role="switch"
                      aria-checked={globalSettings.repAIEnabled !== false}
                      aria-label="Toggle personal AI auto-reply"
                      onClick={handleToggleRepAI}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:ring-2 focus-visible:ring-pilot-blue focus-visible:outline-none ${
                        globalSettings.repAIEnabled !== false
                          ? "bg-emerald-500"
                          : "bg-brand-secondary/70"
                      }`}
                      title={
                        globalSettings.repAIEnabled !== false
                          ? "Pause AI auto-reply for your assigned leads"
                          : "Enable AI auto-reply for your assigned leads"
                      }
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          globalSettings.repAIEnabled !== false
                            ? "translate-x-5"
                            : "translate-x-0"
                        }`}
                      />
                    </button>
                  )
                ) : (
                  <button
                    type="button"
                    role="switch"
                    aria-checked={Boolean(globalSettings.globalAIEnabled)}
                    aria-label="Toggle organization-wide AI auto-reply"
                    onClick={handleToggleGlobalAI}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:ring-2 focus-visible:ring-pilot-blue focus-visible:outline-none ${
                      globalSettings.globalAIEnabled
                        ? "bg-emerald-500"
                        : "bg-brand-secondary/70"
                    }`}
                    title={
                      globalSettings.globalAIEnabled
                        ? "Pause AI Auto-Reply for all representatives"
                        : "Enable AI Auto-Reply organization-wide"
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
                )}
              </div>

              <div className="mt-3 pt-2.5 border-t border-brand-secondary/30 flex items-center justify-between text-[11px]">
                <span className="text-brand-primary/60">Auto-reply status</span>
                <span
                  className={`font-bold ${
                    (isRepUser ? globalSettings.repAIEnabled !== false && globalSettings.globalAIEnabled : globalSettings.globalAIEnabled)
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-amber-500"
                  }`}
                >
                  {(isRepUser ? globalSettings.repAIEnabled !== false && globalSettings.globalAIEnabled : globalSettings.globalAIEnabled)
                    ? "Active & Replying"
                    : "Paused"}
                </span>
              </div>
            </div>

            {/* Control 3: Automated Welcome Message */}
            <div className="p-3.5 rounded-xl bg-bg-main border border-brand-secondary flex flex-col justify-between">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-600 shrink-0">
                    <MessageCircle className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-brand-primary block truncate">
                      Auto Welcome Greeting
                    </span>
                    <span className="text-[11px] text-brand-primary/60 block truncate">
                      {globalSettings.welcomeMessageEnabled
                        ? "Sent on first contact"
                        : "Welcome greetings paused"}
                    </span>
                  </div>
                </div>

                {isRepUser ? (
                  <div
                    className="px-2.5 py-1 rounded-lg text-[10px] font-semibold text-brand-primary/60 bg-brand-secondary/30 shrink-0 border border-brand-secondary/50"
                    title="Managed organization-wide by Sales Manager"
                  >
                    {globalSettings.welcomeMessageEnabled ? "Active" : "Paused"}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleOpenWelcomeModal}
                      className="p-1.5 rounded-lg border border-brand-secondary hover:bg-brand-secondary/40 text-brand-primary/70 hover:text-teal-600 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-pilot-blue focus-visible:outline-none"
                      aria-label="Customize Welcome Message Template"
                      title="Customize Welcome Message Template"
                    >
                      <Settings className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={Boolean(globalSettings.welcomeMessageEnabled)}
                      aria-label="Toggle automated welcome greetings"
                      onClick={handleToggleWelcomeMessage}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:ring-2 focus-visible:ring-pilot-blue focus-visible:outline-none ${
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
                )}
              </div>

              <div className="mt-3 pt-2.5 border-t border-brand-secondary/30 flex items-center justify-between text-[11px]">
                <span className="text-brand-primary/60">Greeting template</span>
                <button
                  type="button"
                  onClick={handleOpenWelcomeModal}
                  className="font-bold text-teal-600 hover:text-teal-700 transition-colors cursor-pointer flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-pilot-blue focus-visible:outline-none rounded px-1"
                >
                  <span>{globalSettings.welcomeMessageEnabled ? "Configured" : "Disabled"}</span>
                  <Settings className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Sales Team WhatsApp Connection Overview for Managers */}
          {isManagerRole && (
            <div className="mt-4 pt-4 border-t border-brand-secondary/40">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-brand-primary">
                    Sales Team WhatsApp Status:
                  </span>
                  {waWidgetError ? (
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-red-500/15 text-red-500 border border-red-500/30 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Status Error
                    </span>
                  ) : waWidgetLoading && teamWaStatuses.length === 0 ? (
                    <span className="text-[10px] font-semibold text-brand-primary/60 animate-pulse">
                      Checking status...
                    </span>
                  ) : disconnectedReps.length > 0 ? (
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-red-500/15 text-red-500 border border-red-500/30 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {disconnectedReps.length} Disconnected
                    </span>
                  ) : teamWaStatuses.length > 0 ? (
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      All {teamWaStatuses.length} Connected
                    </span>
                  ) : (
                    <span className="text-[10px] text-brand-primary/60">
                      No sales representatives
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={fetchWaWidget}
                    disabled={waWidgetLoading}
                    className="p-1 px-2 rounded-lg text-brand-primary/60 hover:text-brand-primary hover:bg-brand-secondary/30 transition-colors cursor-pointer text-xs flex items-center gap-1 disabled:opacity-50"
                    title="Refresh WhatsApp statuses"
                  >
                    <RefreshCw className={`w-3 h-3 ${waWidgetLoading ? "animate-spin" : ""}`} />
                    <span className="text-[11px] font-semibold">Refresh</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/whatsapp")}
                    className="text-[11px] font-bold text-pilot-blue hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span>Manage All in Hub</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Status List / Cards / Error States */}
              {waWidgetError ? (
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-red-600 dark:text-red-400">
                        Unable to load WhatsApp team connectivity
                      </p>
                      <p className="text-[11px] text-brand-primary/70 mt-0.5">
                        {waWidgetError}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={fetchWaWidget}
                    disabled={waWidgetLoading}
                    className="self-start sm:self-auto px-3 py-1.5 rounded-lg text-xs font-bold bg-red-500 hover:bg-red-600 text-white transition-colors cursor-pointer shrink-0 shadow-2xs"
                  >
                    Retry Connection Check
                  </button>
                </div>
              ) : disconnectedReps.length > 0 ? (
                <div className="p-3 sm:p-4 rounded-xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/25">
                  <div className="text-[11px] font-bold text-amber-700 dark:text-amber-400 mb-2 flex items-center gap-1.5">
                    <WifiOff className="w-3.5 h-3.5 text-amber-500" />
                    <span>Sales Persons Not Connected to WhatsApp:</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {disconnectedReps.map((rep) => (
                      <div
                        key={rep.userId || rep.sessionId || rep.email}
                        className="p-3 rounded-xl bg-brand-light border border-brand-secondary/70 flex items-center justify-between gap-3 shadow-2xs hover:border-amber-500/40 transition-colors"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-brand-primary truncate flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-red-500 shrink-0 animate-pulse" />
                            <span className="truncate">{rep.name || "Sales Rep"}</span>
                          </div>
                          <div className="text-[11px] text-brand-primary/60 truncate pl-3.5 mt-0.5">
                            {rep.profilePhone || rep.email || "No phone registered"}
                          </div>
                          {rep.errorMessage && (
                            <div className="text-[10px] text-red-500/90 truncate pl-3.5 mt-0.5">
                              {rep.errorMessage}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md capitalize ${
                              rep.status === "qr"
                                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                                : rep.status === "connecting"
                                  ? "bg-blue-500/15 text-blue-500 border border-blue-500/30"
                                  : "bg-red-500/15 text-red-500 border border-red-500/30"
                            }`}
                          >
                            {rep.status === "qr" ? "QR Scan Needed" : rep.status || "Disconnected"}
                          </span>
                          <button
                            type="button"
                            onClick={() => navigate("/whatsapp")}
                            className="text-[10px] font-bold text-pilot-blue hover:underline cursor-pointer"
                          >
                            Connect &rarr;
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : teamWaStatuses.length > 0 ? (
                <div className="p-3 rounded-xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                      Great news! All {teamWaStatuses.length} sales representatives are connected and active on WhatsApp.
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {teamWaStatuses.slice(0, 5).map((rep) => (
                      <span
                        key={rep.userId || rep.email}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-brand-light border border-emerald-500/20 text-brand-primary"
                      >
                        ✓ {rep.name}
                      </span>
                    ))}
                    {teamWaStatuses.length > 5 && (
                      <span className="text-[10px] text-brand-primary/60 font-medium">
                        +{teamWaStatuses.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              ) : !waWidgetLoading ? (
                <div className="p-3 rounded-xl bg-brand-light border border-brand-secondary/60 text-xs text-brand-primary/60 flex items-center justify-between">
                  <span>No sales representatives are currently registered in this organization.</span>
                  <button
                    type="button"
                    onClick={() => setShowAddUserModal(true)}
                    className="text-[11px] font-bold text-pilot-blue hover:underline cursor-pointer"
                  >
                    + Add Sales Rep
                  </button>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </section>

      {/* ── 5. Channel Inquiries Pulse ──────────────────────────────────── */}
      <section aria-label="Latest Channel Inquiries">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-brand-light border border-brand-secondary rounded-xl p-3 flex items-center gap-3 shadow-2xs">
            <div className="w-8 h-8 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
              <MessageCircle className="w-4 h-4 text-green-500" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-brand-primary/60 uppercase block truncate">
                WhatsApp
              </span>
              <div className="text-xs font-semibold text-brand-primary flex items-center gap-1 truncate">
                <Clock className="w-3 h-3 text-brand-primary/40 shrink-0" />
                <span>{getLatestEnquiryTime(["WhatsApp"])}</span>
              </div>
            </div>
          </div>

          <div className="bg-brand-light border border-brand-secondary rounded-xl p-3 flex items-center gap-3 shadow-2xs">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
              <Phone className="w-4 h-4 text-blue-500" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-brand-primary/60 uppercase block truncate">
                Direct / Mobile
              </span>
              <div className="text-xs font-semibold text-brand-primary flex items-center gap-1 truncate">
                <Clock className="w-3 h-3 text-brand-primary/40 shrink-0" />
                <span>{getLatestEnquiryTime(["Call", "Manual Entry", "Mobile App"])}</span>
              </div>
            </div>
          </div>

          <div className="bg-brand-light border border-brand-secondary rounded-xl p-3 flex items-center gap-3 shadow-2xs">
            <div className="w-8 h-8 rounded-xl bg-pink-500/10 flex items-center justify-center shrink-0">
              <Instagram className="w-4 h-4 text-pink-500" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-brand-primary/60 uppercase block truncate">
                Meta / Instagram
              </span>
              <div className="text-xs font-semibold text-brand-primary flex items-center gap-1 truncate">
                <Clock className="w-3 h-3 text-brand-primary/40 shrink-0" />
                <span>{getLatestEnquiryTime(["Meta Ads"])}</span>
              </div>
            </div>
          </div>

          <div className="bg-brand-light border border-brand-secondary rounded-xl p-3 flex items-center gap-3 shadow-2xs">
            <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
              <Mail className="w-4 h-4 text-orange-500" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-brand-primary/60 uppercase block truncate">
                Email / Web Form
              </span>
              <div className="text-xs font-semibold text-brand-primary flex items-center gap-1 truncate">
                <Clock className="w-3 h-3 text-brand-primary/40 shrink-0" />
                <span>{getLatestEnquiryTime(["Email", "Website Form"])}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. Service Performance (Renamed & Enhanced) ─────────────────── */}
      <section aria-label="Service Performance">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h2 className="text-base font-bold text-brand-primary">
              Service Performance
            </h2>
            <p className="text-xs text-brand-primary/60">
              Lead volume and conversion performance across service offerings
            </p>
          </div>
          {isManagerRole && (
            <button
              type="button"
              onClick={() => navigate("/organization")}
              className="text-xs font-bold text-pilot-blue hover:underline flex items-center gap-1 cursor-pointer focus-visible:ring-2 focus-visible:ring-pilot-blue focus-visible:outline-none rounded px-1"
            >
              <span>Manage Services</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {stats.wonLeadsByServiceData && stats.wonLeadsByServiceData.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.wonLeadsByServiceData.map((s) => {
              const numLeads = s.pipeline || 0;
              const wonLeads = s.won || 0;
              const sColor = getServiceColor(s.name);
              const conversionPct =
                numLeads > 0 ? Math.round((wonLeads / numLeads) * 100) : 0;

              return (
                <div
                  key={s.name}
                  className="relative bg-brand-light border border-brand-secondary rounded-2xl overflow-hidden p-4 shadow-2xs hover:shadow-xs transition-shadow"
                  style={{
                    background: `linear-gradient(135deg, var(--bg-card) 60%, ${sColor}18 100%)`,
                  }}
                >
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1.5"
                    style={{ backgroundColor: sColor }}
                  />
                  <div className="pl-2">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-bold text-brand-primary truncate">
                        {s.name}
                      </h3>
                      <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                        {conversionPct}% Won
                      </span>
                    </div>

                    <div className="flex justify-between items-baseline mt-4">
                      <div>
                        <span className="block text-[11px] font-medium text-brand-primary/60">
                          Total Leads
                        </span>
                        <span className="block text-xl font-extrabold text-brand-primary leading-tight mt-0.5">
                          {numLeads}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="block text-[11px] font-medium text-brand-primary/60">
                          Converted
                        </span>
                        <span className="block text-xl font-extrabold text-emerald-600 dark:text-emerald-400 leading-tight mt-0.5">
                          {wonLeads}
                        </span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-3 w-full bg-brand-secondary/40 rounded-full h-1 overflow-hidden">
                      <div
                        className="h-1 rounded-full"
                        style={{
                          backgroundColor: sColor,
                          width: `${Math.min(conversionPct, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-brand-light border border-brand-secondary rounded-2xl p-8 text-center">
            <Layers className="w-8 h-8 text-brand-primary/40 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-brand-primary">
              No service performance data available
            </h3>
            <p className="text-xs text-brand-primary/60 max-w-md mx-auto mt-1">
              Add services in your Organization Profile or log your first lead to see service conversion analytics here.
            </p>
            <div className="mt-4 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => navigate("/organization")}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-pilot-blue text-white cursor-pointer"
              >
                Configure Services
              </button>
              <button
                type="button"
                onClick={() => navigate("/leads/new")}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold border border-brand-secondary hover:bg-brand-secondary/30 text-brand-primary cursor-pointer"
              >
                Add Lead
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ── 7. Manager Analytics Charts (Enhanced Readability) ───────────── */}
      {isManagerRole && (
        <section aria-label="Lead Distribution Analytics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Leads by Service */}
            <div className="bg-brand-light border border-brand-secondary rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-base font-bold text-brand-primary">
                    Leads by Service
                  </h3>
                  <p className="text-xs text-brand-primary/60">
                    Distribution across configured service categories
                  </p>
                </div>
                <span className="text-xs font-bold text-brand-primary/70 px-2 py-0.5 rounded-md bg-brand-secondary/40">
                  {totalServiceLeads} Total
                </span>
              </div>

              {stats.leadsByServiceData && stats.leadsByServiceData.length > 0 ? (
                <div className="flex flex-col sm:flex-row items-center gap-4 py-2">
                  <div className="w-full sm:w-1/2 h-56 shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.leadsByServiceData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={85}
                          paddingAngle={3}
                          dataKey="value"
                          nameKey="name"
                        >
                          {stats.leadsByServiceData.map((entry, index) => (
                            <Cell
                              key={`cell-service-${index}`}
                              fill={CHART_COLORS[index % CHART_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <RechartsTooltip
                          content={<CustomChartTooltip total={totalServiceLeads} />}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Clean side breakdown list */}
                  <div className="w-full sm:w-1/2 max-h-56 overflow-y-auto space-y-1.5 pr-1 text-xs">
                    {stats.leadsByServiceData.map((item, idx) => {
                      const sharePct =
                        totalServiceLeads > 0
                          ? ((item.value / totalServiceLeads) * 100).toFixed(0)
                          : 0;
                      return (
                        <div
                          key={item.name}
                          className="flex items-center justify-between p-1.5 rounded-lg hover:bg-brand-secondary/30 transition-colors"
                        >
                          <div className="flex items-center gap-2 min-w-0 pr-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{
                                backgroundColor:
                                  CHART_COLORS[idx % CHART_COLORS.length],
                              }}
                            />
                            <span className="text-brand-primary font-medium truncate">
                              {item.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="font-bold text-brand-primary">
                              {item.value}
                            </span>
                            <span className="text-[10px] text-brand-primary/60 font-semibold px-1 rounded bg-brand-secondary/40">
                              {sharePct}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="py-16 text-center text-xs text-brand-primary/60">
                  No service distribution data logged yet.
                </div>
              )}
            </div>

            {/* Chart 2: Leads by Source */}
            <div className="bg-brand-light border border-brand-secondary rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-base font-bold text-brand-primary">
                    Leads by Source
                  </h3>
                  <p className="text-xs text-brand-primary/60">
                    Acquisition channel performance breakdown
                  </p>
                </div>
                <span className="text-xs font-bold text-brand-primary/70 px-2 py-0.5 rounded-md bg-brand-secondary/40">
                  {totalSourceLeads} Total
                </span>
              </div>

              {stats.leadSourceData && stats.leadSourceData.length > 0 ? (
                <div className="flex flex-col sm:flex-row items-center gap-4 py-2">
                  <div className="w-full sm:w-1/2 h-56 shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.leadSourceData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={85}
                          paddingAngle={3}
                          dataKey="value"
                          nameKey="name"
                        >
                          {stats.leadSourceData.map((entry, index) => (
                            <Cell
                              key={`cell-source-${index}`}
                              fill={CHART_COLORS[(index + 2) % CHART_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <RechartsTooltip
                          content={<CustomChartTooltip total={totalSourceLeads} />}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Clean side breakdown list */}
                  <div className="w-full sm:w-1/2 max-h-56 overflow-y-auto space-y-1.5 pr-1 text-xs">
                    {stats.leadSourceData.map((item, idx) => {
                      const sharePct =
                        totalSourceLeads > 0
                          ? ((item.value / totalSourceLeads) * 100).toFixed(0)
                          : 0;
                      return (
                        <div
                          key={item.name}
                          className="flex items-center justify-between p-1.5 rounded-lg hover:bg-brand-secondary/30 transition-colors"
                        >
                          <div className="flex items-center gap-2 min-w-0 pr-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{
                                backgroundColor:
                                  CHART_COLORS[(idx + 2) % CHART_COLORS.length],
                              }}
                            />
                            <span className="text-brand-primary font-medium truncate">
                              {item.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="font-bold text-brand-primary">
                              {item.value}
                            </span>
                            <span className="text-[10px] text-brand-primary/60 font-semibold px-1 rounded bg-brand-secondary/40">
                              {sharePct}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="py-16 text-center text-xs text-brand-primary/60">
                  No lead source data logged yet.
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── 8. Leaderboard & Recent Activity Feed ───────────────────────── */}
      <section aria-label="Team Performance and Recent Activity">
        <div
          className={
            isManagerRole
              ? "grid grid-cols-1 lg:grid-cols-2 gap-6"
              : "grid grid-cols-1"
          }
        >
          {/* Sales Leaderboard (Manager Only) */}
          {isManagerRole && (
            <div className="bg-brand-light border border-brand-secondary rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-4 pb-3 border-b border-brand-secondary/40">
                  <div>
                    <h3 className="text-base font-bold text-brand-primary flex items-center gap-2">
                      <Star
                        className="w-4 h-4 text-yellow-500 fill-yellow-500"
                        aria-hidden="true"
                      />
                      <span>Sales Leaderboard</span>
                    </h3>
                    <p className="text-xs text-brand-primary/60 mt-0.5">
                      Conversion ranking across active representatives
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate("/performance")}
                    className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-pilot-blue focus-visible:outline-none rounded px-1"
                  >
                    <span>Full Report</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {stats.performersList && stats.performersList.length > 0 ? (
                  <ul className="divide-y divide-brand-secondary/30">
                    {stats.performersList.map((p, index) => (
                      <li
                        key={p.id || p.name}
                        className="flex items-center justify-between py-3 px-1 hover:bg-brand-secondary/20 rounded-xl transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-3">
                          <div className="relative shrink-0">
                            <div
                              className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${
                                index === 0
                                  ? "bg-purple-600 text-white"
                                  : "bg-brand-secondary/50 text-brand-primary"
                              }`}
                            >
                              {p.name
                                .split(" ")
                                .map((w) => w[0])
                                .join("")
                                .slice(0, 2)
                                .toUpperCase()}
                            </div>
                            <span
                              className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-extrabold text-white border-2 border-brand-light ${
                                index === 0
                                  ? "bg-yellow-500"
                                  : index === 1
                                    ? "bg-slate-400"
                                    : "bg-amber-700"
                              }`}
                            >
                              {index + 1}
                            </span>
                          </div>

                          <div className="min-w-0">
                            <span className="font-bold text-brand-primary text-xs truncate block">
                              {p.name}
                            </span>
                            <span className="text-[11px] text-brand-primary/65 block truncate">
                              {p.assigned} assigned · {p.won} converted
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block">
                            {p.conversionRate}%
                          </span>
                          <span className="text-[10px] text-brand-primary/50 block">
                            Win Rate
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="py-12 text-center">
                    <Users className="w-8 h-8 text-brand-primary/30 mx-auto mb-2" />
                    <p className="text-xs font-bold text-brand-primary">
                      No sales representatives found
                    </p>
                    <p className="text-[11px] text-brand-primary/60 mt-0.5">
                      Add team members to track conversion performance.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowAddUserModal(true)}
                      className="mt-3 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                    >
                      Add Sales Rep
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Recent Activity Feed (Renamed from Recent Action timeline) */}
          <div className="bg-brand-light border border-brand-secondary rounded-2xl p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-brand-secondary/40">
                <div>
                  <h3 className="text-base font-bold text-brand-primary">
                    Recent Activity
                  </h3>
                  <p className="text-xs text-brand-primary/60 mt-0.5">
                    Latest logged follow-ups, calls, and status updates
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/followups")}
                  className="text-xs font-bold text-pilot-blue hover:underline flex items-center gap-1 cursor-pointer focus-visible:ring-2 focus-visible:ring-pilot-blue focus-visible:outline-none rounded px-1"
                >
                  <span>All Activity</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {stats.recentActivities && stats.recentActivities.length > 0 ? (
                <ul className="divide-y divide-brand-secondary/30">
                  {stats.recentActivities.slice(0, 5).map((act) => (
                    <li
                      key={act.id || act._id}
                      className="flex items-start gap-3 py-3 px-1 hover:bg-brand-secondary/20 rounded-xl transition-colors"
                    >
                      <div className="shrink-0 mt-0.5">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center ${
                            act.type?.includes("Stage")
                              ? "bg-orange-500/10 text-orange-500"
                              : act.type?.includes("Created")
                                ? "bg-purple-500/10 text-purple-500"
                                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          {act.type?.includes("Stage") ? (
                            <TrendingUp className="w-3.5 h-3.5" />
                          ) : act.type?.includes("Created") ? (
                            <Users className="w-3.5 h-3.5" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start flex-wrap gap-1">
                          <span className="font-bold text-brand-primary text-xs truncate pr-2">
                            {act.leadName || "Lead"}{" "}
                            {act.author ? `(${act.author})` : ""}
                          </span>
                          <span className="text-[10px] text-brand-primary/60 whitespace-nowrap">
                            {formatDate(act.date)}
                          </span>
                        </div>
                        <p className="text-xs text-brand-primary/75 mt-0.5 line-clamp-2">
                          {act.notes || act.content || "Follow-up activity recorded"}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="py-12 text-center">
                  <ListTodo className="w-8 h-8 text-brand-primary/30 mx-auto mb-2" />
                  <p className="text-xs font-bold text-brand-primary">
                    No recent activity logged
                  </p>
                  <p className="text-[11px] text-brand-primary/60 mt-0.5">
                    Completed follow-ups and lead modifications will appear here.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate("/leads")}
                    className="mt-3 px-3 py-1.5 rounded-lg text-xs font-bold border border-brand-secondary hover:bg-brand-secondary/30 text-brand-primary cursor-pointer"
                  >
                    View Leads
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── 9. Quick Add Sales Representative Modal ───────────────────────── */}
      {showAddUserModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-rep-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn"
        >
          <div className="bg-bg-card border border-border-main rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <div className="flex justify-between items-center pb-4 border-b border-border-main">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3
                    id="add-rep-modal-title"
                    className="text-base font-bold text-text-primary"
                  >
                    Add Sales Representative
                  </h3>
                  <p className="text-xs text-text-secondary">
                    Create a sales team member to assign incoming leads
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddUserModal(false);
                  setAddUserError("");
                  setAddUserSuccess("");
                }}
                className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-pilot-blue focus-visible:outline-none"
                aria-label="Close add sales representative modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {addUserError && (
              <div
                role="alert"
                className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs font-semibold text-red-500 flex items-center gap-2"
              >
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{addUserError}</span>
              </div>
            )}

            {addUserSuccess && (
              <div
                role="alert"
                className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-semibold text-emerald-500 flex items-center gap-2"
              >
                <CheckCheck className="w-4 h-4 shrink-0" />
                <span>{addUserSuccess}</span>
              </div>
            )}

            <form onSubmit={handleQuickAddUser} className="mt-4 space-y-3.5">
              <div>
                <label
                  htmlFor="new-rep-name"
                  className="text-xs font-bold text-text-primary block mb-1"
                >
                  Full Name
                </label>
                <input
                  id="new-rep-name"
                  type="text"
                  placeholder="e.g. Ramesh Kumar"
                  value={newUser.name}
                  onChange={(e) =>
                    setNewUser({ ...newUser, name: e.target.value })
                  }
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-bg-secondary border border-border-main text-xs text-text-primary focus:outline-none focus:border-pilot-blue focus-visible:ring-2 focus-visible:ring-pilot-blue"
                />
              </div>

              <div>
                <label
                  htmlFor="new-rep-email"
                  className="text-xs font-bold text-text-primary block mb-1"
                >
                  Email Address
                </label>
                <input
                  id="new-rep-email"
                  type="email"
                  placeholder="ramesh@company.com"
                  value={newUser.email}
                  onChange={(e) =>
                    setNewUser({ ...newUser, email: e.target.value })
                  }
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-bg-secondary border border-border-main text-xs text-text-primary focus:outline-none focus:border-pilot-blue focus-visible:ring-2 focus-visible:ring-pilot-blue"
                />
              </div>

              <div>
                <label
                  htmlFor="new-rep-mobile"
                  className="text-xs font-bold text-text-primary block mb-1"
                >
                  Mobile Number
                </label>
                <div className="flex rounded-xl bg-bg-secondary border border-border-main focus-within:border-pilot-blue">
                  <span className="px-3.5 py-2.5 text-xs font-semibold text-text-secondary border-r border-border-main">
                    +91
                  </span>
                  <input
                    id="new-rep-mobile"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="98765 43210"
                    value={newUser.mobile}
                    onChange={(e) =>
                      setNewUser({
                        ...newUser,
                        mobile: e.target.value.replace(/\D/g, "").slice(0, 10),
                      })
                    }
                    required
                    className="w-full min-w-0 px-3.5 py-2.5 rounded-r-xl bg-transparent text-xs text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-pilot-blue"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-600 dark:text-blue-400 flex items-start gap-2">
                <span className="text-sm shrink-0 mt-0.5">🔐</span>
                <span className="leading-relaxed">
                  A secure login password will be automatically generated and
                  sent to this email address.
                </span>
              </div>

              <div className="pt-3 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 rounded-xl border border-border-main text-xs font-bold text-text-secondary hover:bg-bg-secondary transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-pilot-blue focus-visible:outline-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addUserLoading}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all disabled:opacity-60 cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
                >
                  {addUserLoading
                    ? "Creating & Sending..."
                    : "Add & Send Credentials"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 10. Customize Welcome Message Modal ────────────────────────────── */}
      {welcomeModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="welcome-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="bg-bg-main border border-brand-secondary rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-brand-secondary flex items-center justify-between shrink-0 bg-bg-main">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-600">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3
                    id="welcome-modal-title"
                    className="text-base font-bold text-brand-primary"
                  >
                    Automated Welcome Message
                  </h3>
                  <p className="text-xs text-brand-primary/60">
                    Customize the instant WhatsApp greeting sent to brand new
                    enquiry leads
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setWelcomeModalOpen(false)}
                className="p-2 rounded-xl text-brand-primary/60 hover:text-brand-primary hover:bg-brand-secondary/40 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-pilot-blue focus-visible:outline-none"
                aria-label="Close welcome message modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form
              onSubmit={handleSaveWelcomeModal}
              className="flex-1 overflow-y-auto p-5 space-y-5"
            >
              {saveSuccessNotice && (
                <div
                  role="alert"
                  className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-semibold text-emerald-500 flex items-center gap-2"
                >
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
                    When enabled, leads from Website, Meta Ads, Calls, and
                    Mobile App automatically receive this greeting.
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={modalEnabled}
                  aria-label="Toggle automated greeting state"
                  onClick={() => setModalEnabled(!modalEnabled)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:ring-2 focus-visible:ring-pilot-blue focus-visible:outline-none ${
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
                          className="px-2 py-1 text-[11px] font-semibold bg-brand-secondary/40 hover:bg-teal-500/20 text-brand-primary hover:text-teal-600 rounded-lg border border-brand-secondary transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-pilot-blue focus-visible:outline-none"
                          title={`Click to insert ${item.label}`}
                          aria-label={`Insert placeholder ${item.label}`}
                        >
                          + {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Template Textarea */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label
                        htmlFor="welcome-template-input"
                        className="text-xs font-bold text-brand-primary"
                      >
                        Message Template
                      </label>
                      <button
                        type="button"
                        onClick={handleResetWelcomeDefault}
                        className="text-[11px] font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1 cursor-pointer focus-visible:ring-2 focus-visible:ring-pilot-blue focus-visible:outline-none rounded px-1"
                        title="Reset message to standard default"
                        aria-label="Reset message to standard default template"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Reset Default
                      </button>
                    </div>
                    <textarea
                      id="welcome-template-input"
                      rows={8}
                      value={modalTemplate}
                      onChange={(e) => setModalTemplate(e.target.value)}
                      placeholder="Type your WhatsApp greeting template..."
                      className="w-full p-3 rounded-xl bg-bg-secondary border border-border-main text-xs text-brand-primary focus:outline-none focus:border-teal-500 resize-none font-mono leading-relaxed focus-visible:ring-2 focus-visible:ring-pilot-blue"
                    />
                    <div className="mt-1 flex items-center justify-between text-[10px] text-brand-primary/50">
                      <span>
                        WhatsApp formatting: *bold*, _italic_, ~strikethrough~
                      </span>
                      <span>{modalTemplate.length} characters</span>
                    </div>
                  </div>

                  {/* Fallback Service */}
                  <div>
                    <label
                      htmlFor="fallback-service-input"
                      className="text-xs font-bold text-brand-primary block mb-1"
                    >
                      Fallback Service Name
                    </label>
                    <input
                      id="fallback-service-input"
                      type="text"
                      value={modalFallbackService}
                      onChange={(e) => setModalFallbackService(e.target.value)}
                      placeholder="e.g. Consultation & Services"
                      className="w-full px-3 py-2 rounded-xl bg-bg-secondary border border-border-main text-xs text-brand-primary focus:outline-none focus:border-teal-500 focus-visible:ring-2 focus-visible:ring-pilot-blue"
                    />
                    <span className="text-[10px] text-brand-primary/50 block mt-1">
                      Used when an incoming lead does not specify a product or
                      service.
                    </span>
                  </div>
                </div>

                {/* Right: Real-time WhatsApp Chat Preview */}
                <div>
                  <span className="text-xs font-bold text-brand-primary block mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                    Live Customer WhatsApp Preview
                  </span>

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
                        <div className="text-[9px] text-white/60">
                          Official WhatsApp
                        </div>
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
                  className="px-4 py-2 rounded-xl border border-brand-secondary text-xs font-bold text-brand-primary/70 hover:bg-brand-secondary/30 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-pilot-blue focus-visible:outline-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingWelcome}
                  className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:outline-none"
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
