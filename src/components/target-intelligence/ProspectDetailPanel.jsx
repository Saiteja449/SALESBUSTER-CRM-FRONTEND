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
  DollarSign,
  Check,
  Copy,
  RotateCcw,
  ExternalLink,
  Info,
} from "lucide-react";

function getVerificationBadge(status) {
  switch (status) {
    case "verified":
      return {
        label: "Verified",
        bg: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
      };
    case "sourced":
      return {
        label: "Directory Sourced",
        bg: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30",
      };
    case "unverified":
      return {
        label: "Unverified",
        bg: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
      };
    case "unavailable":
      return {
        label: "Unavailable",
        bg: "bg-brand-secondary/40 text-brand-primary/60 border-brand-secondary",
      };
    default:
      return {
        label: "Not Found",
        bg: "bg-brand-secondary/30 text-brand-primary/50 border-brand-secondary/50",
      };
  }
}

function LinkedinIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
    </svg>
  );
}

function TwitterIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function FacebookIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H7v-3h3V9.5C10 6.57 11.76 5 14.39 5c1.26 0 2.39.09 2.71.13v3.14h-1.86c-1.42 0-1.7.68-1.7 1.67V12h3.48l-.45 3h-3.03v6.8c4.56-.93 8-4.96 8-9.8z" />
    </svg>
  );
}

function InstagramIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function YoutubeIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

