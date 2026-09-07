import React, { useState } from "react";
import {
  ShieldCheck,
  Clock,
  Building2,
  RefreshCw,
  LogOut,
  Mail,
  Calendar,
  CreditCard,
  Sparkles,
  CheckCircle2,
  Headphones,
  ArrowUpRight,
  Lock,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import ThemeToggle from "./ThemeToggle.jsx";
import crmLogo from "../assets/images/CRM-LOGO.png";

export default function AccountSuspended() {
  const { organization, logout, fetchOrganization, isSubscriptionExpired } = useAuth();
  const [checking, setChecking] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const orgName = organization?.name || "Workspace";
  const orgEmail = organization?.email || "N/A";
  const status = (organization?.status || "active").toLowerCase();
  const rawPlan = organization?.subscriptionPlan || "Monthly";
  const plan = rawPlan.charAt(0).toUpperCase() + rawPlan.slice(1);
  const seats = organization?.seats || organization?.totalSeats || 1;

  const isSuspended = status === "suspended";
  const isInactive = status === "inactive";
  const isExpired = Boolean(isSubscriptionExpired);

  // Format subscription end date if available
  const formattedEndDate = organization?.subscriptionEndDate
    ? new Date(organization.subscriptionEndDate).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "Renewal Required";

  // Dynamic configuration based on state - polite and high-contrast styling
  let config = {
    badge: "Workspace Access Paused",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/70 dark:text-blue-300 dark:border-blue-800",
    dotColor: "bg-blue-600 dark:bg-blue-400",
    title: "Your Workspace is Temporarily on Pause",
    description: `Hello ${orgName} team. Access to your workspace is temporarily on pause. We apologize for any interruption to your daily sales workflow and are here to help you restore access right away.`,
    statusLabel: "Action Needed",
    statusColor: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/60 dark:text-blue-200 dark:border-blue-700",
    actionNotice: "Our support specialists and account managers are available to assist you in promptly reactivating your workspace.",
  };

  if (isExpired && !isSuspended) {
    config = {
      badge: "Subscription Renewal Needed",
      badgeColor: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800",
      dotColor: "bg-amber-600 dark:bg-amber-400",
      title: "Subscription Plan Awaiting Renewal",
      description: `Your ${plan} plan for ${orgName} concluded on ${formattedEndDate}. We would love to keep empowering your sales team—renew your subscription to continue using your CRM seamlessly.`,
      statusLabel: "Renewal Required",
      statusColor: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/60 dark:text-amber-200 dark:border-amber-700",
      actionNotice: "Renewing your subscription restores complete workspace access instantly for all team members.",
    };
  } else if (isInactive && !isSuspended) {
    config = {
      badge: "Workspace Setup Pending",
      badgeColor: "bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/70 dark:text-purple-300 dark:border-purple-800",
      dotColor: "bg-purple-600 dark:bg-purple-400",
      title: "Workspace Activation Pending",
      description: `The workspace for ${orgName} is currently awaiting activation. Please reach out to your administrator or our support team to complete onboarding and activate full access.`,
      statusLabel: "Setup Pending",
      statusColor: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/60 dark:text-purple-200 dark:border-purple-700",
      actionNotice: "Please contact your team administrator or support representative to complete activation.",
    };
  }

  const handleCheckStatus = async () => {
    setChecking(true);
    setFeedback(null);
    try {
      await fetchOrganization();
      setFeedback({
        type: "info",
        message: "Status rechecked with the server. Your workspace is still awaiting reactivation. Please contact our team if you recently renewed.",
      });
    } catch (err) {
      setFeedback({
        type: "info",
        message: "Server connected. Your workspace is currently on hold. We are happy to help you reactivate it.",
      });
    } finally {
      setTimeout(() => setChecking(false), 600);
    }
  };

  const supportEmailHref = `mailto:support@mysalespilot.ai?subject=${encodeURIComponent(
    `Reactivate Workspace - ${orgName}`
  )}&body=${encodeURIComponent(
    `Hello MySalesPilot Support Team,\n\nI would like assistance in reactivating our workspace access for:\nOrganization: ${orgName}\nRegistered Email: ${orgEmail}\nPlan: ${plan} (${seats} Seats)\n\nThank you!`
  )}`;

  return (
    <div className="min-h-screen w-full bg-slate-100 dark:bg-[#071222] text-slate-900 dark:text-slate-100 flex items-center justify-center p-4 sm:p-6 md:p-8 font-sans relative overflow-hidden">
      {/* Soft ambient brand glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar for Theme Toggle */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20">
        <ThemeToggle />
      </div>

      {/* Main Card Container */}
      <div className="max-w-2xl w-full bg-white dark:bg-[#0c1f37] border border-slate-200 dark:border-slate-700/80 rounded-3xl shadow-xl p-6 sm:p-10 text-center relative z-10 transition-all">
        
        {/* Brand Logo Header - Clean, crisp white badge */}
        <div className="mb-6 flex justify-center">
          <div className="px-6 py-3 rounded-2xl bg-white shadow-xs border border-slate-200/80 inline-flex items-center justify-center">
            <img
              src={crmLogo}
              alt="MySalesPilot.ai"
              className="h-12 sm:h-14 w-auto object-contain max-w-[280px]"
            />
          </div>
        </div>

        {/* Polite Status Badge */}
        <div className="mb-4 inline-flex items-center">
          <span
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide border ${config.badgeColor}`}
          >
            <span className={`w-2 h-2 rounded-full ${config.dotColor}`} />
            {config.badge}
          </span>
        </div>

        {/* Polite Title & Courteous Message */}
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight mb-3">
          {config.title}
        </h1>
        <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed max-w-lg mx-auto mb-6">
          {config.description}
        </p>

        {/* Data Security & Safety Reassurance Banner - High Contrast and Clear */}
        <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-200 dark:border-emerald-800/80 text-left flex items-start gap-3.5 shadow-xs">
          <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 shrink-0 mt-0.5">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm sm:text-base font-bold text-emerald-950 dark:text-emerald-100 mb-1">
              Your Data & Leads are Safe & Intact
            </h4>
            <p className="text-xs sm:text-sm font-medium text-emerald-900 dark:text-emerald-200/90 leading-relaxed">
              All your client records, call logs, WhatsApp histories, and sales configurations are securely preserved. Nothing has been altered, and access will resume immediately upon reactivation.
            </p>
          </div>
        </div>

        {/* 3 Key Peace-of-Mind Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 text-left">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center gap-3 shadow-xs">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">Data Preserved</div>
              <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">Safe & protected</div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center gap-3 shadow-xs">
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">Instant Resume</div>
              <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">Seamless transition</div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center gap-3 shadow-xs">
            <div className="p-2 rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 shrink-0">
              <Headphones className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">Dedicated Help</div>
              <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">Prompt assistance</div>
            </div>
          </div>
        </div>

        {/* Workspace Details Card */}
        <div className="bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 sm:p-5 mb-6 text-left space-y-3 text-xs sm:text-sm shadow-xs">
          <div className="flex items-center justify-between py-1.5 border-b border-slate-200 dark:border-slate-700/60">
            <span className="text-slate-600 dark:text-slate-400 font-medium flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              Organization
            </span>
            <span className="font-bold text-slate-900 dark:text-slate-100">{orgName}</span>
          </div>

          <div className="flex items-center justify-between py-1.5 border-b border-slate-200 dark:border-slate-700/60">
            <span className="text-slate-600 dark:text-slate-400 font-medium flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              Plan & Seats
            </span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {plan} ({seats} {seats === 1 ? "Seat" : "Seats"})
            </span>
          </div>

          <div className="flex items-center justify-between py-1.5 border-b border-slate-200 dark:border-slate-700/60">
            <span className="text-slate-600 dark:text-slate-400 font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              Subscription Status
            </span>
            <span
              className={`font-semibold ${
                isExpired ? "text-amber-600 dark:text-amber-400" : "text-slate-900 dark:text-slate-100"
              }`}
            >
              {formattedEndDate}
            </span>
          </div>

          <div className="flex items-center justify-between py-1.5 border-b border-slate-200 dark:border-slate-700/60">
            <span className="text-slate-600 dark:text-slate-400 font-medium flex items-center gap-2">
              <Mail className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              Registered Email
            </span>
            <span className="font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[220px] sm:max-w-none">
              {orgEmail}
            </span>
          </div>

          <div className="flex items-center justify-between py-1.5">
            <span className="text-slate-600 dark:text-slate-400 font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              Current Status
            </span>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${config.statusColor}`}
            >
              {config.statusLabel}
            </span>
          </div>
        </div>

        {/* Courteous Action Notice */}
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium mb-6 leading-relaxed">
          {config.actionNotice}
        </p>

        {/* Feedback Alert */}
        {feedback && (
          <div className="p-3.5 rounded-xl text-xs sm:text-sm mb-6 border bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200 text-left flex items-start gap-2">
            <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Primary Recheck Status Button */}
          <button
            type="button"
            onClick={handleCheckStatus}
            disabled={checking}
            className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold bg-[#0c7cfd] hover:bg-[#0b6fe5] text-white shadow-md shadow-blue-500/20 active:scale-[0.98] transition-all disabled:opacity-60 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${checking ? "animate-spin" : ""}`} />
            {checking ? "Checking Status..." : "Recheck Status"}
          </button>

          {/* Contact Support Button */}
          <a
            href={supportEmailHref}
            className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 shadow-xs active:scale-[0.98] transition-all cursor-pointer"
          >
            <Headphones className="w-4 h-4 text-[#0c7cfd]" />
            <span>Contact Support</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
          </a>

          {/* Polite Sign Out Button */}
          <button
            type="button"
            onClick={logout}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 border border-slate-200 dark:border-slate-700 hover:border-red-200 dark:hover:border-red-800 active:scale-[0.98] transition-all cursor-pointer"
            title="Sign out of your account"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Dedicated Support Footer */}
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs sm:text-sm text-slate-600 dark:text-slate-400 gap-2">
          <span>Need direct help? Contact SalesPilot Support:</span>
          <a
            href="mailto:support@mysalespilot.ai"
            className="font-semibold text-[#0c7cfd] hover:underline inline-flex items-center gap-1"
          >
            support@mysalespilot.ai
          </a>
        </div>
      </div>
    </div>
  );
}

