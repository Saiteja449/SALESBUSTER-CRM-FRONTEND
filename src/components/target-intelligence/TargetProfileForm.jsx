import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Search,
  Filter,
  Building2,
  MapPin,
  Users,
  RotateCcw,
  Check,
  ChevronDown,
  X,
  History,
  CheckCircle2,
  Clock,
  Hash,
} from "lucide-react";
import { targetIntelligenceService } from "../../services/targetIntelligence.js";

const SAMPLE_PROMPTS = [
  "Find pet care businesses in Hyderabad with founder names, mobile numbers, business emails, and websites.",
  "Find pharmaceutical manufacturing companies in Hyderabad with directors and contact emails.",
  "Find IT and SaaS companies in Bengaluru with founders and verified phone numbers.",
];

const INDUSTRIES = [
  "All",
  "Pet Care & Veterinary",
  "IT & Software",
  "Manufacturing",
  "Pharmaceuticals",
  "Healthcare & Medical",
  "Automotive & Engineering",
  "Food & Beverage",
  "Renewable Energy",
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

const ROLES = [
  "Founder & CEO",
  "Managing Director",
  "Business Owner",
  "Director of Operations",
  "Chief Technology Officer (CTO)",
  "Business Head",
];

export default function TargetProfileForm({
  onSearch,
  isLoading,
  initialFilters = {},
  searchHistory = [],
}) {
  const [nlPrompt, setNlPrompt] = useState("");
  const [isInterpreting, setIsInterpreting] = useState(false);
  const [autoExtractOnDiscover, setAutoExtractOnDiscover] = useState(true);
  const [limit, setLimit] = useState(initialFilters.limit || 10);

  // Structured filters (No employee count, No social media)
  const [industry, setIndustry] = useState(initialFilters.industry || "All");
  const [city, setCity] = useState(initialFilters.city || "All");
  const [customCity, setCustomCity] = useState("");
  const [need, setNeed] = useState("");
  const [selectedRoles, setSelectedRoles] = useState(["Founder & CEO", "Managing Director"]);

  // Popover state
  const [activePopover, setActivePopover] = useState(null);
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false);
  const popoverRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setActivePopover(null);
        setShowHistoryDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInterpretPrompt = async (textToInterpret) => {
    const promptText = textToInterpret || nlPrompt;
    if (!promptText.trim()) return null;

    setIsInterpreting(true);
    try {
      const parsed = await targetIntelligenceService.interpretPrompt(promptText);
      if (parsed) {
        if (parsed.city && parsed.city !== "All") {
          const matchedCity = CITIES.find(
            (c) => c.toLowerCase() === parsed.city.toLowerCase()
          );
          if (matchedCity) {
            setCity(matchedCity);
            setCustomCity("");
          } else {
            setCity("Custom");
            setCustomCity(parsed.city);
          }
        }
        if (parsed.industry) {
          const matchedInd = INDUSTRIES.find((i) =>
            i.toLowerCase().includes(parsed.industry.toLowerCase())
          );
          setIndustry(matchedInd || parsed.industry);
        }
        if (parsed.need) setNeed(parsed.need);
        if (Array.isArray(parsed.decisionMakerRoles) && parsed.decisionMakerRoles.length > 0) {
          setSelectedRoles(parsed.decisionMakerRoles);
        }
        return parsed;
      }
    } catch (err) {
      console.warn("AI prompt interpretation notice:", err.message);
    } finally {
      setIsInterpreting(false);
    }
    return null;
  };

  const handleResetFilters = () => {
    setNlPrompt("");
    setIndustry("All");
    setCity("All");
    setCustomCity("");
    setNeed("");
    setSelectedRoles(["Founder & CEO", "Managing Director"]);
    setLimit(10);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    let targetIndustry = industry;
    let targetCity = city === "Custom" ? customCity.trim() || "All" : city;
    let targetNeed = need.trim();
    let targetRoles = selectedRoles;

    // Option: If auto-extract is checked and user provided a natural language prompt, auto-extract criteria first!
    if (autoExtractOnDiscover && nlPrompt.trim()) {
      setIsInterpreting(true);
      try {
        const parsed = await targetIntelligenceService.interpretPrompt(nlPrompt.trim());
        if (parsed) {
          if (parsed.city && parsed.city !== "All") {
            const matchedCity = CITIES.find(
              (c) => c.toLowerCase() === parsed.city.toLowerCase()
            );
            if (matchedCity) {
              targetCity = matchedCity;
              setCity(matchedCity);
              setCustomCity("");
            } else {
              targetCity = parsed.city;
              setCity("Custom");
              setCustomCity(parsed.city);
            }
          }
          if (parsed.industry) {
            const matchedInd = INDUSTRIES.find((i) =>
              i.toLowerCase().includes(parsed.industry.toLowerCase())
            );
            targetIndustry = matchedInd || parsed.industry;
            setIndustry(targetIndustry);
          }
          if (parsed.need) {
            targetNeed = parsed.need;
            setNeed(parsed.need);
          }
          if (Array.isArray(parsed.decisionMakerRoles) && parsed.decisionMakerRoles.length > 0) {
            targetRoles = parsed.decisionMakerRoles;
            setSelectedRoles(parsed.decisionMakerRoles);
          }
        }
      } catch (err) {
        console.warn("AI prompt auto-extract notice:", err?.message);
      } finally {
        setIsInterpreting(false);
      }
    }

    onSearch({
      prompt: nlPrompt.trim(),
      industry: targetIndustry,
      city: targetCity,
      need: targetNeed,
      roles: targetRoles,
      searchType: "all",
      limit,
    });
  };

  const toggleRole = (role) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  return (
    <div className="bg-brand-light rounded-3xl border border-brand-secondary p-5 sm:p-7 shadow-xs space-y-6">
      {/* ── 1. Header & Natural Language AI Search Area ─────────────────── */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </span>
            <h2 className="text-sm sm:text-base font-black text-brand-primary tracking-tight">
              AI Business Discovery & Contact Engine
            </h2>
          </div>

          {searchHistory.length > 0 && (
            <div className="relative" ref={popoverRef}>
              <button
                type="button"
                onClick={() => setShowHistoryDropdown(!showHistoryDropdown)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold text-brand-primary/70 hover:text-brand-primary bg-brand-secondary/30 hover:bg-brand-secondary/50 transition cursor-pointer"
              >
                <History className="w-3.5 h-3.5" />
                <span>Recent Searches ({searchHistory.length})</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {showHistoryDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-brand-light border border-brand-secondary rounded-2xl shadow-xl z-30 p-2 space-y-1">
                  <div className="px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wider text-brand-primary/50">
                    Search History
                  </div>
                  {searchHistory.slice(0, 5).map((s, idx) => (
                    <button
                      key={s._id || idx}
                      type="button"
                      onClick={() => {
                        setNlPrompt(s.originalPrompt || "");
                        if (s.extractedFilters?.industry) setIndustry(s.extractedFilters.industry);
                        if (s.extractedFilters?.city) setCity(s.extractedFilters.city);
                        setShowHistoryDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs text-brand-primary hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 transition flex items-start gap-2"
                    >
                      <Clock className="w-3.5 h-3.5 mt-0.5 shrink-0 opacity-60" />
                      <span className="line-clamp-2">{s.originalPrompt}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Large AI Prompt Textarea */}
        <div className="relative rounded-2xl border border-brand-secondary bg-brand-primary/5 focus-within:border-emerald-500/60 focus-within:ring-2 focus-within:ring-emerald-500/15 transition-all p-3">
          <textarea
            value={nlPrompt}
            onChange={(e) => setNlPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Describe your target companies in plain English... e.g. 'Find pet care businesses in Hyderabad with founder names, mobile numbers, business emails, and websites.'"
            rows={3}
            className="w-full bg-transparent text-xs sm:text-sm text-brand-primary placeholder:text-brand-primary/45 resize-none focus:outline-none"
          />

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-brand-secondary/40">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleInterpretPrompt()}
                disabled={isInterpreting || !nlPrompt.trim()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-brand-secondary/40 hover:bg-brand-secondary/60 text-brand-primary disabled:opacity-40 transition cursor-pointer"
              >
                <Sparkles className={`w-3.5 h-3.5 text-emerald-500 ${isInterpreting ? "animate-spin" : ""}`} />
                <span>{isInterpreting ? "Extracting Filters..." : "AI Auto-Extract"}</span>
              </button>

              <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold text-brand-primary/80 hover:text-brand-primary bg-brand-secondary/20 hover:bg-brand-secondary/40 transition cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoExtractOnDiscover}
                  onChange={(e) => setAutoExtractOnDiscover(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-500 cursor-pointer"
                />
                <span className="flex items-center gap-1 text-[11px]">
                  <Sparkles className="w-3 h-3 text-emerald-500" />
                  Auto-Extract & Search
                </span>
              </label>

              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-brand-primary/50 hover:text-brand-primary hover:bg-brand-secondary/30 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading || isInterpreting}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-black bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white shadow-sm shadow-emerald-500/20 disabled:opacity-50 transition cursor-pointer"
            >
              {isInterpreting ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin text-white" />
                  <span>AI Auto-Extracting...</span>
                </>
              ) : isLoading ? (
                <>
                  <Search className="w-4 h-4 animate-spin" />
                  <span>Discovering Businesses...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Discover {limit} Businesses</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Example Prompts (Explicitly labeled as examples; never shown as discovered data) */}
        <div className="space-y-1.5">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-brand-primary/50 flex items-center gap-1">
            <span>Example search prompts</span>
            <span className="font-normal lowercase text-brand-primary/40">(click to prefill query):</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_PROMPTS.map((promptText, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setNlPrompt(promptText);
                  handleInterpretPrompt(promptText);
                }}
                className="text-left text-[11px] px-2.5 py-1 rounded-xl bg-brand-secondary/30 hover:bg-brand-secondary/50 text-brand-primary/70 hover:text-brand-primary transition cursor-pointer border border-brand-secondary/40"
              >
                💡 {promptText}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── 2. Structured Filter Pills (Industry, City, Decision Maker Roles) ──── */}
      <div className="pt-2 border-t border-brand-secondary space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-extrabold text-brand-primary">
            <Filter className="w-3.5 h-3.5 text-emerald-500" />
            <span>Structured Filters (Editable)</span>
          </div>
          <span className="text-[11px] text-brand-primary/50">
            Auto-populated from AI prompt or customize manually
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Industry Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-extrabold uppercase tracking-wider text-brand-primary/60 flex items-center gap-1">
              <Building2 className="w-3 h-3 text-emerald-500" />
              <span>Industry</span>
            </label>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-brand-light border border-brand-secondary text-brand-primary focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              {INDUSTRIES.map((ind) => (
                <option key={ind} value={ind}>
                  {ind}
                </option>
              ))}
            </select>
          </div>

          {/* Location Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-extrabold uppercase tracking-wider text-brand-primary/60 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-emerald-500" />
              <span>Target City</span>
            </label>
            <select
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                if (e.target.value !== "Custom") setCustomCity("");
              }}
              className="w-full px-3 py-2 text-xs rounded-xl bg-brand-light border border-brand-secondary text-brand-primary focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              {CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
              <option value="Custom">Custom City...</option>
            </select>
            {city === "Custom" && (
              <input
                type="text"
                value={customCity}
                onChange={(e) => setCustomCity(e.target.value)}
                placeholder="Enter city (e.g. Warangal)"
                className="w-full mt-1.5 px-3 py-1.5 text-xs rounded-xl bg-brand-light border border-brand-secondary text-brand-primary focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            )}
          </div>

          {/* Companies Count / Limit Selector */}
          <div className="space-y-1">
            <label className="text-[11px] font-extrabold uppercase tracking-wider text-brand-primary/60 flex items-center gap-1">
              <Hash className="w-3 h-3 text-emerald-500" />
              <span>Companies to Discover</span>
            </label>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs rounded-xl bg-brand-light border border-brand-secondary text-brand-primary focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer font-bold"
            >
              <option value={5}>5 Companies (Fast)</option>
              <option value={10}>10 Companies (Standard)</option>
              <option value={15}>15 Companies</option>
              <option value={20}>20 Companies</option>
              <option value={25}>25 Companies</option>
              <option value={50}>50 Companies (Deep Search)</option>
            </select>
          </div>

          {/* Decision Maker Roles Filter */}
          <div className="space-y-1 col-span-1 sm:col-span-3">
            <label className="text-[11px] font-extrabold uppercase tracking-wider text-brand-primary/60 flex items-center gap-1">
              <Users className="w-3 h-3 text-emerald-500" />
              <span>Target Decision Makers</span>
            </label>
            <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto p-1.5 rounded-xl border border-brand-secondary bg-brand-light">
              {ROLES.map((role) => {
                const isSelected = selectedRoles.includes(role);
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => toggleRole(role)}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition cursor-pointer flex items-center gap-1 ${
                      isSelected
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                        : "bg-brand-secondary/30 text-brand-primary/60 hover:text-brand-primary"
                    }`}
                  >
                    {isSelected && <Check className="w-2.5 h-2.5" />}
                    <span>{role}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
