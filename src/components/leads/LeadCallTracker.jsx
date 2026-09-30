import React, { useState, useEffect, useCallback } from "react";
import {
  Phone,
  PhoneCall,
  PhoneOff,
  PhoneIncoming,
  PhoneOutgoing,
  Clock,
  User,
  Sparkles,
  Play,
  Pause,
  Download,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
  FileText,
  Volume2,
} from "lucide-react";
import axios from "axios";
import { API_BASE_URL, ENDPOINTS } from "../../utils/constants.js";
import { socket } from "../../utils/socket.js";

// Helper to format talk time in seconds to human-readable string
const formatSeconds = (sec) => {
  const s = parseInt(sec) || 0;
  if (s === 0) return "0s";
  const mins = Math.floor(s / 60);
  const remainder = s % 60;
  if (mins === 0) return `${remainder}s`;
  return `${mins}m ${remainder}s`;
};

// Helper to format date
const formatCallDate = (timestamp) => {
  if (!timestamp) return "N/A";
  const d = new Date(timestamp);
  return d.toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function LeadCallTracker({ lead, currentUser }) {
  const leadId = lead?._id || lead?.id;
  const leadPhone = lead?.phone || "";

  const [callLogs, setCallLogs] = useState([]);
  const [summary, setSummary] = useState({
    totalCalls: 0,
    connectedCalls: 0,
    notConnectedCalls: 0,
    totalTalkTime: 0,
    cloudCalls: 0,
    manualCalls: 0,
    repBreakdown: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Summarize loading state per callLogId
  const [summarizingIds, setSummarizingIds] = useState({});
  const [expandedSummaries, setExpandedSummaries] = useState({});

  // Manual call logging modal
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [submittingManual, setSubmittingManual] = useState(false);
  const [manualForm, setManualForm] = useState({
    status: "connected",
    duration: 30,
    disposition: "Interested",
    notes: "",
  });

  // Audio playback state
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);

  // Fetch call logs for this lead
  const fetchLeadCalls = useCallback(async () => {
    if (!leadId) return;
    try {
      setLoading(true);
      setError(null);
      const url = ENDPOINTS.TELEPHONY.LEAD_CALLS
        ? ENDPOINTS.TELEPHONY.LEAD_CALLS(leadId)
        : `${API_BASE_URL}/telephony/lead-calls/${leadId}`;

      const res = await axios.get(url);
      if (res.data?.success && res.data?.data) {
        setCallLogs(res.data.data.callLogs || []);
        setSummary(
          res.data.data.summary || {
            totalCalls: 0,
            connectedCalls: 0,
            notConnectedCalls: 0,
            totalTalkTime: 0,
            cloudCalls: 0,
            manualCalls: 0,
            repBreakdown: [],
          }
        );
      }
    } catch (err) {
      console.error("Error fetching lead call logs:", err);
      setError("Unable to load call logs. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    fetchLeadCalls();

    // Listen for real-time socket events
    const handleCallCompleted = (data) => {
      const targetPhoneClean = leadPhone ? String(leadPhone).replace(/\D/g, "").slice(-10) : "";
      const incomingPhoneClean = data?.callLog?.leadPhone
        ? String(data.callLog.leadPhone).replace(/\D/g, "").slice(-10)
        : "";

      if (
        data?.leadId === leadId ||
        (targetPhoneClean && incomingPhoneClean && targetPhoneClean === incomingPhoneClean)
      ) {
        fetchLeadCalls();
      }
    };

    const handleCallSummarized = (data) => {
      if (data?.callLogId) {
        setCallLogs((prev) =>
          prev.map((log) => {
            if ((log._id || log.id) === data.callLogId) {
              return {
                ...log,
                aiSummary: data.aiSummary,
                aiAnalysisStatus: "completed",
              };
            }
            return log;
          })
        );
        setSummarizingIds((prev) => ({ ...prev, [data.callLogId]: false }));
        // Automatically expand the freshly summarized call
        setExpandedSummaries((prev) => ({ ...prev, [data.callLogId]: true }));
      }
    };

    socket.on("call_completed", handleCallCompleted);
    socket.on("call_summarized", handleCallSummarized);

    return () => {
      socket.off("call_completed", handleCallCompleted);
      socket.off("call_summarized", handleCallSummarized);
    };
  }, [leadId, leadPhone, fetchLeadCalls]);

  // Trigger On-Demand AI Summarization
  const handleSummarizeCall = async (callLogId) => {
    if (!callLogId) return;
    setSummarizingIds((prev) => ({ ...prev, [callLogId]: true }));
    try {
      const url = ENDPOINTS.TELEPHONY.SUMMARIZE_CALL
        ? ENDPOINTS.TELEPHONY.SUMMARIZE_CALL(callLogId)
        : `${API_BASE_URL}/telephony/call-logs/${callLogId}/summarize`;

      const res = await axios.post(url);
      if (res.data?.success) {
        const summaryText = res.data.data?.aiSummary || "";
        setCallLogs((prev) =>
          prev.map((log) => {
            if ((log._id || log.id) === callLogId) {
              return {
                ...log,
                aiSummary: summaryText,
                aiAnalysisStatus: "completed",
              };
            }
            return log;
          })
        );
        setExpandedSummaries((prev) => ({ ...prev, [callLogId]: true }));
      }
    } catch (err) {
      console.error("Error summarizing call:", err);
      alert(
        err.response?.data?.message ||
          "Failed to summarize call. Please ensure your Gemini API key is configured."
      );
    } finally {
      setSummarizingIds((prev) => ({ ...prev, [callLogId]: false }));
    }
  };

  // Toggle audio playback
  const togglePlayAudio = (url) => {
    if (currentlyPlaying === url) {
      setCurrentlyPlaying(null);
    } else {
      setCurrentlyPlaying(url);
    }
  };

  // Submit manual normal call
  const handleManualCallSubmit = async (e) => {
    e.preventDefault();
    if (!leadId) return;
    setSubmittingManual(true);
    try {
      const payload = {
        leadId,
        leadPhone: lead?.phone || "",
        leadName: lead?.name || "Direct Contact",
        status: manualForm.status,
        duration: parseInt(manualForm.duration) || 0,
        disposition: manualForm.disposition,
        notes: manualForm.notes,
        timestamp: new Date().toISOString(),
      };

      await axios.post(ENDPOINTS.TELEPHONY.MANUAL_CALL_LOG, payload);
      setIsManualModalOpen(false);
      setManualForm({
        status: "connected",
        duration: 30,
        disposition: "Interested",
        notes: "",
      });
      fetchLeadCalls();
    } catch (err) {
      console.error("Error logging manual call:", err);
      alert("Failed to log normal call. Please try again.");
    } finally {
      setSubmittingManual(false);
    }
  };

  return (
    <div className="bg-brand-light border border-brand-secondary rounded-2xl shadow-sm overflow-hidden mb-6">
      {/* Header & Quick Action */}
      <div className="p-5 border-b border-brand-secondary/60 bg-brand-light flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-600/10 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0 mt-0.5 border border-violet-500/20">
            <PhoneCall size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-base text-brand-primary">
                Call Engagement & Rep Activity
              </h3>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                {summary.totalCalls} {summary.totalCalls === 1 ? "Call" : "Total Calls"}
              </span>
            </div>
            <p className="text-xs text-brand-primary/60 mt-0.5">
              Tracks both Cloud (TeleCMI) and Normal phone calls, with rep-level attempt metrics and on-demand AI summaries.
            </p>
          </div>
        </div>

        {/* Action Button: Log Normal / Manual Call */}
        <button
          type="button"
          onClick={() => setIsManualModalOpen(true)}
          className="px-3.5 py-2 bg-brand-light hover:bg-brand-secondary/20 text-brand-primary border border-brand-secondary rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-2 shrink-0 cursor-pointer justify-center"
        >
          <Plus size={14} className="text-violet-600" />
          <span>Log Normal Call</span>
        </button>
      </div>

      {/* Rep Breakdown & Overall KPI Summary */}
      <div className="p-5 bg-brand-secondary/5 border-b border-brand-secondary/40 space-y-4">
        {/* KPI Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white/70 dark:bg-white/5 p-3 rounded-xl border border-brand-secondary/40">
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-primary/60 block">
              Total Contact Attempts
            </span>
            <span className="text-lg font-bold text-brand-primary mt-0.5 block">
              {summary.totalCalls}
            </span>
            <span className="text-[10px] text-brand-primary/50 block">
              {summary.cloudCalls} Cloud · {summary.manualCalls} Normal
            </span>
          </div>

          <div className="bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/20">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
              Connected Calls
            </span>
            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
              {summary.connectedCalls}
            </span>
            <span className="text-[10px] text-emerald-600/70 block">
              {summary.totalCalls > 0
                ? `${Math.round((summary.connectedCalls / summary.totalCalls) * 100)}% connection rate`
                : "No calls yet"}
            </span>
          </div>

          <div className="bg-red-500/5 p-3 rounded-xl border border-red-500/20">
            <span className="text-[10px] font-bold uppercase tracking-wider text-red-500 block">
              Not Connected / Missed
            </span>
            <span className="text-lg font-bold text-red-500 mt-0.5 block">
              {summary.notConnectedCalls}
            </span>
            <span className="text-[10px] text-red-500/70 block">
              Unanswered or busy attempts
            </span>
          </div>

          <div className="bg-violet-500/5 p-3 rounded-xl border border-violet-500/20">
            <span className="text-[10px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400 block">
              Total Talk Time
            </span>
            <span className="text-lg font-bold text-violet-700 dark:text-violet-300 mt-0.5 block">
              {formatSeconds(summary.totalTalkTime)}
            </span>
            <span className="text-[10px] text-violet-600/70 block">
              Cumulative conversation time
            </span>
          </div>
        </div>

        {/* Sales Rep Call Tracker (How many times each rep called this lead) */}
        <div>
          <div className="flex items-center gap-2 mb-2.5">
            <User size={14} className="text-brand-primary/60" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-primary/70">
              Sales Rep Call Activity to this Lead
            </h4>
          </div>

          {summary.repBreakdown && summary.repBreakdown.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {summary.repBreakdown.map((rep, idx) => (
                <div
                  key={idx}
                  className="bg-white dark:bg-white/5 border border-brand-secondary/60 rounded-xl p-3 flex items-center justify-between gap-3 shadow-xs hover:border-violet-500/40 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-violet-600/10 text-violet-600 dark:text-violet-400 font-bold text-xs flex items-center justify-center shrink-0 border border-violet-500/20">
                      {rep.name ? rep.name.charAt(0).toUpperCase() : "R"}
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-brand-primary truncate block">
                        {rep.name}
                      </span>
                      <span className="text-[11px] text-brand-primary/60 block">
                        {rep.connected} Connected · {rep.notConnected} Missed
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-extrabold text-violet-600 dark:text-violet-400 block">
                      {rep.totalCalls} {rep.totalCalls === 1 ? "call" : "calls"}
                    </span>
                    <span className="text-[10px] font-medium text-brand-primary/50 block">
                      {formatSeconds(rep.totalTalkTime)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white/50 dark:bg-white/5 border border-dashed border-brand-secondary/60 rounded-xl p-3 text-center text-xs text-brand-primary/60">
              No sales representative calls recorded for this lead yet.
            </div>
          )}
        </div>
      </div>

      {/* Call History Timeline / List */}
      <div className="p-5">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <Clock size={15} className="text-brand-primary/60" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-primary/70">
              Detailed Call Logs & Recordings
            </h4>
          </div>
          <span className="text-xs text-brand-primary/50">
            {callLogs.length} {callLogs.length === 1 ? "entry" : "entries"}
          </span>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-brand-primary/60">
            <Loader2 size={24} className="animate-spin text-violet-600" />
            <span className="text-xs">Loading call records...</span>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={fetchLeadCalls}
              className="underline font-bold hover:text-red-600 cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : callLogs.length === 0 ? (
          <div className="py-10 border border-dashed border-brand-secondary/60 rounded-xl text-center">
            <div className="w-10 h-10 rounded-full bg-brand-secondary/20 text-brand-primary/50 flex items-center justify-center mx-auto mb-2">
              <PhoneOff size={18} />
            </div>
            <p className="text-xs font-bold text-brand-primary">No call logs found for this lead</p>
            <p className="text-[11px] text-brand-primary/60 mt-0.5">
              Cloud calls made via TeleCMI or normal calls logged will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {callLogs.map((log, index) => {
              const logId = log._id || log.id || index;
              const isConnected = log.status === "connected";
              const isCloud = log.callSource === "cloud_telecmi";
              const hasRecording = Boolean(log.recordingUrl);
              const isSummarizing = Boolean(summarizingIds[logId]);
              const hasSummary = Boolean(log.aiSummary);
              const isSummaryExpanded = Boolean(expandedSummaries[logId]);

              return (
                <div
                  key={logId}
                  className="bg-brand-secondary/5 border border-brand-secondary/40 rounded-xl p-4 transition-all hover:border-brand-secondary/80 shadow-xs"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    {/* Left: Call metadata */}
                    <div className="flex items-start sm:items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 ${
                          isConnected
                            ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                            : "bg-red-500/10 text-red-500 border border-red-500/20"
                        }`}
                      >
                        {isConnected ? <PhoneCall size={16} /> : <PhoneOff size={16} />}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-brand-primary">
                            {log.salespersonName || "Sales Representative"}
                          </span>

                          {/* Source badge */}
                          {isCloud ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                              ☁️ Cloud
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
                              📱 Normal
                            </span>
                          )}

                          {/* Status badge */}
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              isConnected
                                ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                : log.status === "busy"
                                ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                                : "bg-red-500/10 text-red-500 border border-red-500/20"
                            }`}
                          >
                            {log.status}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-brand-primary/60 mt-1 flex-wrap">
                          <span>{formatCallDate(log.timestamp || log.createdAt)}</span>
                          <span>•</span>
                          <span>
                            Talk Time:{" "}
                            <strong className="text-brand-primary">
                              {formatSeconds(log.talkTime || log.duration)}
                            </strong>
                          </span>
                          {log.disposition && (
                            <>
                              <span>•</span>
                              <span className="text-brand-primary/80 font-medium">
                                Disposition: {log.disposition}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Audio Player & Summarize Action */}
                    <div className="flex items-center gap-2.5 flex-wrap shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-brand-secondary/40">
                      {hasRecording ? (
                        <>
                          {/* Audio Player Controls */}
                          <div className="flex items-center gap-2 bg-white dark:bg-white/5 border border-brand-secondary/60 rounded-xl px-3 py-1.5 shadow-xs">
                            <audio
                              controls
                              src={log.recordingUrl}
                              className="h-7 w-48 sm:w-56"
                              preload="metadata"
                            />
                            <a
                              href={log.recordingUrl}
                              target="_blank"
                              rel="noreferrer"
                              download
                              title="Download audio recording"
                              className="p-1 text-brand-primary/60 hover:text-brand-primary hover:bg-brand-secondary/20 rounded-lg transition-colors cursor-pointer"
                            >
                              <Download size={14} />
                            </a>
                          </div>

                          {/* On-Demand Summarize Button */}
                          <button
                            type="button"
                            disabled={isSummarizing}
                            onClick={() => {
                              if (hasSummary) {
                                setExpandedSummaries((prev) => ({
                                  ...prev,
                                  [logId]: !prev[logId],
                                }));
                              } else {
                                handleSummarizeCall(logId);
                              }
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer ${
                              hasSummary
                                ? "bg-violet-600/10 hover:bg-violet-600/20 text-violet-600 dark:text-violet-400 border border-violet-500/30"
                                : "bg-violet-600 hover:bg-violet-700 text-white"
                            }`}
                          >
                            {isSummarizing ? (
                              <>
                                <Loader2 size={13} className="animate-spin" />
                                <span>Summarizing...</span>
                              </>
                            ) : hasSummary ? (
                              <>
                                <Sparkles size={13} className="text-violet-500" />
                                <span>{isSummaryExpanded ? "Hide Summary" : "View AI Summary"}</span>
                                {isSummaryExpanded ? (
                                  <ChevronUp size={13} />
                                ) : (
                                  <ChevronDown size={13} />
                                )}
                              </>
                            ) : (
                              <>
                                <Sparkles size={13} />
                                <span>Summarize Call</span>
                              </>
                            )}
                          </button>
                        </>
                      ) : (
                        <div className="text-[11px] text-brand-primary/40 italic px-2 py-1 bg-brand-secondary/10 rounded-lg">
                          No recording
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Notes if provided */}
                  {log.notes && (
                    <div className="mt-2.5 text-xs text-brand-primary/80 bg-white/50 dark:bg-white/5 p-2 rounded-lg border border-brand-secondary/30">
                      <span className="font-semibold text-brand-primary/60 mr-1">Notes:</span>
                      {log.notes}
                    </div>
                  )}

                  {/* AI Summary Expandable Box */}
                  {hasRecording && hasSummary && isSummaryExpanded && (
                    <div className="mt-3.5 pt-3.5 border-t border-brand-secondary/40 bg-white dark:bg-white/5 rounded-xl p-4 border border-violet-500/20 animate-fadeIn">
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-violet-700 dark:text-violet-300">
                          <Sparkles size={14} className="text-violet-500" />
                          <span>Gemini AI Call Intelligence</span>
                        </div>
                        <button
                          type="button"
                          disabled={isSummarizing}
                          onClick={() => handleSummarizeCall(logId)}
                          className="text-[11px] text-violet-600 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                          title="Re-run AI summarization"
                        >
                          <RotateCcw size={11} className={isSummarizing ? "animate-spin" : ""} />
                          <span>Re-summarize</span>
                        </button>
                      </div>

                      <div className="text-xs text-brand-primary leading-relaxed whitespace-pre-wrap font-sans">
                        {log.aiSummary}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Manual Normal Call Logging Modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-[120] p-4">
          <div className="bg-brand-light border border-brand-secondary rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-scaleUp">
            <div className="p-4 border-b border-brand-secondary flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Phone size={18} className="text-violet-600" />
                <h3 className="font-bold text-sm text-brand-primary">Log Normal / Offline Call</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsManualModalOpen(false)}
                className="p-1 rounded-lg text-brand-primary/60 hover:text-brand-primary hover:bg-brand-secondary/20 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleManualCallSubmit} className="p-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-brand-primary/70 mb-1">
                  Call Outcome / Status
                </label>
                <select
                  value={manualForm.status}
                  onChange={(e) => setManualForm({ ...manualForm, status: e.target.value })}
                  className="w-full text-xs rounded-xl bg-brand-light border border-brand-secondary text-brand-primary p-2.5 focus:border-violet-500 outline-none"
                >
                  <option value="connected">Connected (Talked with lead)</option>
                  <option value="not-connected">Not Answered / Ringing</option>
                  <option value="busy">Line Busy</option>
                  <option value="rejected">Call Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-primary/70 mb-1">
                  Talk Duration (in seconds)
                </label>
                <input
                  type="number"
                  min="0"
                  value={manualForm.duration}
                  onChange={(e) => setManualForm({ ...manualForm, duration: e.target.value })}
                  className="w-full text-xs rounded-xl bg-brand-light border border-brand-secondary text-brand-primary p-2.5 focus:border-violet-500 outline-none"
                  placeholder="e.g. 45"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-primary/70 mb-1">
                  Call Disposition
                </label>
                <select
                  value={manualForm.disposition}
                  onChange={(e) => setManualForm({ ...manualForm, disposition: e.target.value })}
                  className="w-full text-xs rounded-xl bg-brand-light border border-brand-secondary text-brand-primary p-2.5 focus:border-violet-500 outline-none"
                >
                  <option value="Interested">Interested / Follow-up Needed</option>
                  <option value="Demo Scheduled">Demo Scheduled</option>
                  <option value="Price Discussion">Price / Budget Discussion</option>
                  <option value="Not Interested">Not Interested</option>
                  <option value="Wrong Number">Wrong Number</option>
                  <option value="Callback Requested">Callback Requested</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-primary/70 mb-1">
                  Call Notes / Highlights
                </label>
                <textarea
                  rows={3}
                  value={manualForm.notes}
                  onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
                  placeholder="Summarize key points discussed during the phone call..."
                  className="w-full text-xs rounded-xl bg-brand-light border border-brand-secondary text-brand-primary p-2.5 focus:border-violet-500 outline-none resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-brand-primary/70 hover:text-brand-primary transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingManual}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {submittingManual ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Logging...</span>
                    </>
                  ) : (
                    <span>Save Call Log</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
