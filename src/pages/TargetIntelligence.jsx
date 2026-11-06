import React, { useState, useEffect } from "react";
import {
  Target,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Building2,
  Phone,
  Mail,
  Clock,
  Download,
  Check,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { targetIntelligenceService } from "../services/targetIntelligence.js";
import TargetProfileForm from "../components/target-intelligence/TargetProfileForm.jsx";
import ApolloResultsTable from "../components/target-intelligence/ApolloResultsTable.jsx";
import ProspectDetailPanel from "../components/target-intelligence/ProspectDetailPanel.jsx";

export default function TargetIntelligence() {
  const { organization } = useAuth();

  // Quota & Usage
  const [quota, setQuota] = useState({
    isConfigured: false,
    searchesUsedThisMonth: 0,
    searchesLimit: null,
    resetDate: null,
  });

  // Search State
  const [isSearching, setIsSearching] = useState(false);
  const [prospects, setProspects] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchSummary, setSearchSummary] = useState(null);
  const [providerStatuses, setProviderStatuses] = useState(null);
  const [searchOutcome, setSearchOutcome] = useState(null);
  const [searchError, setSearchError] = useState(null);
  const [searchHistory, setSearchHistory] = useState([]);

  // Resolution Filter & State
  const [resolutionFilter, setResolutionFilter] = useState("all"); // 'all' | 'unresolved' | 'resolved'
  const [resolvedHistory, setResolvedHistory] = useState([]);
  const [isResolvingKey, setIsResolvingKey] = useState(null);

  // Active Detail Inspection
  const [inspectingProspect, setInspectingProspect] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    loadQuota();
    loadSearches();
    loadResolvedHistory();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadQuota = async () => {
    const data = await targetIntelligenceService.getUsageQuota();
    if (data) setQuota(data);
  };

  const loadSearches = async () => {
    const data = await targetIntelligenceService.getSearches();
    if (Array.isArray(data)) setSearchHistory(data);
  };

  const loadResolvedHistory = async () => {
    try {
      const data = await targetIntelligenceService.getResolvedProspects();
      if (Array.isArray(data)) setResolvedHistory(data);
    } catch (err) {
      console.warn("Could not load resolved history:", err?.message);
    }
  };

  const handleExecuteSearch = async (filters) => {
    setIsSearching(true);
    setSearchError(null);
    try {
      const result = await targetIntelligenceService.executeSearch(filters);
      setProspects(result.prospects || []);
      setSearchSummary(result);
      setProviderStatuses(result.providerStatuses || null);
      setSearchOutcome(result.outcome || "success");
      setHasSearched(true);
      loadSearches();
      loadResolvedHistory();
      if (result.excludedResolvedCount > 0) {
        showToast(
          `Found ${result.prospects?.length || 0} fresh companies (${result.excludedResolvedCount} previously resolved companies excluded)`
        );
      }
    } catch (err) {
      console.error("Search failed:", err);
      setSearchError(err.message || "Search failed to return results");
      setProviderStatuses(err.providerStatuses || null);
      setSearchOutcome(err.outcome || "all_providers_failed");
      setProspects([]);
      setHasSearched(true);
      showToast(err.message || "Search failed to return results");
    } finally {
      setIsSearching(false);
      loadQuota();
    }
  };

  const handleToggleResolve = async (prospect, shouldResolve, notes = "") => {
    if (!prospect) return;
    const key = prospect.prospectKey || prospect.id;
    setIsResolvingKey(key);

    try {
      if (shouldResolve) {
        const res = await targetIntelligenceService.resolveProspect(prospect, notes);
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
        showToast(`"${prospect.companyName}" marked as resolved`);
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
        showToast(`Resolution cleared for "${prospect.companyName}"`);
      }
      loadResolvedHistory();
    } catch (err) {
      console.error("Failed to toggle resolution status:", err);
      showToast("Could not update resolution status");
    } finally {
      setIsResolvingKey(null);
    }
  };

  const handleBulkResolve = async (selectedList) => {
    if (!Array.isArray(selectedList) || selectedList.length === 0) return;
    try {
      await targetIntelligenceService.bulkResolveProspects(selectedList);
      const keys = new Set(selectedList.map((p) => p.prospectKey || p.id));
      setProspects((prev) =>
        prev.map((p) =>
          keys.has(p.prospectKey || p.id)
            ? {
                ...p,
                isResolved: true,
                resolvedAt: new Date().toISOString(),
                resolvedByName: "You",
              }
            : p
        )
      );
      loadResolvedHistory();
      showToast(`Marked ${selectedList.length} companies as resolved`);
    } catch (err) {
      console.error("Bulk resolve failed:", err);
      showToast("Bulk resolution failed");
    }
  };

  const handleExport = async (recordsToExport, format = "xlsx") => {
    setIsExporting(true);
    try {
      await targetIntelligenceService.exportProspects(recordsToExport, format);
      showToast(`Exported ${recordsToExport.length} companies to ${format.toUpperCase()}`);
    } catch (err) {
      console.error("Export failed:", err);
      showToast("Export failed");
    } finally {
      setIsExporting(false);
    }
  };

  const handleEnrichProspect = async (companyId) => {
    try {
      const enriched = await targetIntelligenceService.enrichCompany(companyId);
      if (enriched) {
        setProspects((prev) =>
          prev.map((p) => ((p._id || p.id) === companyId ? { ...p, ...enriched } : p))
        );
        if (inspectingProspect && (inspectingProspect._id || inspectingProspect.id) === companyId) {
          setInspectingProspect((prev) => ({ ...prev, ...enriched }));
        }
        showToast("Enrichment updated successfully");
      }
    } catch (err) {
      showToast("Enrichment failed");
    }
  };

  // Metrics
  const totalDiscovered = prospects.length;
  const contactsFound = prospects.filter(
    (p) => p.contact?.businessPhone || p.contact?.businessEmail || p.phone || p.email
  ).length;
  const verifiedPhones = prospects.filter(
    (p) => p.contact?.businessPhone || p.phone
  ).length;
  const verifiedEmails = prospects.filter(
    (p) => p.contact?.businessEmail || p.email
  ).length;
  const resolvedTotal = prospects.filter((p) => p.isResolved).length;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 sm:py-8 space-y-6 animate-fadeIn">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-2xl bg-brand-primary text-brand-light shadow-xl text-xs font-bold flex items-center gap-2 animate-slideUp">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

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
                AI Target Intelligence Engine
              </h1>
              <p className="text-xs text-brand-primary/65">
                Discover, enrich, and verify target businesses with decision makers and live corporate coordinates
              </p>
            </div>
          </div>
        </div>

        {/* Quota Meter */}
        <div className="flex items-center gap-3 bg-brand-primary/5 border border-brand-secondary rounded-2xl p-3 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-4 text-xs">
              <span className="font-extrabold text-brand-primary">Monthly Searches</span>
              <span className="font-black text-emerald-600 dark:text-emerald-400">
                {quota.searchesUsedThisMonth ?? 0} {quota.isConfigured && quota.searchesLimit ? `/ ${quota.searchesLimit}` : "(No Limit Set)"}
              </span>
            </div>
            {quota.isConfigured && quota.searchesLimit ? (
              <div className="w-40 h-1.5 rounded-full bg-brand-secondary/60 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all rounded-full"
                  style={{
                    width: `${Math.min(
                      100,
                      ((quota.searchesUsedThisMonth || 0) / (quota.searchesLimit || 1)) * 100
                    )}%`,
                  }}
                />
              </div>
            ) : (
              <div className="text-[10px] text-brand-primary/50">Authoritative usage count</div>
            )}
          </div>
        </div>
      </div>

      {/* ── 2. Top Summary KPI Cards (Visible when results exist) ───────── */}
      {hasSearched && prospects.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 animate-fadeIn">
          <div className="p-3.5 rounded-2xl bg-brand-light border border-brand-secondary shadow-2xs space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-primary/50 flex items-center gap-1">
              <Building2 className="w-3 h-3 text-emerald-500" />
              <span>Discovered</span>
            </span>
            <div className="text-lg font-black text-brand-primary">{totalDiscovered}</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-brand-light border border-brand-secondary shadow-2xs space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-primary/50 flex items-center gap-1">
              <Phone className="w-3 h-3 text-emerald-500" />
              <span>Phones Found</span>
            </span>
            <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
              {verifiedPhones}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-brand-light border border-brand-secondary shadow-2xs space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-primary/50 flex items-center gap-1">
              <Mail className="w-3 h-3 text-emerald-500" />
              <span>Emails Found</span>
            </span>
            <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
              {verifiedEmails}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-brand-light border border-brand-secondary shadow-2xs space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-primary/50 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              <span>Contacts Total</span>
            </span>
            <div className="text-lg font-black text-brand-primary">{contactsFound}</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-brand-light border border-brand-secondary shadow-2xs space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Resolved</span>
            </span>
            <div className="text-lg font-black text-purple-700 dark:text-purple-300">
              {resolvedTotal}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-brand-light border border-brand-secondary shadow-2xs space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-primary/50 flex items-center gap-1">
              <Clock className="w-3 h-3 text-emerald-500" />
              <span>Search Duration</span>
            </span>
            <div className="text-lg font-black text-brand-primary">
              {searchSummary?.durationMs ? `${(searchSummary.durationMs / 1000).toFixed(1)}s` : "< 1s"}
            </div>
          </div>
        </div>
      )}

      {/* ── 3. Search Form (Prompt + Structured Filters) ────────────────── */}
      <TargetProfileForm
        onSearch={handleExecuteSearch}
        isLoading={isSearching}
        searchHistory={searchHistory}
      />

      {/* ── 4. Apollo-Style Results Table ──────────────────────────────── */}
      <ApolloResultsTable
        prospects={prospects}
        resolvedHistory={resolvedHistory}
        hasSearched={hasSearched}
        isLoading={isSearching}
        searchSummary={searchSummary}
        providerStatuses={providerStatuses}
        outcome={searchOutcome}
        searchError={searchError}
        onInspectProspect={(p) => setInspectingProspect(p)}
        onToggleResolve={handleToggleResolve}
        isResolvingKey={isResolvingKey}
        onBulkResolve={handleBulkResolve}
        onExport={handleExport}
        isExporting={isExporting}
        resolutionFilter={resolutionFilter}
        onResolutionFilterChange={(f) => setResolutionFilter(f)}
      />

      {/* ── 5. Company Profile Drawer ──────────────────────────────────── */}
      {inspectingProspect && (
        <ProspectDetailPanel
          prospect={inspectingProspect}
          onClose={() => setInspectingProspect(null)}
          onToggleResolve={handleToggleResolve}
          isResolving={isResolvingKey === (inspectingProspect.prospectKey || inspectingProspect.id)}
          onEnrich={handleEnrichProspect}
        />
      )}
    </div>
  );
}
