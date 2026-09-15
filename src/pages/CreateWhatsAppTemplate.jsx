import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  ArrowLeft,
  Sparkles,
  Send,
  Image as ImageIcon,
  Video as VideoIcon,
  FileText,
  Type,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Phone,
  Globe,
  CornerDownLeft,
  UploadCloud,
  X,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { API_ENDPOINTS } from "../utils/constants.js";

const CATEGORIES = [
  {
    id: "MARKETING",
    label: "Marketing",
    description: "Promotions, product offers, announcements, and customer engagement.",
  },
  {
    id: "UTILITY",
    label: "Utility",
    description: "Order confirmations, billing, appointment reminders, and account updates.",
  },
  {
    id: "AUTHENTICATION",
    label: "Authentication",
    description: "One-time passwords (OTP) and account verification codes.",
  },
];

const LANGUAGES = [
  { code: "en_US", label: "English (US)" },
  { code: "en_GB", label: "English (UK)" },
  { code: "hi", label: "Hindi (हिन्दी)" },
  { code: "es", label: "Spanish (Español)" },
  { code: "ar", label: "Arabic (العربية)" },
  { code: "pt_BR", label: "Portuguese (BR)" },
  { code: "fr", label: "French (Français)" },
  { code: "de", label: "German (Deutsch)" },
  { code: "id", label: "Indonesian (Bahasa Indonesia)" },
];

