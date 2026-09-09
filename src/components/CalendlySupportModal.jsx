import React, { useEffect, useRef, useState } from "react";
import {
  X,
  Headphones,
  Calendar,
  Clock,
  ExternalLink,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { useSupportModal } from "../context/SupportModalContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const CALENDLY_BASE_URL =
  "https://calendly.com/saiteja-infasta/30min?hide_event_type_details=1&hide_gdpr_banner=1";
const CALENDLY_SCRIPT_SRC = "https://assets.calendly.com/assets/external/widget.js";

export default function CalendlySupportModal() {
  const { isOpen, closeSupportModal, meetingContext } = useSupportModal();
  const { currentUser, organization } = useAuth();
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [scheduled, setScheduled] = useState(false);

  // Construct personalized URL with pre-filled name & email
  const prefillName = currentUser?.name || organization?.name || "";
  const prefillEmail = currentUser?.email || organization?.email || "";

  let personalizedUrl = CALENDLY_BASE_URL;
  const params = [];
  if (prefillName) params.push(`name=${encodeURIComponent(prefillName)}`);
  if (prefillEmail) params.push(`email=${encodeURIComponent(prefillEmail)}`);
  if (params.length > 0) {
    personalizedUrl += `&${params.join("&")}`;
  }

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

  // Initialize or re-initialize widget when modal opens
  useEffect(() => {
    if (!isOpen) {
      setScheduled(false);
      setLoading(true);
      return;
    }

    let isMounted = true;

    const initWidget = () => {
      if (!containerRef.current || !isMounted) return;
      containerRef.current.innerHTML = "";

      if (window.Calendly && typeof window.Calendly.initInlineWidget === "function") {
        window.Calendly.initInlineWidget({
          url: personalizedUrl,
          parentElement: containerRef.current,
        });
        setLoading(false);
      }
    };

    // Check if script is already present
    const existingScript = document.querySelector(
      `script[src="${CALENDLY_SCRIPT_SRC}"]`
    );

    if (window.Calendly && typeof window.Calendly.initInlineWidget === "function") {
      initWidget();
    } else if (existingScript) {
      existingScript.addEventListener("load", initWidget);
    } else {
      const script = document.createElement("script");
      script.src = CALENDLY_SCRIPT_SRC;
      script.async = true;
      script.onload = () => {
        if (isMounted) initWidget();
      };
      document.body.appendChild(script);
    }

    // Safety timeout in case Calendly takes time to render
    const timer = setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 2000);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [isOpen, personalizedUrl]);

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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={closeSupportModal}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-4xl bg-bg-card border border-border-main rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh] animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-main bg-gradient-to-r from-bg-card via-purple-500/5 to-bg-card shrink-0">
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
        <div className="bg-bg-secondary/40 border-b border-border-main/60 px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs text-text-secondary shrink-0">
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
              Booking as: <strong className="text-text-primary">{prefillName}</strong> ({prefillEmail})
            </span>
          )}
        </div>

        {/* Scheduled Confirmation Banner */}
        {scheduled && (
          <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-5 py-3 flex items-center gap-3 text-emerald-600 dark:text-emerald-400 shrink-0">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <div className="text-xs sm:text-sm font-semibold flex-1">
              Your meeting has been booked! Calendar invitation and video link have been sent to your email.
            </div>
          </div>
        )}

        {/* Calendly Inline Widget Container */}
        <div className="flex-1 overflow-y-auto min-h-[580px] sm:min-h-[660px] relative bg-white dark:bg-slate-900">
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-bg-card/70 backdrop-blur-xs z-10">
              <RefreshCw className="w-6 h-6 text-purple-500 animate-spin" />
              <span className="text-xs font-medium text-text-secondary">
                Loading available booking calendar...
              </span>
            </div>
          )}

          <div
            ref={containerRef}
            className="calendly-inline-widget w-full h-[620px] sm:h-[680px]"
            style={{ minWidth: "320px" }}
          />
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-border-main bg-bg-card flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-text-secondary shrink-0">
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
