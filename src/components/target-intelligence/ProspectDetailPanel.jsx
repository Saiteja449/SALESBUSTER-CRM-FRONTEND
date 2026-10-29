import React from "react";
import {
  X,
  Building2,
  MapPin,
  Users,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Phone,
  Globe,
  Sparkles,
  DollarSign,
  Calendar,
  Lock,
} from "lucide-react";

export default function ProspectDetailPanel({
  prospect,
  onClose,
}) {
  if (!prospect) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-black/40 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-xl bg-brand-light h-full shadow-2xl flex flex-col border-l border-brand-secondary overflow-y-auto">
        {/* ── Top Header ─────────────────────────────────────────────────── */}
        <div className="p-5 border-b border-brand-secondary flex items-start justify-between gap-4 sticky top-0 bg-brand-light/95 backdrop-blur-md z-10">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                {prospect.matchScore}% Match Score
              </span>
              {prospect.isDuplicate && (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  CRM Match Found
                </span>
              )}
            </div>
            <h2 className="text-lg font-extrabold text-brand-primary truncate">
              {prospect.companyName}
            </h2>
            <p className="text-xs text-brand-primary/60 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-brand-primary/40" />
              {prospect.location}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-brand-primary/60 hover:text-brand-primary hover:bg-brand-secondary/40 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Body Content ───────────────────────────────────────────────── */}
        <div className="p-6 space-y-6 flex-1">
          {/* Company Firmographics */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-brand-primary uppercase tracking-wider">
              Company Overview
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-brand-secondary/20 border border-brand-secondary/40 space-y-0.5">
                <span className="text-[10px] font-bold text-brand-primary/50 uppercase">
                  Industry
                </span>
                <p className="text-xs font-bold text-brand-primary">
                  {prospect.industry}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-brand-secondary/20 border border-brand-secondary/40 space-y-0.5">
                <span className="text-[10px] font-bold text-brand-primary/50 uppercase">
                  Employee Scale
                </span>
                <p className="text-xs font-bold text-brand-primary">
                  {prospect.companySize}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-brand-secondary/20 border border-brand-secondary/40 space-y-0.5">
                <span className="text-[10px] font-bold text-brand-primary/50 uppercase">
                  Estimated Revenue
                </span>
                <p className="text-xs font-bold text-brand-primary">
                  {prospect.annualRevenue || "₹25 Cr - ₹50 Cr"}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-brand-secondary/20 border border-brand-secondary/40 space-y-0.5">
                <span className="text-[10px] font-bold text-brand-primary/50 uppercase">
                  City & State
                </span>
                <p className="text-xs font-bold text-brand-primary">
                  {prospect.location || prospect.city}
                </p>
              </div>
            </div>
          </div>

          {/* Decision Maker Contact */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-brand-primary uppercase tracking-wider">
              Target Decision Maker
            </h3>
            <div className="p-4 rounded-xl bg-brand-secondary/20 border border-brand-secondary/40 space-y-3">
              <div>
                <h4 className="text-sm font-extrabold text-brand-primary">
                  {prospect.decisionMaker?.name}
                </h4>
                <p className="text-xs text-brand-primary/70">
                  {prospect.decisionMaker?.title}
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-brand-secondary/40 text-xs">
                <div className="flex items-center gap-2 text-brand-primary/80">
                  <Mail className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="font-mono">{prospect.decisionMaker?.email}</span>
                </div>
                <div className="flex items-center gap-2 text-brand-primary/80">
                  <Phone className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="font-mono">{prospect.decisionMaker?.phone}</span>
                </div>
              </div>
            </div>
          </div>

          {/* AI Match Rationale & Evidence */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-brand-primary uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              <span>AI Match Rationale & Signals</span>
            </h3>
            <div className="space-y-2">
              {prospect.matchReasons.map((reason, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex items-start gap-2.5 text-xs text-brand-primary"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{reason}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Data Provenance & Compliance */}
          <div className="p-4 rounded-xl bg-brand-secondary/30 border border-brand-secondary/50 space-y-2 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-brand-primary">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Data Provenance & Permitted Use</span>
            </div>
            <p className="text-[11px] text-brand-primary/65 leading-relaxed">
              Source: <strong className="text-brand-primary">{prospect.source}</strong>.
              Last verified on {new Date(prospect.lastVerifiedAt).toLocaleDateString()}.
            </p>
            <p className="text-[10px] text-brand-primary/50 leading-relaxed">
              Adding this prospect to CRM does not constitute consent for marketing blasts.
              All outreach must follow your organization’s lawful communication policies.
            </p>
          </div>
        </div>

        {/* ── Footer Actions ──────────────────────────────────────────────── */}
        <div className="p-4 border-t border-brand-secondary bg-brand-light flex items-center justify-between gap-3 sticky bottom-0">
          {prospect.website ? (
            <a
              href={prospect.website.startsWith("http") ? prospect.website : `https://${prospect.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-pilot-blue hover:underline bg-pilot-blue/10 rounded-xl transition"
            >
              <Globe className="w-4 h-4" />
              <span>Visit Official Website</span>
            </a>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-xs font-extrabold text-brand-primary bg-brand-secondary/60 hover:bg-brand-secondary rounded-xl transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
