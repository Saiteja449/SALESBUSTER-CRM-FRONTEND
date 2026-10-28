import React, { useState } from "react";
import {
  Sparkles,
  Search,
  Filter,
  Building,
  MapPin,
  Users,
  Briefcase,
  Zap,
  RotateCcw,
  Check,
  ChevronDown,
} from "lucide-react";
import { targetIntelligenceService } from "../../services/targetIntelligence.js";

const SAMPLE_PROMPTS = [
  "Find manufacturing companies in Hyderabad that may need ERP software",
  "Mid-sized pharmaceutical fabrication companies in Balanagar & Jeedimetla with 100+ employees",
  "Automotive tier-2 suppliers in Telangana seeking inventory & supply chain automation",
];

const INDUSTRIES = [
  "All",
  "Manufacturing",
  "Pharmaceuticals",
  "Automotive & Engineering",
  "Plastics & Packaging",
  "Renewable Energy",
  "IT & Software",
];

const CITIES = [
  "All",
  "Hyderabad",
  "Bengaluru",
  "Mumbai",
  "Delhi NCR",
  "Pune",
  "Chennai",
];

const COMPANY_SIZES = [
  "Any Size",
  "10-50 employees",
  "50-200 employees",
  "200-500 employees",
  "500+ employees",
];

const ROLES = [
  "Director of Operations",
  "Chief Information Officer (CIO)",
  "Head of IT / Systems",
  "Managing Director / CEO",
  "Procurement Manager",
];

