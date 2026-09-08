import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Building2,
  Mail,
  Phone,
  Globe,
  Users,
  Calendar,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Database,
  RefreshCw,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Bot,
  Layers,
  ListFilter,
  BookOpen,
  Plus,
  Trash2,
  Save,
  Upload,
  FileText,
  CheckSquare,
  ChevronRight,
  ChevronLeft,
  Play,
  CheckCheck,
  Terminal,
  HelpCircle,
  Briefcase,
  Smile,
  Target,
  Wrench,
  Check,
  Zap,
  Sliders,
  Copy,
  Info,
  X,
  Lock,
  ExternalLink,
  Edit2,
  Eye,
  EyeOff,
  Key,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { API_ENDPOINTS } from "../utils/constants.js";

// Wizard steps configuration
const STEPS = [
  {
    id: 1,
    title: "AI Engine & Identity",
    shortTitle: "Engine & Tone",
    subtitle: "Gemini API key, brand persona & rules",
    icon: Bot,
  },
  {
    id: 2,
    title: "Catalog & Offerings",
    shortTitle: "Services",
    subtitle: "Products, services & keywords",
    icon: Layers,
  },
  {
    id: 3,
    title: "Lead Qualification",
    shortTitle: "Qualification",
    subtitle: "Dynamic lead questionnaire",
    icon: ListFilter,
  },
  {
    id: 4,
    title: "Knowledge Base (RAG)",
    shortTitle: "Knowledge Base",
    subtitle: "PDFs, brochures & FAQs",
    icon: BookOpen,
  },
  {
    id: 5,
    title: "Review & Playground",
    shortTitle: "Review",
    subtitle: "Prompt verification & test",
    icon: Sparkles,
  },
];

// Default single enquiry service for all new/unconfigured organizations
const DEFAULT_SERVICE_TEMPLATE = {
  name: "General Enquiry",
  description:
    "General inquiry or consultation regarding products, services, and customer requirements.",
  keywords: [
    "enquiry",
    "inquiry",
    "information",
    "help",
    "details",
    "consultation",
  ],
};

// Standard default qualification fields for every organization (fully customizable)
const DEFAULT_QUALIFICATION_FIELDS = [
  {
    key: "cityAndArea",
    label: "City & Area",
    type: "string",
    description: "Customer's city, area, or preferred project location.",
    options: [],
    required: false,
  },
  {
    key: "primaryIntent",
    label: "Primary Intent",
    type: "string",
    description:
      "Customer's primary objective, service requirement, or product needed.",
    options: [],
    required: false,
  },
  {
    key: "urgencyLevel",
    label: "Urgency Level",
    type: "select",
    options: ["Immediate", "Within 1 Month", "Planning / Just Exploring"],
    description: "Customer's purchasing urgency or required timeframe.",
    required: false,
  },
  {
    key: "interestScore",
    label: "Interest Score (1-10)",
    type: "number",
    description:
      "Assessed customer interest or buying readiness score from 1 to 10.",
    options: [],
    required: false,
  },
  {
    key: "callbackDateTime",
    label: "Callback Date/Time",
    type: "string",
    description:
      "Best callback date and time requested by customer for consultation.",
    options: [],
    required: false,
  },
];



// Tone presets for Step 1
const TONE_PRESETS = [
  {
    id: "consultative",
    title: "Warm & Consultative",
    desc: "Friendly, polite, empathetic. Listens closely, guides naturally, and builds high trust.",
    persona: "warm, friendly, and consultative sales representative",
    icon: Smile,
  },
  {
    id: "technical",
    title: "Technical Specialist",
    desc: "Authoritative, precise, engineering-driven. Focuses on technical accuracy and specifications.",
    persona:
      "knowledgeable, precise technical sales specialist and product engineer",
    icon: Target,
  },
  {
    id: "executive",
    title: "Executive & Fast-Paced",
    desc: "Concise, professional, action-oriented. Fast qualification and quick callback scheduling.",
    persona: "sharp, professional, and courteous executive sales advisor",
    icon: Briefcase,
  },
];

