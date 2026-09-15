import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FileText,
  RefreshCw,
  Plus,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
  Search,
  SlidersHorizontal,
  Trash2,
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

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
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
  };

  const handleSync = async () => {
    setSyncing(true);
    setToastMessage("");
    try {
      const res = await axios.post(API_ENDPOINTS.WHATSAPP_CLOUD.SYNC_TEMPLATES);
      if (res.data.success) {
        setToastMessage(res.data.message || "Templates synced successfully!");
        fetchTemplates();
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

  const handleDeleteTemplate = async (id, name) => {
    if (
      !window.confirm(
        `Are you sure you want to delete template "${name}" from Meta and your CRM? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const res = await axios.delete(
        API_ENDPOINTS.WHATSAPP_CLOUD.DELETE_TEMPLATE(id)
      );
      if (res.data.success) {
        setToastMessage(`Template "${name}" deleted successfully.`);
        fetchTemplates();
      }
    } catch (err) {
      alert(
        err.response?.data?.message ||
          "Failed to delete template from Meta WhatsApp Cloud API."
      );
    }
  };

  const filteredTemplates = templates.filter((t) => {
    const matchSearch =
      !search ||
      t.name?.toLowerCase().includes(search.toLowerCase()) ||
      t.components?.some((c) =>
        c.text?.toLowerCase().includes(search.toLowerCase())
      );
    const matchCategory =
      categoryFilter === "All" || t.category === categoryFilter;
    const matchStatus = statusFilter === "All" || t.status === statusFilter;
    return matchSearch && matchCategory && matchStatus;
  });

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
            Meta-approved message templates for outbound broadcasts and campaigns
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
          >
            Cloud Settings
          </button>

          <button
            type="button"
            onClick={handleSync}
            disabled={syncing}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all flex items-center gap-1.5 disabled:opacity-50"
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
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-700 dark:text-emerald-300 font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search templates by name or content..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="flex items-center gap-2">
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

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="APPROVED">Approved</option>
            <option value="PENDING">Pending</option>
            <option value="REJECTED">Rejected</option>
          </select>
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
            Create a new official Meta-approved template directly, or sync existing approved templates from Meta.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/whatsapp/templates/create")}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white transition-all inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Template</span>
            </button>

            <button
              type="button"
              onClick={handleSync}
              disabled={syncing}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 transition-all inline-flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
              <span>Sync from Meta</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTemplates.map((template, idx) => {
            const tKey = template._id || template.id || template.metaTemplateId || `${template.name}_${template.language}_${idx}`;
            const headerComp = template.components?.find((c) => c.type === "HEADER");
            const bodyComp = template.components?.find((c) => c.type === "BODY");
            const footerComp = template.components?.find((c) => c.type === "FOOTER");
            const buttonsComp = template.components?.find((c) => c.type === "BUTTONS");
            const categoryStr = typeof template.category === "object" ? (template.category?.name || "UTILITY") : (template.category || "UTILITY");

            return (
              <div
                key={tKey}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
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
                          : `[Header ${headerComp.format}]`}
                      </div>
                    )}

                    {/* Body */}
                    {bodyComp && (
                      <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line font-sans">
                        {bodyComp.text}
                      </div>
                    )}

                    {/* Footer */}
                    {footerComp && (
                      <div className="text-[10px] text-slate-400 italic pt-1">
                        {footerComp.text}
                      </div>
                    )}

                    {/* Buttons */}
                    {buttonsComp?.buttons && buttonsComp.buttons.length > 0 && (
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-700 space-y-1">
                        {buttonsComp.buttons.map((btn, bIdx) => (
                          <div
                            key={btn.id || `${btn.text || "btn"}_${bIdx}`}
                            className="w-full text-center py-1.5 rounded-lg bg-slate-50 dark:bg-slate-700/50 text-purple-600 dark:text-purple-400 text-xs font-semibold"
                          >
                            {btn.text || "Action"}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Footer */}
                <div className="p-3.5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        `/whatsapp/campaigns/create?templateId=${
                          template._id || template.id || template.metaTemplateId || ""
                        }`
                      )
                    }
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 hover:bg-purple-600 hover:text-white dark:hover:bg-purple-600 transition-all cursor-pointer"
                  >
                    <span>Use in Campaign</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleDeleteTemplate(
                        template._id || template.id,
                        template.name
                      )
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
    </div>
  );
}