export default function CreateWhatsAppTemplate() {
  const navigate = useNavigate();

  // Basic Info
  const [templateName, setTemplateName] = useState("");
  const [category, setCategory] = useState("MARKETING");
  const [language, setLanguage] = useState("en_US");

  // Header
  const [headerType, setHeaderType] = useState("NONE"); // NONE, TEXT, IMAGE, VIDEO, DOCUMENT
  const [headerText, setHeaderText] = useState("");
  const [sampleFile, setSampleFile] = useState(null);
  const [sampleFilePreview, setSampleFilePreview] = useState("");

  // Body
  const [bodyText, setBodyText] = useState("");
  const [sampleVariables, setSampleVariables] = useState({});

  // Footer
  const [footerText, setFooterText] = useState("");

  // Buttons
  const [buttonType, setButtonType] = useState("NONE"); // NONE, QUICK_REPLY, CTA
  const [buttons, setButtons] = useState([]); // [{ type, text, url, phone_number }]

  // Form State
  const [submitting, setSubmitting] = useState(false);
  const [submitProgress, setSubmitProgress] = useState("");
  const [error, setError] = useState("");
  const [successData, setSuccessData] = useState(null);

  // Auto-format name to lowercase snake_case
  const handleNameChange = (val) => {
    const formatted = val
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");
    setTemplateName(formatted);
  };

  // Detect variables like {{1}}, {{2}} from bodyText
  const detectedVariables = useMemo(() => {
    const matches = bodyText.match(/\{\{(\d+)\}\}/g) || [];
    const unique = Array.from(new Set(matches)).sort(
      (a, b) => parseInt(a.replace(/\D/g, "")) - parseInt(b.replace(/\D/g, ""))
    );
    return unique.map((v) => v.replace(/\D/g, ""));
  }, [bodyText]);

  // Insert next variable {{n}} into bodyText
  const handleInsertVariable = () => {
    const nextNum = detectedVariables.length > 0
      ? Math.max(...detectedVariables.map(Number)) + 1
      : 1;
    setBodyText((prev) => `${prev} {{${nextNum}}}`);
  };

  // Add formatting syntax (*bold*, _italic_, ~strike~)
  const handleInsertFormatting = (char) => {
    setBodyText((prev) => `${prev}${char}text${char}`);
  };

  // Sample File selection
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (headerType === "IMAGE" && file.size > 5 * 1024 * 1024) {
      alert("Image size must be 5MB or less.");
      return;
    }
    if (headerType === "VIDEO" && file.size > 16 * 1024 * 1024) {
      alert("Video size must be 16MB or less.");
      return;
    }
    if (headerType === "DOCUMENT" && file.size > 100 * 1024 * 1024) {
      alert("Document size must be 100MB or less.");
      return;
    }

    setSampleFile(file);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => setSampleFilePreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setSampleFilePreview("");
    }
  };

  const removeSampleFile = () => {
    setSampleFile(null);
    setSampleFilePreview("");
  };

  // Button management
  const handleAddButton = (type) => {
    if (buttons.length >= 3) {
      alert("Meta allows a maximum of 3 buttons.");
      return;
    }
    if (type === "QUICK_REPLY") {
      setButtons((prev) => [...prev, { type: "QUICK_REPLY", text: "Quick Action" }]);
    } else if (type === "URL") {
      setButtons((prev) => [
        ...prev,
        { type: "URL", text: "Visit Website", url: "https://" },
      ]);
    } else if (type === "PHONE_NUMBER") {
      setButtons((prev) => [
        ...prev,
        { type: "PHONE_NUMBER", text: "Call Support", phone_number: "+91" },
      ]);
    }
  };

  const handleUpdateButton = (idx, field, value) => {
    setButtons((prev) =>
      prev.map((btn, i) => (i === idx ? { ...btn, [field]: value } : btn))
    );
  };

  const handleRemoveButton = (idx) => {
    setButtons((prev) => prev.filter((_, i) => i !== idx));
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!templateName.trim()) {
      setError("Please enter a valid template name.");
      return;
    }
    if (!bodyText.trim()) {
      setError("Please enter message body text.");
      return;
    }
    if (["IMAGE", "VIDEO", "DOCUMENT"].includes(headerType) && !sampleFile) {
      setError(
        `Meta requires a sample ${headerType.toLowerCase()} file to evaluate and approve media templates.`
      );
      return;
    }

    // Build components
    const components = [];

    // 1. Header
    if (headerType === "TEXT" && headerText.trim()) {
      components.push({
        type: "HEADER",
        format: "TEXT",
        text: headerText.trim(),
      });
    } else if (["IMAGE", "VIDEO", "DOCUMENT"].includes(headerType)) {
      components.push({
        type: "HEADER",
        format: headerType,
      });
    }

    // 2. Body
    components.push({
      type: "BODY",
      text: bodyText.trim(),
    });

    // 3. Footer
    if (footerText.trim()) {
      components.push({
        type: "FOOTER",
        text: footerText.trim(),
      });
    }

    // 4. Buttons
    if (buttons.length > 0) {
      components.push({
        type: "BUTTONS",
        buttons: buttons.map((b) => {
          if (b.type === "QUICK_REPLY") {
            return { type: "QUICK_REPLY", text: b.text };
          }
          if (b.type === "URL") {
            return { type: "URL", text: b.text, url: b.url };
          }
          if (b.type === "PHONE_NUMBER") {
            return {
              type: "PHONE_NUMBER",
              text: b.text,
              phone_number: b.phone_number,
            };
          }
          return b;
        }),
      });
    }

    const templateData = {
      name: templateName.trim(),
      category,
      language,
      components,
      sampleVariables,
    };

    setSubmitting(true);
    setSubmitProgress("Uploading media sample & submitting to Meta Graph API...");

    try {
      let res;
      if (sampleFile) {
        const formData = new FormData();
        formData.append("sampleFile", sampleFile);
        formData.append("template", JSON.stringify(templateData));

        res = await axios.post(API_ENDPOINTS.WHATSAPP_CLOUD.CREATE_TEMPLATE, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        res = await axios.post(
          API_ENDPOINTS.WHATSAPP_CLOUD.CREATE_TEMPLATE,
          templateData
        );
      }

      if (res.data.success) {
        setSuccessData(res.data.data);
      }
    } catch (err) {
      console.error("Template creation failed:", err);
      setError(
        err.response?.data?.message ||
          "Failed to create template on Meta WhatsApp Cloud API."
      );
    } finally {
      setSubmitting(false);
      setSubmitProgress("");
    }
  };

  // Render preview body text with replaced sample variables
  const renderedPreviewBody = useMemo(() => {
    let text = bodyText || "Hi {{1}}, here is your exclusive offer {{2}}!";
    detectedVariables.forEach((vNum) => {
      const sample = sampleVariables[vNum] || `[Variable {{${vNum}}}]`;
      text = text.replaceAll(`{{${vNum}}}`, sample);
    });
    return text;
  }, [bodyText, detectedVariables, sampleVariables]);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => navigate("/whatsapp/templates")}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-purple-600 transition-colors mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Templates</span>
          </button>

          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            <span>Create WhatsApp Message Template</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Design and submit an official Meta-approved template for broadcast campaigns
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Meta Graph API v26.0 Direct Submission</span>
          </span>
        </div>
      </div>

      {/* Main Grid: Form + Live Phone Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Configurator (7 Cols) */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-5">
          {/* Error Banner */}
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Template Creation Failed</p>
                <p className="mt-0.5 leading-relaxed">{error}</p>
              </div>
            </div>
          )}

          {/* Section 1: Basic Information */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                1. Template Basics
              </h2>
              <p className="text-xs text-slate-500">
                Identifiers and classification for Meta&apos;s review process
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Template Name */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Template Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. festive_offer_discount_2026"
                  value={templateName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  maxLength={512}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                  required
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Only lowercase letters, numbers, and underscores are allowed. No spaces.
                </p>
              </div>

              {/* Category */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Category <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {CATEGORIES.map((cat) => {
                    const active = category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          active
                            ? "border-purple-600 bg-purple-50/30 dark:bg-purple-950/30 ring-1 ring-purple-600"
                            : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900"
                        }`}
                      >
                        <p
                          className={`text-xs font-bold ${
                            active
                              ? "text-purple-700 dark:text-purple-300"
                              : "text-slate-800 dark:text-slate-200"
                          }`}
                        >
                          {cat.label}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1 leading-snug">
                          {cat.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Language */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Language <span className="text-rose-500">*</span>
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.label} ({lang.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Header (Media or Text) */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  2. Header (Optional)
                </h2>
                <p className="text-xs text-slate-500">
                  Add a prominent visual header or text title to your message
                </p>
              </div>
              <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400">
                Media & Text Supported
              </span>
            </div>

            {/* Header Format Tabs */}
            <div className="flex flex-wrap gap-2">
              {[
                { id: "NONE", label: "None", icon: null },
                { id: "TEXT", label: "Text", icon: Type },
                { id: "IMAGE", label: "Image", icon: ImageIcon },
                { id: "VIDEO", label: "Video", icon: VideoIcon },
                { id: "DOCUMENT", label: "Document", icon: FileText },
              ].map((tab) => {
                const Icon = tab.icon;
                const active = headerType === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setHeaderType(tab.id);
                      if (tab.id === "NONE") {
                        setHeaderText("");
                        removeSampleFile();
                      }
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      active
                        ? "bg-purple-600 text-white shadow-xs font-bold"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    {Icon && <Icon className="w-3.5 h-3.5" />}
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Conditional Content for Header */}
            {headerType === "TEXT" && (
              <div className="space-y-1.5 pt-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Header Text (Max 60 characters)
                </label>
                <input
                  type="text"
                  maxLength={60}
                  placeholder="e.g. Exclusive Weekend Special"
                  value={headerText}
                  onChange={(e) => setHeaderText(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            )}

            {["IMAGE", "VIDEO", "DOCUMENT"].includes(headerType) && (
              <div className="space-y-3 pt-2">
                <div className="p-3.5 rounded-xl bg-purple-50/40 dark:bg-purple-950/20 border border-purple-200/50 dark:border-purple-900/40 text-xs text-slate-600 dark:text-slate-300">
                  <p className="font-semibold text-purple-700 dark:text-purple-300 flex items-center gap-1.5 mb-1">
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Meta Sample Media Requirement</span>
                  </p>
                  <p className="text-[11px] leading-relaxed">
                    Meta requires an actual sample {headerType.toLowerCase()} file for review
                    evaluation. Upload your sample file below. During campaign delivery, you
                    can supply personalized files or URLs.
                  </p>
                </div>

                {sampleFile ? (
                  <div className="flex items-center justify-between p-3 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/20">
                    <div className="flex items-center gap-2.5">
                      {headerType === "IMAGE" ? (
                        <ImageIcon className="w-5 h-5 text-emerald-600" />
                      ) : headerType === "VIDEO" ? (
                        <VideoIcon className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <FileText className="w-5 h-5 text-emerald-600" />
                      )}
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-xs">
                          {sampleFile.name}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {(sampleFile.size / 1024 / 1024).toFixed(2)} MB • Ready for Meta review
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={removeSampleFile}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                      title="Remove file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-purple-500 dark:hover:border-purple-500 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all bg-slate-50/30 dark:bg-slate-800/10">
                    <UploadCloud className="w-8 h-8 text-purple-600 dark:text-purple-400 mb-2" />
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Upload Sample {headerType}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {headerType === "IMAGE" && "JPEG or PNG (Max 5MB)"}
                      {headerType === "VIDEO" && "MP4 (Max 16MB)"}
                      {headerType === "DOCUMENT" && "PDF, DOCX, XLSX (Max 100MB)"}
                    </p>
                    <input
                      type="file"
                      className="hidden"
                      accept={
                        headerType === "IMAGE"
                          ? "image/png,image/jpeg"
                          : headerType === "VIDEO"
                          ? "video/mp4"
                          : ".pdf,.doc,.docx,.xls,.xlsx,.txt"
                      }
                      onChange={handleFileChange}
                    />
                  </label>
                )}
              </div>
            )}
          </div>

          {/* Section 3: Message Body & Variables */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  3. Message Body <span className="text-rose-500">*</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Compose the message content. Use formatting and variables as needed.
                </p>
              </div>

              <span className="text-[11px] font-mono text-slate-400">
                {bodyText.length} / 1024
              </span>
            </div>

            {/* Quick Formatting & Variable Tools */}
            <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handleInsertVariable}
                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-600 text-white hover:bg-purple-700 transition-all flex items-center gap-1 shadow-2xs"
              >
                <Plus className="w-3 h-3" />
                <span>Add Variable</span>
              </button>

              <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" />

              <button
                type="button"
                onClick={() => handleInsertFormatting("*")}
                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                title="Bold"
              >
                *Bold*
              </button>

              <button
                type="button"
                onClick={() => handleInsertFormatting("_")}
                className="px-2.5 py-1 rounded-lg text-xs font-style-italic bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 italic"
                title="Italic"
              >
                _Italic_
              </button>

              <button
                type="button"
                onClick={() => handleInsertFormatting("~")}
                className="px-2.5 py-1 rounded-lg text-xs line-through bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                title="Strikethrough"
              >
                ~Strike~
              </button>
            </div>

            {/* Body Textarea */}
            <textarea
              rows={6}
              maxLength={1024}
              placeholder="Hi {{1}}, we're excited to offer you a special {{2}} discount on our services. Reply to this message to claim your voucher!"
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              className="w-full p-3.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500 leading-relaxed font-sans"
              required
            />

            {/* Dynamic Variable Samples Section */}
            {detectedVariables.length > 0 && (
              <div className="pt-2 space-y-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    <span>Sample Values for Meta Approval</span>
                  </p>
                  <span className="text-[10px] text-slate-400">
                    {detectedVariables.length} variable{detectedVariables.length > 1 ? "s" : ""} detected
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Meta requires real sample values for each variable to evaluate your template.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {detectedVariables.map((vNum) => (
                    <div key={vNum}>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        Sample for <span className="font-mono text-purple-600">{`{{${vNum}}}`}</span>
                      </label>
                      <input
                        type="text"
                        placeholder={`e.g. John or 20%`}
                        value={sampleVariables[vNum] || ""}
                        onChange={(e) =>
                          setSampleVariables((prev) => ({
                            ...prev,
                            [vNum]: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
                        required
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Footer */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  4. Footer (Optional)
                </h2>
                <p className="text-xs text-slate-500">
                  Short disclaimer, terms, or unsubscribe instructions (Max 60 chars)
                </p>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                {footerText.length} / 60
              </span>
            </div>

            <input
              type="text"
              maxLength={60}
              placeholder="e.g. Reply STOP to opt out"
              value={footerText}
              onChange={(e) => setFooterText(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Section 5: Interactive Buttons */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  5. Action Buttons (Optional)
                </h2>
                <p className="text-xs text-slate-500">
                  Allow recipients to reply instantly, call, or open a website
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleAddButton("QUICK_REPLY")}
                  disabled={buttons.length >= 3}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 hover:bg-purple-100 disabled:opacity-50 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Quick Reply</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddButton("URL")}
                  disabled={buttons.length >= 3}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 disabled:opacity-50 flex items-center gap-1"
                >
                  <Globe className="w-3 h-3" />
                  <span>Website URL</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddButton("PHONE_NUMBER")}
                  disabled={buttons.length >= 3}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 disabled:opacity-50 flex items-center gap-1"
                >
                  <Phone className="w-3 h-3" />
                  <span>Phone Call</span>
                </button>
              </div>
            </div>

            {/* Render configured buttons */}
            {buttons.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">
                No buttons configured. Click the buttons above to add Quick Replies, a Website URL, or a Phone Number.
              </p>
            ) : (
              <div className="space-y-3">
                {buttons.map((btn, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between"
                  >
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                          {btn.type.replace("_", " ")} Button Text
                        </span>
                        <input
                          type="text"
                          maxLength={25}
                          value={btn.text}
                          onChange={(e) =>
                            handleUpdateButton(idx, "text", e.target.value)
                          }
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                          required
                        />
                      </div>

                      {btn.type === "URL" && (
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                            Destination URL
                          </span>
                          <input
                            type="url"
                            value={btn.url || ""}
                            onChange={(e) =>
                              handleUpdateButton(idx, "url", e.target.value)
                            }
                            className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            required
                          />
                        </div>
                      )}

                      {btn.type === "PHONE_NUMBER" && (
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                            Phone (with country code)
                          </span>
                          <input
                            type="text"
                            value={btn.phone_number || ""}
                            onChange={(e) =>
                              handleUpdateButton(idx, "phone_number", e.target.value)
                            }
                            className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            required
                          />
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveButton(idx)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate("/whatsapp/templates")}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white transition-all shadow-md flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{submitProgress || "Submitting to Meta..."}</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit to Meta for Review</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Right Column: Live WhatsApp Smartphone Mockup (5 Cols) */}
        <div className="lg:col-span-5 lg:sticky lg:top-6 space-y-4">
          <div className="bg-slate-900 rounded-[38px] p-3 shadow-2xl border-4 border-slate-800 max-w-sm mx-auto w-full">
            {/* Phone Speaker & Camera Notch */}
            <div className="w-28 h-4 bg-slate-800 rounded-full mx-auto mb-2" />

            {/* Screen Inner */}
            <div className="rounded-[28px] overflow-hidden bg-[#EFEAE2] dark:bg-[#0b141a] flex flex-col min-h-[540px] border border-slate-700/50 shadow-inner">
              {/* WhatsApp Header Bar */}
              <div className="bg-[#008069] dark:bg-[#202c33] px-3.5 py-3 text-white flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs">
                    SB
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <p className="text-xs font-bold leading-tight">
                        Sales Pilot CRM
                      </p>
                      <ShieldCheck className="w-3 h-3 text-emerald-300" />
                    </div>
                    <p className="text-[9px] text-emerald-100/80">Official Business</p>
                  </div>
                </div>

                <div className="text-[10px] text-emerald-100 font-mono">12:00 PM</div>
              </div>

              {/* Chat Message Canvas */}
              <div className="p-3.5 flex-1 flex flex-col justify-end space-y-2">
                {/* Bubble Container */}
                <div className="bg-white dark:bg-[#1f2c34] rounded-2xl rounded-tl-none shadow-xs border border-black/5 dark:border-white/5 overflow-hidden max-w-[92%]">
                  {/* Header Component Preview */}
                  {headerType === "TEXT" && headerText && (
                    <div className="p-3 pb-1 text-xs font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-700">
                      {headerText}
                    </div>
                  )}

                  {headerType === "IMAGE" && (
                    <div className="w-full h-40 bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden">
                      {sampleFilePreview ? (
                        <img
                          src={sampleFilePreview}
                          alt="Header Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center p-4 text-slate-400">
                          <ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-60" />
                          <span className="text-[10px] font-semibold">Image Header</span>
                        </div>
                      )}
                    </div>
                  )}

                  {headerType === "VIDEO" && (
                    <div className="w-full h-40 bg-slate-800 flex flex-col items-center justify-center text-white p-4">
                      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-1">
                        <VideoIcon className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-[10px] text-slate-300">
                        {sampleFile ? sampleFile.name : "Video Header Preview"}
                      </span>
                    </div>
                  )}

                  {headerType === "DOCUMENT" && (
                    <div className="p-3 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {sampleFile ? sampleFile.name : "Document.pdf"}
                        </p>
                        <p className="text-[10px] text-slate-400">PDF Document</p>
                      </div>
                    </div>
                  )}

                  {/* Body Content Preview */}
                  <div className="p-3 text-xs text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed font-sans">
                    {renderedPreviewBody}
                  </div>

                  {/* Footer Content Preview */}
                  {footerText && (
                    <div className="px-3 pb-1 text-[10px] text-slate-400 italic">
                      {footerText}
                    </div>
                  )}

                  {/* Timestamp & Double Ticks */}
                  <div className="px-3 pb-2 flex items-center justify-end gap-1 text-[9px] text-slate-400">
                    <span>12:01 PM</span>
                    <span className="text-sky-500 font-bold">✓✓</span>
                  </div>

                  {/* Action Buttons in Bubble */}
                  {buttons.length > 0 && (
                    <div className="border-t border-slate-100 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700">
                      {buttons.map((btn, idx) => (
                        <div
                          key={idx}
                          className="w-full py-2 px-3 text-center text-xs font-semibold text-[#00a884] hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5"
                        >
                          {btn.type === "QUICK_REPLY" && (
                            <CornerDownLeft className="w-3 h-3 text-[#00a884]" />
                          )}
                          {btn.type === "URL" && (
                            <Globe className="w-3 h-3 text-[#00a884]" />
                          )}
                          {btn.type === "PHONE_NUMBER" && (
                            <Phone className="w-3 h-3 text-[#00a884]" />
                          )}
                          <span>{btn.text || "Action Button"}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Guidelines info card */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-2 shadow-xs">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-purple-600" />
              <span>Meta Review & Approval</span>
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
              Standard utility and marketing templates are typically approved within minutes by
              Meta&apos;s automated validation engine. Once approved, the template can be used in
              any broadcast campaign.
            </p>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {successData && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Template Created on Meta!
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Your message template has been successfully registered with Meta WhatsApp Cloud API.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-left text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Template Name:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {successData.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Meta ID:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">
                  {successData.metaTemplateId}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Approval Status:</span>
                <span
                  className={`font-bold px-2 py-0.5 rounded-md text-[10px] ${
                    successData.status === "APPROVED"
                      ? "bg-emerald-500/10 text-emerald-600"
                      : "bg-amber-500/10 text-amber-600"
                  }`}
                >
                  {successData.status || "PENDING"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => navigate("/whatsapp/templates")}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50"
              >
                View Templates
              </button>

              <button
                type="button"
                onClick={() =>
                  navigate(`/whatsapp/campaigns/create?templateId=${successData._id || successData.id}`)
                }
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-purple-600 text-white hover:bg-purple-700 transition-all shadow-xs"
              >
                Use in Campaign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
