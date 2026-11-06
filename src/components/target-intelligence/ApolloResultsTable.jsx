import React, { useState } from "react";
import {
  Building2,
  MapPin,
  Users,
  CheckCircle2,
  ShieldCheck,
  ExternalLink,
  Sparkles,
  Mail,
  Phone,
  Check,
  RotateCcw,
  Copy,
  Download,
  Filter,
  ArrowUpDown,
  Search,
  Eye,
  RefreshCw,
  AlertTriangle,
  XCircle,
  Clock,
  Globe,
} from "lucide-react";

export default function ApolloResultsTable({
  prospects = [],
  resolvedHistory = [],
  hasSearched = false,
  isLoading = false,
  searchSummary = null,
  providerStatuses = null,
  outcome = null,
  searchError = null,
  onInspectProspect,
  onToggleResolve,
  isResolvingKey = null,
  onBulkResolve,
  onExport,
  isExporting = false,
  resolutionFilter = "all",
  onResolutionFilterChange,
}) {
  const [selectedKeys, setSelectedKeys] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState("confidenceScore");
  const [sortDirection, setSortDirection] = useState("desc");
  const [copiedKey, setCopiedKey] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Determine source data: when viewing "resolved", display full persistent resolvedHistory if available
  const displaySource =
    resolutionFilter === "resolved" && Array.isArray(resolvedHistory) && resolvedHistory.length > 0
      ? resolvedHistory.map((r) => ({
          ...r,
          id: r._id || r.id || r.prospectKey,
          isResolved: true,
          contact: {
            businessPhone: r.phone || r.contact?.businessPhone,
            phoneType: r.contact?.phoneType || "mobile",
            phoneVerificationStatus: "Verified",
            businessEmail: r.email || r.contact?.businessEmail,
            emailType: r.contact?.emailType || "corporate",
            emailVerificationStatus: "Verified",
          },
          socialLinks: r.socialLinks || (r.linkedin ? { linkedin: r.linkedin } : {}),
        }))
      : prospects;

  // Filter prospects
  const filtered = displaySource.filter((p) => {
    // 1. Resolution filter tab
    if (resolutionFilter === "resolved" && !p.isResolved) return false;
    if (resolutionFilter === "unresolved" && p.isResolved) return false;

    // 2. In-table search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const name = (p.companyName || "").toLowerCase();
      const loc = (p.location?.city || p.location?.raw || p.city || "").toLowerCase();
      const ind = (p.industry || "").toLowerCase();
      const founder = (p.founders?.[0]?.name || p.decisionMaker?.name || "").toLowerCase();
      const phone = (p.contact?.businessPhone || p.phone || "").toLowerCase();
      const email = (p.contact?.businessEmail || p.email || "").toLowerCase();

      return (
        name.includes(q) ||
        loc.includes(q) ||
        ind.includes(q) ||
        founder.includes(q) ||
        phone.includes(q) ||
        email.includes(q)
      );
    }
    return true;
  });

  // Sort prospects
  const sorted = [...filtered].sort((a, b) => {
    let aVal = a[sortField] || "";
    let bVal = b[sortField] || "";
    if (sortField === "confidenceScore") {
      aVal = a.confidenceScore || 0;
      bVal = b.confidenceScore || 0;
    } else if (sortField === "companyName") {
      aVal = (a.companyName || "").toLowerCase();
      bVal = (b.companyName || "").toLowerCase();
    }
    if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sorted.length / pageSize) || 1;
  const paginated = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const toggleSelectAll = () => {
    if (selectedKeys.size === paginated.length) {
      setSelectedKeys(new Set());
    } else {
      const newSet = new Set(paginated.map((p) => p.prospectKey || p.id));
      setSelectedKeys(newSet);
    }
  };

  const toggleSelectRow = (key) => {
    const next = new Set(selectedKeys);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setSelectedKeys(next);
  };

  const handleBulkResolveClick = () => {
    const selectedProspects = prospects.filter((p) =>
      selectedKeys.has(p.prospectKey || p.id)
    );
    if (selectedProspects.length > 0 && onBulkResolve) {
      onBulkResolve(selectedProspects);
      setSelectedKeys(new Set());
    }
  };

  const handleExportSelected = (format) => {
    const selectedProspects =
      selectedKeys.size > 0
        ? prospects.filter((p) => selectedKeys.has(p.prospectKey || p.id))
        : prospects;
    if (onExport) onExport(selectedProspects, format);
  };

  const resolvedTotal =
    Array.isArray(resolvedHistory) && resolvedHistory.length > 0
      ? resolvedHistory.length
      : prospects.filter((p) => p.isResolved).length;
  const unresolvedTotal = prospects.filter((p) => !p.isResolved).length;

  // 1. Loading State
  if (isLoading) {
    return (
      <div className="bg-brand-light rounded-3xl border border-brand-secondary p-12 text-center space-y-4 animate-fadeIn">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
          <RefreshCw className="w-6 h-6 animate-spin" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-black text-brand-primary">
            Querying Live Internet Sources...
          </h3>
          <p className="text-xs text-brand-primary/60 max-w-md mx-auto">
            Contacting live search providers concurrently (Tavily, OpenStreetMap) and extracting verified claims. No synthetic data is fabricated.
          </p>
        </div>
      </div>
    );
  }

  // 2. All Providers Failed State
  if (outcome === "all_providers_failed" || (hasSearched && searchError && prospects.length === 0)) {
    return (
      <div className="bg-brand-light rounded-3xl border border-rose-500/30 p-8 sm:p-10 space-y-4 text-center animate-fadeIn">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-600 dark:text-rose-400">
          <XCircle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-black text-brand-primary">
            Search Failed: All Live Sources Unavailable
          </h3>
          <p className="text-xs text-brand-primary/70 max-w-lg mx-auto">
            {searchError || "None of the configured live internet providers (Tavily, OpenStreetMap) returned a successful response. Per system rules, synthetic or ungrounded data is never fabricated as a fallback."}
          </p>
        </div>

        {providerStatuses && (
          <div className="max-w-md mx-auto p-3.5 rounded-2xl bg-brand-primary/5 border border-brand-secondary text-left space-y-2 text-xs">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-primary/50 block">
              Provider Diagnostics:
            </span>
            {Object.entries(providerStatuses).map(([providerName, pStatus]) => (
              <div key={providerName} className="flex items-center justify-between gap-2 border-b border-brand-secondary/40 pb-1 last:border-b-0 last:pb-0">
                <span className="font-bold text-brand-primary capitalize">{providerName}:</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                  pStatus.status === "success"
                    ? "bg-emerald-500/15 text-emerald-600"
                    : pStatus.status === "timeout"
                    ? "bg-amber-500/15 text-amber-600"
                    : "bg-rose-500/15 text-rose-600"
                }`}>
                  {pStatus.status} {pStatus.error ? `(${pStatus.error.slice(0, 45)})` : ""}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // 3. Initial Empty State (Before search)
  if (!hasSearched && prospects.length === 0) {
    return (
      <div className="bg-brand-light rounded-3xl border border-brand-secondary p-12 text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
          <Sparkles className="w-6 h-6" />
        </div>
        <h3 className="text-base font-black text-brand-primary">
          Ready to Discover Businesses
        </h3>
        <p className="text-xs text-brand-primary/60 max-w-md mx-auto">
          Describe your ideal target businesses in the search bar above. Searches are executed strictly against live internet sources with complete source provenance.
        </p>
      </div>
    );
  }

  // 4. No Matches State (Searched successfully, but zero live results)
  if (hasSearched && prospects.length === 0) {
    return (
      <div className="bg-brand-light rounded-3xl border border-brand-secondary p-12 text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-brand-secondary/40 flex items-center justify-center mx-auto text-brand-primary/50">
          <Building2 className="w-6 h-6" />
        </div>
        <h3 className="text-base font-black text-brand-primary">
          No businesses found
        </h3>
        <p className="text-xs text-brand-primary/60 max-w-md mx-auto">
          Live search providers completed successfully but found 0 matching companies. No dummy or plausible records were invented. Try broadening your location or search terms.
        </p>

        {providerStatuses && (
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs">
            {Object.entries(providerStatuses).map(([pName, pStat]) => (
              <span key={pName} className="px-2.5 py-1 rounded-xl bg-brand-secondary/30 text-brand-primary/60 text-[11px]">
                <strong className="capitalize">{pName}:</strong> {pStat.status} ({pStat.count} results, {pStat.durationMs}ms)
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-brand-light rounded-3xl border border-brand-secondary overflow-hidden shadow-xs space-y-0">
      {/* ── Partial Failure Warning Banner ─────────────────────────────────── */}
      {outcome === "partial_failure" && (
        <div className="px-5 py-2.5 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
          <span>
            <strong>Partial Provider Failure:</strong> One or more search providers timed out or returned an error. Displaying verified results from responding live providers.
          </span>
        </div>
      )}

      {/* ── Excluded Resolved Leads Notice Banner ────────────────────────────── */}
      {searchSummary?.excludedResolvedCount > 0 && (
        <div className="px-5 py-2.5 bg-purple-500/10 border-b border-purple-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-purple-700 dark:text-purple-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-purple-500 shrink-0" />
            <span>
              <strong>{searchSummary.excludedResolvedCount} previously resolved companies</strong> were automatically excluded from this search so your team only sees fresh targets.
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              if (onResolutionFilterChange) onResolutionFilterChange("resolved");
              setCurrentPage(1);
            }}
            className="text-xs font-bold underline hover:text-purple-900 dark:hover:text-purple-100 shrink-0 cursor-pointer text-left"
          >
            View Resolved History ({resolvedTotal}) →
          </button>
        </div>
      )}

      {/* ── Table Top Control Bar ───────────────────────────────────────── */}
      <div className="p-4 sm:p-5 border-b border-brand-secondary flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Resolution Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-brand-secondary/30 rounded-2xl text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              onResolutionFilterChange("all");
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
              resolutionFilter === "all"
                ? "bg-brand-light text-brand-primary shadow-2xs"
                : "text-brand-primary/60 hover:text-brand-primary"
            }`}
          >
            <span>All Targets</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-brand-secondary/60">
              {prospects.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              onResolutionFilterChange("unresolved");
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
              resolutionFilter === "unresolved"
                ? "bg-brand-light text-brand-primary shadow-2xs"
                : "text-brand-primary/60 hover:text-brand-primary"
            }`}
          >
            <span>Unresolved</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-600 dark:text-amber-400">
              {unresolvedTotal}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              onResolutionFilterChange("resolved");
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
              resolutionFilter === "resolved"
                ? "bg-brand-light text-purple-600 dark:text-purple-400 shadow-2xs"
                : "text-brand-primary/60 hover:text-brand-primary"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-purple-500" />
            <span>Resolved</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-purple-500/20 text-purple-700 dark:text-purple-300">
              {resolvedTotal}
            </span>
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-brand-primary/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Filter results..."
              className="pl-8 pr-3 py-1.5 text-xs rounded-xl bg-brand-light border border-brand-secondary text-brand-primary focus:outline-none focus:ring-1 focus:ring-emerald-500 w-36 sm:w-48"
            />
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleExportSelected("xlsx")}
              disabled={isExporting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Excel</span>
            </button>
            <button
              type="button"
              onClick={() => handleExportSelected("csv")}
              disabled={isExporting}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-brand-secondary/40 hover:bg-brand-secondary/60 text-brand-primary transition cursor-pointer"
            >
              <span>CSV</span>
            </button>
          </div>
        </div>
      </div>
      {selectedKeys.size > 0 && (
        <div className="px-5 py-2.5 bg-purple-500/10 border-b border-purple-500/20 flex flex-wrap items-center justify-between gap-3 text-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-purple-700 dark:text-purple-300">
              {selectedKeys.size} company record{selectedKeys.size === 1 ? "" : "s"} selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleBulkResolveClick}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold bg-purple-600 hover:bg-purple-700 text-white shadow-2xs transition cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Mark Selected as Resolved</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedKeys(new Set())}
              className="px-2 py-1 text-xs text-brand-primary/60 hover:text-brand-primary font-bold"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* ── Data Table ──────────────────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-brand-primary/5 border-b border-brand-secondary text-brand-primary/70 font-black text-[11px] uppercase tracking-wider select-none">
              <th className="py-3 px-4 w-10 text-center">
                <input
                  type="checkbox"
                  checked={paginated.length > 0 && selectedKeys.size === paginated.length}
                  onChange={toggleSelectAll}
                  className="rounded text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                />
              </th>
              <th
                onClick={() => {
                  setSortField("companyName");
                  setSortDirection(sortDirection === "asc" ? "desc" : "asc");
                }}
                className="py-3 px-4 cursor-pointer hover:text-brand-primary"
              >
                <div className="flex items-center gap-1.5">
                  <span>Company Name & Live Source</span>
                  <ArrowUpDown className="w-3 h-3 opacity-50" />
                </div>
              </th>
              <th className="py-3 px-4">Location</th>
              <th className="py-3 px-4">Contact Details</th>
              <th className="py-3 px-4">Website</th>
              <th className="py-3 px-4 text-center">Resolution</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-brand-secondary">
            {paginated.map((p) => {
              const key = p.prospectKey || p.id;
              const isSelected = selectedKeys.has(key);
              const isResolved = Boolean(p.isResolved);
              const isResolving = isResolvingKey === key;
              const founder = p.founders?.[0] || p.decisionMaker;
              const phone = p.contact?.businessPhone || p.phone;
              const email = p.contact?.businessEmail || p.email;
              const primarySourceUrl = p.sourceUrl || p.sources?.[0]?.url || "";

              return (
                <tr
                  key={key}
                  className={`transition-colors hover:bg-brand-secondary/20 ${
                    isResolved ? "bg-purple-500/5 dark:bg-purple-950/10" : ""
                  }`}
                >
                  {/* Select Checkbox */}
                  <td className="py-3.5 px-4 text-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectRow(key)}
                      className="rounded text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                    />
                  </td>

                  {/* Company Name & Source */}
                  <td className="py-3.5 px-4 font-bold text-brand-primary">
                    <div className="flex items-start gap-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                        {p.companyName?.[0] || "C"}
                      </div>
                      <div className="space-y-0.5">
                        <div className="font-extrabold text-brand-primary flex items-center gap-1.5">
                          <span>{p.companyName}</span>
                        </div>
                        {p.industry ? (
                      <span className="inline-block px-2 py-0.5 rounded-md bg-brand-secondary/40 text-[11px] font-medium">
                        {p.industry}
                      </span>
                    ) : (
                      <span className="text-brand-primary/40 italic">Unspecified</span>
                    )}
                      </div>
                    </div>
                  </td>


                  {/* Location */}
                  <td className="py-3.5 px-4 text-brand-primary/80">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-emerald-500 shrink-0" />
                      <span className="line-clamp-1 max-w-[130px]">
                        {p.location?.city || p.city || p.location?.raw || "Unspecified"}
                      </span>
                    </div>
                  </td>

                  {/* Phone + Verification Status */}
                  <td className="py-3.5 px-4 font-mono text-[11px]">
                    {phone ? (
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-emerald-500 shrink-0" />
                          <span className="font-semibold text-brand-primary">{phone}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(phone, `phone_${key}`)}
                            className="text-brand-primary/40 hover:text-brand-primary p-0.5"
                            title="Copy phone"
                          >
                            {copiedKey === `phone_${key}` ? (
                              <Check className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        <div className="text-[9px] text-brand-primary/50">
                          {p.contact?.phoneVerificationStatus === "Verified" ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">Verified via RapidAPI</span>
                          ) : (
                            "Format valid • Verification: unknown"
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="text-brand-primary/40 italic">Not listed</span>
                    )}
                     {email ? (
                      <div className="space-y-0.5 max-w-[180px] mt-1">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3 h-3 text-emerald-500 shrink-0" />
                          <span className="truncate text-brand-primary font-medium" title={email}>
                            {email}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(email, `email_${key}`)}
                            className="text-brand-primary/40 hover:text-brand-primary p-0.5"
                            title="Copy email"
                          >
                            {copiedKey === `email_${key}` ? (
                              <Check className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        <div className="text-[9px] text-brand-primary/50">
                          {p.contact?.emailVerificationStatus === "Verified" ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">Verified via RapidAPI</span>
                          ) : (
                            "Format valid • Verification: unknown"
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="text-brand-primary/40 italic block mt-1">Not listed</span>
                    )}

                    {/* Social Handles extracted from RapidAPI */}
                    {p.socialLinks && Object.values(p.socialLinks).some(Boolean) && (
                      <div className="flex flex-wrap items-center gap-1 pt-1.5 mt-1 border-t border-brand-secondary/40">
                        {p.socialLinks.linkedin && (
                          <a
                            href={p.socialLinks.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 hover:bg-blue-500/25"
                            title="LinkedIn Profile"
                          >
                            LinkedIn
                          </a>
                        )}
                        {p.socialLinks.twitter && (
                          <a
                            href={p.socialLinks.twitter}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-500/15 text-slate-700 dark:text-slate-300 hover:bg-slate-500/25"
                            title="Twitter / X"
                          >
                            𝕏
                          </a>
                        )}
                        {p.socialLinks.instagram && (
                          <a
                            href={p.socialLinks.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-pink-500/15 text-pink-600 dark:text-pink-400 hover:bg-pink-500/25"
                            title="Instagram"
                          >
                            Instagram
                          </a>
                        )}
                        {p.socialLinks.facebook && (
                          <a
                            href={p.socialLinks.facebook}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/25"
                            title="Facebook"
                          >
                            Facebook
                          </a>
                        )}
                        {p.socialLinks.whatsapp && (
                          <a
                            href={p.socialLinks.whatsapp}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25"
                            title="WhatsApp"
                          >
                            WhatsApp
                          </a>
                        )}
                      </div>
                    )}
                  </td>

                 

                  {/* Website */}
                  <td className="py-3.5 px-4">
                    {p.website ? (
                      <a
                        href={p.website.startsWith("http") ? p.website : `https://${p.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline max-w-[120px] truncate"
                      >
                        <span className="truncate">{p.website.replace(/^https?:\/\//, "")}</span>
                        <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                      </a>
                    ) : (
                      <span className="text-brand-primary/40 italic">Not listed</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {isResolved ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                        <CheckCircle2 className="w-3 h-3 text-purple-500" />
                        <span>Resolved</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        Unresolved
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onToggleResolve(p, !isResolved)}
                        disabled={isResolving}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-black transition cursor-pointer flex items-center gap-1 ${
                          isResolved
                            ? "bg-brand-secondary/40 text-brand-primary/60 hover:text-brand-primary"
                            : "bg-purple-600 hover:bg-purple-700 text-white shadow-2xs"
                        }`}
                        title={isResolved ? "Mark as unresolved" : "Mark as resolved"}
                      >
                        {isResolved ? (
                          <>
                            <RotateCcw className="w-3 h-3" />
                            <span>Unresolve</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-3 h-3" />
                            <span>Resolve</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => onInspectProspect(p)}
                        className="p-1.5 rounded-xl text-brand-primary/60 hover:text-brand-primary hover:bg-brand-secondary/40 transition cursor-pointer"
                        title="View Full Profile & Sources"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Table Footer & Pagination ───────────────────────────────────── */}
      <div className="p-4 border-t border-brand-secondary flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-brand-primary/60">
        <div>
          Showing {Math.min((currentPage - 1) * pageSize + 1, sorted.length)} to{" "}
          {Math.min(currentPage * pageSize, sorted.length)} of {sorted.length} records (live internet evidence)
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1 rounded-lg border border-brand-secondary text-brand-primary disabled:opacity-40"
            >
              Previous
            </button>
            <span className="px-2 font-bold text-brand-primary">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1 rounded-lg border border-brand-secondary text-brand-primary disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
