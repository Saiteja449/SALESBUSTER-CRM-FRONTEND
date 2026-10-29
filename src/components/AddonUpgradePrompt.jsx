import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  Send,
  Bot,
  CheckCircle2,
  Lock,
  Headphones,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  BarChart3,
  Users,
  Zap,
  Calendar,
  Layers,
  Target,
} from "lucide-react";
import { useSupportModal } from "../context/SupportModalContext.jsx";

const ADDON_CONFIGS = {
  whatsappCampaigns: {
    title: "WhatsApp Campaigns & Broadcast Marketing",
    subtitle:
      "Scale your outreach with high-converting automated WhatsApp broadcasts, drip sequencing, and deep delivery analytics.",
    badge: "Enterprise Add-on",
    icon: <Send className="w-8 h-8 text-amber-500" />,
    gradient: "from-amber-500/15 via-orange-500/10 to-transparent",
    glowColor: "bg-amber-500/15",
    iconContainer: "bg-amber-500/10 border-amber-500/30",
    buttonClass:
      "bg-amber-500 hover:bg-amber-600 focus-visible:ring-2 focus-visible:ring-amber-400",
    meetingContext:
      "Upgrade Request: Activate WhatsApp Campaigns Add-on (Broadcast Marketing & Drip Automations).",
    features: [
      {
        icon: <Zap className="w-5 h-5 text-amber-500" />,
        title: "Meta Cloud Broadcast Engine",
        desc: "Send verified WhatsApp marketing templates at scale with automated rate-limiting and anti-ban safeguards.",
      },
      {
        icon: <Users className="w-5 h-5 text-amber-500" />,
        title: "Dynamic Lead Segmentation",
        desc: "Filter audiences by service, pipeline stage, or custom tags for hyper-personalized messaging.",
      },
      {
        icon: <Calendar className="w-5 h-5 text-amber-500" />,
        title: "Automated Scheduling & Drip Sequences",
        desc: "Set and forget multi-touch outreach campaigns triggered on specific dates and times.",
      },
      {
        icon: <BarChart3 className="w-5 h-5 text-amber-500" />,
        title: "Full Funnel Delivery Analytics",
        desc: "Track real-time delivery rates, read receipts, and response conversions directly in your CRM.",
      },
    ],
  },
  biAnalyst: {
    title: "AI Business Intelligence Analyst",
    subtitle:
      "Unlock conversational AI intelligence over your CRM pipeline, sales rep deal velocity, and revenue forecasting.",
    badge: "AI Add-on",
    icon: <Bot className="w-8 h-8 text-purple-500" />,
    gradient: "from-purple-500/15 via-indigo-500/10 to-transparent",
    glowColor: "bg-purple-500/15",
    iconContainer: "bg-purple-500/10 border-purple-500/30",
    buttonClass:
      "bg-purple-600 hover:bg-purple-700 focus-visible:ring-2 focus-visible:ring-purple-400",
    meetingContext:
      "Upgrade Request: Activate BI Analyst Add-on (Conversational Sales Analytics & Executive Reports).",
    features: [
      {
        icon: <Sparkles className="w-5 h-5 text-purple-500" />,
        title: "Conversational Intelligence",
        desc: "Ask questions in natural English or Hindi and get instant tabular and visual breakdowns of your leads.",
      },
      {
        icon: <TrendingUp className="w-5 h-5 text-purple-500" />,
        title: "Pipeline Velocity & Win/Loss Diagnostics",
        desc: "Spot bottleneck stages, sales rep conversion drops, and lead aging before revenue is lost.",
      },
      {
        icon: <ShieldCheck className="w-5 h-5 text-purple-500" />,
        title: "Executive Summaries & AI Reports",
        desc: "Generate weekly performance summaries and strategic recommendations for board and management reviews.",
      },
      {
        icon: <Layers className="w-5 h-5 text-purple-500" />,
        title: "Data Isolation & Privacy",
        desc: "Tenant-scoped AI analytics ensure strict organization confidentiality with zero data leakage.",
      },
    ],
  },
  targetIntelligence: {
    title: "AI Target Data Intelligence",
    subtitle:
      "Discover high-intent accounts, ideal customer profiles, and decision-maker contacts with transparent AI match scoring and 1-click CRM lead import.",
    badge: "AI Intelligence Add-on",
    icon: <Target className="w-8 h-8 text-emerald-500" />,
    gradient: "from-emerald-500/15 via-teal-500/10 to-transparent",
    glowColor: "bg-emerald-500/15",
    iconContainer: "bg-emerald-500/10 border-emerald-500/30",
    buttonClass:
      "bg-emerald-600 hover:bg-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-400",
    meetingContext:
      "Upgrade Request: Activate AI Target Data Intelligence Add-on (ICP Discovery & Lead Intelligence).",
    features: [
      {
        icon: <Sparkles className="w-5 h-5 text-emerald-500" />,
        title: "Natural Language ICP Builder",
        desc: "Type requests in plain English ('manufacturing firms in Hyderabad needing ERP') to auto-generate structured filters.",
      },
      {
        icon: <TrendingUp className="w-5 h-5 text-emerald-500" />,
        title: "Relevance Scoring & Explainability",
        desc: "Review 0â€“100 normalized match ratings with transparent rationale and verified company signals.",
      },
      {
        icon: <ShieldCheck className="w-5 h-5 text-emerald-500" />,
        title: "Compliance & Source Provenance",
        desc: "Strictly search organization-approved directories with verified timestamps and permitted outreach tags.",
      },
      {
        icon: <Zap className="w-5 h-5 text-emerald-500" />,
        title: "1-Click CRM Lead Creation",
        desc: "Batch import qualified prospects into SalesBuster with built-in deduplication (skip, update, or create).",
      },
    ],
  },
};

