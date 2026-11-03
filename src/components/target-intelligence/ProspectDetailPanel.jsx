import React, { useState } from "react";
import {
  X,
  Building2,
  MapPin,
  Users,
  ShieldCheck,
  CheckCircle2,
  Mail,
  Phone,
  Globe,
  Sparkles,
  Check,
  Copy,
  RotateCcw,
  ExternalLink,
  FileText,
  Clock,
  RefreshCw,
} from "lucide-react";

export default function ProspectDetailPanel({
  prospect,
  onClose,
  onToggleResolve,
  isResolving = false,
  onEnrich,
  isEnriching = false,
}) {
  const [copiedKey, setCopiedKey] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [activeTab, setActiveTab] = useState("overview"); // 'overview' | 'decision_makers' | 'contacts' | 'provenance'

  if (!prospect) return null;

  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const isResolved = Boolean(prospect.isResolved);
  const email = prospect.contact?.businessEmail || prospect.email || "";
  const phone = prospect.contact?.businessPhone || prospect.phone || "";
  const website = prospect.website || "";
  const contactPage = prospect.contact?.contactPage || "";
  const founders = Array.isArray(prospect.founders) && prospect.founders.length > 0
    ? prospect.founders
    : prospect.decisionMaker
    ? [prospect.decisionMaker]
    : [];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-black/40 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-xl bg-brand-light h-full shadow-2xl border-l border-brand-secondary flex flex-col overflow-hidden animate-slideLeft">
        {/* ── 1. Drawer Header ───────────────────────────────────────────── */}
        <div className="p-5 sm:p-6 border-b border-brand-secondary flex items-start justify-between gap-4 bg-brand-primary/5">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-lg shrink-0 border border-emerald-500/30">
              {prospect.companyName?.[0] || "C"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-brand-primary truncate">
                  {prospect.companyName}
                </h2>
                {isResolved && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30 shrink-0">
                    <CheckCircle2 className="w-3 h-3 text-purple-500" />
                    <span>Resolved</span>
                  </span>
                )}
              </div>
              <div className="text-xs text-brand-primary/60 flex items-center gap-2 mt-0.5">
                <span>{prospect.industry || "Commercial Enterprise"}</span>
                <span>•</span>
                <span>{prospect.location?.city || prospect.city || "India"}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {onEnrich && website && (
              <button
                type="button"
                onClick={() => onEnrich(prospect._id || prospect.id)}
                disabled={isEnriching}
                className="p-2 rounded-xl text-brand-primary/60 hover:text-brand-primary hover:bg-brand-secondary/40 transition cursor-pointer"
                title="Refresh Enrichment"
              >
                <RefreshCw className={`w-4 h-4 ${isEnriching ? "animate-spin" : ""}`} />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-brand-primary/60 hover:text-brand-primary hover:bg-brand-secondary/40 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── 2. Navigation Tabs ─────────────────────────────────────────── */}
        <div className="flex items-center gap-2 px-5 sm:px-6 border-b border-brand-secondary bg-brand-light text-xs font-bold overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`py-3 border-b-2 transition whitespace-nowrap ${
              activeTab === "overview"
                ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                : "border-transparent text-brand-primary/60 hover:text-brand-primary"
            }`}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("decision_makers")}
            className={`py-3 border-b-2 transition whitespace-nowrap ${
              activeTab === "decision_makers"
                ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                : "border-transparent text-brand-primary/60 hover:text-brand-primary"
            }`}
          >
            Decision Makers ({founders.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("contacts")}
            className={`py-3 border-b-2 transition whitespace-nowrap ${
              activeTab === "contacts"
                ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                : "border-transparent text-brand-primary/60 hover:text-brand-primary"
            }`}
          >
            Contacts & Channels
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("provenance")}
            className={`py-3 border-b-2 transition whitespace-nowrap ${
              activeTab === "provenance"
                ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                : "border-transparent text-brand-primary/60 hover:text-brand-primary"
            }`}
          >
            Provenance & Sources
          </button>
        </div>

        {/* ── 3. Tab Contents ────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {activeTab === "overview" && (
            <div className="space-y-5 animate-fadeIn">
              {/* Description */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-primary/50">
                  Business Description
                </span>
                <p className="text-xs sm:text-sm text-brand-primary/80 leading-relaxed bg-brand-primary/5 p-4 rounded-2xl border border-brand-secondary">
                  {prospect.description || "No description provided in live source citations."}
                </p>
              </div>

              {/* Core Attributes Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-brand-primary/5 border border-brand-secondary space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-primary/50 flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-emerald-500" />
                    <span>Industry</span>
                  </span>
                  <div className="text-xs font-bold text-brand-primary">
                    {prospect.industry || "Unspecified"}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-brand-primary/5 border border-brand-secondary space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-primary/50 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-emerald-500" />
                    <span>Location</span>
                  </span>
                  <div className="text-xs font-bold text-brand-primary truncate">
                    {prospect.location?.raw || prospect.location?.city || prospect.city || "Unspecified"}
                  </div>
                </div>
              </div>

              {/* Website */}
              {website && (
                <div className="p-3.5 rounded-2xl bg-brand-primary/5 border border-brand-secondary flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-bold text-brand-primary">Official Website</span>
                  </div>
                  <a
                    href={website.startsWith("http") ? website : `https://${website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    <span>{website.replace(/^https?:\/\//, "")}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {/* Match Reasons */}
              {Array.isArray(prospect.matchReasons) && prospect.matchReasons.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-primary/50">
                    Why This Business Matches
                  </span>
                  <div className="space-y-1.5">
                    {prospect.matchReasons.map((reason, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-brand-primary/80"
                      >
                        <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "decision_makers" && (
            <div className="space-y-4 animate-fadeIn">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-primary/50">
                Key Decision Makers & Leadership
              </span>

              {founders.length === 0 ? (
                <div className="p-8 text-center text-xs text-brand-primary/50 border border-brand-secondary rounded-2xl">
                  No named decision makers identified in live source citations.
                </div>
              ) : (
                founders.map((f, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-brand-primary/5 border border-brand-secondary space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold text-xs">
                          {f.name?.[0] || "D"}
                        </div>
                        <div>
                          <div className="font-extrabold text-xs sm:text-sm text-brand-primary">
                            {f.name}
                          </div>
                          <div className="text-[11px] text-brand-primary/60">
                            {f.title || f.designation || "Executive"}
                          </div>
                        </div>
                      </div>

                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-brand-secondary/40 text-brand-primary/60">
                        Verification: unknown
                      </span>
                    </div>

                    {(f.phone || f.email) && (
                      <div className="pt-2 border-t border-brand-secondary/40 flex flex-wrap gap-3 text-xs">
                        {f.phone && (
                          <div className="flex items-center gap-1 font-mono text-[11px]">
                            <Phone className="w-3 h-3 text-emerald-500" />
                            <span>{f.phone}</span>
                          </div>
                        )}
                        {f.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-emerald-500" />
                            <span>{f.email}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "contacts" && (
            <div className="space-y-4 animate-fadeIn">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-primary/50">
                Direct Contact Channels
              </span>

              {/* Phone */}
              <div className="p-4 rounded-2xl bg-brand-primary/5 border border-brand-secondary flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-brand-primary/50">
                      Business Phone ({prospect.contact?.phoneType || "Corporate"})
                    </div>
                    <div className="text-xs sm:text-sm font-bold font-mono text-brand-primary">
                      {phone || "Not Publicly Listed"}
                    </div>
                    {phone && (
                      <div className="text-[10px] text-brand-primary/50">
                        Format valid • Deliverability / ownership: unknown
                      </div>
                    )}
                  </div>
                </div>

                {phone && (
                  <button
                    type="button"
                    onClick={() => handleCopy(phone, "drawer_phone")}
                    className="p-1.5 rounded-lg border border-brand-secondary text-brand-primary/60 hover:text-brand-primary"
                  >
                    {copiedKey === "drawer_phone" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>

              {/* Email */}
              <div className="p-4 rounded-2xl bg-brand-primary/5 border border-brand-secondary flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-brand-primary/50">
                      Corporate Email
                    </div>
                    <div className="text-xs sm:text-sm font-bold text-brand-primary">
                      {email || "Not Publicly Listed"}
                    </div>
                    {email && (
                      <div className="text-[10px] text-brand-primary/50">
                        Format valid • Mailbox deliverability: unknown
                      </div>
                    )}
                  </div>
                </div>

                {email && (
                  <button
                    type="button"
                    onClick={() => handleCopy(email, "drawer_email")}
                    className="p-1.5 rounded-lg border border-brand-secondary text-brand-primary/60 hover:text-brand-primary"
                  >
                    {copiedKey === "drawer_email" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>

              {/* Contact Page */}
              {contactPage && (
                <div className="p-4 rounded-2xl bg-brand-primary/5 border border-brand-secondary flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-brand-secondary/40 text-brand-primary/70 flex items-center justify-center">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[10px] font-extrabold uppercase tracking-wider text-brand-primary/50">
                        Official Contact Page
                      </div>
                      <a
                        href={contactPage}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                      >
                        <span>Open Contact Form</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "provenance" && (
            <div className="space-y-4 animate-fadeIn">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-primary/50">
                Data Provenance & Live Source Citations
              </span>

              <div className="p-4 rounded-2xl bg-brand-primary/5 border border-brand-secondary space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-brand-primary/60">Primary Data Source:</span>
                  <span className="font-extrabold text-brand-primary">{prospect.source || "Live Search"}</span>
                </div>
                {prospect.retrievedAt && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-brand-primary/60">Retrieved At:</span>
                    <span className="font-mono text-brand-primary/80">{new Date(prospect.retrievedAt).toLocaleString()}</span>
                  </div>
                )}
                {prospect.sourceUrl && (
                  <div className="flex items-center justify-between text-xs gap-2">
                    <span className="font-bold text-brand-primary/60 shrink-0">Source URL:</span>
                    <a
                      href={prospect.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline truncate flex items-center gap-1"
                    >
                      <span className="truncate">{prospect.sourceUrl}</span>
                      <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                    </a>
                  </div>
                )}
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-brand-primary/60">Evidence Score:</span>
                  <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{prospect.confidenceScore || 75}%</span>
                </div>
              </div>

              {Array.isArray(prospect.sources) && prospect.sources.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-primary/40">
                    Field-Level Source Citations ({prospect.sources.length})
                  </span>
                  <div className="space-y-1.5 max-h-56 overflow-y-auto">
                    {prospect.sources.map((s, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl border border-brand-secondary bg-brand-light text-xs flex items-center justify-between gap-2"
                      >
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline truncate flex items-center gap-1"
                        >
                          <span className="truncate">{s.url}</span>
                          <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                        </a>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-brand-secondary/40">
                            {s.field}
                          </span>
                          {s.accessedAt && (
                            <span className="text-[9px] text-brand-primary/40">
                              {new Date(s.accessedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── 4. Drawer Footer: Resolution Action Controls ────────────────── */}
        <div className="p-5 sm:p-6 border-t border-brand-secondary bg-brand-primary/5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-brand-primary">Target Resolution Status:</span>
            {isResolved ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-500" />
                <span>Resolved</span>
              </span>
            ) : (
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">
                Unresolved
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onToggleResolve(prospect, !isResolved, resolutionNotes)}
              disabled={isResolving}
              className={`w-full py-2.5 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center justify-center gap-2 ${
                isResolved
                  ? "bg-brand-secondary/50 hover:bg-brand-secondary/70 text-brand-primary"
                  : "bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
              }`}
            >
              {isResolved ? (
                <>
                  <RotateCcw className="w-4 h-4" />
                  <span>Mark as Unresolved</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Mark as Resolved</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
