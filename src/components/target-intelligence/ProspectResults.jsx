import React from "react";
import {
  Building2,
  MapPin,
  Users,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  Sparkles,
  TrendingUp,
  Tag,
  DollarSign,
  Globe,
} from "lucide-react";

export default function ProspectResults({
  prospects = [],
  hasSearched = false,
  onInspectProspect,
}) {
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

  if (prospects.length === 0) {
    if (!hasSearched) {
      return (
        <div className="bg-brand-light rounded-2xl border border-brand-secondary p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-brand-primary">
            Ready to Discover Target Accounts
          </h3>
          <p className="text-xs text-brand-primary/60 max-w-md mx-auto">
            Enter what company type, industry, or service you are searching for above (e.g. &ldquo;Find Pet companies or pet service providing companies&rdquo;) and click Search Target Prospects.
          </p>
        </div>
      );
    }

    return (
      <div className="bg-brand-light rounded-2xl border border-brand-secondary p-12 text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-brand-secondary/40 flex items-center justify-center mx-auto text-brand-primary/50">
          <Building2 className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-brand-primary">
          No matching prospects found
        </h3>
        <p className="text-xs text-brand-primary/60 max-w-md mx-auto">
          Try expanding your search query, switching cities, or broadening
          the business need prompt.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Prospect Cards Grid ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4">
        {prospects.map((prospect) => {
          const scoreStyle = getScoreBadge(prospect.matchScore);

          return (
            <div
              key={prospect.id}
              className="rounded-2xl border border-brand-secondary hover:border-brand-primary/30 p-5 transition-all bg-brand-light shadow-2xs"
            >
              <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                {/* Company Details Header */}
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                    <Building2 className="w-5 h-5" />
                  </div>

                  <div className="min-w-0 space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-black text-brand-primary leading-tight truncate">
                        {prospect.companyName}
                      </h3>
                      {prospect.website && (
                        <a
                          href={prospect.website.startsWith("http") ? prospect.website : `https://${prospect.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-pilot-blue hover:underline bg-pilot-blue/10 px-2 py-0.5 rounded-md"
                        >
                          <Globe className="w-3 h-3" />
                          <span>Visit Website</span>
                        </a>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-brand-primary/70">
                      <span className="flex items-center gap-1">
                        <Tag className="w-3.5 h-3.5 text-brand-primary/50" />
                        <span className="font-semibold">{prospect.industry}</span>
                      </span>

                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-brand-primary/50" />
                        <span>{prospect.location || prospect.city}</span>
                      </span>

                      {prospect.companySize && (
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-brand-primary/50" />
                          <span>{prospect.companySize}</span>
                        </span>
                      )}

                      {prospect.annualRevenue && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5 text-brand-primary/50" />
                          <span>{prospect.annualRevenue}</span>
                        </span>
                      )}
                    </div>

                    {/* Decision Maker Snippet */}
                    <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
                      <span className="text-[11px] font-bold text-brand-primary/50 uppercase tracking-wider">
                        Key Contact:
                      </span>
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-brand-secondary/40">
                        <span className="font-bold text-brand-primary">
                          {prospect.decisionMaker?.name || "Corporate Executive"}
                        </span>
                        {prospect.decisionMaker?.title && (
                          <>
                            <span className="text-brand-primary/40">•</span>
                            <span className="text-brand-primary/70 font-medium">
                              {prospect.decisionMaker.title}
                            </span>
                          </>
                        )}
                      </div>

                      <span className="text-[11px] text-brand-primary/50 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                        {prospect.source}
                      </span>
                    </div>

                    {/* Match Reasons Signals */}
                    {prospect.matchReasons && prospect.matchReasons.length > 0 && (
                      <div className="pt-2 space-y-1">
                        {prospect.matchReasons.map((reason, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-1.5 text-xs text-brand-primary/80"
                          >
                            <Sparkles className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{reason}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Score & Detail CTA */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 shrink-0">
                  <div
                    className={`px-3 py-1.5 rounded-xl border text-center ${scoreStyle.bg}`}
                  >
                    <div className="text-lg font-black leading-none">
                      {prospect.matchScore}%
                    </div>
                    <div className="text-[9px] font-bold uppercase tracking-wider mt-0.5">
                      {scoreStyle.label}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onInspectProspect(prospect)}
                    className="text-xs font-bold text-pilot-blue hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>View Details</span>
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
