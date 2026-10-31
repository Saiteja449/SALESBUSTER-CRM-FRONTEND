import React, { useState } from "react";
import {
  Building2,
  MapPin,
  Users,
  CheckCircle2,
  ShieldCheck,
  ExternalLink,
  Sparkles,
  Tag,
  DollarSign,
  Globe,
  Mail,
  Phone,
  Check,
  RotateCcw,
  UserCheck,
  Copy,
} from "lucide-react";

function LinkedinIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
    </svg>
  );
}

export default function ProspectResults({
  prospects = [],
  hasSearched = false,
  onInspectProspect,
  onToggleResolve,
  isResolvingKey = null,
  resolutionFilter = "all",
}) {
  const [copiedKey, setCopiedKey] = useState(null);

  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const getScoreBadge = (score) => {
    if (score >= 90) {
      return {
        bg: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
        label: "High Match",
      };
    }
    if (score >= 80) {
      return {
        bg: "bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30",
        label: "Strong Match",
      };
    }
    return {
      bg: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
      label: "Moderate Match",
    };
  };

  // Filter prospects based on active resolution filter
  const filteredProspects = prospects.filter((p) => {
    if (resolutionFilter === "resolved") return Boolean(p.isResolved);
    if (resolutionFilter === "unresolved") return !p.isResolved;
    return true;
  });

  const resolvedCount = prospects.filter((p) => p.isResolved).length;

  if (prospects.length === 0) {
    if (!hasSearched) {
      return (
        <div className="bg-brand-light rounded-3xl border border-brand-secondary p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-base font-black text-brand-primary">
            Ready to Search Live B2B Target Data
          </h3>
          <p className="text-xs text-brand-primary/60 max-w-md mx-auto">
            Select Companies or People, choose a city or company size, and enter your target market query above.
          </p>
        </div>
      );
    }

    return (
      <div className="bg-brand-light rounded-3xl border border-brand-secondary p-12 text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-brand-secondary/40 flex items-center justify-center mx-auto text-brand-primary/50">
          <Building2 className="w-6 h-6" />
        </div>
        <h3 className="text-base font-black text-brand-primary">
          No live matching records found
        </h3>
        <p className="text-xs text-brand-primary/60 max-w-md mx-auto">
          We strictly deliver verified live data without dummy fallbacks. Try broadening your location, company size, or prompt.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Summary & Resolution Count Bar ─────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-brand-primary">
            Showing {filteredProspects.length} of {prospects.length} Targets
          </span>
          {resolvedCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
              <CheckCircle2 className="w-3 h-3 text-purple-500" />
              <span>{resolvedCount} Resolved Already</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-brand-primary/60 text-[11px]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Verified Live Corporate Coordinates Only</span>
        </div>
      </div>

      {/* ── Results Cards List ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4">
        {filteredProspects.map((prospect) => {
          const scoreStyle = getScoreBadge(prospect.matchScore);
          const isPerson = prospect.entityType === "person";
          const isResolved = Boolean(prospect.isResolved);
          const isResolving = isResolvingKey === prospect.prospectKey;

          // Contact details resolution
          const email = prospect.decisionMaker?.email || prospect.email || "";
          const phone = prospect.decisionMaker?.phone || prospect.phone || "";
          const linkedin = prospect.decisionMaker?.linkedin || prospect.linkedin || "";
          const website = prospect.website || "";

          return (
            <div
              key={prospect.prospectKey || prospect.id}
              className={`rounded-3xl border transition-all p-5 sm:p-6 bg-brand-light shadow-2xs relative ${
                isResolved
                  ? "border-purple-500/30 bg-purple-500/5 dark:bg-purple-950/10"
                  : "border-brand-secondary hover:border-brand-primary/30"
              }`}
            >
              {/* Resolved Watermark / Status Badge */}
              {isResolved && (
                <div className="mb-3.5 flex items-center justify-between pb-3 border-b border-purple-500/20">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-purple-600 text-white shadow-2xs">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Resolved Already</span>
                  </div>
                  <span className="text-[11px] font-medium text-brand-primary/60">
                    Marked by {prospect.resolvedByName || "Team Member"} on{" "}
                    {prospect.resolvedAt
                      ? new Date(prospect.resolvedAt).toLocaleDateString()
                      : "Earlier Session"}
                  </span>
                </div>
              )}

              <div className="flex flex-col lg:flex-row items-start justify-between gap-5">
                {/* ── Left: Entity Identity ──────────────────────────────── */}
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  {/* Avatar / Icon */}
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 border ${
                      isPerson
                        ? "bg-sky-500/10 border-sky-500/30 text-sky-600 dark:text-sky-400"
                        : "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    {isPerson ? (
                      <Users className="w-6 h-6" />
                    ) : (
                      <Building2 className="w-6 h-6" />
                    )}
                  </div>

                  <div className="min-w-0 space-y-2 flex-1">
                    {/* Header: Name & Type Pill */}
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base sm:text-lg font-black text-brand-primary leading-tight truncate">
                        {isPerson
                          ? prospect.personName || prospect.decisionMaker?.name || prospect.companyName
                          : prospect.companyName}
                      </h3>

                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${
                          isPerson
                            ? "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30"
                            : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                        }`}
                      >
                        {isPerson ? "Executive / Person" : "Company"}
                      </span>

                      {website && (
                        <a
                          href={website.startsWith("http") ? website : `https://${website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-pilot-blue hover:underline bg-pilot-blue/10 px-2 py-0.5 rounded-md"
                        >
                          <Globe className="w-3 h-3" />
                          <span>Website</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>

                    {/* Headline for Person or Firmographics for Company */}
                    {isPerson ? (
                      <div className="text-xs font-semibold text-brand-primary/80">
                        <span>{prospect.title || prospect.decisionMaker?.title || "Executive Leader"}</span>
                        {prospect.companyName && (
                          <>
                            <span className="text-brand-primary/40 mx-1.5">•</span>
                            <span className="font-bold text-brand-primary">
                              {prospect.companyName}
                            </span>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-brand-primary/70">
                        {prospect.industry && (
                          <span className="flex items-center gap-1">
                            <Tag className="w-3.5 h-3.5 text-brand-primary/40" />
                            <span className="font-semibold">{prospect.industry}</span>
                          </span>
                        )}

                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-brand-primary/40" />
                          <span>{prospect.location || prospect.city}</span>
                        </span>

                        {prospect.companySize && (
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-brand-primary/40" />
                            <span>{prospect.companySize}</span>
                          </span>
                        )}

                        {prospect.annualRevenue && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3.5 h-3.5 text-brand-primary/40" />
                            <span>{prospect.annualRevenue}</span>
                          </span>
                        )}
                      </div>
                    )}

                    {/* ── ACCURATE VERIFIED CONTACT CHANNELS (HIGHEST PRIORITY) ── */}
                    <div className="p-3 rounded-2xl bg-brand-secondary/25 border border-brand-secondary/50 space-y-2 mt-2">
                      <div className="text-[10px] font-black uppercase tracking-wider text-brand-primary/50 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                          Verified Direct Contact Details
                        </span>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                          Live Active Records
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2.5 text-xs">
                        {/* Phone */}
                        {phone ? (
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-brand-light border border-brand-secondary text-brand-primary font-bold">
                            <Phone className="w-3.5 h-3.5 text-emerald-500" />
                            <a
                              href={`tel:${phone.replace(/\s+/g, "")}`}
                              className="hover:underline"
                            >
                              {phone}
                            </a>
                            <button
                              type="button"
                              onClick={() => handleCopy(phone, `phone-${prospect.prospectKey}`)}
                              className="ml-1 text-brand-primary/40 hover:text-brand-primary cursor-pointer"
                              title="Copy phone"
                            >
                              {copiedKey === `phone-${prospect.prospectKey}` ? (
                                <Check className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-brand-primary/40 italic">
                            Corporate phone in directory lookup
                          </span>
                        )}

                        {/* Email */}
                        {email ? (
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-brand-light border border-brand-secondary text-brand-primary font-bold">
                            <Mail className="w-3.5 h-3.5 text-sky-500" />
                            <a href={`mailto:${email}`} className="hover:underline">
                              {email}
                            </a>
                            <button
                              type="button"
                              onClick={() => handleCopy(email, `email-${prospect.prospectKey}`)}
                              className="ml-1 text-brand-primary/40 hover:text-brand-primary cursor-pointer"
                              title="Copy email"
                            >
                              {copiedKey === `email-${prospect.prospectKey}` ? (
                                <Check className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        ) : null}

                        {/* LinkedIn Profile */}
                        {linkedin ? (
                          <a
                            href={linkedin.startsWith("http") ? linkedin : `https://${linkedin}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#0077B5]/15 border border-[#0077B5]/30 text-[#0077B5] dark:text-[#3897d3] font-bold hover:bg-[#0077B5]/25 transition"
                          >
                            <LinkedinIcon className="w-3.5 h-3.5" />
                            <span>View LinkedIn Profile</span>
                            <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                          </a>
                        ) : null}
                      </div>

                      {/* Key Decision Maker snippet for Companies */}
                      {!isPerson && prospect.decisionMaker?.name && (
                        <div className="pt-1 text-xs text-brand-primary/70 flex items-center gap-2">
                          <span className="font-bold text-brand-primary/50 text-[11px] uppercase">
                            Primary Executive:
                          </span>
                          <span className="font-black text-brand-primary">
                            {prospect.decisionMaker.name}
                          </span>
                          {prospect.decisionMaker.title && (
                            <span className="text-brand-primary/60 font-medium">
                              ({prospect.decisionMaker.title})
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Match Reasons Signals */}
                    {prospect.matchReasons && prospect.matchReasons.length > 0 && (
                      <div className="pt-1 space-y-1">
                        {prospect.matchReasons.slice(0, 2).map((reason, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-1.5 text-xs text-brand-primary/75"
                          >
                            <Sparkles className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{reason}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Right: Match Score & Action Buttons ────────────────── */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 shrink-0 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-brand-secondary">
                  <div className={`px-3.5 py-1.5 rounded-2xl border text-center ${scoreStyle.bg}`}>
                    <div className="text-lg font-black leading-none">
                      {prospect.matchScore}%
                    </div>
                    <div className="text-[9px] font-black uppercase tracking-wider mt-0.5">
                      {scoreStyle.label}
                    </div>
                  </div>

                  {/* RESOLVED ACTION BUTTON */}
                  {isResolved ? (
                    <button
                      type="button"
                      onClick={() => onToggleResolve && onToggleResolve(prospect, false)}
                      disabled={isResolving}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-black rounded-xl border border-purple-500/40 bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 transition cursor-pointer"
                      title="Click to unresolve"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{isResolving ? "Updating..." : "Unresolve"}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onToggleResolve && onToggleResolve(prospect, true)}
                      disabled={isResolving}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-black rounded-xl text-white bg-purple-600 hover:bg-purple-700 shadow-sm active:scale-95 transition cursor-pointer disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{isResolving ? "Saving..." : "Mark as Resolved"}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onInspectProspect(prospect)}
                    className="text-xs font-bold text-pilot-blue hover:underline flex items-center gap-1 cursor-pointer pt-1"
                  >
                    <span>Inspect Full Intel</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
