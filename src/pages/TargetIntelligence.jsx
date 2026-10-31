import React, { useState, useEffect } from "react";
import {
  Target,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { targetIntelligenceService } from "../services/targetIntelligence.js";
import TargetProfileForm from "../components/target-intelligence/TargetProfileForm.jsx";
import ProspectResults from "../components/target-intelligence/ProspectResults.jsx";
import ProspectDetailPanel from "../components/target-intelligence/ProspectDetailPanel.jsx";

export default function TargetIntelligence() {
  const { organization } = useAuth();

  // Quota & Usage
  const [quota, setQuota] = useState({
    searchesUsedThisMonth: 0,
    searchesLimit: 100,
  });

  // Search State
  const [isSearching, setIsSearching] = useState(false);
  const [prospects, setProspects] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchSummary, setSearchSummary] = useState(null);

  // Resolution Filter & State
  const [resolutionFilter, setResolutionFilter] = useState("all"); // 'all' | 'unresolved' | 'resolved'
  const [isResolvingKey, setIsResolvingKey] = useState(null);

  // Active Detail Inspection
  const [inspectingProspect, setInspectingProspect] = useState(null);

  useEffect(() => {
    loadQuota();
  }, []);

  const loadQuota = async () => {
    const data = await targetIntelligenceService.getUsageQuota();
    if (data) setQuota(data);
  };

  const handleExecuteSearch = async (filters) => {
    setIsSearching(true);
    try {
      const result = await targetIntelligenceService.executeSearch(filters);
      setProspects(result.prospects || []);
      setSearchSummary(result);
      setHasSearched(true);
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setIsSearching(false);
      loadQuota();
    }
  };

  const handleToggleResolve = async (prospect, shouldResolve) => {
    if (!prospect) return;
    const key = prospect.prospectKey || prospect.id;
    setIsResolvingKey(key);

    try {
      if (shouldResolve) {
        const res = await targetIntelligenceService.resolveProspect(prospect);
        setProspects((prev) =>
          prev.map((p) =>
            (p.prospectKey || p.id) === key
              ? {
                  ...p,
                  isResolved: true,
                  resolvedAt: res.resolvedAt || new Date().toISOString(),
                  resolvedByName: res.resolvedByName || "You",
                }
              : p
          )
        );

        if (inspectingProspect && (inspectingProspect.prospectKey || inspectingProspect.id) === key) {
          setInspectingProspect((prev) => ({
            ...prev,
            isResolved: true,
            resolvedAt: res.resolvedAt || new Date().toISOString(),
            resolvedByName: res.resolvedByName || "You",
          }));
        }
      } else {
        await targetIntelligenceService.unresolveProspect(prospect.prospectKey, prospect.companyName);
        setProspects((prev) =>
          prev.map((p) =>
            (p.prospectKey || p.id) === key
              ? {
                  ...p,
                  isResolved: false,
                  resolvedAt: null,
                  resolvedByName: null,
                }
              : p
          )
        );

        if (inspectingProspect && (inspectingProspect.prospectKey || inspectingProspect.id) === key) {
          setInspectingProspect((prev) => ({
            ...prev,
            isResolved: false,
            resolvedAt: null,
            resolvedByName: null,
          }));
        }
      }
    } catch (err) {
      console.error("Failed to toggle resolution status:", err);
    } finally {
      setIsResolvingKey(null);
    }
  };

  const resolvedTotal = prospects.filter((p) => p.isResolved).length;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 sm:py-8 space-y-6 animate-fadeIn">
      {/* ── 1. Page Header with Add-on Badge & Quota Meter ─────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-brand-secondary">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              <Sparkles className="w-3 h-3 text-emerald-500" />
              <span>Active Add-on</span>
            </span>
            <span className="text-xs text-brand-primary/50 font-medium">
              Org: {organization?.name || "My Organization"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-2xs">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-brand-primary tracking-tight">
                AI Target Data Intelligence
              </h1>
              <p className="text-xs text-brand-primary/65">
                LinkedIn-style verified B2B account & decision-maker intelligence with live contact data
              </p>
            </div>
          </div>
        </div>

        {/* Quota Indicators Card */}
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-brand-light border border-brand-secondary shadow-2xs">
          <div className="text-right">
            <div className="text-[10px] font-bold text-brand-primary/50 uppercase">
              Monthly Search Quota
            </div>
            <div className="text-xs font-black text-brand-primary">
              <span className="text-emerald-600 dark:text-emerald-400">
                {quota.searchesUsedThisMonth || 0}
              </span>{" "}
              / {quota.searchesLimit || 100} Used
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. ICP Query & Structured Form Builder ──────────────────────── */}
      <TargetProfileForm
        onSearch={handleExecuteSearch}
        isLoading={isSearching}
        resolutionFilter={resolutionFilter}
        onResolutionFilterChange={(f) => setResolutionFilter(f)}
      />

      {/* ── 3. Results Section ──────────────────────────────────────────── */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-wrap items-center justify-between gap-3 px-1">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-extrabold text-brand-primary uppercase tracking-wider">
              Discovered Target Accounts & Decision Makers
            </h2>
            {prospects.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                {prospects.length}
              </span>
            )}
            {resolvedTotal > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-purple-600" />
                <span>{resolvedTotal} Resolved</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-brand-primary/60">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Pure live online corporate records • Zero simulated fallbacks</span>
          </div>
        </div>

        {isSearching ? (
          <div className="p-16 rounded-3xl bg-brand-light border border-brand-secondary text-center space-y-3 shadow-2xs">
            <div className="w-10 h-10 border-3 border-emerald-500/30 border-t-emerald-600 rounded-full animate-spin mx-auto" />
            <div className="text-sm font-black text-brand-primary">
              Searching live B2B corporate directories & verified executive profiles...
            </div>
            <p className="text-xs text-brand-primary/50">
              Retrieving live operating entities, verified phone coordinates, and decision-maker contact details
            </p>
          </div>
        ) : (
          <ProspectResults
            prospects={prospects}
            hasSearched={hasSearched}
            resolutionFilter={resolutionFilter}
            onInspectProspect={(p) => setInspectingProspect(p)}
            onToggleResolve={handleToggleResolve}
            isResolvingKey={isResolvingKey}
          />
        )}
      </div>

      {/* ── 4. Slide-over Prospect Detail Panel ──────────────────────────── */}
      {inspectingProspect && (
        <ProspectDetailPanel
          prospect={inspectingProspect}
          onClose={() => setInspectingProspect(null)}
          onToggleResolve={handleToggleResolve}
          isResolving={isResolvingKey === (inspectingProspect.prospectKey || inspectingProspect.id)}
        />
      )}
    </div>
  );
}