export default function AddonUpgradePrompt({ addon = "whatsappCampaigns" }) {
  const navigate = useNavigate();
  const { openSupportModal } = useSupportModal();

  const config = ADDON_CONFIGS[addon] || ADDON_CONFIGS.whatsappCampaigns;

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 md:py-12 animate-fadeIn">
      {/* â”€â”€ Main Upgrade Hero Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div
        className={`relative overflow-hidden rounded-3xl bg-brand-light border border-brand-secondary/80 p-6 sm:p-10 shadow-lg bg-gradient-to-b ${config.gradient}`}
      >
        {/* Background glow orb */}
        <div
          className={`absolute -top-24 -right-24 w-80 h-80 rounded-full blur-3xl pointer-events-none ${config.glowColor}`}
        />

        <div className="relative z-10">
          {/* Header Badge */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-secondary/50 border border-brand-secondary text-xs font-bold text-brand-primary">
              <Lock className="w-3.5 h-3.5 text-amber-500" />
              <span>{config.badge}</span>
              <span className="w-1 h-1 rounded-full bg-brand-primary/40" />
              <span className="text-amber-600 dark:text-amber-400 font-extrabold">
                Upgrade to use
              </span>
            </div>

            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="text-xs font-bold text-brand-primary/60 hover:text-brand-primary transition-colors cursor-pointer"
            >
              Back to Dashboard
            </button>
          </div>

          {/* Title and Icon */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-xs shrink-0 ${config.iconContainer}`}
            >
              {config.icon}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-primary tracking-tight">
                {config.title}
              </h1>
              <p className="text-xs sm:text-sm text-brand-primary/70 mt-1 max-w-2xl leading-relaxed">
                {config.subtitle}
              </p>
            </div>
          </div>

          {/* Action Callouts */}
          <div className="mt-8 flex flex-wrap items-center gap-3.5 pt-6 border-t border-brand-secondary/40">
            <button
              type="button"
              onClick={() => openSupportModal(config.meetingContext)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-extrabold text-white transition-all shadow-md active:scale-[0.98] cursor-pointer ${config.buttonClass}`}
            >
              <Headphones className="w-4 h-4" />
              <span>Upgrade & Activate Add-on</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => navigate("/organization")}
              className="flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-bold text-brand-primary bg-brand-light hover:bg-brand-secondary/40 border border-brand-secondary transition-colors cursor-pointer"
            >
              <span>Manage Organization Add-ons</span>
            </button>
          </div>
        </div>
      </div>

      {/* â”€â”€ Feature Grid â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="mt-8">
        <h2 className="text-sm font-extrabold text-brand-primary uppercase tracking-wider mb-4 px-1">
          Everything included with this add-on
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {config.features.map((f) => (
            <div
              key={f.title}
              className="p-5 rounded-2xl bg-brand-light border border-brand-secondary flex items-start gap-3.5 shadow-2xs hover:shadow-xs transition-shadow"
            >
              <div className="p-2 rounded-xl bg-brand-secondary/40 border border-brand-secondary/60 shrink-0 mt-0.5">
                {f.icon}
              </div>
              <div>
                <h3 className="text-sm font-bold text-brand-primary">
                  {f.title}
                </h3>
                <p className="text-xs text-brand-primary/65 mt-1 leading-relaxed">
                  {f.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* â”€â”€ Trust Banner â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="mt-8 p-4 rounded-2xl bg-brand-light/60 border border-brand-secondary/60 flex flex-wrap items-center justify-between gap-3 text-xs text-brand-primary/70">
        <div className="flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>
            Instant activation once approved by your organization administrator.
          </span>
        </div>
        <button
          type="button"
          onClick={() => openSupportModal(config.meetingContext)}
          className="text-xs font-bold text-pilot-blue hover:underline cursor-pointer"
        >
          Talk to Sales Support &rarr;
        </button>
      </div>
    </div>
  );
}
