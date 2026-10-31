import React, { useState } from "react";
import {
  X,
  Users,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Layers,
  Tag,
} from "lucide-react";

export default function AddToCrmDialog({
  isOpen,
  onClose,
  selectedProspects = [],
  salesReps = [],
  onConfirmImport,
  isImporting,
}) {
  const [assignedUserId, setAssignedUserId] = useState("");
  const [pipelineStage, setPipelineStage] = useState("New");
  const [duplicateAction, setDuplicateAction] = useState("skip"); // skip | update | create
  const [tags, setTags] = useState("AI Target ICP, Hyderabad Manufacturing");

  if (!isOpen) return null;

  const duplicateCount = selectedProspects.filter((p) => p.isDuplicate).length;
  const missingPhoneCount = selectedProspects.filter(
    (p) => !(p.personContact?.phone?.value || p.companyContact?.phone?.value || p.directPhone || p.phone || p.companyPhone)
  ).length;

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirmImport({
      prospects: selectedProspects,
      assignedUserId: assignedUserId || undefined,
      pipelineStage,
      duplicateAction,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-lg bg-brand-light rounded-3xl border border-brand-secondary shadow-2xl overflow-hidden">
        {/* ── Dialog Header ──────────────────────────────────────────────── */}
        <div className="p-5 sm:p-6 border-b border-brand-secondary flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-extrabold text-brand-primary">
              Import to SalesBuster CRM
            </h3>
            <p className="text-xs text-brand-primary/60 mt-0.5">
              Review lead assignments and duplicate resolution settings
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isImporting}
            className="p-1.5 rounded-xl text-brand-primary/60 hover:text-brand-primary hover:bg-brand-secondary/40 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Form Body ──────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {/* Summary Banner */}
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs">
            <span className="font-bold text-emerald-700 dark:text-emerald-300">
              {selectedProspects.length} Prospect{selectedProspects.length === 1 ? "" : "s"} ready to review
            </span>
            {duplicateCount > 0 && (
              <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">
                {duplicateCount} CRM match detected
              </span>
            )}
            {missingPhoneCount > 0 && (
              <span className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400 bg-neutral-500/10 px-2 py-0.5 rounded-md" title="SalesBuster CRM requires a phone coordinate for lead creation">
                {missingPhoneCount} missing phone
              </span>
            )}
          </div>

          {/* Assign to Sales Rep */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-brand-primary">
              Assign to Sales Rep
            </label>
            <select
              value={assignedUserId}
              onChange={(e) => setAssignedUserId(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-brand-light border border-brand-secondary text-brand-primary focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="">Auto-assign (Unassigned)</option>
              {salesReps.map((rep) => {
                const repId = rep._id || rep.id || rep.email;
                return (
                  <option key={repId} value={repId}>
                    {rep.name || rep.email} ({rep.role || "Sales Rep"})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Initial Pipeline Stage */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-brand-primary">
              Initial Pipeline Stage
            </label>
            <select
              value={pipelineStage}
              onChange={(e) => setPipelineStage(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-brand-light border border-brand-secondary text-brand-primary focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="New">New</option>
              <option value="Follow Up">Follow Up</option>
              <option value="Not Attended">Not Attended</option>
              <option value="Not Interested">Not Interested</option>
              <option value="Price Issue">Price Issue</option>
              <option value="Converted">Converted</option>
            </select>
          </div>

          {/* Custom Tags */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-brand-primary">
              Lead Tags (comma-separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-brand-light border border-brand-secondary text-brand-primary focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Duplicate Resolution Strategy */}
          {duplicateCount > 0 && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-2">
              <label className="block text-xs font-bold text-amber-800 dark:text-amber-300">
                Duplicate Handling Strategy
              </label>
              <div className="space-y-1 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="dupAction"
                    value="skip"
                    checked={duplicateAction === "skip"}
                    onChange={() => setDuplicateAction("skip")}
                    className="text-amber-600 focus:ring-amber-500"
                  />
                  <span>Skip existing CRM matches (recommended)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="dupAction"
                    value="update"
                    checked={duplicateAction === "update"}
                    onChange={() => setDuplicateAction("update")}
                    className="text-amber-600 focus:ring-amber-500"
                  />
                  <span>Update existing CRM records with enriched fields</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="dupAction"
                    value="create"
                    checked={duplicateAction === "create"}
                    onChange={() => setDuplicateAction("create")}
                    className="text-amber-600 focus:ring-amber-500"
                  />
                  <span>Create new duplicate lead</span>
                </label>
              </div>
            </div>
          )}

          {/* Compliance Disclaimer */}
          <p className="text-[11px] text-brand-primary/50 leading-relaxed pt-1">
            Imported records will be tagged with target search provenance. Adding a prospect does not automatically send WhatsApp or email messages.
          </p>

          {/* Dialog Actions */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-brand-secondary/40">
            <button
              type="button"
              onClick={onClose}
              disabled={isImporting}
              className="px-4 py-2.5 text-xs font-bold text-brand-primary/70 hover:text-brand-primary rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isImporting}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition active:scale-[0.98] cursor-pointer disabled:opacity-50"
            >
              <span>{isImporting ? "Importing to CRM..." : "Confirm & Import Leads"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