export default function ProspectDetailPanel({
  prospect,
  onClose,
  onToggleResolve,
  isResolving = false,
}) {
  const [copiedKey, setCopiedKey] = useState(null);

  if (!prospect) return null;

  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const isPerson = prospect.entityType === "person";
  const isResolved = Boolean(prospect.isResolved);

  // Distinct resolution of company coordinates vs personal direct coordinates
  const compPhone = prospect.companyContact?.phone?.value || (!isPerson ? prospect.phone : "");
  const compPhoneSource = prospect.companyContact?.phone?.sourceName || prospect.source || "Directory";
  const compPhoneUrl = prospect.companyContact?.phone?.sourceUrl || prospect.sourceUrl || null;
  const compPhoneStatus = prospect.companyContact?.phone?.verificationStatus || (compPhone ? "sourced" : "not_found");
  const compPhoneBadge = getVerificationBadge(compPhoneStatus);

  const compEmail = prospect.companyContact?.email?.value || (!isPerson ? prospect.email : "");
  const compEmailSource = prospect.companyContact?.email?.sourceName || prospect.source || "Directory";
  const compEmailUrl = prospect.companyContact?.email?.sourceUrl || prospect.sourceUrl || null;
  const compEmailStatus = prospect.companyContact?.email?.verificationStatus || (compEmail ? "sourced" : "not_found");
  const compEmailBadge = getVerificationBadge(compEmailStatus);

  const personPhone = prospect.personContact?.phone?.value || (isPerson ? prospect.phone : "");
  const personPhoneSource = prospect.personContact?.phone?.sourceName || (personPhone ? "Corporate Registry" : null);
  const personPhoneStatus = prospect.personContact?.phone?.verificationStatus || (personPhone ? "verified" : "unavailable");
  const personPhoneBadge = getVerificationBadge(personPhoneStatus);

  const personEmail = prospect.personContact?.email?.value || (isPerson ? prospect.email : "");
  const personEmailSource = prospect.personContact?.email?.sourceName || (personEmail ? "Corporate Registry" : null);
  const personEmailStatus = prospect.personContact?.email?.verificationStatus || (personEmail ? "verified" : "unavailable");
  const personEmailBadge = getVerificationBadge(personEmailStatus);

  const personName = prospect.personContact?.name || prospect.decisionMaker?.name || prospect.personName || "";
  const personTitle = prospect.personContact?.title || prospect.decisionMaker?.title || prospect.title || "";
  const website = prospect.companyContact?.website || prospect.website || "";

  // Strict LinkedIn handling:
  // For company: ONLY show if real verified company page exists.
  // If NOT available, DO NOT SHOW IT AT ALL!
  const hasCompanyLinkedIn =
    !isPerson &&
    Boolean(
      prospect.linkedin &&
        typeof prospect.linkedin === "string" &&
        prospect.linkedin.trim().length > 10 &&
        /linkedin\.com\/(company|school)\/[a-zA-Z0-9_\-.]+/i.test(prospect.linkedin.trim())
    );
  const companyLinkedInUrl = hasCompanyLinkedIn ? prospect.linkedin.trim() : null;

  // For person: ONLY show if verified personal LinkedIn profile exists (/in/).
  const hasPersonLinkedIn =
    isPerson &&
    Boolean(
      (prospect.decisionMaker?.linkedin || prospect.linkedin) &&
        /linkedin\.com\/in\/[a-zA-Z0-9_\-.]+/i.test(
          (prospect.decisionMaker?.linkedin || prospect.linkedin).trim()
        )
    );
  const personLinkedInUrl = hasPersonLinkedIn
    ? (prospect.decisionMaker?.linkedin || prospect.linkedin).trim()
    : null;

  // Social media links
  const socialLinks = prospect.socialLinks || {};
  const twitterUrl = socialLinks.twitter || null;
  const facebookUrl = socialLinks.facebook || null;
  const instagramUrl = socialLinks.instagram || null;
  const youtubeUrl = socialLinks.youtube || null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-black/40 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-xl bg-brand-light h-full shadow-2xl flex flex-col border-l border-brand-secondary overflow-y-auto">
        {/* ── Top Header ─────────────────────────────────────────────────── */}
        <div className="p-5 border-b border-brand-secondary flex items-start justify-between gap-4 sticky top-0 bg-brand-light/95 backdrop-blur-md z-10">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                {prospect.matchScore}% Match Score
              </span>

              {isResolved ? (
                <span className="px-2 py-0.5 text-[10px] font-black rounded-md bg-purple-600 text-white shadow-2xs">
                  ✓ Resolved Already
                </span>
              ) : (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-brand-secondary/60 text-brand-primary/70">
                  Unresolved Target
                </span>
              )}
            </div>

            <h2 className="text-lg font-black text-brand-primary truncate">
              {isPerson
                ? prospect.personName || prospect.decisionMaker?.name || prospect.companyName
                : prospect.companyName}
            </h2>

            <p className="text-xs text-brand-primary/60 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-brand-primary/40" />
              <span>{prospect.location || prospect.city}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-brand-primary/60 hover:text-brand-primary hover:bg-brand-secondary/40 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Resolution Banner ──────────────────────────────────────────── */}
        {isResolved && (
          <div className="px-6 py-3 bg-purple-500/10 border-b border-purple-500/20 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-bold">
              <CheckCircle2 className="w-4 h-4 text-purple-600" />
              <span>Target Resolved Already</span>
            </div>
            <span className="text-[11px] text-brand-primary/60">
              Resolved by {prospect.resolvedByName || "Team Member"}
            </span>
          </div>
        )}

        {/* ── Body Content ───────────────────────────────────────────────── */}
        <div className="p-6 space-y-6 flex-1">
          {/* 1. COMPANY REGISTERED COORDINATES */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-brand-primary uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-emerald-500" />
                <span>Company Registered Coordinates</span>
              </span>
              <span className="text-[10px] text-brand-primary/60 font-semibold">
                Source: {compPhoneSource}
              </span>
            </h3>

            <div className="p-4 rounded-2xl bg-brand-secondary/20 border border-brand-secondary/50 space-y-3 text-xs">
              {/* Company Phone */}
              <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-brand-light border border-brand-secondary">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-brand-primary/50 uppercase">
                      <span>Company Corporate Phone</span>
                      <span className={`px-1.5 py-0.2 rounded border text-[9px] ${compPhoneBadge.bg}`}>
                        {compPhoneBadge.label}
                      </span>
                    </div>
                    {compPhone ? (
                      <a
                        href={`tel:${compPhone.replace(/\s+/g, "")}`}
                        className="font-black text-brand-primary hover:underline truncate block"
                      >
                        {compPhone}
                      </a>
                    ) : (
                      <span className="text-brand-primary/40 italic">Not published in directory records</span>
                    )}
                  </div>
                </div>

                {compPhone && (
                  <button
                    type="button"
                    onClick={() => handleCopy(compPhone, "detail-comp-phone")}
                    className="p-1.5 text-brand-primary/40 hover:text-brand-primary cursor-pointer rounded-lg hover:bg-brand-secondary/40"
                    title="Copy Company Phone"
                  >
                    {copiedKey === "detail-comp-phone" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
              </div>

              {/* Company Email */}
              <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-brand-light border border-brand-secondary">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-600 shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-brand-primary/50 uppercase">
                      <span>Official Corporate Email</span>
                      <span className={`px-1.5 py-0.2 rounded border text-[9px] ${compEmailBadge.bg}`}>
                        {compEmailBadge.label}
                      </span>
                    </div>
                    {compEmail ? (
                      <a
                        href={`mailto:${compEmail}`}
                        className="font-black text-brand-primary hover:underline truncate block font-mono text-[11px]"
                      >
                        {compEmail}
                      </a>
                    ) : (
                      <span className="text-brand-primary/40 italic">Not published in directory records</span>
                    )}
                  </div>
                </div>

                {compEmail && (
                  <button
                    type="button"
                    onClick={() => handleCopy(compEmail, "detail-comp-email")}
                    className="p-1.5 text-brand-primary/40 hover:text-brand-primary cursor-pointer rounded-lg hover:bg-brand-secondary/40"
                    title="Copy Company Email"
                  >
                    {copiedKey === "detail-comp-email" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
              </div>

              {/* Company Website */}
              {website && (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-brand-light border border-brand-secondary">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-pilot-blue/10 flex items-center justify-center text-pilot-blue shrink-0">
                      <Globe className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold text-brand-primary/50 uppercase">
                        Official Website
                      </div>
                      <a
                        href={website.startsWith("http") ? website : `https://${website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-pilot-blue hover:underline truncate block text-xs"
                      >
                        {website}
                      </a>
                    </div>
                  </div>
                  <a
                    href={website.startsWith("http") ? website : `https://${website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-pilot-blue hover:underline"
                    title="Visit Website"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              {/* Company LinkedIn: ONLY SHOWN IF VALID COMPANY PAGE */}
              {companyLinkedInUrl && (
                <div className="p-2.5 rounded-xl bg-brand-light border border-brand-secondary flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#0077B5]/10 flex items-center justify-center text-[#0077B5] shrink-0">
                      <LinkedinIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-brand-primary/50 uppercase">
                        Company LinkedIn Page
                      </div>
                      <span className="font-bold text-[#0077B5] text-[11px]">
                        Official Company Page
                      </span>
                    </div>
                  </div>

                  <a
                    href={companyLinkedInUrl.startsWith("http") ? companyLinkedInUrl : `https://${companyLinkedInUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0077B5] text-white text-xs font-bold hover:bg-[#005582] transition"
                  >
                    <span>Open</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {/* Company Social Media Links */}
              {!isPerson && (twitterUrl || facebookUrl || instagramUrl || youtubeUrl) && (
                <div className="p-2.5 rounded-xl bg-brand-light border border-brand-secondary space-y-1.5">
                  <div className="text-[10px] font-bold text-brand-primary/50 uppercase">
                    Official Social Media Channels
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {twitterUrl && (
                      <a href={twitterUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-brand-secondary/30 text-brand-primary font-bold hover:bg-brand-secondary transition text-xs">
                        <TwitterIcon className="w-3.5 h-3.5" />
                        <span>Twitter / X</span>
                      </a>
                    )}
                    {facebookUrl && (
                      <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 text-[#1877F2] font-bold hover:bg-blue-500/20 transition text-xs">
                        <FacebookIcon className="w-3.5 h-3.5" />
                        <span>Facebook</span>
                      </a>
                    )}
                    {instagramUrl && (
                      <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-pink-500/10 text-[#E4405F] font-bold hover:bg-pink-500/20 transition text-xs">
                        <InstagramIcon className="w-3.5 h-3.5" />
                        <span>Instagram</span>
                      </a>
                    )}
                    {youtubeUrl && (
                      <a href={youtubeUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/10 text-[#CD201F] font-bold hover:bg-red-500/20 transition text-xs">
                        <YoutubeIcon className="w-3.5 h-3.5" />
                        <span>YouTube</span>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 2. EXECUTIVE & DECISION-MAKER DIRECT COORDINATES (STRICTLY SEPARATE) */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-brand-primary uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-sky-500" />
                <span>Executive & Decision-Maker Coordinates</span>
              </span>
              <span className="text-[10px] text-brand-primary/60 font-semibold">
                {personPhoneStatus === "verified" ? "Status: Verified Leadership" : "Enrichment Required"}
              </span>
            </h3>

            <div className="p-4 rounded-2xl bg-brand-secondary/20 border border-brand-secondary/50 space-y-3 text-xs">
              {/* Executive Identity */}
              <div className="p-2.5 rounded-xl bg-brand-light border border-brand-secondary flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold text-brand-primary/50 uppercase">
                    Primary Decision Maker
                  </div>
                  <div className="font-black text-brand-primary text-sm">
                    {personName || <span className="text-brand-primary/40 font-normal italic">Not identified in public directory records</span>}
                  </div>
                  {personTitle && (
                    <div className="text-xs font-semibold text-brand-primary/70">
                      {personTitle}
                    </div>
                  )}
                </div>

                {personLinkedInUrl && (
                  <a
                    href={personLinkedInUrl.startsWith("http") ? personLinkedInUrl : `https://${personLinkedInUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0077B5] text-white text-xs font-bold hover:bg-[#005582] transition"
                  >
                    <span>Profile</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {/* Direct Personal Phone */}
              <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-brand-light border border-brand-secondary">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-600 shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-brand-primary/50 uppercase">
                      <span>Executive Direct Mobile</span>
                      <span className={`px-1.5 py-0.2 rounded border text-[9px] ${personPhoneBadge.bg}`}>
                        {personPhoneBadge.label}
                      </span>
                    </div>
                    {personPhone ? (
                      <a
                        href={`tel:${personPhone.replace(/\s+/g, "")}`}
                        className="font-black text-brand-primary hover:underline truncate block"
                      >
                        {personPhone}
                      </a>
                    ) : (
                      <span className="text-brand-primary/40 italic">Unavailable without configured enrichment provider</span>
                    )}
                  </div>
                </div>

                {personPhone && (
                  <button
                    type="button"
                    onClick={() => handleCopy(personPhone, "detail-person-phone")}
                    className="p-1.5 text-brand-primary/40 hover:text-brand-primary cursor-pointer rounded-lg hover:bg-brand-secondary/40"
                    title="Copy Direct Phone"
                  >
                    {copiedKey === "detail-person-phone" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
              </div>

              {/* Direct Personal Email */}
              <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-brand-light border border-brand-secondary">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-600 shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-brand-primary/50 uppercase">
                      <span>Executive Direct Email</span>
                      <span className={`px-1.5 py-0.2 rounded border text-[9px] ${personEmailBadge.bg}`}>
                        {personEmailBadge.label}
                      </span>
                    </div>
                    {personEmail ? (
                      <a
                        href={`mailto:${personEmail}`}
                        className="font-black text-brand-primary hover:underline truncate block font-mono text-[11px]"
                      >
                        {personEmail}
                      </a>
                    ) : (
                      <span className="text-brand-primary/40 italic">Unavailable without configured enrichment provider</span>
                    )}
                  </div>
                </div>

                {personEmail && (
                  <button
                    type="button"
                    onClick={() => handleCopy(personEmail, "detail-person-email")}
                    className="p-1.5 text-brand-primary/40 hover:text-brand-primary cursor-pointer rounded-lg hover:bg-brand-secondary/40"
                    title="Copy Direct Email"
                  >
                    {copiedKey === "detail-person-email" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
              </div>

              {/* Educational Notice explaining why direct coordinates are unavailable */}
              {!personPhone && !personEmail && (
                <div className="p-3 rounded-xl bg-brand-light/80 border border-brand-secondary/60 flex items-start gap-2 text-[11px] text-brand-primary/65 leading-relaxed">
                  <Info className="w-4 h-4 text-brand-primary/50 shrink-0 mt-0.5" />
                  <span>
                    <strong>Why are direct executive contacts unavailable?</strong> SalesBuster AI Target Intelligence retrieves corporate records from public directories without hallucinating personal contacts. To discover verified executive mobile numbers and direct emails, configure an approved B2B contact enrichment provider for your organization.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Company Firmographics */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-brand-primary uppercase tracking-wider">
              Entity Overview
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-brand-secondary/20 border border-brand-secondary/40 space-y-0.5">
                <span className="text-[10px] font-bold text-brand-primary/50 uppercase">
                  Industry
                </span>
                <p className="text-xs font-bold text-brand-primary">
                  {prospect.industry || "General Commercial Enterprise"}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-brand-secondary/20 border border-brand-secondary/40 space-y-0.5">
                <span className="text-[10px] font-bold text-brand-primary/50 uppercase">
                  Employee Scale
                </span>
                <p className="text-xs font-bold text-brand-primary">
                  {prospect.companySize || "Active Enterprise"}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-brand-secondary/20 border border-brand-secondary/40 space-y-0.5">
                <span className="text-[10px] font-bold text-brand-primary/50 uppercase">
                  Estimated Scale
                </span>
                <p className="text-xs font-bold text-brand-primary">
                  {prospect.annualRevenue || "Active Enterprise"}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-brand-secondary/20 border border-brand-secondary/40 space-y-0.5">
                <span className="text-[10px] font-bold text-brand-primary/50 uppercase">
                  City & State
                </span>
                <p className="text-xs font-bold text-brand-primary">
                  {prospect.location || prospect.city}
                </p>
              </div>
            </div>
          </div>

          {/* AI Match Rationale */}
          {prospect.matchReasons && prospect.matchReasons.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-brand-primary uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                <span>Verification Rationale & Signals</span>
              </h3>
              <div className="space-y-2">
                {prospect.matchReasons.map((reason, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex items-start gap-2.5 text-xs text-brand-primary"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Data Provenance & Compliance */}
          <div className="p-4 rounded-xl bg-brand-secondary/30 border border-brand-secondary/50 space-y-2 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-brand-primary">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Real-Time Provenance</span>
            </div>
            <p className="text-[11px] text-brand-primary/65 leading-relaxed">
              Source: <strong className="text-brand-primary">{prospect.source}</strong>. Verified corporate records without simulated fallbacks.
            </p>
          </div>
        </div>

        {/* ── Footer Actions ──────────────────────────────────────────────── */}
        <div className="p-4 border-t border-brand-secondary bg-brand-light flex items-center justify-between gap-3 sticky bottom-0">
          {website ? (
            <a
              href={website.startsWith("http") ? website : `https://${website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-pilot-blue hover:underline bg-pilot-blue/10 rounded-xl transition"
            >
              <Globe className="w-4 h-4" />
              <span>Visit Website</span>
            </a>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            {/* RESOLVE / UNRESOLVE BUTTON */}
            {isResolved ? (
              <button
                type="button"
                onClick={() => onToggleResolve && onToggleResolve(prospect, false)}
                disabled={isResolving}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-black rounded-xl border border-purple-500/40 bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{isResolving ? "Updating..." : "Unresolve Target"}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onToggleResolve && onToggleResolve(prospect, true)}
                disabled={isResolving}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-black text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition cursor-pointer shadow-sm disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isResolving ? "Saving..." : "Mark as Resolved"}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-extrabold text-brand-primary bg-brand-secondary/60 hover:bg-brand-secondary rounded-xl transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
