import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import {
  Send,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  AlertCircle,
  FileText,
  Users,
  Calendar,
  Sparkles,
  Zap,
  Clock,
  Layers,
  Phone,
  Radio,
  Repeat,
  ShieldCheck,
  CheckSquare,
  Square,
  Info,
  CalendarCheck,
} from "lucide-react";
import { API_ENDPOINTS } from "../utils/constants.js";
import { useLeads } from "../context/LeadsContext.jsx";
import CloudSettingsModal from "../components/whatsapp/CloudSettingsModal.jsx";

const STEPS = [
  { id: 1, title: "Campaign Info", icon: Layers },
  { id: 2, title: "Target Audience", icon: Users },
  { id: 3, title: "Select Template", icon: FileText },
  { id: 4, title: "Variable Mapping", icon: Sparkles },
  { id: 5, title: "Review & Launch", icon: Send },
];

export default function CreateCampaign() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedTemplateId = searchParams.get("templateId");
  const { activeServices } = useLeads();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cloudStatus, setCloudStatus] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Step 1: Campaign details
  const [campaignName, setCampaignName] = useState("");

  // Campaign Dispatch Mode: "one_time" | "automated"
  const [campaignType, setCampaignType] = useState("one_time");

  // Automated Schedule & node-cron settings
  const [schedule, setSchedule] = useState({
    startDate: new Date().toISOString().split("T")[0],
    timeOfDay: "10:00",
    frequency: "weekly", // "once", "daily", "weekly", "monthly", "custom"
    daysOfWeek: [1], // Default: Monday (1)
    dayOfMonth: 1,
    intervalDays: 7,
    endCondition: "indefinite", // "indefinite", "until_date", "max_runs"
    endDate: "",
    maxRuns: 10,
  });

  // Audience Delivery Rule on Automated Runs
  const [audiencePolicy, setAudiencePolicy] = useState({
    mode: "cooldown", // "new_leads_only", "cooldown", "all_matching"
    cooldownDays: 14,
  });

  // Step 2: Audience criteria
  const [audienceCriteria, setAudienceCriteria] = useState({
    filterType: "filtered",
    leadType: "all",
    leadStatus: [],
    services: [],
    cities: [],
    tags: [],
    dateRange: { start: "", end: "" },
    requireConsent: true,
  });
  const [audienceEstimate, setAudienceEstimate] = useState(null);
  const [estimating, setEstimating] = useState(false);

  // Step 3: Templates
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  // Step 4: Variable mappings & Header media
  const [variableMappings, setVariableMappings] = useState([]);
  const [headerMediaUrl, setHeaderMediaUrl] = useState("");
  const [headerMediaName, setHeaderMediaName] = useState("");

  // Step 5: Rate & Launch (fixed at default 5 msg/sec)
  const messagesPerSecond = 5;

  useEffect(() => {
    checkCloudStatus();
    fetchTemplates();
  }, []);

  const checkCloudStatus = async () => {
    try {
      const res = await axios.get(API_ENDPOINTS.WHATSAPP_CLOUD.STATUS);
      if (res.data.success) {
        setCloudStatus(res.data.data);
        if (!res.data.data?.isConfigured) {
          setSettingsOpen(true);
        }
      }
    } catch (err) {
      console.error("Error checking Cloud API status:", err);
    }
  };

  useEffect(() => {
    if (templates.length > 0 && preselectedTemplateId) {
      const found = templates.find(
        (t) =>
          t.id === preselectedTemplateId ||
          t._id === preselectedTemplateId ||
          t.metaTemplateId === preselectedTemplateId
      );
      if (found) {
        handleSelectTemplate(found);
      }
    }
  }, [templates, preselectedTemplateId]);

  // Re-estimate audience when criteria change
  useEffect(() => {
    if (currentStep === 2) {
      estimateAudienceCount();
    }
  }, [audienceCriteria, currentStep]);

  const fetchTemplates = async () => {
    try {
      const res = await axios.get(API_ENDPOINTS.WHATSAPP_CLOUD.TEMPLATES);
      if (res.data.success) {
        const approved = (res.data.data || []).filter(
          (t) => t.status === "APPROVED"
        );
        setTemplates(approved);
      }
    } catch (err) {
      console.error("Error loading templates:", err);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const estimateAudienceCount = async () => {
    setEstimating(true);
    try {
      const res = await axios.post(
        API_ENDPOINTS.WHATSAPP_CLOUD.AUDIENCE_ESTIMATE,
        { audienceCriteria }
      );
      if (res.data.success) {
        setAudienceEstimate(res.data.data);
      }
    } catch (err) {
      console.error("Error estimating audience:", err);
    } finally {
      setEstimating(false);
    }
  };

  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template);

    // Initialize mapping array based on template variables
    const initialMappings = (template.variableNames || []).map((paramIndex) => {
      let defaultField = "name";
      if (paramIndex === "2") defaultField = "service";
      if (paramIndex === "3") defaultField = "city";
      return {
        paramIndex,
        sourceType: "lead_field",
        fieldKey: defaultField,
        staticValue: "",
        fallback: paramIndex === "1" ? "Valued Customer" : "",
      };
    });

    setVariableMappings(initialMappings);
  };

  const handleUpdateMapping = (index, updates) => {
    setVariableMappings((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...updates };
      return copy;
    });
  };

  // Compute live rendered preview text for the WhatsApp previewer
  const getRenderedPreviewText = () => {
    if (!selectedTemplate) return "";
    const bodyComp = selectedTemplate.components?.find(
      (c) => c.type === "BODY"
    );
    if (!bodyComp || !bodyComp.text) return "";

    let rendered = bodyComp.text;
    const sampleValues = {
      name: "John Doe",
      service: "Elevator Modernization",
      city: "Hyderabad",
      phone: "+91 98765 43210",
      companyName: "SalesBuster AI",
      assignedTo: "Rahul Sharma",
    };

    variableMappings.forEach((m) => {
      let val = "";
      if (m.sourceType === "static_value") {
        val = m.staticValue || m.fallback || `{{${m.paramIndex}}}`;
      } else {
        val = sampleValues[m.fieldKey] || m.fallback || `{{${m.paramIndex}}}`;
      }
      rendered = rendered.replace(
        new RegExp(`\\{\\{${m.paramIndex}\\}\\}`, "g"),
        `*${val}*`
      );
    });

    return rendered;
  };

  const handleCreateAndLaunch = async (autoStart = false) => {
    setError("");

    if (!campaignName.trim()) {
      setError("Please provide a campaign name.");
      setCurrentStep(1);
      return;
    }

    if (!selectedTemplate) {
      setError("Please select an approved WhatsApp template.");
      setCurrentStep(3);
      return;
    }

    const resolvedTemplateId =
      selectedTemplate.id ||
      selectedTemplate._id ||
      selectedTemplate.metaTemplateId;

    if (!resolvedTemplateId) {
      setError("Selected template ID could not be determined. Please re-select the template.");
      setCurrentStep(3);
      return;
    }

    if (audienceEstimate && audienceEstimate.eligibleCount === 0) {
      setError("Target audience has 0 eligible recipients.");
      setCurrentStep(2);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: campaignName.trim(),
        campaignType,
        schedule: campaignType === "automated" ? schedule : undefined,
        audiencePolicy: campaignType === "automated" ? audiencePolicy : undefined,
        templateId: resolvedTemplateId,
        template: selectedTemplate,
        variableMappings,
        audienceCriteria,
        headerMedia: headerMediaUrl
          ? {
              type: "IMAGE",
              url: headerMediaUrl.trim(),
              fileName: headerMediaName.trim() || undefined,
            }
          : undefined,
        messagesPerSecond: Number(messagesPerSecond) || 5,
        autoStart: campaignType === "automated" ? false : !!autoStart,
      };

      const res = await axios.post(
        API_ENDPOINTS.WHATSAPP_CLOUD.CAMPAIGNS,
        payload
      );

      if (res.data.success) {
        const newCampaign = res.data.campaign;
        navigate(
          `/whatsapp/campaigns/${newCampaign?.id || newCampaign?._id || ""}`
        );
      }
    } catch (err) {
      console.error("Create campaign error:", err);
      setError(
        err.response?.data?.message ||
          "Failed to create campaign. Check template parameters."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto w-full">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate("/whatsapp/campaigns")}
          className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Campaigns</span>
        </button>

        <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
          Step {currentStep} of {STEPS.length}
        </span>
      </div>

      {/* Cloud API Not Configured Banner */}
      {cloudStatus && !cloudStatus.isConfigured && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-start gap-3">
            <Radio className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 animate-pulse" />
            <div>
              <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                WhatsApp Cloud API is not connected
              </h4>
              <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
                Connect your Meta Business Account credentials to ensure templates load and campaigns can be dispatched.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition-all shadow-xs shrink-0 self-start sm:self-auto"
          >
            Setup Cloud API
          </button>
        </div>
      )}

      {/* Stepper Wizard Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between relative">
          {STEPS.map((step) => {
            const Icon = step.icon;
            const isDone = currentStep > step.id;
            const isCurrent = currentStep === step.id;

            return (
              <div
                key={step.id}
                onClick={() => {
                  if (step.id < currentStep) setCurrentStep(step.id);
                }}
                className={`flex flex-col items-center gap-1.5 z-10 cursor-pointer transition-all ${
                  isCurrent
                    ? "text-purple-600 dark:text-purple-400 font-bold"
                    : isDone
                    ? "text-slate-700 dark:text-slate-300 font-medium"
                    : "text-slate-400"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold transition-all shadow-xs ${
                    isCurrent
                      ? "bg-purple-600 text-white ring-4 ring-purple-500/20"
                      : isDone
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                  }`}
                >
                  {isDone ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
                <span className="text-[11px] hidden sm:block">{step.title}</span>
              </div>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div className="text-xs text-rose-700 dark:text-rose-300 font-medium leading-relaxed">
            {error}
          </div>
        </div>
      )}

      {/* Step Contents */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
        {/* ================= STEP 1: CAMPAIGN INFO ================= */}
        {currentStep === 1 && (
          <div className="space-y-6 max-w-xl">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                Campaign Information
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Give your WhatsApp campaign an identifiable title
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Campaign Name *
              </label>
              <input
                type="text"
                placeholder="e.g. March Elevator Modernization Special"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>
          </div>
        )}

        {/* ================= STEP 2: AUDIENCE BUILDER ================= */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                  Target Audience & Dispatch Strategy
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Select how and when to broadcast, and filter recipients by organization rules
                </p>
              </div>

              {/* Estimate Badge */}
              <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-800/80 flex items-center gap-3">
                <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    {estimating ? (
                      "Calculating..."
                    ) : (
                      <>
                        <span className="text-base text-purple-600 dark:text-purple-400">
                          {audienceEstimate?.eligibleCount || 0}
                        </span>{" "}
                        Recipients
                      </>
                    )}
                  </div>
                  {audienceEstimate?.optedOutCount > 0 && (
                    <div className="text-[10px] text-amber-600 dark:text-amber-400">
                      {audienceEstimate.optedOutCount} opted-out contacts excluded
                    </div>
                  )}
                  {audienceEstimate?.unconsentedCount > 0 && (
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">
                      {audienceEstimate.unconsentedCount} non-consenting leads excluded
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Dispatch Mode Switcher */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                onClick={() => setCampaignType("one_time")}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3.5 ${
                  campaignType === "one_time"
                    ? "border-purple-600 bg-purple-50/40 dark:bg-purple-950/20 shadow-xs"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    campaignType === "one_time"
                      ? "bg-purple-600 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                  }`}
                >
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      One-Time Broadcast
                    </h4>
                    {campaignType === "one_time" && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-purple-600 text-white">
                        Selected
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Launch immediately or save as draft for single-shot dispatch.
                  </p>
                </div>
              </div>

              <div
                onClick={() => setCampaignType("automated")}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3.5 ${
                  campaignType === "automated"
                    ? "border-purple-600 bg-purple-50/40 dark:bg-purple-950/20 shadow-xs"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    campaignType === "automated"
                      ? "bg-purple-600 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                  }`}
                >
                  <Repeat className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      Automated Campaign
                    </h4>
                    {campaignType === "automated" && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-purple-600 text-white">
                        node-cron
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Schedule recurring runs (e.g. Every Monday at 10 AM) with dynamic lead rules & cooldown.
                  </p>
                </div>
              </div>
            </div>

            {/* ================= AUTOMATION SETTINGS PANEL ================= */}
            {campaignType === "automated" && (
              <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent border border-purple-500/30 space-y-5 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-purple-900 dark:text-purple-200">
                      Automation & node-cron Schedule
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-600/15 text-purple-700 dark:text-purple-300">
                    Runs in Background
                  </span>
                </div>

                {/* Date & Time Picker */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      value={schedule.startDate}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) =>
                        setSchedule((prev) => ({ ...prev, startDate: e.target.value }))
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Execution Time of Day *
                    </label>
                    <input
                      type="time"
                      value={schedule.timeOfDay}
                      onChange={(e) =>
                        setSchedule((prev) => ({ ...prev, timeOfDay: e.target.value }))
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                {/* Frequency Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Execution Frequency
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: "weekly", label: "Weekly (e.g. Every Monday)" },
                      { id: "daily", label: "Daily" },
                      { id: "monthly", label: "Monthly" },
                      { id: "custom", label: "Custom Interval" },
                      { id: "once", label: "One-Time Scheduled" },
                    ].map((f) => {
                      const active = schedule.frequency === f.id;
                      return (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setSchedule((prev) => ({ ...prev, frequency: f.id }))}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                            active
                              ? "bg-purple-600 text-white shadow-xs"
                              : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-purple-500/40"
                          }`}
                        >
                          {f.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Days of Week (for Weekly) */}
                {schedule.frequency === "weekly" && (
                  <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                      Select Day(s) of Week to Run
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { day: 1, label: "Mon", full: "Monday" },
                        { day: 2, label: "Tue", full: "Tuesday" },
                        { day: 3, label: "Wed", full: "Wednesday" },
                        { day: 4, label: "Thu", full: "Thursday" },
                        { day: 5, label: "Fri", full: "Friday" },
                        { day: 6, label: "Sat", full: "Saturday" },
                        { day: 0, label: "Sun", full: "Sunday" },
                      ].map((item) => {
                        const selected = (schedule.daysOfWeek || [1]).includes(item.day);
                        return (
                          <button
                            key={item.day}
                            type="button"
                            onClick={() => {
                              setSchedule((prev) => {
                                const current = prev.daysOfWeek || [1];
                                const updated = selected
                                  ? current.filter((d) => d !== item.day)
                                  : [...current, item.day];
                                return {
                                  ...prev,
                                  daysOfWeek: updated.length > 0 ? updated : [item.day],
                                };
                              });
                            }}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                              selected
                                ? "bg-purple-600 text-white shadow-xs"
                                : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                            }`}
                          >
                            <span>{item.full}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Day of Month (for Monthly) */}
                {schedule.frequency === "monthly" && (
                  <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Day of the Month (1 to 28)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={28}
                      value={schedule.dayOfMonth || 1}
                      onChange={(e) =>
                        setSchedule((prev) => ({
                          ...prev,
                          dayOfMonth: Math.min(28, Math.max(1, parseInt(e.target.value) || 1)),
                        }))
                      }
                      className="w-24 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                    />
                  </div>
                )}

                {/* Custom interval (for Custom) */}
                {schedule.frequency === "custom" && (
                  <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Run every
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={90}
                      value={schedule.intervalDays || 7}
                      onChange={(e) =>
                        setSchedule((prev) => ({
                          ...prev,
                          intervalDays: Math.max(1, parseInt(e.target.value) || 1),
                        }))
                      }
                      className="w-20 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                    />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      days
                    </span>
                  </div>
                )}

                {/* ================= AUDIENCE DELIVERY RULES ("TO WHOM IT SHOULD SEND") ================= */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Audience Delivery Rules ("To Whom It Should Send")
                    </label>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 -mt-1">
                    Determine how target recipients are evaluated on each scheduled cycle:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Rule 1: New Leads Only */}
                    <div
                      onClick={() => setAudiencePolicy((prev) => ({ ...prev, mode: "new_leads_only" }))}
                      className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                        audiencePolicy.mode === "new_leads_only"
                          ? "border-purple-600 bg-white dark:bg-slate-800 shadow-xs"
                          : "border-slate-200 dark:border-slate-700/80 bg-white/60 dark:bg-slate-800/40 hover:border-slate-300"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            New Leads Only
                          </span>
                          {audiencePolicy.mode === "new_leads_only" && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                          Only sends to leads newly entering the selected status/service since previous run. No repeat sends.
                        </p>
                      </div>
                    </div>

                    {/* Rule 2: Cooldown Protection */}
                    <div
                      onClick={() => setAudiencePolicy((prev) => ({ ...prev, mode: "cooldown" }))}
                      className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                        audiencePolicy.mode === "cooldown"
                          ? "border-purple-600 bg-white dark:bg-slate-800 shadow-xs"
                          : "border-slate-200 dark:border-slate-700/80 bg-white/60 dark:bg-slate-800/40 hover:border-slate-300"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            Cooldown Protection
                          </span>
                          {audiencePolicy.mode === "cooldown" && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                          Sends to matching leads who have NOT received this campaign within the cooldown period.
                        </p>
                      </div>

                      {audiencePolicy.mode === "cooldown" && (
                        <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700">
                          {[7, 14, 30].map((days) => (
                            <button
                              key={days}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setAudiencePolicy((prev) => ({ ...prev, cooldownDays: days }));
                              }}
                              className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all ${
                                audiencePolicy.cooldownDays === days
                                  ? "bg-purple-600 text-white"
                                  : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                              }`}
                            >
                              {days}d
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Rule 3: All Matching Leads */}
                    <div
                      onClick={() => setAudiencePolicy((prev) => ({ ...prev, mode: "all_matching" }))}
                      className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                        audiencePolicy.mode === "all_matching"
                          ? "border-purple-600 bg-white dark:bg-slate-800 shadow-xs"
                          : "border-slate-200 dark:border-slate-700/80 bg-white/60 dark:bg-slate-800/40 hover:border-slate-300"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            All Matching Leads
                          </span>
                          {audiencePolicy.mode === "all_matching" && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                          Broadcasts to every lead currently matching criteria on every single scheduled cycle.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Live Automation Summary Banner */}
                <div className="p-3.5 rounded-xl bg-purple-600/10 border border-purple-600/20 text-xs text-purple-950 dark:text-purple-200 flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <span className="font-bold">Active Schedule Rule: </span>
                    {schedule.frequency === "weekly" ? (
                      <>
                        Repeats every{" "}
                        <span className="font-bold underline">
                          {(schedule.daysOfWeek || [1])
                            .map((d) => ["Sun", "Monday", "Tue", "Wed", "Thu", "Fri", "Sat"][d])
                            .join(", ")}
                        </span>{" "}
                        at <span className="font-bold">{schedule.timeOfDay}</span>.
                      </>
                    ) : schedule.frequency === "daily" ? (
                      <>
                        Repeats <span className="font-bold">Daily</span> at{" "}
                        <span className="font-bold">{schedule.timeOfDay}</span>.
                      </>
                    ) : schedule.frequency === "monthly" ? (
                      <>
                        Repeats <span className="font-bold">Monthly</span> on day{" "}
                        <span className="font-bold">{schedule.dayOfMonth || 1}</span> at{" "}
                        <span className="font-bold">{schedule.timeOfDay}</span>.
                      </>
                    ) : (
                      <>
                        Scheduled for{" "}
                        <span className="font-bold">{schedule.startDate || "Upcoming"}</span> at{" "}
                        <span className="font-bold">{schedule.timeOfDay}</span>.
                      </>
                    )}{" "}
                    Delivery Rule:{" "}
                    <span className="font-bold">
                      {audiencePolicy.mode === "new_leads_only"
                        ? "New Matching Leads Only"
                        : audiencePolicy.mode === "cooldown"
                        ? `Cooldown Protection (${audiencePolicy.cooldownDays} days)`
                        : "All Matching Leads"}
                    </span>
                    .
                  </div>
                </div>
              </div>
            )}

            {/* ================= ORGANIZATION-BASED TARGETING RULES ================= */}
            <div className="space-y-5 pt-2">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Organization Lead Targeting Rules
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Filter which leads qualify based on your organization's services, pipeline statuses, and database segments.
                </p>
              </div>

              {/* Lead Segment: All, Old Leads, New Leads */}
              <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Audience Database Segment
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: "all", label: "All Leads (Full Database)" },
                    { id: "old_leads_only", label: "Old Leads Only (Excel Imports)" },
                    { id: "new_leads_only", label: "New Leads Only" },
                  ].map((seg) => {
                    const active = (audienceCriteria.leadType || "all") === seg.id;
                    return (
                      <button
                        key={seg.id}
                        type="button"
                        onClick={() =>
                          setAudienceCriteria((prev) => ({
                            ...prev,
                            leadType: seg.id,
                          }))
                        }
                        className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                          active
                            ? "bg-purple-600 text-white shadow-xs font-bold"
                            : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-purple-500/40"
                        }`}
                      >
                        {seg.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Filter Controls: Lead Status & Organization Services */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Status filter with Select All / Clear All */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Lead Pipeline Status
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const allStatuses = [
                            "New",
                            "Follow Up",
                            "Converted",
                            "Not Interested",
                            "Price Issue",
                            "Not Attended",
                          ];
                          setAudienceCriteria((prev) => ({
                            ...prev,
                            leadStatus:
                              prev.leadStatus.length === allStatuses.length
                                ? []
                                : allStatuses,
                          }));
                        }}
                        className="text-[10px] font-bold text-purple-600 dark:text-purple-400 hover:underline"
                      >
                        {audienceCriteria.leadStatus.length === 6 ? "Clear All" : "Select All"}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {[
                      "New",
                      "Follow Up",
                      "Converted",
                      "Not Interested",
                      "Price Issue",
                      "Not Attended",
                    ].map((status) => {
                      const active = audienceCriteria.leadStatus.includes(status);
                      return (
                        <button
                          key={status}
                          type="button"
                          onClick={() => {
                            setAudienceCriteria((prev) => ({
                              ...prev,
                              leadStatus: active
                                ? prev.leadStatus.filter((s) => s !== status)
                                : [...prev.leadStatus, status],
                            }));
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                            active
                              ? "bg-purple-600 text-white shadow-xs font-bold"
                              : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                          }`}
                        >
                          {status}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-slate-400">
                    {audienceCriteria.leadStatus.length === 0
                      ? "Targeting all statuses (no status filter)."
                      : `Targeting ${audienceCriteria.leadStatus.length} selected status(es).`}
                  </p>
                </div>

                {/* Organization Services filter with Select All / Clear All */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Organization Services / Products
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const allSvcNames = (activeServices || ["General Enquiry"]).map(
                            (s) => (typeof s === "string" ? s : s.name || s.code || "General Enquiry")
                          );
                          setAudienceCriteria((prev) => ({
                            ...prev,
                            services:
                              prev.services.length === allSvcNames.length
                                ? []
                                : allSvcNames,
                          }));
                        }}
                        className="text-[10px] font-bold text-purple-600 dark:text-purple-400 hover:underline"
                      >
                        {audienceCriteria.services.length === (activeServices || ["General Enquiry"]).length
                          ? "Clear All"
                          : "Select All"}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto">
                    {(activeServices || ["General Enquiry"]).map((service, idx) => {
                      const serviceName =
                        typeof service === "string"
                          ? service
                          : service.name || service.code || "General Enquiry";
                      const serviceKey =
                        typeof service === "string"
                          ? service
                          : service.id || service._id || `svc_${idx}`;
                      const active = audienceCriteria.services.includes(serviceName);
                      return (
                        <button
                          key={serviceKey}
                          type="button"
                          onClick={() => {
                            setAudienceCriteria((prev) => ({
                              ...prev,
                              services: active
                                ? prev.services.filter((s) => s !== serviceName)
                                : [...prev.services, serviceName],
                            }));
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                            active
                              ? "bg-purple-600 text-white shadow-xs font-bold"
                              : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                          }`}
                        >
                          {serviceName}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-slate-400">
                    {audienceCriteria.services.length === 0
                      ? "Targeting all organization services (no service filter)."
                      : `Targeting ${audienceCriteria.services.length} selected service(s).`}
                  </p>
                </div>
              </div>

              {/* Explicit WhatsApp Consent Requirement */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={audienceCriteria.requireConsent !== false}
                    onChange={(e) =>
                      setAudienceCriteria((prev) => ({
                        ...prev,
                        requireConsent: e.target.checked,
                      }))
                    }
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300 dark:border-slate-600"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Require Explicit WhatsApp Consent (Meta Compliance)
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Only include leads with confirmed WhatsApp opt-in consent to ensure compliance with Meta messaging guidelines.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 3: SELECT TEMPLATE ================= */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                Select Approved WhatsApp Template
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Choose the pre-approved Meta template for this campaign
              </p>
            </div>

            {loadingTemplates ? (
              <div className="py-12 text-center text-slate-400 text-xs animate-pulse">
                Loading templates...
              </div>
            ) : templates.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700">
                <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                <p className="text-xs text-slate-700 dark:text-slate-300 font-bold mb-1">
                  No approved templates found
                </p>
                <p className="text-xs text-slate-500 mb-3">
                  Please visit the Templates section to sync your Meta templates.
                </p>
                <button
                  type="button"
                  onClick={() => navigate("/whatsapp/templates")}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 text-white"
                >
                  Go to Templates
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template, idx) => {
                  const tId = template._id || template.id || template.metaTemplateId || `tpl_${idx}`;
                  const selectedId = selectedTemplate?._id || selectedTemplate?.id || selectedTemplate?.metaTemplateId;
                  const isSelected = selectedId === tId;
                  const body = template.components?.find((c) => c.type === "BODY")?.text || "";

                  return (
                    <div
                      key={tId}
                      onClick={() => handleSelectTemplate(template)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? "border-purple-600 bg-purple-50/20 dark:bg-purple-950/20 ring-2 ring-purple-600"
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/30 dark:bg-slate-800/20"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400">
                            {typeof template.category === "object" ? template.category?.name : (template.category || "UTILITY")}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {template.variableCount || 0} variables
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2 truncate">
                          {template.name}
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                          {body}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                        <span className="text-[10px] text-slate-400">
                          {template.language}
                        </span>
                        {isSelected && (
                          <span className="text-purple-600 dark:text-purple-400 font-bold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Selected
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================= STEP 4: VARIABLE MAPPING & PREVIEW ================= */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                Map Template Variables
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Connect template dynamic tags ({"{{1}}"}, {"{{2}}"}) to CRM lead fields
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Mappings Form */}
              <div className="lg:col-span-7 space-y-4">
                {/* Header image attachment if applicable */}
                {selectedTemplate?.components?.some((c) => c.type === "HEADER") && (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Header Media URL (Optional Image/Banner)
                    </label>
                    <input
                      type="url"
                      placeholder="https://your-domain.com/banner.jpg"
                      value={headerMediaUrl}
                      onChange={(e) => setHeaderMediaUrl(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                )}

                {variableMappings.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/30 rounded-xl">
                    This template does not require any dynamic variables.
                  </div>
                ) : (
                  variableMappings.map((mapping, idx) => (
                    <div
                      key={mapping.paramIndex}
                      className="p-4 rounded-xl bg-slate-50/60 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded-md">
                          Tag {"{{" + mapping.paramIndex + "}}"}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateMapping(idx, {
                                sourceType: "lead_field",
                              })
                            }
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              mapping.sourceType === "lead_field"
                                ? "bg-purple-600 text-white"
                                : "text-slate-400"
                            }`}
                          >
                            CRM Field
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateMapping(idx, {
                                sourceType: "static_value",
                              })
                            }
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              mapping.sourceType === "static_value"
                                ? "bg-purple-600 text-white"
                                : "text-slate-400"
                            }`}
                          >
                            Custom Static
                          </button>
                        </div>
                      </div>

                      {mapping.sourceType === "lead_field" ? (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">
                              Lead Field
                            </label>
                            <select
                              value={mapping.fieldKey}
                              onChange={(e) =>
                                handleUpdateMapping(idx, {
                                  fieldKey: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 outline-none"
                            >
                              <option value="name">Lead Full Name</option>
                              <option value="service">Service / Product</option>
                              <option value="city">City / Location</option>
                              <option value="phone">Phone Number</option>
                              <option value="email">Email</option>
                              <option value="assignedTo">Assigned Sales Rep</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">
                              Fallback Value
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Customer"
                              value={mapping.fallback}
                              onChange={(e) =>
                                handleUpdateMapping(idx, {
                                  fallback: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 outline-none"
                            />
                          </div>
                        </div>
                      ) : (
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">
                            Static Text Value
                          </label>
                          <input
                            type="text"
                            placeholder="Enter text to insert for every recipient..."
                            value={mapping.staticValue}
                            onChange={(e) =>
                              handleUpdateMapping(idx, {
                                staticValue: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 outline-none"
                          />
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Right Column: Live WhatsApp Chat Bubble Previewer */}
              <div className="lg:col-span-5">
                <div className="sticky top-6 p-4 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                    <span>Live WhatsApp Simulation</span>
                  </div>

                  {/* Bubble */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md space-y-2">
                    {headerMediaUrl && (
                      <div className="w-full h-32 rounded-xl bg-slate-200 dark:bg-slate-700 overflow-hidden mb-2">
                        <img
                          src={headerMediaUrl}
                          alt="Banner Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => (e.target.style.display = "none")}
                        />
                      </div>
                    )}
                    <div className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line font-sans">
                      {getRenderedPreviewText() || "Select a template to preview."}
                    </div>
                    <div className="text-[10px] text-slate-400 text-right">
                      12:00 PM ✓✓
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-2 block text-center">
                    Simulated using sample lead: John Doe
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 5: REVIEW & LAUNCH ================= */}
        {currentStep === 5 && (
          <div className="space-y-6 max-w-xl">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                Review & {campaignType === "automated" ? "Schedule" : "Launch"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Review your campaign setup, audience delivery rules, and dispatch schedule
              </p>
            </div>

            {/* Dispatch Mode Banner */}
            {campaignType === "automated" ? (
              <div className="p-4 rounded-xl border border-purple-200 dark:border-purple-800/60 bg-purple-50/50 dark:bg-purple-950/20 flex items-start gap-3">
                <Repeat className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Automated Recurring Execution (node-cron)
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    This campaign will automatically trigger in the background according to your schedule. On each cycle, eligible recipients are dynamically evaluated according to your audience rules and cooldown policy.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-purple-200 dark:border-purple-800/60 bg-purple-50/50 dark:bg-purple-950/20 flex items-start gap-3">
                <Send className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Immediate Queue Dispatch
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Launching will immediately queue recipients and dispatch messages at the standard safe rate (5 msg/sec). You can pause or cancel anytime from the campaign dashboard.
                  </p>
                </div>
              </div>
            )}

            {/* Campaign Summary Card */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Campaign Name:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {campaignName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Campaign Mode:</span>
                <span className="font-bold text-purple-600 dark:text-purple-400">
                  {campaignType === "automated" ? "Automated Campaign" : "One-Time Broadcast"}
                </span>
              </div>
              {campaignType === "automated" && (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Schedule Frequency:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {schedule.frequency === "weekly"
                        ? `Weekly (${(schedule.daysOfWeek || [1])
                            .map((d) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d])
                            .join(", ")} at ${schedule.timeOfDay})`
                        : schedule.frequency === "daily"
                        ? `Daily at ${schedule.timeOfDay}`
                        : schedule.frequency === "monthly"
                        ? `Monthly (Day ${schedule.dayOfMonth || 1} at ${schedule.timeOfDay})`
                        : `${schedule.frequency} at ${schedule.timeOfDay}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Delivery Policy:</span>
                    <span className="font-bold text-purple-600 dark:text-purple-400">
                      {audiencePolicy.mode === "new_leads_only"
                        ? "New Leads Only"
                        : audiencePolicy.mode === "cooldown"
                        ? `Cooldown (${audiencePolicy.cooldownDays} Days)`
                        : "All Matching Leads"}
                    </span>
                  </div>
                </>
              )}
              <div className="flex justify-between">
                <span className="text-slate-400">Template:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {selectedTemplate?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Target Pipeline Statuses:</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {audienceCriteria.leadStatus.length > 0
                    ? audienceCriteria.leadStatus.join(", ")
                    : "All Statuses"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Target Services:</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {audienceCriteria.services.length > 0
                    ? audienceCriteria.services.join(", ")
                    : "All Organization Services"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Current Eligible Recipients:</span>
                <span className="font-bold text-purple-600 dark:text-purple-400">
                  {audienceEstimate?.eligibleCount || 0} Leads
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Consent Requirement:</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {audienceCriteria.requireConsent !== false ? "Enforced (Opt-in only)" : "All Selected"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Wizard Footer Nav Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800 mt-6">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(currentStep - 1)}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Previous
            </button>
          ) : (
            <div />
          )}

          {currentStep < 5 ? (
            <button
              type="button"
              onClick={() => {
                if (currentStep === 1 && !campaignName.trim()) {
                  setError("Please enter a campaign name.");
                  return;
                }
                if (currentStep === 3 && !selectedTemplate) {
                  setError("Please select a template.");
                  return;
                }
                setError("");
                setCurrentStep(currentStep + 1);
              }}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white transition-all shadow-sm flex items-center gap-1.5"
            >
              <span>Next Step</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleCreateAndLaunch(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors"
              >
                Save as Draft
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => handleCreateAndLaunch(true)}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
              >
                {campaignType === "automated" ? (
                  <>
                    <CalendarCheck className="w-3.5 h-3.5" />
                    <span>{loading ? "Scheduling..." : "Schedule Campaign"}</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>{loading ? "Launching..." : "Launch Now"}</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
      {/* Cloud Settings Modal */}
      <CloudSettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onUpdated={async () => {
          await checkCloudStatus();
          fetchTemplates();
        }}
      />
    </div>
  );
}
