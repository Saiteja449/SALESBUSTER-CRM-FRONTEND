import React, { useEffect, useState, useMemo } from "react";
import {
  X,
  Headphones,
  Calendar,
  Clock,
  ExternalLink,
  CheckCircle2,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { useSupportModal } from "../context/SupportModalContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const CALENDLY_BASE_URL = "https://calendly.com/team-salesbuster/30min";

export default function CalendlySupportModal() {
  const { isOpen, closeSupportModal, meetingContext } = useSupportModal();
  const { currentUser, organization } = useAuth();
  const [loading, setLoading] = useState(true);
  const [scheduled, setScheduled] = useState(false);

  // Construct personalized URL with pre-filled name & email
  const personalizedUrl = useMemo(() => {
    try {
      const url = new URL(CALENDLY_BASE_URL);
      url.searchParams.set(
        "embed_domain",
        window.location.host || "salesbuster.ai",
      );
      url.searchParams.set("embed_type", "Inline");
      url.searchParams.set("hide_event_type_details", "1");
      url.searchParams.set("hide_gdpr_banner", "1");

      const name = currentUser?.name || organization?.name;
      if (name) url.searchParams.set("name", name);

      const email = currentUser?.email || organization?.email;
      if (email) url.searchParams.set("email", email);

      return url.toString();
    } catch {
      return `${CALENDLY_BASE_URL}?hide_event_type_details=1&hide_gdpr_banner=1`;
    }
  }, [
    currentUser?.name,
    currentUser?.email,
    organization?.name,
    organization?.email,
  ]);

  const prefillName = currentUser?.name || organization?.name || "";
  const prefillEmail = currentUser?.email || organization?.email || "";

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setScheduled(false);
    }
  }, [isOpen]);

  // Handle Calendly event postMessage notifications
  useEffect(() => {
    const handleMessage = (e) => {
      if (e.data && e.data.event === "calendly.event_scheduled") {
        setScheduled(true);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        closeSupportModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeSupportModal]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/65 backdrop-blur-xs animate-fadeIn"
      onClick={closeSupportModal}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-4xl h-[92vh] max-h-[720px] bg-bg-card border border-border-main rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border-main bg-gradient-to-r from-bg-card via-purple-500/5 to-bg-card shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-text-primary tracking-tight">
                  Book Human Assistance & Support
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Meeting
                </span>
              </div>
              <p className="text-xs text-text-secondary mt-0.5">
                {meetingContext
                  ? meetingContext
                  : "Connect 1-on-1 with our CRM specialist for setup, AI configuration, or technical guidance."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Direct Link in case iframe is blocked */}
            <a
              href={personalizedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-text-secondary hover:text-text-primary bg-bg-secondary/40 hover:bg-bg-secondary border border-border-main transition-colors"
              title="Open booking page in a new browser tab"
            >
              <span>Open in Tab</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            {/* Close button */}
            <button
              type="button"
              onClick={closeSupportModal}
              className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Meeting Highlights Banner */}
        <div className="bg-bg-secondary/40 border-b border-border-main/60 px-5 py-2 flex flex-wrap items-center justify-between gap-2 text-xs text-text-secondary shrink-0">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="inline-flex items-center gap-1.5 font-medium text-text-primary">
              <Clock className="w-3.5 h-3.5 text-purple-500" />
              30 Minutes Session
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium text-text-primary">
              <Calendar className="w-3.5 h-3.5 text-blue-500" />
              Video / Screen Share
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium text-text-primary">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              Direct Engineering & Sales Pilot Team
            </span>
          </div>

          {prefillName && (
            <span className="hidden md:inline-block text-[11px] text-text-secondary/80">
              Booking as:{" "}
              <strong className="text-text-primary">{prefillName}</strong> (
              {prefillEmail})
            </span>
          )}
        </div>

        {/* Scheduled Confirmation Banner */}
        {scheduled && (
          <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-5 py-2.5 flex items-center gap-3 text-emerald-600 dark:text-emerald-400 shrink-0">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <div className="text-xs sm:text-sm font-semibold flex-1">
              Your meeting has been booked! Calendar invitation and video link
              have been sent to your email.
            </div>
          </div>
        )}

        {/* Calendly Direct Frame Container */}
        <div className="flex-1 w-full min-h-0 relative bg-white">
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-bg-card/85 backdrop-blur-xs z-10">
              <RefreshCw className="w-6 h-6 text-purple-500 animate-spin" />
              <span className="text-xs font-medium text-text-secondary">
                Loading booking calendar...
              </span>
            </div>
          )}

          <iframe
            src={personalizedUrl}
            width="100%"
            height="100%"
            frameBorder="0"
            title="Select a Date & Time - Calendly"
            className="w-full h-full border-0"
            onLoad={() => setLoading(false)}
          />
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-2.5 border-t border-border-main bg-bg-card flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-text-secondary shrink-0">
          <span>
            Need urgent assistance? Reach our team directly at{" "}
            <a
              href="mailto:support@salesbuster.ai"
              className="text-purple-500 hover:underline font-medium"
            >
              support@salesbuster.ai
            </a>
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={closeSupportModal}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-bg-secondary hover:bg-bg-secondary/80 text-text-primary border border-border-main transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
