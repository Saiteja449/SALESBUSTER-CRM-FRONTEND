import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Search,
  Filter,
  Building2,
  MapPin,
  Users,
  Briefcase,
  RotateCcw,
  Check,
  ChevronDown,
  X,
  CheckCircle2,
} from "lucide-react";
import { targetIntelligenceService } from "../../services/targetIntelligence.js";

const SAMPLE_PROMPTS = [
  "Find Pet companies or pet service providing companies",
  "Mid-sized pharmaceutical fabrication companies in Balanagar & Jeedimetla with 100+ employees",
  "Automotive tier-2 suppliers in Telangana seeking inventory & supply chain automation",
];

const INDUSTRIES = [
  "All",
  "Pet Care & Veterinary",
  "Manufacturing",
  "Pharmaceuticals",
  "Healthcare & Medical",
  "Automotive & Engineering",
  "Plastics & Packaging",
  "Renewable Energy",
  "IT & Software",
  "Food & Beverage",
];

const CITIES = [
  "All",
  "Hyderabad",
  "Bengaluru",
  "Mumbai",
  "Delhi NCR",
  "Pune",
  "Chennai",
  "Ahmedabad",
  "Kolkata",
];

const COMPANY_SIZES = [
  "Any Size",
  "1-10 employees",
  "11-50 employees",
  "50-200 employees",
  "200-500 employees",
  "500-1000 employees",
  "1000+ employees",
];

const ROLES = [
  "Founder & CEO",
  "Managing Director",
  "Chief Information Officer (CIO)",
  "Chief Technology Officer (CTO)",
  "Head of Operations / COO",
  "Procurement Manager",
  "VP of Sales / Business Head",
];