export default function TargetProfileForm({
  onSearch,
  isLoading,
  initialFilters = {},
}) {
  const [nlPrompt, setNlPrompt] = useState(
    "Find manufacturing companies in Hyderabad that may need ERP software"
  );
  const [isInterpreting, setIsInterpreting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Structured filters
  const [industry, setIndustry] = useState(initialFilters.industry || "Manufacturing");
  const [city, setCity] = useState(initialFilters.city || "Hyderabad");
  const [companySize, setCompanySize] = useState("50-200 employees");
  const [need, setNeed] = useState("Enterprise Resource Planning (ERP)");
  const [selectedRoles, setSelectedRoles] = useState([
    "Director of Operations",
    "Chief Information Officer (CIO)",
  ]);

  const handleApplySample = (prompt) => {
    setNlPrompt(prompt);
  };

  const handleInterpretPrompt = async () => {
    if (!nlPrompt.trim()) return;
    setIsInterpreting(true);
    try {
      const parsed = await targetIntelligenceService.interpretPrompt(nlPrompt);
      if (parsed) {
        if (parsed.city) setCity(parsed.city);
        if (parsed.industry) setIndustry(parsed.industry);
        if (parsed.need) setNeed(parsed.need);
        if (parsed.companySize) setCompanySize(parsed.companySize);
        if (parsed.decisionMakerRoles && Array.isArray(parsed.decisionMakerRoles)) {
          setSelectedRoles(parsed.decisionMakerRoles);
        }
      }
      setShowAdvanced(true);
    } catch (err) {
      console.warn("Error interpreting prompt:", err);
    } finally {
      setIsInterpreting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleRoleToggle = (role) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    onSearch({
      prompt: nlPrompt,
      industry,
      city,
      companySize,
      need,
      roles: selectedRoles,
    });
  };

  const handleReset = () => {
    setNlPrompt("");
    setIndustry("All");
    setCity("All");
    setCompanySize("Any Size");
    setNeed("");
    setSelectedRoles([]);
  };

  return (
    <div className="bg-brand-light rounded-2xl border border-brand-secondary p-5 sm:p-6 shadow-xs space-y-5">
      {/* ── Top Bar: Title & AI Indicator ────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-brand-primary">
              AI Ideal Customer Profile (ICP) Search
            </h2>
            <p className="text-xs text-brand-primary/60">
              Search verified B2B directories with natural language or structured criteria
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowAdvanced((prev) => !prev)}
          className="text-xs font-bold text-pilot-blue hover:text-pilot-blue/80 flex items-center gap-1.5 transition cursor-pointer"
        >
          <Filter className="w-3.5 h-3.5" />
          <span>{showAdvanced ? "Hide Filters" : "Structured Filters"}</span>
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform ${
              showAdvanced ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      {/* ── Natural Language Prompt Box ──────────────────────────────────── */}
      <div className="space-y-2">
        <label
          htmlFor="nlPrompt"
          className="block text-xs font-bold text-brand-primary uppercase tracking-wider"
        >
          Describe Target Market or Business Need
        </label>
        <div className="relative">
          <textarea
            id="nlPrompt"
            rows={2}
            value={nlPrompt}
            onChange={(e) => setNlPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type any question or market description (e.g. 'Textile mills in Surat looking for supply chain management') and press Enter..."
            className="w-full px-4 py-3 text-sm rounded-xl bg-brand-light border border-brand-secondary text-brand-primary placeholder:text-brand-primary/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition resize-none"
          />
        </div>

        {/* Sample Prompt Chips */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          <span className="text-[11px] font-bold text-brand-primary/50 uppercase tracking-wider mr-1">
            Try prompt:
          </span>
          {SAMPLE_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => handleApplySample(prompt)}
              className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-brand-secondary/40 hover:bg-brand-secondary text-brand-primary/80 transition truncate max-w-xs cursor-pointer"
              title={prompt}
            >
              &ldquo;{prompt}&rdquo;
            </button>
          ))}
        </div>
      </div>

      {/* ── Structured Filters (Collapsible / Expandable) ────────────────── */}
      {showAdvanced && (
        <div className="p-4 rounded-xl bg-brand-secondary/20 border border-brand-secondary/40 space-y-4 animate-fadeIn">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Industry */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-brand-primary/70 flex items-center gap-1">
                <Building className="w-3 h-3 text-emerald-500" />
                Industry
              </label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg bg-brand-light border border-brand-secondary text-brand-primary focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              >
                {INDUSTRIES.map((ind) => (
                  <option key={ind} value={ind}>
                    {ind}
                  </option>
                ))}
              </select>
            </div>

            {/* Geography / City */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-brand-primary/70 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-emerald-500" />
                City / Region
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg bg-brand-light border border-brand-secondary text-brand-primary focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              >
                {CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Company Size */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-brand-primary/70 flex items-center gap-1">
                <Users className="w-3 h-3 text-emerald-500" />
                Company Size
              </label>
              <select
                value={companySize}
                onChange={(e) => setCompanySize(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg bg-brand-light border border-brand-secondary text-brand-primary focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              >
                {COMPANY_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>

            {/* Business Need */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-brand-primary/70 flex items-center gap-1">
                <Zap className="w-3 h-3 text-emerald-500" />
                Inferred Need
              </label>
              <input
                type="text"
                value={need}
                onChange={(e) => setNeed(e.target.value)}
                placeholder="e.g. ERP software"
                className="w-full px-3 py-2 text-xs rounded-lg bg-brand-light border border-brand-secondary text-brand-primary focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Decision Maker Roles */}
          <div className="space-y-1.5 pt-1">
            <label className="text-[11px] font-bold text-brand-primary/70 flex items-center gap-1">
              <Briefcase className="w-3 h-3 text-emerald-500" />
              Target Decision-Maker Roles
            </label>
            <div className="flex flex-wrap gap-2">
              {ROLES.map((role) => {
                const isSelected = selectedRoles.includes(role);
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => handleRoleToggle(role)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg border transition cursor-pointer ${
                      isSelected
                        ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-bold"
                        : "bg-brand-light border-brand-secondary text-brand-primary/70 hover:bg-brand-secondary/40"
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-emerald-500" />}
                    <span>{role}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Form Actions ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={handleReset}
          className="text-xs font-bold text-brand-primary/60 hover:text-brand-primary flex items-center gap-1.5 transition cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Filters</span>
        </button>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleInterpretPrompt}
            disabled={isInterpreting || !nlPrompt.trim()}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border border-brand-secondary bg-brand-light hover:bg-brand-secondary/40 text-brand-primary transition cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            <span>Interpret with AI</span>
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex items-center gap-2 px-5 py-2 text-xs font-extrabold rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm active:scale-[0.98] transition cursor-pointer disabled:opacity-50"
          >
            <Search className="w-4 h-4" />
            <span>{isLoading ? "Searching Directories..." : "Search Target Prospects"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