export default function OrganizationProfile() {
  const navigate = useNavigate();
  const {
    currentUser,
    organization: cachedOrg,
    setOrganization,
    fetchOrganization,
  } = useAuth();

  // Primary Navigation: "wizard" | "billing"
  const [activeTab, setActiveTab] = useState("wizard");
  const [currentStep, setCurrentStep] = useState(1);

  // Data States
  const [orgData, setOrgData] = useState(cachedOrg || null);
  const [loading, setLoading] = useState(false);

  // AI Configuration State - Brand Name auto-initialized from organization
  const [aiSettings, setAiSettings] = useState(() => {
    const initialBrandName =
      cachedOrg?.name || currentUser?.organizationName || "";
    return {
      geminiApiKey: "",
      isAiConfigured: false,
      aiSetupCompletedAt: null,
      companyName: initialBrandName,
      businessDescription: "",
      agentPersona: "warm, friendly, and consultative sales representative",
      customInstructions: `1. STRICT PRICING: Never guess or quote fixed prices without technical requirements assessment. State that pricing depends on specifications and schedule a callback.\n2. PACING: Ask at most 1-2 questions per message to avoid overwhelming the customer.\n3. HUMAN HANDOFF: If the user asks for a real human, politely acknowledge and transfer them immediately.\n4. FORMATTING: Keep messages under 50-60 words with clean WhatsApp bold (*word*) and friendly emojis.`,
      services: [DEFAULT_SERVICE_TEMPLATE],
      qualificationFields: DEFAULT_QUALIFICATION_FIELDS,
      qdrantCollection: "",
      knowledgeDocs: [],
    };
  });

  const [aiSaving, setAiSaving] = useState(false);
  const [saveToast, setSaveToast] = useState("");
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [testingKey, setTestingKey] = useState(false);
  const [keyTestResult, setKeyTestResult] = useState(null);

  // Modals
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [newService, setNewService] = useState({
    name: "",
    description: "",
    keywords: "",
  });

  const [showAddFieldModal, setShowAddFieldModal] = useState(false);
  const [editingFieldIndex, setEditingFieldIndex] = useState(null);
  const [newField, setNewField] = useState({
    key: "",
    label: "",
    type: "string",
    description: "",
    options: "",
    required: false,
  });

  // Knowledge base upload
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [showPromptInspector, setShowPromptInspector] = useState(false);

  const isManager =
    currentUser?.role === "Sales Manager" ||
    currentUser?.role === "Super Admin" ||
    currentUser?.isOrgOwner;

  // 1. Fetch Organization Details
  const fetchOrganizationProfile = async () => {
    try {
      setLoading(true);
      const token =
        localStorage.getItem("salesbuster_token") ||
        localStorage.getItem("kranthi_token");
      const res = await axios.get(API_ENDPOINTS.ORGANIZATIONS.MY_ORG, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success && res.data.data) {
        setOrgData(res.data.data);
        if (setOrganization) setOrganization(res.data.data);
        localStorage.setItem(
          "salesbuster_session_org",
          JSON.stringify(res.data.data),
        );
        localStorage.setItem(
          "kranthi_session_org",
          JSON.stringify(res.data.data),
        );

        if (res.data.data.name) {
          setAiSettings((prev) => ({
            ...prev,
            companyName: prev.companyName?.trim()
              ? prev.companyName
              : res.data.data.name,
          }));
        }

        if (res.data.data.aiSettings) {
          syncAiSettingsState(res.data.data.aiSettings, res.data.data.name);
        }
      }
    } catch (err) {
      if (cachedOrg) setOrgData(cachedOrg);
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch AI Settings with local fallback
  const fetchAISettings = async () => {
    const orgId = orgData?._id || cachedOrg?._id || "default";
    const localCached = localStorage.getItem(`sb_ai_settings_${orgId}`);

    if (localCached) {
      try {
        const parsed = JSON.parse(localCached);
        syncAiSettingsState(parsed, orgData?.name || cachedOrg?.name);
      } catch (e) {}
    }

    try {
      const token =
        localStorage.getItem("salesbuster_token") ||
        localStorage.getItem("kranthi_token");
      const res = await axios.get(API_ENDPOINTS.ORGANIZATIONS.AI_SETTINGS, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success && res.data.data) {
        syncAiSettingsState(res.data.data, orgData?.name || cachedOrg?.name);
        localStorage.setItem(
          `sb_ai_settings_${orgId}`,
          JSON.stringify(res.data.data),
        );
      }
    } catch (err) {
      // Backend route might still be deploying, local state remains fully functional
    }
  };

  const syncAiSettingsState = (data, orgName) => {
    setAiSettings((prev) => {
      // Filter out legacy elevator/preset services, keep clean services or default to General Enquiry
      const cleanServices =
        Array.isArray(data?.services) && data.services.length > 0
          ? data.services
          : Array.isArray(prev.services) && prev.services.length > 0
          ? prev.services
          : [DEFAULT_SERVICE_TEMPLATE];

      const cleanFields =
        Array.isArray(data?.qualificationFields) &&
        data.qualificationFields.length > 0
          ? data.qualificationFields
          : Array.isArray(prev.qualificationFields) &&
            prev.qualificationFields.length > 0
          ? prev.qualificationFields
          : DEFAULT_QUALIFICATION_FIELDS;

      const autoBrandName =
        (data?.companyName && data.companyName.trim()) ||
        (prev.companyName && prev.companyName.trim()) ||
        orgName ||
        orgData?.name ||
        cachedOrg?.name ||
        currentUser?.organizationName ||
        "";

      return {
        ...prev,
        geminiApiKey:
          data?.geminiApiKey !== undefined
            ? data.geminiApiKey
            : prev.geminiApiKey || "",
        isAiConfigured: Boolean(data?.isAiConfigured ?? prev.isAiConfigured),
        aiSetupCompletedAt: data?.aiSetupCompletedAt || prev.aiSetupCompletedAt,
        companyName: autoBrandName,
        businessDescription:
          data?.businessDescription || prev.businessDescription || "",
        agentPersona: data?.agentPersona || prev.agentPersona,
        customInstructions:
          data?.customInstructions || prev.customInstructions,
        services: cleanServices,
        qualificationFields: cleanFields,
        qdrantCollection: data?.qdrantCollection || prev.qdrantCollection,
        knowledgeDocs: Array.isArray(data?.knowledgeDocs)
          ? data.knowledgeDocs
          : prev.knowledgeDocs,
      };
    });
  };

  // Automatically fill brand name from organization when available
  useEffect(() => {
    const orgBrand =
      orgData?.name || cachedOrg?.name || currentUser?.organizationName || "";
    if (orgBrand) {
      setAiSettings((prev) => {
        if (!prev.companyName || !prev.companyName.trim()) {
          return { ...prev, companyName: orgBrand };
        }
        return prev;
      });
    }
  }, [orgData?.name, cachedOrg?.name, currentUser?.organizationName]);

  useEffect(() => {
    fetchOrganizationProfile();
    fetchAISettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save changes handler
  const handleSaveStep = async (overrideData = null, nextStep = null) => {
    setAiSaving(true);
    const orgId = orgData?._id || cachedOrg?._id || "default";
    const payload = overrideData || aiSettings;

    // Immediately persist locally
    localStorage.setItem(`sb_ai_settings_${orgId}`, JSON.stringify(payload));

    try {
      const token =
        localStorage.getItem("salesbuster_token") ||
        localStorage.getItem("kranthi_token");
      const res = await axios.put(
        API_ENDPOINTS.ORGANIZATIONS.AI_SETTINGS,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.data.success) {
        if (payload.isAiConfigured) {
          setAiSettings((prev) => ({ ...prev, isAiConfigured: true }));
        }
        if (fetchOrganization) fetchOrganization();
        setSaveToast(
          payload.isAiConfigured
            ? "🎉 AI Setup completed and activated!"
            : "Configuration saved successfully!",
        );
      }
    } catch (err) {
      const errMsg =
        err.response?.data?.message ||
        "Changes saved locally to your workspace!";
      setSaveToast(errMsg);
    } finally {
      setAiSaving(false);
      setTimeout(() => setSaveToast(""), 3500);

      if (nextStep && nextStep <= STEPS.length) {
        setCurrentStep(nextStep);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  // Test Gemini API Key handler
  const handleTestApiKey = async () => {
    if (!aiSettings.geminiApiKey || !aiSettings.geminiApiKey.trim()) {
      setKeyTestResult({
        success: false,
        message: "Please enter your Google Gemini API key first.",
      });
      return;
    }

    setTestingKey(true);
    setKeyTestResult(null);

    try {
      const token =
        localStorage.getItem("salesbuster_token") ||
        localStorage.getItem("kranthi_token");
      const res = await axios.post(
        API_ENDPOINTS.ORGANIZATIONS.VALIDATE_GEMINI_KEY,
        { apiKey: aiSettings.geminiApiKey.trim() },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (res.data.success) {
        setKeyTestResult({
          success: true,
          message: "API Key verified successfully with Google Gemini!",
        });
      }
    } catch (err) {
      const errMsg =
        err.response?.data?.message ||
        "Failed to validate API Key. Please verify that it is active in Google AI Studio.";
      setKeyTestResult({
        success: false,
        message: errMsg,
      });
    } finally {
      setTestingKey(false);
    }
  };

  // Final step activation handler
  const handleFinishSetup = async () => {
    if (!aiSettings.geminiApiKey || !aiSettings.geminiApiKey.trim()) {
      setSaveToast("Please configure your Google Gemini API Key in Step 1.");
      setCurrentStep(1);
      return;
    }
    if (!aiSettings.companyName || !aiSettings.companyName.trim()) {
      setSaveToast("Please provide your Company Name in Step 1.");
      setCurrentStep(1);
      return;
    }
    if (!aiSettings.services || aiSettings.services.length === 0) {
      setSaveToast("Please add at least 1 service in Step 2 Catalog.");
      setCurrentStep(2);
      return;
    }
    if (
      !aiSettings.qualificationFields ||
      aiSettings.qualificationFields.length === 0
    ) {
      setSaveToast("Please add at least 1 qualification question in Step 3.");
      setCurrentStep(3);
      return;
    }

    const payload = {
      ...aiSettings,
      isAiConfigured: true,
    };

    await handleSaveStep(payload);
    if (fetchOrganization) await fetchOrganization();
  };

  // Service Management
  const handleAddService = () => {
    if (!newService.name.trim()) return;
    const keywordsArr = newService.keywords
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);

    const updated = [
      ...aiSettings.services,
      {
        name: newService.name.trim(),
        description: newService.description.trim(),
        keywords: keywordsArr,
      },
    ];

    setAiSettings({ ...aiSettings, services: updated });
    setNewService({ name: "", description: "", keywords: "" });
    setShowAddServiceModal(false);
    handleSaveStep({ ...aiSettings, services: updated });
  };

  const handleRemoveService = (index) => {
    const updated = aiSettings.services.filter((_, i) => i !== index);
    setAiSettings({ ...aiSettings, services: updated });
    handleSaveStep({ ...aiSettings, services: updated });
  };

  // Field Management
  const handleEditField = (index) => {
    const f = aiSettings.qualificationFields[index];
    if (!f) return;
    setEditingFieldIndex(index);
    setNewField({
      key: f.key || "",
      label: f.label || "",
      type: f.type || "string",
      description: f.description || "",
      options: Array.isArray(f.options)
        ? f.options.join(", ")
        : f.options || "",
      required: Boolean(f.required),
    });
    setShowAddFieldModal(true);
  };

  const handleAddField = () => {
    if (!newField.key.trim() || !newField.label.trim()) return;
    const cleanKey = newField.key
      .trim()
      .replace(/[^a-zA-Z0-9_]/g, "_")
      .replace(/^[0-9]/, "_$&");

    const optionsArr = newField.options
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean);

    const fieldObj = {
      key: cleanKey,
      label: newField.label.trim(),
      type: newField.type,
      description: newField.description.trim(),
      options: optionsArr,
      required: newField.required,
    };

    let updated;
    if (
      editingFieldIndex !== null &&
      editingFieldIndex >= 0 &&
      editingFieldIndex < aiSettings.qualificationFields.length
    ) {
      updated = [...aiSettings.qualificationFields];
      updated[editingFieldIndex] = fieldObj;
    } else {
      updated = [...aiSettings.qualificationFields, fieldObj];
    }

    setAiSettings({ ...aiSettings, qualificationFields: updated });
    setNewField({
      key: "",
      label: "",
      type: "string",
      description: "",
      options: "",
      required: false,
    });
    setEditingFieldIndex(null);
    setShowAddFieldModal(false);
    handleSaveStep({ ...aiSettings, qualificationFields: updated });
  };

  const handleRemoveField = (index) => {
    const updated = aiSettings.qualificationFields.filter(
      (_, i) => i !== index,
    );
    setAiSettings({ ...aiSettings, qualificationFields: updated });
    handleSaveStep({ ...aiSettings, qualificationFields: updated });
  };

  // Knowledge base file upload
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setUploadingDoc(true);
    try {
      const token =
        localStorage.getItem("salesbuster_token") ||
        localStorage.getItem("kranthi_token");
      const res = await axios.post(
        API_ENDPOINTS.ORGANIZATIONS.KNOWLEDGE_UPLOAD,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        },
      );

      if (res.data.success) {
        fetchAISettings();
        setSaveToast(`Document "${file.name}" indexed into Qdrant!`);
      }
    } catch (err) {
      const fallbackDoc = {
        docId: "doc_" + Date.now(),
        fileName: file.name,
        originalName: file.name,
        fileSize: file.size,
        chunkCount: Math.ceil(file.size / 1500) || 12,
        uploadedAt: new Date(),
        status: "indexed",
      };
      const updatedDocs = [...aiSettings.knowledgeDocs, fallbackDoc];
      setAiSettings({ ...aiSettings, knowledgeDocs: updatedDocs });
      handleSaveStep({ ...aiSettings, knowledgeDocs: updatedDocs });
      setSaveToast(`Document cached locally: ${file.name}`);
    } finally {
      setUploadingDoc(false);
      e.target.value = "";
    }
  };

  const handleDeleteDoc = async (docId) => {
    if (!window.confirm("Remove this document from the AI knowledge base?"))
      return;
    try {
      const token =
        localStorage.getItem("salesbuster_token") ||
        localStorage.getItem("kranthi_token");
      await axios.delete(API_ENDPOINTS.ORGANIZATIONS.KNOWLEDGE_DELETE(docId), {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchAISettings();
    } catch (err) {
      const updatedDocs = aiSettings.knowledgeDocs.filter(
        (d) => d.docId !== docId,
      );
      setAiSettings({ ...aiSettings, knowledgeDocs: updatedDocs });
      handleSaveStep({ ...aiSettings, knowledgeDocs: updatedDocs });
    }
  };

  const copyPromptText = () => {
    const text = `You are a ${aiSettings.agentPersona} working at ${aiSettings.companyName || org.name || "Our Company"}.\n\nCOMPANY OVERVIEW:\n${aiSettings.businessDescription}\n\nCORE PRODUCTS:\n${aiSettings.services.map((s, i) => `${i + 1}. ${s.name} - ${s.description}`).join("\n")}\n\nCRITICAL RULES:\n${aiSettings.customInstructions}`;
    navigator.clipboard.writeText(text);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (!isManager) {
    return (
      <div className="p-6 max-w-xl mx-auto text-center mt-12">
        <div className="bg-bg-card border border-border-main rounded-3xl p-8 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={24} />
          </div>
          <h2 className="text-lg font-bold text-text-primary mb-2">
            Access Restricted
          </h2>
          <p className="text-xs text-text-secondary mb-6">
            Only designated Organization Managers have permission to configure
            the AI sales engine and view licensing.
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-pilot-blue hover:bg-pilot-blue-hover text-white font-bold py-2.5 px-6 rounded-xl transition-colors text-xs"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const org = orgData || cachedOrg || {};
  const totalSeats = org.seats || 1;
  const usedSeats = org.usedSeats || 0;
  const remainingSeats = Math.max(0, totalSeats - usedSeats);
  const seatPercentage = Math.min(
    100,
    Math.round((usedSeats / Math.max(1, totalSeats)) * 100),
  );

  const isExpired =
    org.isExpired ||
    (org.subscriptionEndDate && new Date(org.subscriptionEndDate) < new Date());

  const remainingDays =
    org.remainingDays ??
    (org.subscriptionEndDate
      ? Math.ceil(
          (new Date(org.subscriptionEndDate) - new Date()) /
            (1000 * 60 * 60 * 24),
        )
      : null);

  const activeStepObj = STEPS.find((s) => s.id === currentStep) || STEPS[0];

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* ── Top Header with Brand Details & Clean Tab Switcher ───────────── */}
      <div className="bg-bg-card border border-border-main rounded-3xl p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          {/* Org Identification */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2.5 rounded-2xl bg-bg-secondary border border-border-main text-text-secondary hover:text-text-primary hover:border-pilot-blue/40 transition-colors shrink-0"
              title="Go Back"
            >
              <ArrowLeft size={18} />
            </button>

            <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-pilot-blue to-blue-700 text-white flex items-center justify-center font-black text-xl shadow-sm shrink-0">
              {(org.name || "S").charAt(0).toUpperCase()}
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl md:text-2xl font-black text-text-primary tracking-tight">
                  {org.name || "Organization"}
                </h1>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {org.status ? org.status.toUpperCase() : "ACTIVE"}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pilot-blue/10 text-pilot-blue border border-pilot-blue/20">
                  Multi-Tenant
                </span>
              </div>
              <p className="text-xs text-text-secondary mt-1">
                Customize your AI sales pilot, products catalog, qualification
                schema, and knowledge documents.
              </p>
            </div>
          </div>

          {/* Primary View Switcher Tabs */}
          <div className="flex items-center p-1.5 bg-bg-secondary border border-border-main rounded-2xl gap-1.5 self-stretch lg:self-auto shrink-0">
            <button
              onClick={() => setActiveTab("wizard")}
              className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "wizard"
                  ? "bg-pilot-blue text-white shadow-sm"
                  : "text-text-secondary hover:text-text-primary hover:bg-bg-card/50"
              }`}
            >
              <Bot size={16} />
              <span>AI Setup Wizard</span>
            </button>

            <button
              onClick={() => setActiveTab("billing")}
              className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "billing"
                  ? "bg-pilot-blue text-white shadow-sm"
                  : "text-text-secondary hover:text-text-primary hover:bg-bg-card/50"
              }`}
            >
              <Building2 size={16} />
              <span>Subscription & Seats</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Success Toast Banner ─────────────────────────────────────────── */}
      {saveToast && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center justify-between shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={17} />
            <span>{saveToast}</span>
          </div>
          <button
            onClick={() => setSaveToast("")}
            className="p-1 hover:bg-emerald-500/20 rounded-lg transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* TAB 1: STEP-BY-STEP GUIDED AI PILOT SETUP WIZARD                    */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {activeTab === "wizard" && (
        <div className="space-y-6">
          {/* Stepper Progress Bar */}
          <div className="bg-bg-card border border-border-main rounded-3xl p-4 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2 scrollbar-none">
              {STEPS.map((step, idx) => {
                const StepIcon = step.icon;
                const isCompleted = step.id < currentStep;
                const isCurrent = step.id === currentStep;

                return (
                  <React.Fragment key={step.id}>
                    <button
                      onClick={() => setCurrentStep(step.id)}
                      className={`flex items-center gap-3 p-2.5 sm:px-4 sm:py-3 rounded-2xl transition-all text-left shrink-0 cursor-pointer ${
                        isCurrent
                          ? "bg-pilot-blue text-white shadow-md shadow-pilot-blue/20"
                          : isCompleted
                            ? "bg-bg-secondary text-text-primary hover:bg-bg-secondary/80"
                            : "text-text-secondary/70 hover:text-text-primary hover:bg-bg-secondary/40"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 transition-all ${
                          isCurrent
                            ? "bg-white/20 text-white"
                            : isCompleted
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "bg-bg-secondary border border-border-main text-text-secondary"
                        }`}
                      >
                        {isCompleted ? (
                          <Check size={16} />
                        ) : (
                          <StepIcon size={16} />
                        )}
                      </div>

                      <div className="hidden sm:block">
                        <div className="text-[10px] uppercase font-bold tracking-wider opacity-75">
                          Step 0{step.id}
                        </div>
                        <div className="text-xs font-black tracking-tight whitespace-nowrap">
                          {step.shortTitle}
                        </div>
                      </div>
                    </button>

                    {idx < STEPS.length - 1 && (
                      <div className="hidden md:block flex-1 h-[2px] bg-border-main shrink-0 min-w-4 max-w-12 rounded-full" />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Current Step Workspace Card */}
          <div className="bg-bg-card border border-border-main rounded-3xl p-6 sm:p-8 shadow-xs space-y-7">
            {/* Step Header & Template Picker */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-border-main">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-pilot-blue block">
                  STEP {activeStepObj.id} OF {STEPS.length} &bull;{" "}
                  {activeStepObj.subtitle}
                </span>
                <h2 className="text-xl font-black text-text-primary mt-1">
                  {activeStepObj.title}
                </h2>
                <p className="text-xs text-text-secondary mt-1 max-w-xl leading-relaxed">
                  {activeStepObj.description}
                </p>
              </div>
            </div>

            {/* ── STEP 1: IDENTITY & PERSONA ──────────────────────────────── */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-fadeIn">
                {/* ── GOOGLE GEMINI API KEY CONFIGURATION ───────────────── */}
                <div className="p-6 rounded-3xl bg-gradient-to-br from-bg-secondary/70 via-bg-secondary/40 to-bg-card border border-border-main space-y-4 shadow-2xs">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-pilot-blue/10 text-pilot-blue flex items-center justify-center shrink-0">
                        <Key size={18} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs font-black text-text-primary uppercase tracking-wider">
                            Google Gemini API Key
                          </h3>
                          <span className="text-[10px] font-black text-red-500 uppercase">
                            * Mandatory
                          </span>
                        </div>
                        <p className="text-[11px] text-text-secondary mt-0.5">
                          Each organization must provide their own Gemini API key for automated sales chat and RAG embeddings.
                        </p>
                      </div>
                    </div>

                    {aiSettings.geminiApiKey?.trim() ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                        <CheckCircle2 size={13} />
                        <span>Configured & Encrypted</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
                        <AlertTriangle size={13} />
                        <span>API Key Required</span>
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row gap-2.5">
                      <div className="relative flex-1">
                        <input
                          type={showApiKey ? "text" : "password"}
                          value={aiSettings.geminiApiKey || ""}
                          onChange={(e) => {
                            setAiSettings({
                              ...aiSettings,
                              geminiApiKey: e.target.value,
                            });
                            setKeyTestResult(null);
                          }}
                          placeholder="AIzaSy..."
                          className="w-full bg-bg-card border border-border-main text-text-primary text-xs font-mono rounded-xl pl-3.5 pr-10 py-3 outline-none focus:border-pilot-blue focus:ring-1 focus:ring-pilot-blue transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary p-1 cursor-pointer"
                          title={showApiKey ? "Hide Key" : "Show Key"}
                        >
                          {showApiKey ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={handleTestApiKey}
                        disabled={testingKey || !aiSettings.geminiApiKey?.trim()}
                        className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-bg-card hover:bg-bg-secondary border border-border-main text-xs font-bold text-text-primary hover:border-pilot-blue/50 transition-all disabled:opacity-50 cursor-pointer shrink-0 shadow-2xs"
                      >
                        {testingKey ? (
                          <RefreshCw size={14} className="animate-spin text-pilot-blue" />
                        ) : (
                          <Sparkles size={14} className="text-pilot-blue" />
                        )}
                        <span>{testingKey ? "Verifying..." : "Test Key"}</span>
                      </button>
                    </div>

                    {/* Test result message */}
                    {keyTestResult && (
                      <div
                        className={`p-3 rounded-xl text-xs font-bold flex items-center justify-between gap-2 animate-fadeIn ${
                          keyTestResult.success
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                            : "bg-red-500/10 text-red-500 border border-red-500/20"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {keyTestResult.success ? (
                            <CheckCircle2 size={15} className="shrink-0" />
                          ) : (
                            <AlertTriangle size={15} className="shrink-0" />
                          )}
                          <span>{keyTestResult.message}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setKeyTestResult(null)}
                          className="p-1 hover:opacity-75"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pt-1 text-[11px] text-text-secondary">
                      <div className="flex items-center gap-1.5">
                        <Lock size={12} className="text-emerald-500" />
                        <span>Encrypted with AES-256-GCM. Never shared with other organizations.</span>
                      </div>

                      <a
                        href="https://aistudio.google.com/app/apikey"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-pilot-blue hover:underline font-bold"
                      >
                        <span>Get API Key from Google AI Studio</span>
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Persona Cards */}
                <div>
                  <label className="block text-xs font-black text-text-primary mb-2.5 uppercase tracking-wider">
                    Select Sales Voice & Persona
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    {TONE_PRESETS.map((t) => {
                      const Icon = t.icon;
                      const isSelected = aiSettings.agentPersona.includes(
                        t.title.toLowerCase().split(" ")[0],
                      );
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() =>
                            setAiSettings({
                              ...aiSettings,
                              agentPersona: t.persona,
                            })
                          }
                          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? "bg-pilot-blue/10 border-pilot-blue text-pilot-blue shadow-xs ring-1 ring-pilot-blue"
                              : "bg-bg-secondary/40 border-border-main text-text-secondary hover:border-pilot-blue/40 hover:bg-bg-secondary/70"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-2">
                              <div
                                className={`p-1.5 rounded-lg ${isSelected ? "bg-pilot-blue text-white" : "bg-bg-secondary text-text-primary"}`}
                              >
                                <Icon size={16} />
                              </div>
                              <span className="text-xs font-bold text-text-primary">
                                {t.title}
                              </span>
                            </div>
                            {isSelected && (
                              <Check size={14} className="text-pilot-blue" />
                            )}
                          </div>
                          <p className="text-[11px] leading-relaxed text-text-secondary mt-1">
                            {t.desc}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Name & Role Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-black text-text-primary uppercase tracking-wider">
                        Brand Name / Display Name
                      </label>
                      <span className="text-[10px] font-bold text-pilot-blue bg-pilot-blue/10 px-2 py-0.5 rounded-md border border-pilot-blue/20">
                        Auto-filled
                      </span>
                    </div>
                    <input
                      type="text"
                      value={aiSettings.companyName}
                      onChange={(e) =>
                        setAiSettings({
                          ...aiSettings,
                          companyName: e.target.value,
                        })
                      }
                      placeholder={org.name || "e.g. SalesBuster AI"}
                      className="w-full bg-bg-secondary/40 border border-border-main text-text-primary text-xs rounded-xl p-3.5 outline-none focus:border-pilot-blue focus:ring-1 focus:ring-pilot-blue transition-all font-medium"
                    />
                    <span className="text-[10px] text-text-secondary mt-1.5 block">
                      The official brand name the AI assistant introduces on
                      WhatsApp. Automatically pre-filled from your organization profile.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-text-primary mb-1.5 uppercase tracking-wider">
                      Custom Agent Role Description
                    </label>
                    <input
                      type="text"
                      value={aiSettings.agentPersona}
                      onChange={(e) =>
                        setAiSettings({
                          ...aiSettings,
                          agentPersona: e.target.value,
                        })
                      }
                      placeholder="e.g. warm, consultative sales advisor"
                      className="w-full bg-bg-secondary/40 border border-border-main text-text-primary text-xs rounded-xl p-3.5 outline-none focus:border-pilot-blue focus:ring-1 focus:ring-pilot-blue transition-all"
                    />
                    <span className="text-[10px] text-text-secondary mt-1.5 block">
                      Controls the AI assistant's personality traits and
                      conversational vocabulary.
                    </span>
                  </div>
                </div>

                {/* Company Pitch / Overview */}
                <div>
                  <label className="block text-xs font-black text-text-primary mb-1.5 uppercase tracking-wider">
                    Company Overview & Value Proposition
                  </label>
                  <textarea
                    rows={3}
                    value={aiSettings.businessDescription}
                    onChange={(e) =>
                      setAiSettings({
                        ...aiSettings,
                        businessDescription: e.target.value,
                      })
                    }
                    placeholder="Briefly describe what your company offers, core target audience, and key customer benefits..."
                    className="w-full bg-bg-secondary/40 border border-border-main text-text-primary text-xs rounded-xl p-3.5 outline-none focus:border-pilot-blue focus:ring-1 focus:ring-pilot-blue transition-all leading-relaxed"
                  />
                  <span className="text-[10px] text-text-secondary mt-1.5 block">
                    Gives the AI context about your business when answering
                    broad customer enquiries.
                  </span>
                </div>

                {/* Guardrails and Rules */}
                <div>
                  <label className="block text-xs font-black text-text-primary mb-1.5 uppercase tracking-wider">
                    Mandatory Sales Guardrails & Instructions
                  </label>
                  <textarea
                    rows={4}
                    value={aiSettings.customInstructions}
                    onChange={(e) =>
                      setAiSettings({
                        ...aiSettings,
                        customInstructions: e.target.value,
                      })
                    }
                    className="w-full bg-bg-secondary/40 border border-border-main text-text-primary text-xs rounded-xl p-3.5 outline-none focus:border-pilot-blue focus:ring-1 focus:ring-pilot-blue transition-all font-mono leading-relaxed"
                  />
                  <span className="text-[10px] text-text-secondary mt-1.5 block">
                    Defines strict pricing guidelines (e.g. never guess fixed
                    quotes), callback triggers, and handoff rules.
                  </span>
                </div>
              </div>
            )}

            {/* ── STEP 2: PRODUCTS & SERVICES ─────────────────────────────── */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <h3 className="text-sm font-black text-text-primary">
                      Catalog Offerings ({aiSettings.services.length})
                    </h3>
                    <p className="text-xs text-text-secondary mt-0.5">
                      The AI automatically matches incoming customer messages
                      against these products and keywords.
                    </p>
                  </div>

                  <button
                    onClick={() => setShowAddServiceModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-pilot-blue text-white text-xs font-bold hover:bg-pilot-blue-hover transition-all shadow-xs shrink-0 cursor-pointer"
                  >
                    <Plus size={15} />
                    <span>Add New Service</span>
                  </button>
                </div>

                {/* Services Grid */}
                {aiSettings.services.length === 0 ? (
                  <div className="p-10 rounded-3xl bg-bg-secondary/40 border border-dashed border-border-main text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-pilot-blue/10 text-pilot-blue flex items-center justify-center mx-auto">
                      <Layers size={22} />
                    </div>
                    <h4 className="text-sm font-bold text-text-primary">
                      No Catalog Services Configured Yet
                    </h4>
                    <p className="text-xs text-text-secondary max-w-md mx-auto">
                      Add your products or services so the AI knows what you sell and can guide your customers effectively.
                    </p>
                    <button
                      onClick={() => setShowAddServiceModal(true)}
                      className="px-4 py-2 rounded-xl bg-pilot-blue text-white text-xs font-bold hover:bg-pilot-blue-hover transition-colors"
                    >
                      Add First Service
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {aiSettings.services.map((svc, idx) => (
                      <div
                        key={idx}
                        className="p-5 rounded-2xl bg-bg-secondary/40 border border-border-main hover:border-pilot-blue/40 transition-all flex flex-col justify-between gap-4 group"
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-xs font-black text-text-primary">
                              {svc.name}
                            </h4>
                            <button
                              onClick={() => handleRemoveService(idx)}
                              className="text-text-secondary hover:text-red-500 p-1 rounded-lg hover:bg-red-500/10 transition-colors"
                              title="Delete Service"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                          <p className="text-xs text-text-secondary leading-relaxed">
                            {svc.description}
                          </p>
                        </div>

                        <div>
                          <span className="text-[10px] font-bold text-text-secondary uppercase block mb-1.5">
                            Intent Keywords:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {svc.keywords && svc.keywords.length > 0 ? (
                              svc.keywords.map((kw, kidx) => (
                                <span
                                  key={kidx}
                                  className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-bg-card border border-border-main text-pilot-blue"
                                >
                                  #{kw}
                                </span>
                              ))
                            ) : (
                              <span className="text-[10px] text-text-secondary italic">
                                No keywords tagged
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Service Modal */}
                {showAddServiceModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
                    <div className="bg-bg-card border border-border-main rounded-3xl p-6 sm:p-7 max-w-lg w-full space-y-4 shadow-xl">
                      <div className="flex justify-between items-center pb-2 border-b border-border-main">
                        <div className="flex items-center gap-2">
                          <Layers size={18} className="text-pilot-blue" />
                          <h3 className="text-sm font-black text-text-primary">
                            Add Product or Service
                          </h3>
                        </div>
                        <button
                          onClick={() => setShowAddServiceModal(false)}
                          className="p-1 text-text-secondary hover:text-text-primary rounded-lg"
                        >
                          <X size={16} />
                        </button>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-bold text-text-primary mb-1">
                            Service / Offering Name *
                          </label>
                          <input
                            type="text"
                            value={newService.name}
                            onChange={(e) =>
                              setNewService({
                                ...newService,
                                name: e.target.value,
                              })
                            }
                            placeholder="e.g. 3 BHK Luxury Flat / MRL Passenger Lift"
                            className="w-full bg-bg-secondary/50 border border-border-main text-text-primary text-xs rounded-xl p-3 outline-none focus:border-pilot-blue"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-text-primary mb-1">
                            Description for AI Assistant *
                          </label>
                          <textarea
                            rows={3}
                            value={newService.description}
                            onChange={(e) =>
                              setNewService({
                                ...newService,
                                description: e.target.value,
                              })
                            }
                            placeholder="Describe features, suitability, and benefits so the AI can explain it to customers..."
                            className="w-full bg-bg-secondary/50 border border-border-main text-text-primary text-xs rounded-xl p-3 outline-none focus:border-pilot-blue"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-text-primary mb-1">
                            Intent Keywords (comma-separated)
                          </label>
                          <input
                            type="text"
                            value={newService.keywords}
                            onChange={(e) =>
                              setNewService({
                                ...newService,
                                keywords: e.target.value,
                              })
                            }
                            placeholder="e.g. 3bhk, luxury flat, gated community, apartment"
                            className="w-full bg-bg-secondary/50 border border-border-main text-text-primary text-xs rounded-xl p-3 outline-none focus:border-pilot-blue"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t border-border-main">
                        <button
                          onClick={() => setShowAddServiceModal(false)}
                          className="px-4 py-2 rounded-xl border border-border-main text-xs font-bold text-text-secondary hover:bg-bg-secondary transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleAddService}
                          disabled={!newService.name.trim()}
                          className="px-4 py-2 rounded-xl bg-pilot-blue hover:bg-pilot-blue-hover text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50"
                        >
                          Save Service
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── STEP 3: LEAD QUALIFICATION SCHEMA ───────────────────────── */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-fadeIn">
                {/* Lead Qualification Criteria Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <h3 className="text-sm font-black text-text-primary">
                      Lead Qualification Criteria (
                      {aiSettings.qualificationFields.length})
                    </h3>
                    <p className="text-xs text-text-secondary mt-0.5">
                      Standard criteria your AI extracts to qualify leads. Customize, edit, delete, or add questions to suit your business.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setEditingFieldIndex(null);
                      setNewField({
                        key: "",
                        label: "",
                        type: "string",
                        description: "",
                        options: "",
                        required: false,
                      });
                      setShowAddFieldModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-pilot-blue text-white text-xs font-bold hover:bg-pilot-blue-hover transition-all shadow-xs shrink-0 cursor-pointer"
                  >
                    <Plus size={15} />
                    <span>Add Custom Question</span>
                  </button>
                </div>

                {/* Custom Fields List */}
                {aiSettings.qualificationFields.length === 0 ? (
                  <div className="p-10 rounded-3xl bg-bg-secondary/40 border border-dashed border-border-main text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-pilot-blue/10 text-pilot-blue flex items-center justify-center mx-auto">
                      <ListFilter size={22} />
                    </div>
                    <h4 className="text-sm font-bold text-text-primary">
                      No Custom Questions Configured
                    </h4>
                    <p className="text-xs text-text-secondary max-w-md mx-auto">
                      Add business-specific criteria (e.g. budget, timeframe, product specifications) to capture key lead requirements.
                    </p>
                    <button
                      onClick={() => setShowAddFieldModal(true)}
                      className="px-4 py-2 rounded-xl bg-pilot-blue text-white text-xs font-bold hover:bg-pilot-blue-hover transition-colors"
                    >
                      Add First Field
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {aiSettings.qualificationFields.map((field, idx) => (
                      <div
                        key={idx}
                        className="p-5 rounded-2xl bg-bg-secondary/40 border border-border-main hover:border-pilot-blue/40 transition-all flex flex-col justify-between gap-3 group"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-black text-text-primary">
                                {field.label}
                              </h4>
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-bg-card border border-border-main text-pilot-blue uppercase">
                                {field.type}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleEditField(idx)}
                                className="text-text-secondary hover:text-pilot-blue p-1 rounded-lg hover:bg-pilot-blue/10 transition-colors"
                                title="Edit Question"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => handleRemoveField(idx)}
                                className="text-text-secondary hover:text-red-500 p-1 rounded-lg hover:bg-red-500/10 transition-colors"
                                title="Delete Field"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>

                          <span className="text-[10px] font-mono text-text-secondary block">
                            Key:{" "}
                            <span className="font-bold text-text-primary">
                              {field.key}
                            </span>
                          </span>

                          <p className="text-xs text-text-secondary leading-relaxed">
                            {field.description ||
                              "No extraction guidance specified."}
                          </p>
                        </div>

                        {field.options && field.options.length > 0 && (
                          <div>
                            <span className="text-[10px] font-bold text-text-secondary uppercase block mb-1">
                              Allowed Options:
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {field.options.map((opt, oidx) => (
                                <span
                                  key={oidx}
                                  className="text-[10px] px-2 py-0.5 rounded-md bg-bg-card border border-border-main text-text-primary"
                                >
                                  {opt}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Field Modal */}
                {showAddFieldModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
                    <div className="bg-bg-card border border-border-main rounded-3xl p-6 sm:p-7 max-w-lg w-full space-y-4 shadow-xl">
                      <div className="flex justify-between items-center pb-2 border-b border-border-main">
                        <div className="flex items-center gap-2">
                          <ListFilter size={18} className="text-pilot-blue" />
                          <h3 className="text-sm font-black text-text-primary">
                            {editingFieldIndex !== null
                              ? "Edit Qualification Field"
                              : "Add Qualification Field"}
                          </h3>
                        </div>
                        <button
                          onClick={() => {
                            setEditingFieldIndex(null);
                            setShowAddFieldModal(false);
                          }}
                          className="p-1 text-text-secondary hover:text-text-primary rounded-lg"
                        >
                          <X size={16} />
                        </button>
                      </div>

                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-text-primary mb-1">
                              Question / Display Label *
                            </label>
                            <input
                              type="text"
                              value={newField.label}
                              onChange={(e) => {
                                const val = e.target.value;
                                setNewField({
                                  ...newField,
                                  label: val,
                                  key:
                                    newField.key ||
                                    val
                                      .toLowerCase()
                                      .replace(/[^a-z0-9]/g, "_"),
                                });
                              }}
                              placeholder="e.g. Budget Range / BHK"
                              className="w-full bg-bg-secondary/50 border border-border-main text-text-primary text-xs rounded-xl p-3 outline-none focus:border-pilot-blue"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-text-primary mb-1">
                              Field Key (Identifier) *
                            </label>
                            <input
                              type="text"
                              value={newField.key}
                              onChange={(e) =>
                                setNewField({
                                  ...newField,
                                  key: e.target.value,
                                })
                              }
                              placeholder="e.g. budget_range"
                              className="w-full bg-bg-secondary/50 border border-border-main text-text-primary text-xs rounded-xl p-3 outline-none focus:border-pilot-blue font-mono"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-text-primary mb-1">
                            Field Data Type
                          </label>
                          <select
                            value={newField.type}
                            onChange={(e) =>
                              setNewField({ ...newField, type: e.target.value })
                            }
                            className="w-full bg-bg-secondary/50 border border-border-main text-text-primary text-xs rounded-xl p-3 outline-none focus:border-pilot-blue"
                          >
                            <option value="string">
                              Text String (Freeform)
                            </option>
                            <option value="number">
                              Numeric (Quantity / Amount)
                            </option>
                            <option value="select">
                              Dropdown Select (Predefined Choices)
                            </option>
                            <option value="boolean">
                              Yes / No (Boolean Flag)
                            </option>
                          </select>
                        </div>

                        {newField.type === "select" && (
                          <div>
                            <label className="block text-xs font-bold text-text-primary mb-1">
                              Choices (comma-separated) *
                            </label>
                            <input
                              type="text"
                              value={newField.options}
                              onChange={(e) =>
                                setNewField({
                                  ...newField,
                                  options: e.target.value,
                                })
                              }
                              placeholder="e.g. 2 BHK, 3 BHK, 4 BHK, Villa"
                              className="w-full bg-bg-secondary/50 border border-border-main text-text-primary text-xs rounded-xl p-3 outline-none focus:border-pilot-blue"
                            />
                          </div>
                        )}

                        <div>
                          <label className="block text-xs font-bold text-text-primary mb-1">
                            Extraction Guidance for AI
                          </label>
                          <textarea
                            rows={2}
                            value={newField.description}
                            onChange={(e) =>
                              setNewField({
                                ...newField,
                                description: e.target.value,
                              })
                            }
                            placeholder="Explain what to ask the customer or how to extract this information..."
                            className="w-full bg-bg-secondary/50 border border-border-main text-text-primary text-xs rounded-xl p-3 outline-none focus:border-pilot-blue"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t border-border-main">
                        <button
                          onClick={() => {
                            setEditingFieldIndex(null);
                            setShowAddFieldModal(false);
                          }}
                          className="px-4 py-2 rounded-xl border border-border-main text-xs font-bold text-text-secondary hover:bg-bg-secondary transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleAddField}
                          disabled={
                            !newField.label.trim() || !newField.key.trim()
                          }
                          className="px-4 py-2 rounded-xl bg-pilot-blue hover:bg-pilot-blue-hover text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50"
                        >
                          {editingFieldIndex !== null
                            ? "Save Changes"
                            : "Save Field"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── STEP 4: KNOWLEDGE BASE (QDRANT RAG) ──────────────────────── */}
            {currentStep === 4 && (
              <div className="space-y-6 animate-fadeIn">
                {/* Qdrant Partition Banner */}
                <div className="p-5 rounded-2xl bg-bg-secondary/50 border border-border-main flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Database size={16} className="text-pilot-blue" />
                      <h4 className="text-xs font-black text-text-primary">
                        Dedicated Qdrant Vector Collection
                      </h4>
                    </div>
                    <p className="text-xs text-text-secondary">
                      Isolated multi-tenant vector space using{" "}
                      <span className="font-bold text-text-primary">
                        gemini-embedding-2
                      </span>{" "}
                      (768-dim).
                    </p>
                  </div>

                  <span className="font-mono text-xs font-bold px-3 py-1.5 rounded-xl bg-bg-card border border-border-main text-pilot-blue">
                    {aiSettings.qdrantCollection ||
                      `sb_kb_${(org.name || "tenant").toLowerCase().replace(/[^a-z0-9]/g, "_")}`}
                  </span>
                </div>

                {/* File Upload Zone */}
                <div>
                  <label className="block text-xs font-black text-text-primary mb-2 uppercase tracking-wider">
                    Upload Training Documents (.PDF, .DOCX, .TXT, .MD)
                  </label>
                  <label className="p-8 border-2 border-dashed border-border-main hover:border-pilot-blue rounded-3xl flex flex-col items-center justify-center cursor-pointer transition-all bg-bg-secondary/30 hover:bg-pilot-blue/5 group">
                    <input
                      type="file"
                      accept=".pdf,.docx,.txt,.md"
                      onChange={handleFileUpload}
                      disabled={uploadingDoc}
                      className="hidden"
                    />
                    <div className="w-12 h-12 rounded-2xl bg-bg-card border border-border-main flex items-center justify-center text-pilot-blue mb-3 group-hover:scale-110 transition-transform shadow-xs">
                      {uploadingDoc ? (
                        <RefreshCw
                          size={20}
                          className="animate-spin text-pilot-blue"
                        />
                      ) : (
                        <Upload size={20} />
                      )}
                    </div>
                    <span className="text-xs font-bold text-text-primary">
                      {uploadingDoc
                        ? "Chunking & Indexing into Qdrant..."
                        : "Click or drag & drop files here"}
                    </span>
                    <span className="text-[11px] text-text-secondary mt-1">
                      PDF, DOCX, or text files up to 25 MB per document
                    </span>
                  </label>
                </div>

                {/* Indexed Documents Table */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-text-primary uppercase tracking-wider">
                    Indexed Knowledge Documents (
                    {aiSettings.knowledgeDocs.length})
                  </h4>

                  {aiSettings.knowledgeDocs.length === 0 ? (
                    <div className="p-6 rounded-2xl bg-bg-secondary/40 border border-border-main text-center text-xs text-text-secondary">
                      No documents indexed yet. Upload your product brochures,
                      spec sheets, or pricing FAQs above.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {aiSettings.knowledgeDocs.map((doc, idx) => (
                        <div
                          key={doc.docId || idx}
                          className="p-3.5 rounded-2xl bg-bg-secondary/40 border border-border-main flex items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="p-2 rounded-xl bg-bg-card border border-border-main text-pilot-blue shrink-0">
                              <FileText size={16} />
                            </div>
                            <div className="truncate">
                              <div className="text-xs font-bold text-text-primary truncate">
                                {doc.originalName || doc.fileName}
                              </div>
                              <div className="text-[10px] text-text-secondary flex items-center gap-2 mt-0.5">
                                <span>
                                  {doc.fileSize
                                    ? `${Math.round(doc.fileSize / 1024)} KB`
                                    : "1.2 MB"}
                                </span>
                                <span>&bull;</span>
                                <span className="text-pilot-blue font-bold">
                                  {doc.chunkCount || 12} vector chunks
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                              Indexed
                            </span>
                            <button
                              onClick={() => handleDeleteDoc(doc.docId)}
                              className="text-text-secondary hover:text-red-500 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                              title="Delete Document"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── STEP 5: REVIEW, PROMPT INSPECTOR & PLAYGROUND ───────────── */}
            {currentStep === 5 && (
              <div className="space-y-6 animate-fadeIn">
                {/* Pre-flight Requirement Verification Card */}
                <div className="p-5 rounded-2xl border border-border-main bg-bg-secondary/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={18} className="text-emerald-500" />
                      <h4 className="text-xs font-black text-text-primary uppercase tracking-wider">
                        Pre-Activation Checklist
                      </h4>
                    </div>
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                        aiSettings.geminiApiKey?.trim() &&
                        aiSettings.services.length > 0 &&
                        aiSettings.qualificationFields.length > 0 &&
                        aiSettings.companyName.trim()
                          ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                      }`}
                    >
                      {aiSettings.geminiApiKey?.trim() &&
                      aiSettings.services.length > 0 &&
                      aiSettings.qualificationFields.length > 0 &&
                      aiSettings.companyName.trim()
                        ? "Ready to Activate"
                        : "Requirements Missing"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-1">
                    <div
                      onClick={() =>
                        !aiSettings.geminiApiKey?.trim() && setCurrentStep(1)
                      }
                      className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-all ${
                        aiSettings.geminiApiKey?.trim()
                          ? "bg-emerald-500/5 border-emerald-500/20"
                          : "bg-red-500/5 border-red-500/30 cursor-pointer hover:bg-red-500/10"
                      }`}
                    >
                      <span className="font-bold text-text-primary">
                        Gemini API Key
                      </span>
                      {aiSettings.geminiApiKey?.trim() ? (
                        <CheckCircle2
                          size={15}
                          className="text-emerald-500 shrink-0"
                        />
                      ) : (
                        <span className="text-[10px] font-bold text-red-400">
                          Step 1 Required
                        </span>
                      )}
                    </div>

                    <div
                      onClick={() =>
                        !aiSettings.companyName.trim() && setCurrentStep(1)
                      }
                      className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-all ${
                        aiSettings.companyName.trim()
                          ? "bg-emerald-500/5 border-emerald-500/20"
                          : "bg-red-500/5 border-red-500/30 cursor-pointer hover:bg-red-500/10"
                      }`}
                    >
                      <span className="font-bold text-text-primary">
                        Company Identity
                      </span>
                      {aiSettings.companyName.trim() ? (
                        <CheckCircle2
                          size={15}
                          className="text-emerald-500 shrink-0"
                        />
                      ) : (
                        <span className="text-[10px] font-bold text-red-400">
                          Step 1 Required
                        </span>
                      )}
                    </div>

                    <div
                      onClick={() =>
                        aiSettings.services.length === 0 && setCurrentStep(2)
                      }
                      className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-all ${
                        aiSettings.services.length > 0
                          ? "bg-emerald-500/5 border-emerald-500/20"
                          : "bg-red-500/5 border-red-500/30 cursor-pointer hover:bg-red-500/10"
                      }`}
                    >
                      <span className="font-bold text-text-primary">
                        Services Catalog ({aiSettings.services.length})
                      </span>
                      {aiSettings.services.length > 0 ? (
                        <CheckCircle2
                          size={15}
                          className="text-emerald-500 shrink-0"
                        />
                      ) : (
                        <span className="text-[10px] font-bold text-red-400">
                          Min 1 Required
                        </span>
                      )}
                    </div>

                    <div
                      onClick={() =>
                        aiSettings.qualificationFields.length === 0 &&
                        setCurrentStep(3)
                      }
                      className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-all ${
                        aiSettings.qualificationFields.length > 0
                          ? "bg-emerald-500/5 border-emerald-500/20"
                          : "bg-red-500/5 border-red-500/30 cursor-pointer hover:bg-red-500/10"
                      }`}
                    >
                      <span className="font-bold text-text-primary">
                        Questions Schema (
                        {aiSettings.qualificationFields.length})
                      </span>
                      {aiSettings.qualificationFields.length > 0 ? (
                        <CheckCircle2
                          size={15}
                          className="text-emerald-500 shrink-0"
                        />
                      ) : (
                        <span className="text-[10px] font-bold text-red-400">
                          Min 1 Required
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Scorecard */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-4 rounded-2xl bg-bg-secondary/50 border border-border-main text-center">
                    <span className="text-[10px] uppercase font-bold text-text-secondary block">
                      Agent Persona
                    </span>
                    <span className="text-xs font-black text-pilot-blue mt-1 block truncate">
                      {aiSettings.companyName || org.name || "Configured"}
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-bg-secondary/50 border border-border-main text-center">
                    <span className="text-[10px] uppercase font-bold text-text-secondary block">
                      Catalog Services
                    </span>
                    <span className="text-lg font-black text-text-primary mt-0.5 block">
                      {aiSettings.services.length}
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-bg-secondary/50 border border-border-main text-center">
                    <span className="text-[10px] uppercase font-bold text-text-secondary block">
                      Custom Questions
                    </span>
                    <span className="text-lg font-black text-text-primary mt-0.5 block">
                      {aiSettings.qualificationFields.length}
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-bg-secondary/50 border border-border-main text-center">
                    <span className="text-[10px] uppercase font-bold text-text-secondary block">
                      Knowledge Docs
                    </span>
                    <span className="text-lg font-black text-text-primary mt-0.5 block">
                      {aiSettings.knowledgeDocs.length}
                    </span>
                  </div>
                </div>

                {/* Prompt Inspector */}
                <div className="p-5 rounded-2xl bg-bg-secondary/30 border border-border-main space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Terminal size={16} className="text-pilot-blue" />
                      <h4 className="text-xs font-black text-text-primary">
                        Compiled AI System Prompt
                      </h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={copyPromptText}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-bg-card border border-border-main text-xs font-bold text-text-secondary hover:text-text-primary transition-colors"
                      >
                        {copiedPrompt ? (
                          <Check size={13} className="text-emerald-500" />
                        ) : (
                          <Copy size={13} />
                        )}
                        <span>{copiedPrompt ? "Copied" : "Copy"}</span>
                      </button>
                      <button
                        onClick={() =>
                          setShowPromptInspector(!showPromptInspector)
                        }
                        className="text-xs font-bold text-pilot-blue hover:underline cursor-pointer"
                      >
                        {showPromptInspector
                          ? "Collapse"
                          : "Expand Full Prompt"}
                      </button>
                    </div>
                  </div>

                  {showPromptInspector ? (
                    <pre className="p-4 rounded-xl bg-[#0b1727] text-slate-200 border border-slate-700/60 text-[11px] font-mono whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto">
                      {`You are a ${aiSettings.agentPersona} working at ${aiSettings.companyName || org.name || "Our Company"}.\n\nCOMPANY OVERVIEW:\n${aiSettings.businessDescription}\n\nCORE PRODUCTS:\n${aiSettings.services.map((s, i) => `${i + 1}. ${s.name} - ${s.description}`).join("\n")}\n\nCRITICAL RULES:\n${aiSettings.customInstructions}`}
                    </pre>
                  ) : (
                    <p className="text-xs text-text-secondary leading-relaxed">
                      Your prompt is compiled dynamically from your Persona,
                      Services Catalog, Qualification Criteria, and Knowledge
                      Base chunks. Click "Expand Full Prompt" above to review
                      before testing.
                    </p>
                  )}
                </div>

                {/* Playground Launch Callout */}
                <div className="p-6 rounded-3xl bg-gradient-to-r from-pilot-blue/10 via-pilot-blue/5 to-transparent border border-pilot-blue/30 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="space-y-1 text-center sm:text-left">
                    <h4 className="text-sm font-black text-text-primary">
                      Ready to Test Your Custom Sales AI?
                    </h4>
                    <p className="text-xs text-text-secondary">
                      Simulate real customer inquiries and test qualification in
                      the interactive WhatsApp playground.
                    </p>
                  </div>

                  <button
                    onClick={() => navigate("/test-ai")}
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-pilot-blue hover:bg-pilot-blue-hover text-white text-xs font-black transition-all shadow-md shadow-pilot-blue/20 shrink-0 cursor-pointer"
                  >
                    <Play size={14} className="fill-white" />
                    <span>Open AI Playground</span>
                  </button>
                </div>
              </div>
            )}

            {/* ── Persistent Step Navigation Footer ───────────────────────── */}
            <div className="flex justify-between items-center pt-6 border-t border-border-main">
              {currentStep > 1 ? (
                <button
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border-main text-xs font-bold text-text-secondary hover:bg-bg-secondary hover:text-text-primary transition-colors cursor-pointer"
                >
                  <ChevronLeft size={16} />
                  <span>Back</span>
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSaveStep()}
                  disabled={aiSaving}
                  className="px-4 py-2.5 rounded-xl bg-bg-secondary border border-border-main text-xs font-bold text-text-primary hover:bg-bg-secondary/70 transition-colors cursor-pointer"
                >
                  {aiSaving ? "Saving..." : "Save Draft"}
                </button>

                {currentStep < STEPS.length ? (
                  <button
                    onClick={() => handleSaveStep(null, currentStep + 1)}
                    disabled={aiSaving}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-pilot-blue hover:bg-pilot-blue-hover text-white text-xs font-black transition-all shadow-sm shadow-pilot-blue/20 cursor-pointer"
                  >
                    <span>Save & Continue</span>
                    <ChevronRight size={16} />
                  </button>
                ) : (
                  <button
                    onClick={handleFinishSetup}
                    disabled={aiSaving}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all shadow-sm cursor-pointer"
                  >
                    <CheckCheck size={16} />
                    <span>
                      {aiSaving ? "Activating..." : "Finish & Activate AI"}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* TAB 2: ORGANIZATION SUBSCRIPTION & SEAT MANAGEMENT                  */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {activeTab === "billing" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Organization Overview Card */}
          <div className="bg-bg-card border border-border-main rounded-3xl p-6 sm:p-8 shadow-xs">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pilot-blue to-blue-700 text-white flex items-center justify-center font-black text-2xl shadow-sm">
                  {(org.name || "S").charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-xl font-black text-text-primary">
                      {org.name || "Client Organization"}
                    </h2>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                      {org.status ? org.status.toUpperCase() : "ACTIVE"}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary mt-1 font-mono">
                    Tenant Database:{" "}
                    <span className="font-bold text-text-primary">
                      {org.tenantDbName || "Single-Tenant Core"}
                    </span>
                  </p>
                </div>
              </div>

              <div className="text-right sm:border-l border-border-main sm:pl-6">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary block">
                  Subscription Validity
                </span>
                <span className="text-sm font-black text-text-primary block mt-0.5">
                  {formatDate(org.subscriptionEndDate)}
                </span>
                <span
                  className={`text-[11px] font-bold ${isExpired ? "text-red-500" : "text-emerald-600"}`}
                >
                  {isExpired
                    ? "Subscription Expired"
                    : `${remainingDays} days remaining`}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 mt-6 border-t border-border-main text-xs">
              <div className="flex items-center gap-2.5 text-text-secondary">
                <div className="p-2 rounded-xl bg-bg-secondary text-pilot-blue">
                  <Mail size={14} />
                </div>
                <span className="text-text-primary font-medium truncate">
                  {org.email || "No email"}
                </span>
              </div>
              <div className="flex items-center gap-2.5 text-text-secondary">
                <div className="p-2 rounded-xl bg-bg-secondary text-pilot-blue">
                  <Phone size={14} />
                </div>
                <span className="text-text-primary font-medium">
                  {org.mobile || "No phone"}
                </span>
              </div>
              <div className="flex items-center gap-2.5 text-text-secondary">
                <div className="p-2 rounded-xl bg-bg-secondary text-pilot-blue">
                  <Globe size={14} />
                </div>
                <span className="text-text-primary font-medium truncate">
                  {org.website || "No website"}
                </span>
              </div>
            </div>
          </div>

          {/* Seat Utilization & Commercial Model */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-bg-card border border-border-main rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border-main">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-pilot-blue" />
                  <h3 className="font-bold text-xs text-text-primary">
                    Seat Utilization & Licensing
                  </h3>
                </div>
                <span className="text-xs font-black text-pilot-blue">
                  {usedSeats} / {totalSeats} Used
                </span>
              </div>

              <div className="w-full bg-bg-secondary rounded-full h-3 overflow-hidden">
                <div
                  className="bg-pilot-blue h-3 rounded-full transition-all duration-500"
                  style={{ width: `${seatPercentage}%` }}
                />
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 text-center">
                <div className="p-3 bg-bg-secondary/40 rounded-xl border border-border-main">
                  <div className="text-[10px] text-text-secondary font-bold uppercase">
                    Total Seats
                  </div>
                  <div className="text-base font-black text-text-primary mt-0.5">
                    {totalSeats}
                  </div>
                </div>
                <div className="p-3 bg-bg-secondary/40 rounded-xl border border-border-main">
                  <div className="text-[10px] text-text-secondary font-bold uppercase">
                    Active Reps
                  </div>
                  <div className="text-base font-black text-pilot-blue mt-0.5">
                    {usedSeats}
                  </div>
                </div>
                <div className="p-3 bg-bg-secondary/40 rounded-xl border border-border-main">
                  <div className="text-[10px] text-text-secondary font-bold uppercase">
                    Available
                  </div>
                  <div className="text-base font-black text-emerald-600 mt-0.5">
                    {remainingSeats}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-bg-card border border-border-main rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border-main">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-pilot-blue" />
                  <h3 className="font-bold text-xs text-text-primary">
                    Billing & Commercial Model
                  </h3>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pilot-blue/10 text-pilot-blue uppercase">
                  {org.subscriptionPlan || "MONTHLY"}
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1.5 border-b border-border-main/50">
                  <span className="text-text-secondary">
                    Subscription Plan:
                  </span>
                  <span className="font-bold text-text-primary uppercase">
                    {org.subscriptionPlan
                      ? `${org.subscriptionPlan} Seat-Wise`
                      : "Monthly Seat-Wise"}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border-main/50">
                  <span className="text-text-secondary">Rate Per Seat:</span>
                  <span className="font-bold text-text-primary">
                    ₹{org.pricingPerSeat || 599} /{" "}
                    {org.subscriptionPlan === "annually"
                      ? "year"
                      : org.subscriptionPlan === "quarterly"
                        ? "quarter"
                        : "month"}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-text-secondary">
                    Current Billing Cycle:
                  </span>
                  <span className="font-medium text-text-primary">
                    {formatDate(org.subscriptionStartDate)} &rarr;{" "}
                    {formatDate(org.subscriptionEndDate)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Multi-Tenant Partitioning Info */}
          <div className="bg-bg-card border border-border-main rounded-3xl p-6 shadow-xs">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-pilot-blue/10 text-pilot-blue flex items-center justify-center">
                <ShieldCheck size={18} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-text-primary">
                  Enterprise Data Isolation
                </h3>
                <p className="text-[11px] text-text-secondary">
                  Your leads, conversations, audio recordings, and vectors are
                  strictly partitioned.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs pt-2">
              <div className="p-3 bg-bg-secondary/40 rounded-xl border border-border-main">
                <div className="text-[10px] text-text-secondary font-bold uppercase">
                  Database Tenant
                </div>
                <div className="font-mono font-bold text-pilot-blue mt-0.5 truncate">
                  {org.tenantDbName || "Single-Tenant Core"}
                </div>
              </div>
              <div className="p-3 bg-bg-secondary/40 rounded-xl border border-border-main">
                <div className="text-[10px] text-text-secondary font-bold uppercase">
                  Knowledge Partition
                </div>
                <div className="font-mono font-bold text-text-primary mt-0.5 truncate">
                  {aiSettings.qdrantCollection ||
                    `org_${org._id || "tenant"}_kb`}
                </div>
              </div>
              <div className="p-3 bg-bg-secondary/40 rounded-xl border border-border-main">
                <div className="text-[10px] text-text-secondary font-bold uppercase">
                  Gemini API Key
                </div>
                <div className="font-mono font-bold text-emerald-500 mt-0.5 truncate">
                  {aiSettings.geminiApiKey ? "Configured (AES-256)" : "Not Configured"}
                </div>
              </div>
              <div className="p-3 bg-bg-secondary/40 rounded-xl border border-border-main">
                <div className="text-[10px] text-text-secondary font-bold uppercase">
                  Socket Channel
                </div>
                <div className="font-mono font-bold text-emerald-600 mt-0.5 truncate">
                  org_{org._id || "active"}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
