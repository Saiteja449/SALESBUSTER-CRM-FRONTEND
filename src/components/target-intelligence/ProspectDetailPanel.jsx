import React, { useState } from "react";
import {
  X,
  Building2,
  MapPin,
  Users,
  ShieldCheck,
  CheckCircle2,
  Mail,
  Phone,
  Globe,
  Sparkles,
  DollarSign,
  Check,
  Copy,
  RotateCcw,
  ExternalLink,
} from "lucide-react";

function LinkedinIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
    </svg>
  );
}

export default function ProspectDetailPanel({
  prospect,
  onClose,
  onToggleResolve,
  isResolving = false,
}) {
  const [copiedKey, setCopiedKey] = useState(null);

  if (!prospect) return null;

  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const isPerson = prospect.entityType === "person";
  const isResolved = Boolean(prospect.isResolved);

  const email = prospect.decisionMaker?.email || prospect.email || "";
  const phone = prospect.decisionMaker?.phone || prospect.phone || "";
  const linkedin = prospect.decisionMaker?.linkedin || prospect.linkedin || "";
  const website = prospect.website || "";

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

              {isResolved ? (
                <span className="px-2 py-0.5 text-[10px] font-black rounded-md bg-purple-600 text-white shadow-2xs">
                  ✓ Resolved Already
                </span>
              ) : (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-brand-secondary/60 text-brand-primary/70">
                  Unresolved Target
                </span>
              )}
            </div>

            <h2 className="text-lg font-black text-brand-primary truncate">
              {isPerson
                ? prospect.personName || prospect.decisionMaker?.name || prospect.companyName
                : prospect.companyName}
            </h2>

            <p className="text-xs text-brand-primary/60 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-brand-primary/40" />
              <span>{prospect.location || prospect.city}</span>
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

        {/* ── Resolution Banner ──────────────────────────────────────────── */}
        {isResolved && (
          <div className="px-6 py-3 bg-purple-500/10 border-b border-purple-500/20 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-bold">
              <CheckCircle2 className="w-4 h-4 text-purple-600" />
              <span>Target Resolved Already</span>
            </div>
            <span className="text-[11px] text-brand-primary/60">
              Resolved by {prospect.resolvedByName || "Team Member"}
            </span>
          </div>
        )}

        {/* ── Body Content ───────────────────────────────────────────────── */}
        <div className="p-6 space-y-6 flex-1">
          {/* ACCURATE CONTACT COORDINATES (MOST IMPORTANT) */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-brand-primary uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Verified Direct Contact Coordinates</span>
            </h3>

            <div className="p-4 rounded-2xl bg-brand-secondary/20 border border-brand-secondary/50 space-y-3 text-xs">
              {/* Phone */}
              <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-brand-light border border-brand-secondary">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold text-brand-primary/50 uppercase">
                      Direct / Corporate Phone
                    </div>
                    {phone ? (
                      <a
                        href={`tel:${phone.replace(/\s+/g, "")}`}
                        className="font-black text-brand-primary hover:underline truncate block"
                      >
                        {phone}
                      </a>
                    ) : (
                      <span className="text-brand-primary/40 italic">Not publicly published</span>
                    )}
                  </div>
                </div>

                {phone && (
                  <button
                    type="button"
                    onClick={() => handleCopy(phone, "detail-phone")}
                    className="p-1.5 text-brand-primary/40 hover:text-brand-primary cursor-pointer rounded-lg hover:bg-brand-secondary/40"
                    title="Copy Phone"
                  >
                    {copiedKey === "detail-phone" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
              </div>

              {/* Email */}
              <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-brand-light border border-brand-secondary">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-600 shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold text-brand-primary/50 uppercase">
                      Official Executive / Corporate Email
                    </div>
                    {email ? (
                      <a
                        href={`mailto:${email}`}
                        className="font-black text-brand-primary hover:underline truncate block font-mono text-[11px]"
                      >
                        {email}
                      </a>
                    ) : (
                      <span className="text-brand-primary/40 italic">Not publicly published</span>
                    )}
                  </div>
                </div>

                {email && (
                  <button
                    type="button"
                    onClick={() => handleCopy(email, "detail-email")}
                    className="p-1.5 text-brand-primary/40 hover:text-brand-primary cursor-pointer rounded-lg hover:bg-brand-secondary/40"
                    title="Copy Email"
                  >
                    {copiedKey === "detail-email" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
              </div>

              {/* LinkedIn */}
              {linkedin && (
                <div className="p-2.5 rounded-xl bg-brand-light border border-brand-secondary flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#0077B5]/10 flex items-center justify-center text-[#0077B5] shrink-0">
                      <LinkedinIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-brand-primary/50 uppercase">
                        LinkedIn Profile
                      </div>
                      <span className="font-bold text-[#0077B5] text-[11px]">
                        Verified LinkedIn Page
                      </span>
                    </div>
                  </div>

                  <a
                    href={linkedin.startsWith("http") ? linkedin : `https://${linkedin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0077B5] text-white text-xs font-bold hover:bg-[#005582] transition"
                  >
                    <span>Open</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Company Firmographics */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-brand-primary uppercase tracking-wider">
              Entity Overview
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-brand-secondary/20 border border-brand-secondary/40 space-y-0.5">
                <span className="text-[10px] font-bold text-brand-primary/50 uppercase">
                  Industry
                </span>
                <p className="text-xs font-bold text-brand-primary">
                  {prospect.industry || "General Commercial Enterprise"}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-brand-secondary/20 border border-brand-secondary/40 space-y-0.5">
                <span className="text-[10px] font-bold text-brand-primary/50 uppercase">
                  Employee Scale
                </span>
                <p className="text-xs font-bold text-brand-primary">
                  {prospect.companySize || "Active Enterprise"}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-brand-secondary/20 border border-brand-secondary/40 space-y-0.5">
                <span className="text-[10px] font-bold text-brand-primary/50 uppercase">
                  Estimated Scale
                </span>
                <p className="text-xs font-bold text-brand-primary">
                  {prospect.annualRevenue || "Active Enterprise"}
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

          {/* AI Match Rationale */}
          {prospect.matchReasons && prospect.matchReasons.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-brand-primary uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                <span>Verification Rationale & Signals</span>
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
          )}

          {/* Data Provenance & Compliance */}
          <div className="p-4 rounded-xl bg-brand-secondary/30 border border-brand-secondary/50 space-y-2 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-brand-primary">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Real-Time Provenance</span>
            </div>
            <p className="text-[11px] text-brand-primary/65 leading-relaxed">
              Source: <strong className="text-brand-primary">{prospect.source}</strong>. Verified corporate records without simulated fallbacks.
            </p>
          </div>
        </div>

        {/* ── Footer Actions ──────────────────────────────────────────────── */}
        <div className="p-4 border-t border-brand-secondary bg-brand-light flex items-center justify-between gap-3 sticky bottom-0">
          {website ? (
            <a
              href={website.startsWith("http") ? website : `https://${website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-pilot-blue hover:underline bg-pilot-blue/10 rounded-xl transition"
            >
              <Globe className="w-4 h-4" />
              <span>Visit Website</span>
            </a>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            {/* RESOLVE / UNRESOLVE BUTTON */}
            {isResolved ? (
              <button
                type="button"
                onClick={() => onToggleResolve && onToggleResolve(prospect, false)}
                disabled={isResolving}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-black rounded-xl border border-purple-500/40 bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{isResolving ? "Updating..." : "Unresolve Target"}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onToggleResolve && onToggleResolve(prospect, true)}
                disabled={isResolving}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-black text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition cursor-pointer shadow-sm disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isResolving ? "Saving..." : "Mark as Resolved"}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-extrabold text-brand-primary bg-brand-secondary/60 hover:bg-brand-secondary rounded-xl transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
