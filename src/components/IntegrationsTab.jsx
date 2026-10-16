import React, { useState } from "react";
import axios from "axios";
import {
  Globe,
  Key,
  Copy,
  Check,
  ShieldCheck,
  Eye,
  EyeOff,
  RefreshCw,
  Send,
  Terminal,
  Code,
  FileCode,
  Sparkles,
  Info,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Phone,
  Layers,
  FileText,
  Paperclip,
} from "lucide-react";
import { BACKEND_URL } from "../utils/constants.js";

const VALID_STATUSES = [
  "New",
  "Follow Up",
  "Converted",
  "Not Interested",
  "Not Attended",
  "Price Issue",
  "Missed Call",
];

export default function IntegrationsTab({ orgData, onRefreshOrg }) {
  const orgId = orgData?._id || "";
  const webhookKey = orgData?.webhookKey || "";

  // Clipboard copy states
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedWebsiteUrl, setCopiedWebsiteUrl] = useState(false);
  const [copiedWebhookUrl, setCopiedWebhookUrl] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);
  const [copiedJs, setCopiedJs] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);

  // Visibility states
  const [showSecret, setShowSecret] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [activeCodeTab, setActiveCodeTab] = useState("html"); // "html" | "js" | "curl"

  // Live Tester: Website Lead Form
  const [websiteTest, setWebsiteTest] = useState({
    name: "",
    mobile: "",
    service: "General Enquiry",
    message: "",
  });
  const [websiteTesting, setWebsiteTesting] = useState(false);
  const [websiteResult, setWebsiteResult] = useState(null);

  // Live Tester: Lead Status Webhook
  const [webhookTest, setWebhookTest] = useState({
    phone: "",
    status: "Converted",
  });
  const [webhookTesting, setWebhookTesting] = useState(false);
  const [webhookResult, setWebhookResult] = useState(null);

  // Live Tester: Send WhatsApp Document
  const [docTest, setDocTest] = useState({
    phone: "",
    caption: "",
    file: null,
  });
  const [docTesting, setDocTesting] = useState(false);
  const [docResult, setDocResult] = useState(null);
  const [copiedDocUrl, setCopiedDocUrl] = useState(false);
  const [copiedDocCurl, setCopiedDocCurl] = useState(false);
  const [copiedDocJs, setCopiedDocJs] = useState(false);
  const [activeDocCodeTab, setActiveDocCodeTab] = useState("curl"); // "curl" | "js"

  const websiteEndpointUrl = `${BACKEND_URL}/api/website/lead?orgId=${orgId}`;
  const webhookEndpointUrl = `${BACKEND_URL}/api/leads/webhook/status`;
  const docEndpointUrl = `${BACKEND_URL}/api/whatsapp/send-document`;

  const copyToClipboard = (text, setter) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2500);
  };

  const handleRegenerateKey = async () => {
    if (
      !window.confirm(
        "Are you sure you want to regenerate your Organization Webhook Secret? Any existing external webhooks using the current key will stop working until updated."
      )
    ) {
      return;
    }

    setRegenerating(true);
    try {
      const token =
        localStorage.getItem("salesbuster_token") ||
        localStorage.getItem("kranthi_token");
      const res = await axios.post(
        `${BACKEND_URL}/api/organizations/my-org/regenerate-webhook-key`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data?.success && onRefreshOrg) {
        await onRefreshOrg();
      }
    } catch (err) {
      alert(
        err.response?.data?.message ||
          "Failed to regenerate webhook key. Please try again."
      );
    } finally {
      setRegenerating(false);
    }
  };

  // Submit test website lead
  const handleTestWebsiteLead = async (e) => {
    e.preventDefault();
    if (!websiteTest.name || !websiteTest.mobile) {
      alert("Please provide both Full Name and Mobile Number for testing.");
      return;
    }

    setWebsiteTesting(true);
    setWebsiteResult(null);

    try {
      const res = await axios.post(websiteEndpointUrl, {
        name: websiteTest.name,
        mobile: websiteTest.mobile,
        service: websiteTest.service || "General Enquiry",
        message: websiteTest.message,
        organizationId: orgId,
      });

      setWebsiteResult({
        success: true,
        data: res.data,
      });
    } catch (err) {
      setWebsiteResult({
        success: false,
        error:
          err.response?.data?.message ||
          err.response?.data?.errors?.join(", ") ||
          err.message,
      });
    } finally {
      setWebsiteTesting(false);
    }
  };

  // Submit test status update webhook
  const handleTestWebhookStatus = async (e) => {
    e.preventDefault();
    if (!webhookTest.phone) {
      alert("Please enter a customer phone number to test status update.");
      return;
    }

    setWebhookTesting(true);
    setWebhookResult(null);

    try {
      const res = await axios.post(
        webhookEndpointUrl,
        {
          phone: webhookTest.phone,
          status: webhookTest.status,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "x-webhook-secret": webhookKey,
          },
        }
      );

      setWebhookResult({
        success: true,
        data: res.data,
      });
    } catch (err) {
      setWebhookResult({
        success: false,
        error: err.response?.data?.message || err.message,
      });
    } finally {
      setWebhookTesting(false);
    }
  };

  const sampleHtmlSnippet = `<!-- SalesBuster CRM Inbound Lead Form -->
<form action="${websiteEndpointUrl}" method="POST">
  <!-- Customer Contact Info -->
  <label for="name">Full Name *</label>
  <input type="text" id="name" name="name" required placeholder="John Doe" />

  <label for="mobile">Mobile Number *</label>
  <input type="tel" id="mobile" name="mobile" required placeholder="9876543210" />

  <label for="email">Email Address</label>
  <input type="email" id="email" name="email" placeholder="john@example.com" />

  <!-- Requested Service -->
  <label for="service">Service</label>
  <input type="text" id="service" name="service" value="General Enquiry" />

  <!-- Inquiry Message -->
  <label for="message">Requirements / Message</label>
  <textarea id="message" name="message" rows="3" placeholder="I would like more information..."></textarea>

  <button type="submit">Submit Enquiry</button>
</form>`;

  const sampleJsSnippet = `// Submit website form lead to SalesBuster CRM
async function submitLeadToCRM(formData) {
  try {
    const response = await fetch("${websiteEndpointUrl}", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: formData.name,       // Required
        mobile: formData.mobile,   // Required (10 digits)
        email: formData.email,     // Optional
        service: formData.service || "General Enquiry",
        city: formData.city || "",
        message: formData.message || "",
      }),
    });

    const result = await response.json();
    if (result.success) {
      console.log("Lead captured! ID:", result.leadId);
      // Show confirmation message to website visitor
    } else {
      console.error("Submission failed:", result.message);
    }
  } catch (error) {
    console.error("Network error submitting lead:", error);
  }
}`;

  const sampleWebhookCurl = `curl -X POST "${webhookEndpointUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${webhookKey || "<YOUR_WEBHOOK_SECRET>"}" \\
  -d '{
    "phone": "9876543210",
    "status": "Converted"
  }'`;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* ── HEADER BANNER ──────────────────────────────────────────────── */}
      <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-pilot-blue/15 via-indigo-600/10 to-bg-card border border-pilot-blue/30 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-pilot-blue text-white shadow-xs">
                <Globe size={11} className="animate-spin" style={{ animationDuration: "12s" }} />
                External Integrations
              </span>
              <span className="text-[11px] font-bold text-text-secondary">
                REST APIs & Webhooks
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-text-primary tracking-tight">
              Website Lead Capture & Status Update Webhook
            </h2>
            <p className="text-xs text-text-secondary max-w-2xl leading-relaxed">
              Connect external contact forms to automatically capture incoming leads in your CRM, and use our secured status webhook to update lead stages directly using the customer's phone number.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* SECTION 1: WEBSITE LEAD CAPTURE                                   */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <div className="bg-bg-card border border-border-main rounded-3xl p-6 sm:p-7 space-y-6 shadow-xs flex flex-col justify-between">
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-pilot-blue/10 text-pilot-blue flex items-center justify-center shrink-0 border border-pilot-blue/20">
                  <Globe size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-text-primary tracking-tight">
                    1. Receive Leads from Website
                  </h3>
                  <p className="text-xs text-text-secondary">
                    Inbound form integration for landing pages & WordPress
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                Active Inbound Endpoint
              </span>
            </div>

            {/* Inbound Endpoint URL Box */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider block">
                Form Submission Endpoint (POST)
              </label>
              <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-bg-secondary border border-border-main">
                <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-black uppercase">
                  POST
                </span>
                <input
                  type="text"
                  readOnly
                  value={websiteEndpointUrl}
                  className="bg-transparent border-none text-text-primary text-xs font-mono flex-1 outline-none min-w-0"
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(websiteEndpointUrl, setCopiedWebsiteUrl)}
                  className="p-1.5 rounded-xl hover:bg-bg-card text-text-secondary hover:text-text-primary transition-colors cursor-pointer shrink-0"
                  title="Copy endpoint URL"
                >
                  {copiedWebsiteUrl ? (
                    <Check size={14} className="text-emerald-500" />
                  ) : (
                    <Copy size={14} />
                  )}
                </button>
              </div>
            </div>

            {/* Highlights Grid */}
            <div className="grid grid-cols-2 gap-2.5 text-[11px]">
              <div className="p-3 rounded-2xl bg-bg-secondary/60 border border-border-main/70 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-text-primary">
                  <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                  <span>Round-Robin Auto Assign</span>
                </div>
                <p className="text-[10px] text-text-secondary leading-normal">
                  Evenly distributes new leads among your active sales reps.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-bg-secondary/60 border border-border-main/70 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-text-primary">
                  <Sparkles size={13} className="text-pilot-blue shrink-0" />
                  <span>Real-Time Notifications</span>
                </div>
                <p className="text-[10px] text-text-secondary leading-normal">
                  Pushes immediate socket alerts to reps currently on dashboard.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-bg-secondary/60 border border-border-main/70 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-text-primary">
                  <Send size={13} className="text-purple-500 shrink-0" />
                  <span>WhatsApp Greeting</span>
                </div>
                <p className="text-[10px] text-text-secondary leading-normal">
                  Dispatches automated WhatsApp welcome enquiry message.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-bg-secondary/60 border border-border-main/70 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-text-primary">
                  <Layers size={13} className="text-amber-500 shrink-0" />
                  <span>Thread Duplication</span>
                </div>
                <p className="text-[10px] text-text-secondary leading-normal">
                  Updates notes & timestamp if the same number submits again.
                </p>
              </div>
            </div>

            {/* Code Embed Tabs */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">
                  Ready-to-use Code Snippets
                </span>
                <div className="flex items-center gap-1 bg-bg-secondary p-1 rounded-xl border border-border-main text-[11px]">
                  <button
                    type="button"
                    onClick={() => setActiveCodeTab("html")}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      activeCodeTab === "html"
                        ? "bg-pilot-blue text-white shadow-2xs"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    HTML Form
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveCodeTab("js")}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      activeCodeTab === "js"
                        ? "bg-pilot-blue text-white shadow-2xs"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    JavaScript (Fetch)
                  </button>
                </div>
              </div>

              <div className="relative rounded-2xl bg-slate-950 p-4 font-mono text-[11px] text-slate-200 border border-slate-800 overflow-x-auto max-h-[170px]">
                <pre>{activeCodeTab === "html" ? sampleHtmlSnippet : sampleJsSnippet}</pre>
                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(
                      activeCodeTab === "html" ? sampleHtmlSnippet : sampleJsSnippet,
                      activeCodeTab === "html" ? setCopiedHtml : setCopiedJs
                    )
                  }
                  className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-sans font-bold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  {(activeCodeTab === "html" ? copiedHtml : copiedJs) ? (
                    <>
                      <Check size={12} className="text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy size={12} />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Live Tester: Website Form */}
          <div className="pt-4 border-t border-border-main/70 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-pilot-blue" />
              <h4 className="text-xs font-black text-text-primary uppercase tracking-wide">
                Live Tester: Send Test Website Lead
              </h4>
            </div>

            <form onSubmit={handleTestWebsiteLead} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <input
                    type="text"
                    required
                    placeholder="Visitor Name *"
                    value={websiteTest.name}
                    onChange={(e) => setWebsiteTest({ ...websiteTest, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-bg-secondary border border-border-main text-text-primary text-xs outline-none focus:border-pilot-blue"
                  />
                </div>
                <div>
                  <input
                    type="tel"
                    required
                    placeholder="10-digit Mobile Number *"
                    value={websiteTest.mobile}
                    onChange={(e) => setWebsiteTest({ ...websiteTest, mobile: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-bg-secondary border border-border-main text-text-primary text-xs outline-none focus:border-pilot-blue"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <input
                    type="text"
                    placeholder="Service (e.g. Consultation)"
                    value={websiteTest.service}
                    onChange={(e) => setWebsiteTest({ ...websiteTest, service: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-bg-secondary border border-border-main text-text-primary text-xs outline-none focus:border-pilot-blue"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Inquiry Message (Optional)"
                    value={websiteTest.message}
                    onChange={(e) => setWebsiteTest({ ...websiteTest, message: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-bg-secondary border border-border-main text-text-primary text-xs outline-none focus:border-pilot-blue"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <span className="text-[10px] text-text-secondary">
                  Tests lead reception directly into your tenant database.
                </span>
                <button
                  type="submit"
                  disabled={websiteTesting}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-pilot-blue hover:bg-pilot-blue-hover text-white text-xs font-black transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {websiteTesting ? (
                    <RefreshCw size={13} className="animate-spin" />
                  ) : (
                    <Send size={13} />
                  )}
                  <span>{websiteTesting ? "Submitting..." : "Send Test Lead"}</span>
                </button>
              </div>
            </form>

            {websiteResult && (
              <div
                className={`p-3 rounded-2xl text-xs font-medium flex items-start gap-2 animate-fadeIn ${
                  websiteResult.success
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                    : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                }`}
              >
                {websiteResult.success ? (
                  <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                )}
                <div>
                  <strong>{websiteResult.success ? "Success!" : "Submission Error:"}</strong>{" "}
                  {websiteResult.success
                    ? `Lead created with ID: ${websiteResult.data?.leadId}. Check your Leads Directory!`
                    : websiteResult.error}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* SECTION 2: LEAD STATUS UPDATE WEBHOOK                              */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <div className="bg-bg-card border border-border-main rounded-3xl p-6 sm:p-7 space-y-6 shadow-xs flex flex-col justify-between">
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/20">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-text-primary tracking-tight">
                    2. Update Lead Status Webhook
                  </h3>
                  <p className="text-xs text-text-secondary">
                    Secure status synchronization for external diallers & CRMs
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 shrink-0">
                Phone Number Lookup
              </span>
            </div>

            {/* Strict Guard Banner */}
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5 text-xs text-amber-700 dark:text-amber-300">
              <ShieldCheck size={16} className="shrink-0 mt-0.5 text-amber-500" />
              <div className="leading-relaxed">
                <strong>Strict Status Guard:</strong> This webhook is strictly restricted to updating the <strong>status</strong> field only. Any other fields passed in the payload (name, email, notes, sales rep, deal value) are strictly protected against modification.
              </div>
            </div>

            {/* Webhook Endpoint Box */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider block">
                Webhook Endpoint (POST)
              </label>
              <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-bg-secondary border border-border-main">
                <span className="px-2 py-0.5 rounded-lg bg-purple-500/20 text-purple-600 dark:text-purple-400 font-mono text-[10px] font-black uppercase">
                  POST
                </span>
                <input
                  type="text"
                  readOnly
                  value={webhookEndpointUrl}
                  className="bg-transparent border-none text-text-primary text-xs font-mono flex-1 outline-none min-w-0"
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(webhookEndpointUrl, setCopiedWebhookUrl)}
                  className="p-1.5 rounded-xl hover:bg-bg-card text-text-secondary hover:text-text-primary transition-colors cursor-pointer shrink-0"
                  title="Copy webhook URL"
                >
                  {copiedWebhookUrl ? (
                    <Check size={14} className="text-emerald-500" />
                  ) : (
                    <Copy size={14} />
                  )}
                </button>
              </div>
            </div>

            {/* Organization Secret Key */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider block">
                  Organization Webhook Secret (Header: x-webhook-secret)
                </label>
                <button
                  type="button"
                  onClick={handleRegenerateKey}
                  disabled={regenerating}
                  className="text-[10px] font-bold text-pilot-blue hover:underline cursor-pointer flex items-center gap-1 disabled:opacity-50"
                >
                  <RefreshCw size={11} className={regenerating ? "animate-spin" : ""} />
                  <span>Regenerate Secret</span>
                </button>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-bg-secondary border border-border-main">
                <Key size={14} className="text-purple-500 shrink-0" />
                <input
                  type={showSecret ? "text" : "password"}
                  readOnly
                  value={webhookKey || "sb_whk_not_configured"}
                  className="bg-transparent border-none text-text-primary text-xs font-mono flex-1 outline-none min-w-0"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="p-1 rounded-lg text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                  title={showSecret ? "Hide secret" : "Reveal secret"}
                >
                  {showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button
                  type="button"
                  onClick={() => copyToClipboard(webhookKey, setCopiedKey)}
                  className="p-1.5 rounded-xl hover:bg-bg-card text-text-secondary hover:text-text-primary transition-colors cursor-pointer shrink-0"
                  title="Copy webhook secret"
                >
                  {copiedKey ? (
                    <Check size={14} className="text-emerald-500" />
                  ) : (
                    <Copy size={14} />
                  )}
                </button>
              </div>
            </div>

            {/* Valid Status Values */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider block">
                Allowed Status Values
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {VALID_STATUSES.map((st) => (
                  <span
                    key={st}
                    className="px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold bg-bg-secondary border border-border-main text-text-primary shadow-2xs"
                  >
                    "{st}"
                  </span>
                ))}
              </div>
            </div>

            {/* cURL Command Snippet */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">
                  cURL Webhook Call Example
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(sampleWebhookCurl, setCopiedCurl)}
                  className="text-[10px] font-bold text-pilot-blue hover:underline cursor-pointer flex items-center gap-1"
                >
                  {copiedCurl ? (
                    <>
                      <Check size={11} className="text-emerald-500" />
                      <span className="text-emerald-500">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy size={11} />
                      <span>Copy cURL</span>
                    </>
                  )}
                </button>
              </div>

              <div className="rounded-2xl bg-slate-950 p-4 font-mono text-[11px] text-slate-200 border border-slate-800 overflow-x-auto max-h-[120px]">
                <pre>{sampleWebhookCurl}</pre>
              </div>
            </div>
          </div>

          {/* Interactive Live Tester: Status Update Webhook */}
          <div className="pt-4 border-t border-border-main/70 space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck size={14} className="text-purple-500" />
              <h4 className="text-xs font-black text-text-primary uppercase tracking-wide">
                Live Tester: Test Status Update by Phone
              </h4>
            </div>

            <form onSubmit={handleTestWebhookStatus} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <input
                    type="tel"
                    required
                    placeholder="Customer Phone (e.g. 9876543210) *"
                    value={webhookTest.phone}
                    onChange={(e) => setWebhookTest({ ...webhookTest, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-bg-secondary border border-border-main text-text-primary text-xs outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <select
                    value={webhookTest.status}
                    onChange={(e) => setWebhookTest({ ...webhookTest, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-bg-secondary border border-border-main text-text-primary text-xs outline-none focus:border-purple-500 cursor-pointer"
                  >
                    {VALID_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <span className="text-[10px] text-text-secondary">
                  Locates the lead in your tenant DB by phone and updates its status.
                </span>
                <button
                  type="submit"
                  disabled={webhookTesting}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {webhookTesting ? (
                    <RefreshCw size={13} className="animate-spin" />
                  ) : (
                    <Check size={13} />
                  )}
                  <span>{webhookTesting ? "Updating..." : "Test Webhook"}</span>
                </button>
              </div>
            </form>

            {webhookResult && (
              <div
                className={`p-3 rounded-2xl text-xs font-medium flex items-start gap-2 animate-fadeIn ${
                  webhookResult.success
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                    : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                }`}
              >
                {webhookResult.success ? (
                  <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                )}
                <div>
                  <strong>{webhookResult.success ? "Status Updated!" : "Webhook Error:"}</strong>{" "}
                  {webhookResult.success
                    ? webhookResult.data?.message || "Lead status updated successfully."
                    : webhookResult.error}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CARD 3: SEND WHATSAPP DOCUMENT (PDF/WORD DOCX) WITH TEXT */}
      <div className="rounded-3xl border border-border-main bg-bg-card p-6 shadow-sm space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
              <FileText size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-text-primary">
                  Send WhatsApp Document with Text (PDF / Word)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                  Document API
                </span>
              </div>
              <p className="text-xs text-text-secondary mt-0.5">
                Dispatch PDF or Word documents (.pdf, .docx, .doc) with accompanying text/caption to any phone number from your organization.
              </p>
            </div>
          </div>
        </div>

        {/* Endpoint URL Pill */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">
            Document Send Endpoint (POST Multipart Form-Data)
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 px-4 py-2.5 rounded-2xl bg-bg-secondary border border-border-main font-mono text-xs text-text-primary truncate select-all">
              {docEndpointUrl}
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(docEndpointUrl, setCopiedDocUrl)}
              className="px-3 py-2.5 rounded-2xl bg-bg-secondary hover:bg-border-main/40 border border-border-main text-text-secondary hover:text-text-primary text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              {copiedDocUrl ? (
                <>
                  <Check size={14} className="text-emerald-500" />
                  <span className="text-emerald-500">Copied</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Payload Specs & Code Snippets Tabs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-2">
          {/* Field Reference */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-text-primary uppercase tracking-wide">
              Request Parameters Reference
            </h4>
            <div className="rounded-2xl border border-border-main bg-bg-secondary/40 p-3.5 space-y-2 text-xs">
              <div className="flex items-start justify-between pb-2 border-b border-border-main/50">
                <span className="font-mono font-bold text-teal-600 dark:text-teal-400">phone</span>
                <span className="text-text-secondary text-[11px]">Required • Recipient phone number (e.g. 9876543210)</span>
              </div>
              <div className="flex items-start justify-between pb-2 border-b border-border-main/50">
                <span className="font-mono font-bold text-teal-600 dark:text-teal-400">file</span>
                <span className="text-text-secondary text-[11px]">Required • .pdf, .docx, or .doc file (max 25 MB)</span>
              </div>
              <div className="flex items-start justify-between pb-2 border-b border-border-main/50">
                <span className="font-mono font-bold text-teal-600 dark:text-teal-400">caption / text</span>
                <span className="text-text-secondary text-[11px]">Optional • Accompanying message text/caption</span>
              </div>
              <div className="flex items-start justify-between">
                <span className="font-mono font-bold text-teal-600 dark:text-teal-400">Headers</span>
                <span className="text-text-secondary text-[11px]">x-webhook-secret: &lt;your_key&gt; or Bearer token</span>
              </div>
            </div>
          </div>

          {/* Code Snippets */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 p-0.5 rounded-xl bg-bg-secondary border border-border-main">
                <button
                  type="button"
                  onClick={() => setActiveDocCodeTab("curl")}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    activeDocCodeTab === "curl"
                      ? "bg-bg-card text-teal-600 dark:text-teal-400 shadow-xs"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  cURL
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDocCodeTab("js")}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    activeDocCodeTab === "js"
                      ? "bg-bg-card text-teal-600 dark:text-teal-400 shadow-xs"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  JavaScript
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  const snippet =
                    activeDocCodeTab === "curl"
                      ? `curl -X POST "${docEndpointUrl}" \\\n  -H "x-webhook-secret: ${webhookKey || "YOUR_KEY"}" \\\n  -F "phone=9876543210" \\\n  -F "caption=Attached is the proposal." \\\n  -F "file=@/path/to/proposal.pdf"`
                      : `const formData = new FormData();\nformData.append("phone", "9876543210");\nformData.append("caption", "Attached is the proposal.");\nformData.append("file", fileInput.files[0]);\n\nconst res = await fetch("${docEndpointUrl}", {\n  method: "POST",\n  headers: { "x-webhook-secret": "${webhookKey || "YOUR_KEY"}" },\n  body: formData\n});\nconst data = await res.json();`;
                  copyToClipboard(
                    snippet,
                    activeDocCodeTab === "curl" ? setCopiedDocCurl : setCopiedDocJs
                  );
                }}
                className="text-[10px] font-bold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer flex items-center gap-1"
              >
                {(activeDocCodeTab === "curl" ? copiedDocCurl : copiedDocJs) ? (
                  <>
                    <Check size={11} className="text-emerald-500" />
                    <span className="text-emerald-500">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy size={11} />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
            </div>

            <div className="rounded-2xl bg-slate-950 p-3.5 font-mono text-[11px] text-slate-200 border border-slate-800 overflow-x-auto max-h-[140px]">
              <pre>
                {activeDocCodeTab === "curl"
                  ? `curl -X POST "${docEndpointUrl}" \\\n  -H "x-webhook-secret: ${webhookKey || "YOUR_KEY"}" \\\n  -F "phone=9876543210" \\\n  -F "caption=Attached is the proposal." \\\n  -F "file=@/path/to/proposal.pdf"`
                  : `const formData = new FormData();\nformData.append("phone", "9876543210");\nformData.append("caption", "Attached is the proposal.");\nformData.append("file", fileInput.files[0]);\n\nconst res = await fetch("${docEndpointUrl}", {\n  method: "POST",\n  headers: { "x-webhook-secret": "${webhookKey || "YOUR_KEY"}" },\n  body: formData\n});\nconst data = await res.json();`}
              </pre>
            </div>
          </div>
        </div>

        {/* Interactive Live Tester: Send Document */}
        <div className="pt-4 border-t border-border-main/70 space-y-3">
          <div className="flex items-center gap-2">
            <Send size={14} className="text-teal-500" />
            <h4 className="text-xs font-black text-text-primary uppercase tracking-wide">
              Live Tester: Send WhatsApp Document by Phone
            </h4>
          </div>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!docTest.phone) {
                alert("Please provide the recipient phone number.");
                return;
              }
              if (!docTest.file) {
                alert("Please select a PDF or Word document (.pdf, .docx, .doc) to send.");
                return;
              }

              setDocTesting(true);
              setDocResult(null);

              try {
                const formData = new FormData();
                formData.append("phone", docTest.phone);
                formData.append("file", docTest.file);
                if (docTest.caption) formData.append("caption", docTest.caption);

                const token =
                  localStorage.getItem("salesbuster_token") ||
                  localStorage.getItem("kranthi_token");

                const headers = {
                  "x-webhook-secret": webhookKey,
                };
                if (token) {
                  headers["Authorization"] = `Bearer ${token}`;
                }

                const res = await axios.post(docEndpointUrl, formData, {
                  headers,
                });

                setDocResult({
                  success: true,
                  data: res.data,
                });
              } catch (err) {
                setDocResult({
                  success: false,
                  error:
                    err.response?.data?.message ||
                    err.message ||
                    "Failed to send document. Make sure WhatsApp is connected in Settings.",
                });
              } finally {
                setDocTesting(false);
              }
            }}
            className="space-y-3"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <input
                  type="tel"
                  required
                  placeholder="Recipient Phone (e.g. 9876543210) *"
                  value={docTest.phone}
                  onChange={(e) => setDocTest({ ...docTest, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-bg-secondary border border-border-main text-text-primary text-xs outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <input
                  type="file"
                  required
                  accept=".pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
                  onChange={(e) => setDocTest({ ...docTest, file: e.target.files[0] || null })}
                  className="w-full px-2 py-1.5 rounded-xl bg-bg-secondary border border-border-main text-text-primary text-xs outline-none focus:border-teal-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:font-bold file:bg-teal-500/10 file:text-teal-600 dark:file:text-teal-400 cursor-pointer"
                />
              </div>
            </div>

            <div>
              <textarea
                rows={2}
                placeholder="Accompanying message text / caption (e.g. Here is our brochure and quote) *"
                value={docTest.caption}
                onChange={(e) => setDocTest({ ...docTest, caption: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-bg-secondary border border-border-main text-text-primary text-xs outline-none focus:border-teal-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <span className="text-[10px] text-text-secondary flex items-center gap-1">
                <Paperclip size={11} />
                Finds or registers contact in your tenant CRM and transmits document via WhatsApp.
              </span>
              <button
                type="submit"
                disabled={docTesting}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-black transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                {docTesting ? (
                  <RefreshCw size={13} className="animate-spin" />
                ) : (
                  <Send size={13} />
                )}
                <span>{docTesting ? "Sending Document..." : "Send WhatsApp Document"}</span>
              </button>
            </div>
          </form>

          {docResult && (
            <div
              className={`p-3 rounded-2xl text-xs font-medium flex items-start gap-2 animate-fadeIn ${
                docResult.success
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
              }`}
            >
              {docResult.success ? (
                <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
              ) : (
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
              )}
              <div>
                <strong>{docResult.success ? "Document Message Sent!" : "Send Error:"}</strong>{" "}
                {docResult.success
                  ? docResult.data?.message || "Document dispatched successfully via WhatsApp."
                  : docResult.error}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