export default function TargetProfileForm({
  onSearch,
  isLoading,
  initialFilters = {},
  searchType: propSearchType = "all",
  onSearchTypeChange,
  resolutionFilter = "all",
  onResolutionFilterChange,
}) {
  const [nlPrompt, setNlPrompt] = useState("");
  const [searchType, setSearchType] = useState(propSearchType || "all"); // 'all' | 'companies' | 'people'
  const [isInterpreting, setIsInterpreting] = useState(false);

  // Structured filters
  const [industry, setIndustry] = useState(initialFilters.industry || "All");
  const [city, setCity] = useState(initialFilters.city || "All");
  const [customCity, setCustomCity] = useState("");
  const [companySize, setCompanySize] = useState("Any Size");
  const [need, setNeed] = useState("");
  const [selectedRoles, setSelectedRoles] = useState([]);

  // Popover open state for quick LinkedIn filter pills
  const [activePopover, setActivePopover] = useState(null); // 'category' | 'city' | 'size' | 'industry' | 'role' | 'status'
  const popoverRef = useRef(null);

  // Sync external searchType changes
  useEffect(() => {
    if (propSearchType && propSearchType !== searchType) {
      setSearchType(propSearchType);
    }
  }, [propSearchType]);

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setActivePopover(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleApplySample = (prompt) => {
    setNlPrompt(prompt);
  };

  const handleCategorySelect = (type) => {
    setSearchType(type);
    setActivePopover(null);
    if (onSearchTypeChange) {
      onSearchTypeChange(type);
    }
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

  const handleCitySelect = (c) => {
    setCity(c);
    setCustomCity("");
    setActivePopover(null);
  };

  const handleCustomCityApply = () => {
    if (customCity.trim()) {
      setCity(customCity.trim());
      setActivePopover(null);
    }
  };

  const handleCompanySizeSelect = (size) => {
    setCompanySize(size);
    setActivePopover(null);
  };

  const handleIndustrySelect = (ind) => {
    setIndustry(ind);
    setActivePopover(null);
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    setActivePopover(null);
    const trimmedPrompt = nlPrompt.trim();
    onSearch({
      prompt: trimmedPrompt,
      searchType,
      industry: industry !== "All" ? industry : undefined,
      city: city !== "All" ? city : undefined,
      companySize: companySize !== "Any Size" ? companySize : undefined,
      need: need ? need : undefined,
      roles: selectedRoles.length > 0 ? selectedRoles : undefined,
    });
  };

  const handleReset = () => {
    setNlPrompt("");
    setSearchType("all");
    setIndustry("All");
    setCity("All");
    setCustomCity("");
    setCompanySize("Any Size");
    setNeed("");
    setSelectedRoles([]);
    setActivePopover(null);
    if (onSearchTypeChange) onSearchTypeChange("all");
    if (onResolutionFilterChange) onResolutionFilterChange("all");
  };

  // Compute active filters count for badge
  const activeFiltersCount =
    (searchType !== "all" ? 1 : 0) +
    (city !== "All" ? 1 : 0) +
    (companySize !== "Any Size" ? 1 : 0) +
    (industry !== "All" ? 1 : 0) +
    (selectedRoles.length > 0 ? selectedRoles.length : 0) +
    (resolutionFilter !== "all" ? 1 : 0);

  return (
    <div
      ref={popoverRef}
      className="bg-brand-light rounded-3xl border border-brand-secondary p-5 sm:p-6 shadow-xs space-y-4 relative"
    >
      {/* ── 1. Top Row: LinkedIn Scope Selector Tabs ─────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-secondary/60 pb-3.5">
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-brand-secondary/30 border border-brand-secondary/40">
          <button
            type="button"
            onClick={() => handleCategorySelect("all")}
            className={`px-4 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
              searchType === "all"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-brand-primary/70 hover:text-brand-primary hover:bg-brand-secondary/40"
            }`}
          >
            <span>All Results</span>
          </button>

          <button
            type="button"
            onClick={() => handleCategorySelect("companies")}
            className={`px-4 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
              searchType === "companies"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-brand-primary/70 hover:text-brand-primary hover:bg-brand-secondary/40"
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Companies</span>
          </button>

          <button
            type="button"
            onClick={() => handleCategorySelect("people")}
            className={`px-4 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
              searchType === "people"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-brand-primary/70 hover:text-brand-primary hover:bg-brand-secondary/40"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>People (Decision Makers)</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleInterpretPrompt}
            disabled={isInterpreting || !nlPrompt.trim()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border border-brand-secondary bg-brand-light hover:bg-brand-secondary/40 text-brand-primary transition cursor-pointer disabled:opacity-40"
            title="Auto-extract City, Industry & Roles with AI"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            <span>{isInterpreting ? "Interpreting..." : "AI Auto-Fill"}</span>
          </button>

          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1 text-xs font-bold text-brand-primary/50 hover:text-rose-600 px-2.5 py-1.5 rounded-xl hover:bg-rose-500/10 transition cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* ── 2. Unified Search Input Bar ──────────────────────────────────── */}
      <div className="relative">
        <div className="relative flex items-center">
          <div className="absolute left-4 text-brand-primary/40 pointer-events-none">
            <Search className="w-5 h-5" />
          </div>

          <input
            type="text"
            value={nlPrompt}
            onChange={(e) => setNlPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              searchType === "companies"
                ? "Search companies by name, sector or business model (e.g. 'Pet care companies in Hyderabad', 'Pharma packaging')..."
                : searchType === "people"
                ? "Search decision makers by role, title, or company (e.g. 'Founders of pet startups', 'CIO in Manufacturing')..."
                : "Search companies, decision makers, industry or location (e.g. 'Pet companies or pet service providing companies')..."
            }
            className="w-full pl-12 pr-28 py-3.5 text-sm font-medium rounded-2xl bg-brand-light border border-brand-secondary text-brand-primary placeholder:text-brand-primary/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition shadow-2xs"
          />

          <div className="absolute right-2 flex items-center gap-1.5">
            {nlPrompt && (
              <button
                type="button"
                onClick={() => setNlPrompt("")}
                className="p-1.5 text-brand-primary/40 hover:text-brand-primary rounded-lg transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-black rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm active:scale-95 transition cursor-pointer disabled:opacity-50"
            >
              <Search className="w-3.5 h-3.5" />
              <span>{isLoading ? "Searching..." : "Search"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 3. LinkedIn-Style Quick Filter Pills Row ──────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap pt-1">
        {/* NEW: Category Dropdown Filter Pill (Companies | People | All) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setActivePopover(activePopover === "category" ? null : "category")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition cursor-pointer ${
              searchType !== "all"
                ? "bg-emerald-500/15 border-emerald-500/50 text-emerald-700 dark:text-emerald-300 shadow-2xs"
                : "bg-brand-light border-brand-secondary text-brand-primary/80 hover:bg-brand-secondary/40"
            }`}
          >
            {searchType === "companies" ? (
              <Building2 className="w-3.5 h-3.5 text-emerald-500" />
            ) : searchType === "people" ? (
              <Users className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <Filter className="w-3.5 h-3.5 text-emerald-500" />
            )}
            <span>
              {searchType === "companies"
                ? "Category: Companies"
                : searchType === "people"
                ? "Category: People"
                : "Category: All"}
            </span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {activePopover === "category" && (
            <div className="absolute left-0 mt-2 w-64 p-3 bg-brand-light rounded-2xl border border-brand-secondary shadow-xl z-30 space-y-1.5 animate-fadeIn">
              <div className="text-xs font-black text-brand-primary uppercase tracking-wider mb-1">
                Select Entity Category
              </div>
              {[
                { id: "all", label: "All Results", icon: Filter },
                { id: "companies", label: "Companies", icon: Building2 },
                { id: "people", label: "People (Decision Makers)", icon: Users },
              ].map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleCategorySelect(opt.id)}
                    className={`w-full px-3 py-2 text-xs rounded-lg text-left transition cursor-pointer flex items-center justify-between ${
                      searchType === opt.id
                        ? "bg-emerald-600 text-white font-bold"
                        : "text-brand-primary/80 hover:bg-brand-secondary/40"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5" />
                      <span>{opt.label}</span>
                    </div>
                    {searchType === opt.id && <Check className="w-3.5 h-3.5" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* City / Location Pill */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setActivePopover(activePopover === "city" ? null : "city")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition cursor-pointer ${
              city !== "All"
                ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-700 dark:text-emerald-300"
                : "bg-brand-light border-brand-secondary text-brand-primary/80 hover:bg-brand-secondary/40"
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-500" />
            <span>{city !== "All" ? `City: ${city}` : "Locations / City"}</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {activePopover === "city" && (
            <div className="absolute left-0 mt-2 w-72 p-3 bg-brand-light rounded-2xl border border-brand-secondary shadow-xl z-30 space-y-2.5 animate-fadeIn">
              <div className="text-xs font-black text-brand-primary uppercase tracking-wider">
                Select City / Region
              </div>
              <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto">
                {CITIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => handleCitySelect(c)}
                    className={`px-2.5 py-1.5 text-xs rounded-lg text-left truncate transition cursor-pointer ${
                      city === c
                        ? "bg-emerald-600 text-white font-bold"
                        : "text-brand-primary/80 hover:bg-brand-secondary/40"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <div className="pt-2 border-t border-brand-secondary flex items-center gap-1.5">
                <input
                  type="text"
                  value={customCity}
                  onChange={(e) => setCustomCity(e.target.value)}
                  placeholder="Other city name..."
                  className="w-full px-2.5 py-1 text-xs rounded-lg bg-brand-secondary/20 border border-brand-secondary text-brand-primary focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  onKeyDown={(e) => e.key === "Enter" && handleCustomCityApply()}
                />
                <button
                  type="button"
                  onClick={handleCustomCityApply}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                >
                  Set
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Company Size Pill */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setActivePopover(activePopover === "size" ? null : "size")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition cursor-pointer ${
              companySize !== "Any Size"
                ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-700 dark:text-emerald-300"
                : "bg-brand-light border-brand-secondary text-brand-primary/80 hover:bg-brand-secondary/40"
            }`}
          >
            <Users className="w-3.5 h-3.5 text-emerald-500" />
            <span>{companySize !== "Any Size" ? `Size: ${companySize}` : "Company Size"}</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {activePopover === "size" && (
            <div className="absolute left-0 mt-2 w-64 p-3 bg-brand-light rounded-2xl border border-brand-secondary shadow-xl z-30 space-y-1.5 animate-fadeIn">
              <div className="text-xs font-black text-brand-primary uppercase tracking-wider mb-1">
                Company Headcount
              </div>
              {COMPANY_SIZES.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => handleCompanySizeSelect(size)}
                  className={`w-full px-3 py-1.5 text-xs rounded-lg text-left transition cursor-pointer flex items-center justify-between ${
                    companySize === size
                      ? "bg-emerald-600 text-white font-bold"
                      : "text-brand-primary/80 hover:bg-brand-secondary/40"
                  }`}
                >
                  <span>{size}</span>
                  {companySize === size && <Check className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Industry Pill */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setActivePopover(activePopover === "industry" ? null : "industry")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition cursor-pointer ${
              industry !== "All"
                ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-700 dark:text-emerald-300"
                : "bg-brand-light border-brand-secondary text-brand-primary/80 hover:bg-brand-secondary/40"
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>{industry !== "All" ? `Industry: ${industry}` : "Industry"}</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {activePopover === "industry" && (
            <div className="absolute left-0 mt-2 w-64 p-3 bg-brand-light rounded-2xl border border-brand-secondary shadow-xl z-30 space-y-1.5 animate-fadeIn">
              <div className="text-xs font-black text-brand-primary uppercase tracking-wider mb-1">
                Industry Sector
              </div>
              <div className="max-h-52 overflow-y-auto space-y-1">
                {INDUSTRIES.map((ind) => (
                  <button
                    key={ind}
                    type="button"
                    onClick={() => handleIndustrySelect(ind)}
                    className={`w-full px-3 py-1.5 text-xs rounded-lg text-left transition cursor-pointer flex items-center justify-between ${
                      industry === ind
                        ? "bg-emerald-600 text-white font-bold"
                        : "text-brand-primary/80 hover:bg-brand-secondary/40"
                    }`}
                  >
                    <span className="truncate">{ind}</span>
                    {industry === ind && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Seniority / Role Pill */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setActivePopover(activePopover === "role" ? null : "role")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition cursor-pointer ${
              selectedRoles.length > 0
                ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-700 dark:text-emerald-300"
                : "bg-brand-light border-brand-secondary text-brand-primary/80 hover:bg-brand-secondary/40"
            }`}
          >
            <Briefcase className="w-3.5 h-3.5 text-emerald-500" />
            <span>
              {selectedRoles.length > 0 ? `Roles (${selectedRoles.length})` : "Seniority / Role"}
            </span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {activePopover === "role" && (
            <div className="absolute left-0 mt-2 w-72 p-3 bg-brand-light rounded-2xl border border-brand-secondary shadow-xl z-30 space-y-2 animate-fadeIn">
              <div className="text-xs font-black text-brand-primary uppercase tracking-wider">
                Decision Maker Titles
              </div>
              <div className="space-y-1 max-h-56 overflow-y-auto">
                {ROLES.map((role) => {
                  const isSelected = selectedRoles.includes(role);
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => handleRoleToggle(role)}
                      className={`w-full px-3 py-1.5 text-xs rounded-lg text-left transition cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/30"
                          : "text-brand-primary/80 hover:bg-brand-secondary/40"
                      }`}
                    >
                      <span className="truncate">{role}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Resolution Status Filter Pill */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setActivePopover(activePopover === "status" ? null : "status")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition cursor-pointer ${
              resolutionFilter !== "all"
                ? "bg-purple-500/10 border-purple-500/50 text-purple-700 dark:text-purple-300"
                : "bg-brand-light border-brand-secondary text-brand-primary/80 hover:bg-brand-secondary/40"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-purple-500" />
            <span>
              {resolutionFilter === "resolved"
                ? "Status: Resolved"
                : resolutionFilter === "unresolved"
                ? "Status: Unresolved"
                : "Resolution Status"}
            </span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {activePopover === "status" && (
            <div className="absolute left-0 mt-2 w-56 p-3 bg-brand-light rounded-2xl border border-brand-secondary shadow-xl z-30 space-y-1.5 animate-fadeIn">
              <div className="text-xs font-black text-brand-primary uppercase tracking-wider mb-1">
                Filter by Resolution
              </div>
              {[
                { id: "all", label: "All Prospects" },
                { id: "unresolved", label: "Unresolved Only" },
                { id: "resolved", label: "Resolved Already" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    if (onResolutionFilterChange) onResolutionFilterChange(opt.id);
                    setActivePopover(null);
                  }}
                  className={`w-full px-3 py-1.5 text-xs rounded-lg text-left transition cursor-pointer flex items-center justify-between ${
                    resolutionFilter === opt.id
                      ? "bg-purple-600 text-white font-bold"
                      : "text-brand-primary/80 hover:bg-brand-secondary/40"
                  }`}
                >
                  <span>{opt.label}</span>
                  {resolutionFilter === opt.id && <Check className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── 4. Active Filter Badges ──────────────────────────────────────── */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-brand-secondary/40">
          <span className="text-[11px] font-bold text-brand-primary/50 uppercase tracking-wider mr-1">
            Active Filters:
          </span>

          {searchType !== "all" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
              <span>Category: {searchType === "companies" ? "Companies" : "People"}</span>
              <button
                type="button"
                onClick={() => handleCategorySelect("all")}
                className="hover:text-emerald-900 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {city !== "All" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
              <span>City: {city}</span>
              <button
                type="button"
                onClick={() => setCity("All")}
                className="hover:text-emerald-900 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {companySize !== "Any Size" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
              <span>Size: {companySize}</span>
              <button
                type="button"
                onClick={() => setCompanySize("Any Size")}
                className="hover:text-emerald-900 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {industry !== "All" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
              <span>Industry: {industry}</span>
              <button
                type="button"
                onClick={() => setIndustry("All")}
                className="hover:text-emerald-900 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {selectedRoles.map((r) => (
            <span
              key={r}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
            >
              <span>Role: {r}</span>
              <button
                type="button"
                onClick={() => handleRoleToggle(r)}
                className="hover:text-emerald-900 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          {resolutionFilter !== "all" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
              <span>Status: {resolutionFilter}</span>
              <button
                type="button"
                onClick={() => onResolutionFilterChange && onResolutionFilterChange("all")}
                className="hover:text-purple-900 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          <button
            type="button"
            onClick={handleReset}
            className="text-[11px] font-bold text-pilot-blue hover:underline cursor-pointer ml-1"
          >
            Clear all
          </button>
        </div>
      )}

      {/* ── 5. Quick Sample Prompts ──────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
        <span className="text-[11px] font-bold text-brand-primary/45 uppercase tracking-wider mr-1">
          Suggestions:
        </span>
        {SAMPLE_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => handleApplySample(prompt)}
            className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-brand-secondary/30 hover:bg-brand-secondary text-brand-primary/75 transition truncate max-w-xs cursor-pointer"
            title={prompt}
          >
            &ldquo;{prompt}&rdquo;
          </button>
        ))}
      </div>
    </div>
  );
}
