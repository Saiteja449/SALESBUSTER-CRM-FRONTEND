import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Target,
  Sparkles,
  Search,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Database,
  BarChart3,
  ShieldCheck,
  Zap,
  Users,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useLeads } from "../context/LeadsContext.jsx";
import { targetIntelligenceService } from "../services/targetIntelligence.js";
import TargetProfileForm from "../components/target-intelligence/TargetProfileForm.jsx";
import ProspectResults from "../components/target-intelligence/ProspectResults.jsx";
import ProspectDetailPanel from "../components/target-intelligence/ProspectDetailPanel.jsx";
import AddToCrmDialog from "../components/target-intelligence/AddToCrmDialog.jsx";

export default function TargetIntelligence() {
  const navigate = useNavigate();
  const { organization, allUsers, fetchOrganization } = useAuth();
  const { refreshData } = useLeads();

  // Quota & Usage
  const [quota, setQuota] = useState({
    searchesUsedThisMonth: 18,
    searchesLimit: 100,
    leadsImportedThisMonth: 84,
    leadsImportLimit: 500,
  });

  // Search State
  const [isSearching, setIsSearching] = useState(false);
  const [prospects, setProspects] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchSummary, setSearchSummary] = useState(null);

  // Selection & Details
  const [selectedIds, setSelectedIds] = useState([]);
  const [inspectingProspect, setInspectingProspect] = useState(null);

  // Import Dialog
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importNotification, setImportNotification] = useState(null);

  useEffect(() => {
    loadQuota();
    // Run initial search with default ICP for instant feedback
    handleExecuteSearch({
      city: "Hyderabad",
      industry: "Manufacturing",
      need: "Enterprise Resource Planning (ERP)",
    });
  }, []);

  const loadQuota = async () => {
    const data = await targetIntelligenceService.getUsageQuota();
    if (data) setQuota(data);
  };

  const handleExecuteSearch = async (filters) => {
    setIsSearching(true);
    setImportNotification(null);
    try {
      const result = await targetIntelligenceService.executeSearch(filters);
      setProspects(result.prospects || []);
      setSearchSummary(result);
      setHasSearched(true);
      setSelectedIds([]);
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleToggleSelect = (prospectId) => {
    setSelectedIds((prev) =>
      prev.includes(prospectId)
        ? prev.filter((id) => id !== prospectId)
        : [...prev, prospectId]
    );
  };

  const handleSelectAll = () => {
    setSelectedIds(prospects.map((p) => p.id));
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  const handleOpenSingleImport = (prospect) => {
    setSelectedIds([prospect.id]);
    setIsImportModalOpen(true);
  };

  const handleConfirmImport = async (payload) => {
    setIsImporting(true);
    try {
      const res = await targetIntelligenceService.importProspectsToCrm(payload);
      if (res && res.success && Array.isArray(res.results)) {
        // Collect IDs of prospects that were successfully resolved (created, updated, or skipped)
        const successfulIds = new Set(
          res.results
            .filter((r) => r.status === "created" || r.status === "updated" || r.status === "skipped")
            .map((r) => r.prospectId)
        );

        const failedResults = res.results.filter((r) => r.status === "failed");

        // Retain unimported / failed prospects in selectedIds for user review and retry
        setSelectedIds((prev) => prev.filter((id) => !successfulIds.has(id)));

        if (failedResults.length > 0) {
          const failureReasons = failedResults
            .map((f) => `${f.companyName}: ${f.reason}`)
            .join("; ");

          setImportNotification({
            type: "warning",
            message: `Import processed: ${res.createdCount || 0} created, ${res.updatedCount || 0} updated, ${res.skippedCount || 0} skipped, ${failedResults.length} failed (${failureReasons}). Failed prospects remain selected for review.`,
            createdCount: res.createdCount || 0,
            updatedCount: res.updatedCount || 0,
            skippedCount: res.skippedCount || 0,
            failedCount: failedResults.length,
          });
        } else {
          setImportNotification({
            type: "success",
            message: res.message || `Successfully processed ${res.results.length} prospects (${res.createdCount || 0} created, ${res.updatedCount || 0} updated, ${res.skippedCount || 0} skipped).`,
            createdCount: res.createdCount || 0,
            updatedCount: res.updatedCount || 0,
            skippedCount: res.skippedCount || 0,
            failedCount: 0,
          });
        }

        setIsImportModalOpen(false);
        if (inspectingProspect && successfulIds.has(inspectingProspect.id)) {
          setInspectingProspect(null);
        }

        // Live refresh CRM leads if any leads were created or updated
        if (refreshData && ((res.createdCount && res.createdCount > 0) || (res.updatedCount && res.updatedCount > 0))) {
          refreshData();
        }

        // Also refresh quota counters
        targetIntelligenceService.getUsageQuota().then(setQuota).catch(() => {});
      } else {
        throw new Error(res?.message || "Import response missing validation results");
      }
    } catch (err) {
      // On network or server failure, show error and retain selection for retry - DO NOT report success
      setImportNotification({
        type: "error",
        message: err.response?.data?.message || err.message || "Network or server failure during CRM import. Selections retained for retry.",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const selectedProspectObjects = prospects.filter((p) =>
    selectedIds.includes(p.id)
  );

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
                Discover, qualify, and import high-intent B2B accounts and verified decision makers
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
                {quota.searchesUsedThisMonth}
              </span>{" "}
              / {quota.searchesLimit} Used
            </div>
          </div>
          <div className="w-px h-8 bg-brand-secondary/60" />
          <div className="text-right">
            <div className="text-[10px] font-bold text-brand-primary/50 uppercase">
              CRM Leads Imported
            </div>
            <div className="text-xs font-black text-brand-primary">
              <span className="text-pilot-blue">{quota.leadsImportedThisMonth}</span>{" "}
              / {quota.leadsImportLimit}
            </div>
          </div>
        </div>
      </div>

      {/* ── Notification Banner (if any) ─────────────────────────────────── */}
      {importNotification && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 animate-fadeIn ${
            importNotification.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
              : importNotification.type === "warning"
              ? "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300"
              : "bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300"
          }`}
        >
          <div className="flex items-center gap-2.5 text-xs font-bold">
            {importNotification.type === "success" && (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            )}
            {importNotification.type === "warning" && (
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            )}
            {importNotification.type === "error" && (
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            )}
            <span>{importNotification.message}</span>
          </div>
          <div className="flex items-center gap-3">
            {importNotification.type !== "error" && (
              <button
                type="button"
                onClick={() => navigate("/leads")}
                className="text-xs font-extrabold underline hover:no-underline cursor-pointer"
              >
                Go to Leads Directory &rarr;
              </button>
            )}
            <button
              type="button"
              onClick={() => setImportNotification(null)}
              className="text-xs opacity-60 hover:opacity-100 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* ── 2. ICP Query & Structured Form Builder ──────────────────────── */}
      <TargetProfileForm onSearch={handleExecuteSearch} isLoading={isSearching} />

      {/* ── 3. Results Section ──────────────────────────────────────────── */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-wrap items-center justify-between gap-3 px-1">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-extrabold text-brand-primary uppercase tracking-wider">
              Discovered Target Accounts
            </h2>
            {prospects.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-brand-secondary/50 text-brand-primary/70">
                {prospects.length}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-brand-primary/60">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Search restricted strictly to approved B2B directories</span>
          </div>
        </div>

        {isSearching ? (
          <div className="p-16 rounded-2xl bg-brand-light border border-brand-secondary text-center space-y-3">
            <div className="w-10 h-10 border-3 border-emerald-500/30 border-t-emerald-600 rounded-full animate-spin mx-auto" />
            <div className="text-sm font-bold text-brand-primary">
              Searching verified company directories & scoring relevance...
            </div>
            <p className="text-xs text-brand-primary/50">
              Evaluating discrete manufacturing capabilities, MCA registry data, and decision-maker roles
            </p>
          </div>
        ) : (
          <ProspectResults
            prospects={prospects}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onSelectAll={handleSelectAll}
            onClearSelection={handleClearSelection}
            onInspectProspect={(p) => setInspectingProspect(p)}
            onOpenImportDialog={() => setIsImportModalOpen(true)}
          />
        )}
      </div>

      {/* ── 4. Slide-over Prospect Detail Panel ──────────────────────────── */}
      {inspectingProspect && (
        <ProspectDetailPanel
          prospect={inspectingProspect}
          onClose={() => setInspectingProspect(null)}
          isSelected={selectedIds.includes(inspectingProspect.id)}
          onToggleSelect={handleToggleSelect}
          onImportSingle={handleOpenSingleImport}
        />
      )}

      {/* ── 5. Add to CRM Confirmation Dialog ───────────────────────────── */}
      <AddToCrmDialog
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        selectedProspects={selectedProspectObjects}
        salesReps={allUsers || []}
        onConfirmImport={handleConfirmImport}
        isImporting={isImporting}
      />
    </div>
  );
}
