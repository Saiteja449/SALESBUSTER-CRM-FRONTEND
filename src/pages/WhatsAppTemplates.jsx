import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FileText,
  RefreshCw,
  Plus,
  CheckCircle2,
  ArrowRight,
  Search,
  Trash2,
  Eye,
  X,
  AlertCircle,
  HelpCircle,
  Clock,
  ExternalLink,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { API_ENDPOINTS } from "../utils/constants.js";
import CloudSettingsModal from "../components/whatsapp/CloudSettingsModal.jsx";

export default function WhatsAppTemplates() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await axios.get(API_ENDPOINTS.WHATSAPP_CLOUD.TEMPLATES);
      if (res.data.success) {
        setTemplates(res.data.data || []);
      }
    } catch (err) {
      console.error("Error fetching templates:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        const res = await axios.get(API_ENDPOINTS.WHATSAPP_CLOUD.TEMPLATES);
        if (!ignore && res.data.success) {
          setTemplates(res.data.data || []);
        }
      } catch (err) {
        if (!ignore) console.error("Error fetching templates:", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    load();
    return () => {
      ignore = true;
    };
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    setToastMessage("");
    try {
      const res = await axios.post(API_ENDPOINTS.WHATSAPP_CLOUD.SYNC_TEMPLATES);
      if (res.data.success) {
        setToastMessage(res.data.message || "Templates synced successfully from Meta Graph API!");
        await fetchTemplates();
        setTimeout(() => setToastMessage(""), 5000);
      }
    } catch (err) {
      alert(
        err.response?.data?.message ||
          "Failed to sync templates. Make sure Cloud API is connected in Settings."
      );
    } finally {
      setSyncing(false);
    }
  };

  const confirmDeleteTemplate = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await axios.delete(
        API_ENDPOINTS.WHATSAPP_CLOUD.DELETE_TEMPLATE(deleteTarget.id)
      );
      if (res.data.success) {
        setToastMessage(`Template "${deleteTarget.name}" deleted from Meta and CRM.`);
        setDeleteTarget(null);
        await fetchTemplates();
        setTimeout(() => setToastMessage(""), 5000);
      }
    } catch (err) {
      alert(
        err.response?.data?.message ||
          "Failed to delete template from Meta WhatsApp Cloud API."
      );
    } finally {
      setDeleting(false);
    }
  };

  const filteredTemplates = templates.filter((t) => {
    const matchSearch =
      !search ||
      t.name?.toLowerCase().includes(search.toLowerCase()) ||
      t.components?.some((c) =>
        c.text?.toLowerCase().includes(search.toLowerCase())
      );
    const categoryStr = typeof t.category === "object" ? t.category?.name : t.category;
    const matchCategory =
      categoryFilter === "All" || categoryStr === categoryFilter;
    const matchStatus = statusFilter === "All" || t.status === statusFilter;
    return matchSearch && matchCategory && matchStatus;
  });

  const counts = {
    all: templates.length,
    approved: templates.filter((t) => t.status === "APPROVED").length,
    pending: templates.filter((t) => t.status === "PENDING").length,
    rejected: templates.filter((t) => t.status === "REJECTED").length,
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <FileText className="w-7 h-7 text-purple-600 dark:text-purple-400" />
            <span>WhatsApp Message Templates</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Meta-approved message templates for outbound broadcasts and targeted campaigns
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
          >
            Cloud Settings
          </button>

          <button
            type="button"
            onClick={handleSync}
            disabled={syncing}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
            <span>{syncing ? "Syncing..." : "Sync from Meta"}</span>
          </button>

          <button
            type="button"
            onClick={() => navigate("/whatsapp/templates/create")}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Template</span>
          </button>
        </div>
      </div>

      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-700 dark:text-emerald-300 font-medium flex items-center justify-between gap-2 animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage("")}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Filter & Status Navigation Bar */}
      <div className="space-y-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { id: "All", label: "All Templates", count: counts.all },
            { id: "APPROVED", label: "Approved", count: counts.approved },
            { id: "PENDING", label: "Pending Review", count: counts.pending },
            { id: "REJECTED", label: "Rejected", count: counts.rejected },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                statusFilter === tab.id
                  ? "bg-purple-600 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  statusFilter === tab.id
                    ? "bg-white/20 text-white"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search & Category Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search templates by name or content..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 outline-none"
            >
              <option value="All">All Categories</option>
              <option value="MARKETING">Marketing</option>
              <option value="UTILITY">Utility</option>
              <option value="AUTHENTICATION">Authentication</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid of Templates */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-64 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse border border-slate-200 dark:border-slate-700"
            />
          ))}
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
          <div className="w-14 h-14 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 mx-auto flex items-center justify-center mb-3">
            <FileText className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
            No Message Templates Found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-4">
            {search || categoryFilter !== "All" || statusFilter !== "All"
              ? "No templates match your active filters. Try resetting the search or category."
              : "Create an official Meta-approved template directly, or sync existing approved templates from Meta."}
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/whatsapp/templates/create")}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Template</span>
            </button>

            <button
              type="button"
              onClick={handleSync}
              disabled={syncing}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 transition-all inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
              <span>Sync from Meta</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTemplates.map((template, idx) => {
            const tKey =
              template._id ||
              template.id ||
              template.metaTemplateId ||
              `${template.name}_${template.language}_${idx}`;
            const headerComp = template.components?.find((c) => c.type === "HEADER");
            const bodyComp = template.components?.find((c) => c.type === "BODY");
            const footerComp = template.components?.find((c) => c.type === "FOOTER");
            const buttonsComp = template.components?.find((c) => c.type === "BUTTONS");
            const categoryStr =
              typeof template.category === "object"
                ? template.category?.name || "UTILITY"
                : template.category || "UTILITY";

            return (
              <div
                key={tKey}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                {/* Card Header */}
                <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-800/20">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        categoryStr === "MARKETING"
                          ? "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                          : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                      }`}
                    >
                      {categoryStr}
                    </span>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        template.status === "APPROVED"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : template.status === "REJECTED"
                          ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {template.status || "APPROVED"}
                    </span>
                  </div>

                  <h3
                    className="text-sm font-bold text-slate-900 dark:text-white truncate"
                    title={template.name}
                  >
                    {template.name}
                  </h3>
                  <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                    <span>Lang: {template.language || "en_US"}</span>
                    <span>•</span>
                    <span>{template.variableCount || 0} Variables</span>
                  </div>
                </div>

                {/* Simulated WhatsApp Bubble */}
                <div className="p-4 flex-1 bg-slate-50/80 dark:bg-slate-950/40">
                  <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-2">
                    {/* Header */}
                    {headerComp && (
                      <div className="text-xs font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-700 pb-1.5">
                        {headerComp.format === "TEXT"
                          ? headerComp.text
                          : `[Header: ${headerComp.format}]`}
                      </div>
                    )}

                    {/* Body */}
                    {bodyComp && (
                      <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line font-sans line-clamp-4">
                        {bodyComp.text}
                      </div>
                    )}

                    {/* Footer */}
                    {footerComp && (
                      <div className="text-[10px] text-slate-400 italic pt-1 truncate">
                        {footerComp.text}
                      </div>
                    )}

                    {/* Buttons */}
                    {buttonsComp?.buttons && buttonsComp.buttons.length > 0 && (
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-700 space-y-1">
                        {buttonsComp.buttons.slice(0, 2).map((btn, bIdx) => (
                          <div
                            key={btn.id || `${btn.text || "btn"}_${bIdx}`}
                            className="w-full text-center py-1 rounded-lg bg-slate-50 dark:bg-slate-700/50 text-purple-600 dark:text-purple-400 text-[11px] font-semibold"
                          >
                            {btn.text || "Action"}
                          </div>
                        ))}
                        {buttonsComp.buttons.length > 2 && (
                          <div className="text-[10px] text-center text-slate-400">
                            +{buttonsComp.buttons.length - 2} more buttons
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Footer */}
                <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewTemplate(template)}
                    className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Quick preview"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    disabled={template.status !== "APPROVED"}
                    onClick={() =>
                      navigate(
                        `/whatsapp/campaigns/create?templateId=${
                          template._id || template.id || template.metaTemplateId || ""
                        }`
                      )
                    }
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 hover:bg-purple-600 hover:text-white dark:hover:bg-purple-600 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    title={
                      template.status !== "APPROVED"
                        ? "Template must be APPROVED by Meta before launching campaigns"
                        : "Use this template in a campaign"
                    }
                  >
                    <span>Use in Campaign</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setDeleteTarget({
                        id: template._id || template.id,
                        name: template.name,
                      })
                    }
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors border border-transparent hover:border-rose-200 dark:hover:border-rose-900 cursor-pointer"
                    title="Delete template from Meta"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cloud Settings Modal */}
      <CloudSettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onUpdated={fetchTemplates}
      />

      {/* Template Detailed Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Template Preview: {previewTemplate.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewTemplate(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 bg-slate-100/70 dark:bg-slate-950/50 flex-1 overflow-y-auto flex justify-center">
              {/* Phone Bubble Frame */}
              <div className="w-full max-w-sm bg-[#DCF8C6]/30 dark:bg-emerald-950/20 p-4 rounded-2xl border border-emerald-500/20 shadow-sm space-y-3">
                {previewTemplate.components?.find((c) => c.type === "HEADER") && (
                  <div className="text-sm font-bold text-slate-900 dark:text-white border-b border-emerald-500/10 pb-2">
                    {previewTemplate.components.find((c) => c.type === "HEADER").text ||
                      `[Header Media: ${
                        previewTemplate.components.find((c) => c.type === "HEADER").format
                      }]`}
                  </div>
                )}

                <div className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed font-sans">
                  {previewTemplate.components?.find((c) => c.type === "BODY")?.text ||
                    "No body text"}
                </div>

                {previewTemplate.components?.find((c) => c.type === "FOOTER") && (
                  <div className="text-[10px] text-slate-500 italic pt-1">
                    {previewTemplate.components.find((c) => c.type === "FOOTER").text}
                  </div>
                )}

                {previewTemplate.components?.find((c) => c.type === "BUTTONS")?.buttons?.length >
                  0 && (
                  <div className="pt-2 border-t border-emerald-500/10 space-y-1.5">
                    {previewTemplate.components
                      .find((c) => c.type === "BUTTONS")
                      .buttons.map((btn, bIdx) => (
                        <div
                          key={bIdx}
                          className="w-full text-center py-2 rounded-xl bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 text-xs font-semibold shadow-xs"
                        >
                          {btn.text}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Language: {previewTemplate.language || "en_US"}
              </span>
              <button
                type="button"
                onClick={() => setPreviewTemplate(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Delete Template from Meta?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                Are you sure you want to delete <span className="font-semibold text-slate-700 dark:text-slate-200">&quot;{deleteTarget.name}&quot;</span>? This will permanently delete the template from your Meta WhatsApp Business Account and your CRM.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteTemplate}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {deleting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
