import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useLeads } from "../context/LeadsContext.jsx";
import { formatDate } from "../utils/helpers.js";
import {
  Search,
  Bot,
  Calendar,
  User,
  Phone,
  Mail,
  ExternalLink,
  MessageCircle,
  Sparkles,
  ClipboardList,
} from "lucide-react";

// Helper to sanitize display text and prevent literal 'null', 'undefined', etc.
const cleanDisplay = (val, fallback = "") => {
  if (val === null || val === undefined) return fallback;
  const s = String(val).trim();
  if (
    !s ||
    s.toLowerCase() === "null" ||
    s.toLowerCase() === "undefined" ||
    s.toLowerCase() === "none" ||
    s.toLowerCase() === "n/a"
  ) {
    return fallback;
  }
  return s;
};

export default function AIFollowUps() {
  const { leads, followups } = useLeads();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFollowupId, setSelectedFollowupId] = useState(null);

  // Filter followups to only those created by AI Agent
  const aiFollowups = useMemo(() => {
    return followups
      .filter((f) => f.author === "AI Agent")
      .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
  }, [followups]);

  // Combine followups with lead data
  const combinedData = useMemo(() => {
    return aiFollowups
      .map((f) => {
        const lead = leads.find((l) => l.id === f.leadId || l._id === f.leadId);
        return {
          ...f,
          lead,
        };
      })
      .filter((f) => f.lead); // Ensure lead exists
  }, [aiFollowups, leads]);

  // Filter by search query
  const filteredData = useMemo(() => {
    if (!searchQuery) return combinedData;
    const lowerQuery = searchQuery.toLowerCase();
    return combinedData.filter(
      (f) =>
        f.lead.name?.toLowerCase().includes(lowerQuery) ||
        f.notes?.toLowerCase().includes(lowerQuery) ||
        (f.lead.phone && f.lead.phone.includes(lowerQuery)) ||
        (f.lead.service && f.lead.service.toLowerCase().includes(lowerQuery)),
    );
  }, [combinedData, searchQuery]);

  const selectedData = useMemo(() => {
    if (!selectedFollowupId) return null;
    return filteredData.find((f) => f.id === selectedFollowupId) || null;
  }, [selectedFollowupId, filteredData]);

  // Auto-select first item if none selected and data exists
  React.useEffect(() => {
    if (!selectedFollowupId && filteredData.length > 0) {
      setSelectedFollowupId(filteredData[0].id);
    } else if (
      selectedFollowupId &&
      !filteredData.some((f) => f.id === selectedFollowupId) &&
      filteredData.length > 0
    ) {
      setSelectedFollowupId(filteredData[0].id);
    }
  }, [filteredData, selectedFollowupId]);

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-80px)] overflow-hidden">
      {/* Left Sidebar */}
      <div className="w-full md:w-80 border-r border-brand-secondary bg-brand-light flex flex-col shrink-0">
        <div className="p-4 border-b border-brand-secondary">
          <h2 className="text-xl font-bold text-brand-primary flex items-center gap-2 mb-4">
            <Sparkles className="text-teal-500 w-6 h-6" />
            Immediate Actions
          </h2>
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-brand-primary/50"
              size={18}
            />
            <input
              type="text"
              placeholder="Search leads or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-bg-main border border-brand-secondary text-brand-primary text-sm rounded-lg focus:ring-teal-500 focus:border-teal-500 pl-10 p-2.5 outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredData.length === 0 ? (
            <div className="text-center py-8 text-brand-primary/50 text-sm">
              No immediate actions found.
            </div>
          ) : (
            filteredData.map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedFollowupId(f.id)}
                className={`w-full text-left p-3 rounded-xl transition-all border ${
                  selectedFollowupId === f.id
                    ? "bg-teal-500/10 border-teal-500/50 shadow-sm"
                    : "bg-transparent border-transparent hover:bg-brand-secondary/20"
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold text-brand-primary truncate pr-2 text-sm">
                    {f.lead.name}
                  </span>
                  <span
                    className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      f.priority === "High"
                        ? "bg-red-500/10 text-red-500 border border-red-500/20"
                        : f.priority === "Medium"
                          ? "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                          : "bg-brand-secondary/30 text-brand-primary/70 border border-brand-secondary"
                    }`}
                  >
                    {f.priority || "Medium"}
                  </span>
                </div>
                <div className="text-xs text-brand-primary/60 flex items-center gap-1 mb-2">
                  <Calendar size={12} />
                  {formatDate(f.createdAt || f.date)}
                </div>
                <p className="text-xs text-brand-primary/80 line-clamp-2 italic">
                  "{cleanDisplay(f.notes, f.lead?.service ? `Follow-up scheduled for ${f.lead.service}` : "Follow-up scheduled by AI Agent")}"
                </p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-bg-main overflow-y-auto p-4 md:p-6">
        {selectedData ? (
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Lead Details Card */}
            <div className="bg-brand-light border border-brand-secondary rounded-2xl p-6 shadow-sm">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-brand-secondary pb-6">
                <div>
                  <h1 className="text-2xl font-extrabold text-brand-primary flex items-center gap-3">
                    <User className="text-teal-500" size={28} />
                    {selectedData.lead.name}
                  </h1>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-brand-primary/70">
                    <span className="flex items-center gap-1.5 bg-brand-secondary/20 px-2.5 py-1 rounded-md">
                      <Phone size={14} />
                      {selectedData.lead.phone}
                    </span>
                    {selectedData.lead.email && (
                      <span className="flex items-center gap-1.5 bg-brand-secondary/20 px-2.5 py-1 rounded-md">
                        <Mail size={14} />
                        {selectedData.lead.email}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() =>
                      navigate(`/whatsapp`, {
                        state: { openChatId: selectedData.lead.id },
                      })
                    }
                    className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 px-4 rounded-lg transition-colors cursor-pointer"
                  >
                    <MessageCircle size={18} />
                    Open WhatsApp
                  </button>
                  <button
                    onClick={() =>
                      navigate(`/lead-details/${selectedData.lead.id}`)
                    }
                    className="flex items-center justify-center gap-2 bg-brand-light border-2 border-teal-500 text-teal-500 hover:bg-teal-500/10 font-bold py-2 px-4 rounded-lg transition-colors cursor-pointer"
                  >
                    <ExternalLink size={18} />
                    View Lead Details
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-bg-main p-4 rounded-xl border border-brand-secondary">
                  <span className="block text-xs font-semibold text-brand-primary/60 uppercase tracking-wider mb-1">
                    Service
                  </span>
                  <span className="font-bold text-brand-primary text-sm truncate block">
                    {cleanDisplay(selectedData.lead.service) || cleanDisplay(selectedData.lead.services?.join(", ")) || "General Enquiry"}
                  </span>
                </div>
                <div className="bg-bg-main p-4 rounded-xl border border-brand-secondary">
                  <span className="block text-xs font-semibold text-brand-primary/60 uppercase tracking-wider mb-1">
                    City
                  </span>
                  <span className="font-bold text-brand-primary text-sm truncate block">
                    {cleanDisplay(selectedData.lead.city) || cleanDisplay(selectedData.lead.aiQualification?.city) || "Not Specified"}
                  </span>
                </div>
                <div className="bg-bg-main p-4 rounded-xl border border-brand-secondary">
                  <span className="block text-xs font-semibold text-brand-primary/60 uppercase tracking-wider mb-1">
                    Status
                  </span>
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                      selectedData.lead.status === "Converted"
                        ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                        : selectedData.lead.status === "New"
                          ? "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                          : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                    }`}
                  >
                    {selectedData.lead.status || "New"}
                  </span>
                </div>
                <div className="bg-bg-main p-4 rounded-xl border border-brand-secondary">
                  <span className="block text-xs font-semibold text-brand-primary/60 uppercase tracking-wider mb-1">
                    Enquired On
                  </span>
                  <span className="font-bold text-brand-primary text-sm">
                    {formatDate(selectedData.lead.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Immediate Action Note Card */}
            <div className="bg-brand-light border border-teal-500/30 rounded-xl overflow-hidden shadow-sm">
              <div className="p-5">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="font-bold text-teal-500 flex items-center gap-2">
                    <ClipboardList className="w-5 h-5" />
                    Immediate Action Details
                  </h3>
                </div>

                <div className="p-4 bg-bg-main border border-brand-secondary rounded-xl flex justify-between items-start">
                  <div className="flex gap-4 items-start w-full">
                    <div className="min-w-0 flex-grow">
                      <div className="flex justify-between items-start mb-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-sm font-bold text-brand-primary">
                            {selectedData.type || "WhatsApp"} Engagement Channel
                          </h4>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              selectedData.priority === "High"
                                ? "bg-red-500/10 text-red-500 border border-red-500/20"
                                : selectedData.priority === "Medium"
                                  ? "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                                  : "bg-brand-secondary/30 text-brand-primary/70 border border-brand-secondary"
                            }`}
                          >
                            {selectedData.priority || "Medium"}
                          </span>
                        </div>

                        {selectedData.date && (
                          <div className="text-right">
                            <span className="block text-[10px] font-bold text-brand-primary/70 uppercase tracking-wider">
                              Scheduled Date
                            </span>
                            <span className="text-xs font-bold text-teal-600 bg-teal-500/10 px-2 py-1 rounded">
                              {formatDate(selectedData.date)}{" "}
                              {cleanDisplay(selectedData.time) ? `• ${cleanDisplay(selectedData.time)}` : ""}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-brand-primary/70 mb-2">
                        <Calendar size={14} />
                        <span>
                          Created on: {formatDate(selectedData.createdAt || selectedData.date)}
                          {selectedData.createdAt && (
                            <>
                              {" "}•{" "}
                              {new Date(selectedData.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </>
                          )}
                        </span>
                      </div>

                      <p className="text-sm italic text-brand-primary mb-3 p-3 bg-brand-light rounded-lg border border-brand-secondary/50">
                        "{cleanDisplay(selectedData.notes, selectedData.lead?.service ? `Follow-up scheduled for ${selectedData.lead.service}` : "Follow-up scheduled by AI Agent")}"
                      </p>

                      <hr className="border-brand-secondary mb-3" />

                      <div className="text-xs font-bold text-teal-500 flex items-center gap-1.5">
                        <Bot size={14} />
                        Followed up by: AI Agent
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-brand-primary/50">
            <Sparkles size={48} className="mb-4 opacity-50 text-teal-500" />
            <p className="text-lg font-medium">
              Select an immediate action from the sidebar to view details
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
