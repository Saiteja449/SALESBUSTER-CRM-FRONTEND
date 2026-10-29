import React from "react";
import {
  Building2,
  MapPin,
  Users,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Sparkles,
  TrendingUp,
  Tag,
  DollarSign,
} from "lucide-react";

export default function ProspectResults({
  prospects = [],
  hasSearched = false,
  selectedIds = [],
  onToggleSelect,
  onSelectAll,
  onClearSelection,
  onInspectProspect,
  onOpenImportDialog,
}) {
  const allSelected =
    prospects.length > 0 && selectedIds.length === prospects.length;

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
      {/* ── Selection Action Bar ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-brand-light border border-brand-secondary">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={() => (allSelected ? onClearSelection() : onSelectAll())}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-xs font-bold text-brand-primary">
              Select All ({prospects.length})
            </span>
          </label>

          {selectedIds.length > 0 && (
            <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
              {selectedIds.length} Selected
            </span>
          )}
        </div>

        {selectedIds.length > 0 && (
          <button
            type="button"
            onClick={onOpenImportDialog}
            className="flex items-center gap-2 px-4 py-2 text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition active:scale-[0.98] cursor-pointer"
          >
            <span>Import {selectedIds.length} to SalesBuster CRM</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* ── Prospect Cards Grid ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4">
        {prospects.map((prospect) => {
          const isSelected = selectedIds.includes(prospect.id);
          const scoreStyle = getScoreBadge(prospect.matchScore);

          return (
            <div
              key={prospect.id}
              className={`rounded-2xl border p-5 transition-all bg-brand-light ${
                isSelected
                  ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs"
                  : "border-brand-secondary hover:border-brand-primary/30"
              }`}
            >
              <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                {/* Checkbox and Company Header */}
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelect(prospect.id)}
                    className="mt-1 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />

                  <div className="min-w-0 space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3
                        onClick={() => onInspectProspect(prospect)}
                        className="text-base font-extrabold text-brand-primary hover:text-emerald-600 transition cursor-pointer truncate"
                      >
                        {prospect.companyName}
                      </h3>

                      {/* Duplicate Badge */}
                      {prospect.isDuplicate ? (
                        <span
                          title={`Existing lead in CRM: ${prospect.duplicateDetails?.leadName}`}
                          className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                        >
                          <AlertCircle className="w-3 h-3" />
                          <span>CRM Match</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>New Account</span>
                        </span>
                      )}
                    </div>

                    {/* Metadata line */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-brand-primary/65">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-brand-primary/40 shrink-0" />
                        {prospect.industry}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-brand-primary/40 shrink-0" />
                        {prospect.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-brand-primary/40 shrink-0" />
                        {prospect.companySize}
                      </span>
                    </div>

                    {/* Decision Maker Contact Pill */}
                    <div className="pt-2 flex flex-wrap items-center gap-3">
                      <div className="p-2 rounded-xl bg-brand-secondary/30 border border-brand-secondary/60 flex items-center gap-2 text-xs">
                        <span className="font-bold text-brand-primary">
                          {prospect.decisionMaker?.name}
                        </span>
                        <span className="text-brand-primary/40">•</span>
                        <span className="text-brand-primary/70 font-medium">
                          {prospect.decisionMaker?.title}
                        </span>
                      </div>

                      <span className="text-[11px] text-brand-primary/50 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                        {prospect.source}
                      </span>
                    </div>

                    {/* Match Reasons Signals */}
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
                    <span>View Evidence</span>
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
