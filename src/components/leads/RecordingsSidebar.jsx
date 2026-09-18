import React, { useState, useEffect } from "react";
import {
  X,
  Phone,
  Upload,
  FileAudio,
  AlertCircle,
  CheckCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  RotateCcw,
  Mic,
} from "lucide-react";
import axios from "axios";
import { socket } from "../../utils/socket.js";
import { API_BASE_URL } from "../../utils/constants.js";
import { useLeads } from "../../context/LeadsContext.jsx";

const ENABLE_AI_AUDIO_ANALYSIS =
  import.meta.env.VITE_ENABLE_AI_AUDIO_ANALYSIS !== "false";

const getAudioUrl = (url) => {
  if (!url) return "";
  let fullUrl = url;
  if (!fullUrl.startsWith("http")) {
    fullUrl = `${API_BASE_URL.replace("/api", "")}${fullUrl}`;
  }
  // Prevent Mixed Content warning on HTTPS sites
  if (
    (typeof window !== "undefined" && window.location.protocol === "https:") ||
    fullUrl.includes("salesbuster.ai")
  ) {
    fullUrl = fullUrl.replace(/^http:\/\//i, "https://");
  }
  return fullUrl;
};

const formatMarkdownToHtml = (content) => {
  if (!content) return "";
  return content
    .replace(/\n/g, "<br/>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>");
};

export default function RecordingsSidebar({ lead, isOpen, onClose }) {
  const { setLeads } = useLeads();
  const id = lead?._id || lead?.id;

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [recordingTitle, setRecordingTitle] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [isUploadingRecording, setIsUploadingRecording] = useState(false);
  const [expandedRecordings, setExpandedRecordings] = useState({});
  const [analyzingRecordingIds, setAnalyzingRecordingIds] = useState({});
  const [copiedTranscriptId, setCopiedTranscriptId] = useState(null);

  useEffect(() => {
    if (!isOpen || !id) return;

    const handleRecordingAnalyzed = (data) => {
      if (data.leadId === id) {
        setLeads((prev) =>
          prev.map((l) => {
            if (l.id === id || l._id === id) {
              const updatedRecs = (l.recordings || []).map((r) => {
                if ((r._id || r.id) === data.recordingId) {
                  return {
                    ...r,
                    transcription: data.transcription,
                    analysis: data.analysis,
                    analysisStatus: data.analysisStatus,
                    analysisError: data.analysisError,
                  };
                }
                return r;
              });
              return { ...l, recordings: updatedRecs };
            }
            return l;
          }),
        );
        setAnalyzingRecordingIds((prev) => ({
          ...prev,
          [data.recordingId]: false,
        }));
      }
    };

    const handleRecordingUploaded = (data) => {
      if (data.leadId === id) {
        setLeads((prev) =>
          prev.map((l) => {
            if (l.id === id || l._id === id) {
              const existing = l.recordings || [];
              const exists = existing.some(
                (r) =>
                  (r._id || r.id) === (data.recording._id || data.recording.id),
              );
              return {
                ...l,
                recordings: exists ? existing : [...existing, data.recording],
              };
            }
            return l;
          }),
        );
      }
    };

    socket.on("recording_analyzed", handleRecordingAnalyzed);
    socket.on("recording_uploaded", handleRecordingUploaded);

    return () => {
      socket.off("recording_analyzed", handleRecordingAnalyzed);
      socket.off("recording_uploaded", handleRecordingUploaded);
    };
  }, [id, isOpen, setLeads]);

  // If sidebar is closed, don't render its heavy contents
  if (!isOpen || !lead) return null;

  const handleAudioFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      if (!recordingTitle) {
        setRecordingTitle(file.name.replace(/\.[^/.]+$/, ""));
      }
      setUploadError("");
    }
  };

  const handleUploadRecordingSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      setUploadError("Please select an audio file to upload.");
      return;
    }
    setIsUploadingRecording(true);
    setUploadError("");
    try {
      const uploadFormData = new FormData();
      uploadFormData.append("recording", uploadFile);
      if (recordingTitle.trim()) {
        uploadFormData.append("recordingName", recordingTitle.trim());
      }

      const response = await axios.post(
        `${API_BASE_URL}/leads/${id}/recordings`,
        uploadFormData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

      const newRec = response.data?.data;
      if (newRec) {
        setExpandedRecordings((prev) => ({
          ...prev,
          [newRec._id || newRec.id]: true,
        }));
      }

      setUploadFile(null);
      setRecordingTitle("");
      setShowUploadModal(false);
    } catch (err) {
      console.error("Error uploading recording:", err);
      setUploadError(
        err.response?.data?.message ||
          "Failed to upload audio recording. Please try again.",
      );
    } finally {
      setIsUploadingRecording(false);
    }
  };

  const handleTriggerAnalysis = async (recordingId) => {
    setAnalyzingRecordingIds((prev) => ({ ...prev, [recordingId]: true }));
    try {
      await axios.post(
        `${API_BASE_URL}/leads/${id}/analyze-recording/${recordingId}`,
      );
    } catch (err) {
      console.error("Error triggering analysis:", err);
      setAnalyzingRecordingIds((prev) => ({ ...prev, [recordingId]: false }));
      alert("Failed to start analysis. Please try again.");
    }
  };

  const toggleRecording = (recId) => {
    setExpandedRecordings((prev) => ({
      ...prev,
      [recId]: !prev[recId],
    }));
  };

  const handleCopyTranscript = (recId, text) => {
    navigator.clipboard.writeText(text);
    setCopiedTranscriptId(recId);
    setTimeout(() => setCopiedTranscriptId(null), 2000);
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
        onClick={onClose}
      ></div>
      <aside className="fixed inset-y-0 right-0 w-full sm:w-[500px] lg:w-[600px] bg-brand-light z-[101] shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out border-l border-brand-secondary">
        <div className="p-4 border-b border-brand-secondary flex items-center justify-between bg-white shadow-sm shrink-0">
          <div>
            <h2 className="text-lg font-bold text-brand-primary flex items-center gap-2">
              <Phone size={18} className="text-violet-500" />
              Call Recordings & AI Analysis
            </h2>
            <p className="text-xs text-brand-primary/60 mt-0.5">
              {lead.name ? `Viewing recordings for ${lead.name}` : "Manage audio and transcripts"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-brand-secondary/20 hover:bg-brand-secondary/40 rounded-full text-brand-primary transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-brand-secondary/5">
          {ENABLE_AI_AUDIO_ANALYSIS && (
            <div className="bg-white border border-brand-secondary rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-brand-secondary bg-brand-light/50 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-brand-primary text-sm">
                    Recordings ({lead.recordings?.length || 0})
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowUploadModal(!showUploadModal)}
                  className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  {showUploadModal ? (
                    <>
                      <X size={14} /> Close
                    </>
                  ) : (
                    <>
                      <Upload size={14} /> Upload Audio
                    </>
                  )}
                </button>
              </div>

              {showUploadModal && (
                <div className="p-4 bg-violet-500/5 border-b border-brand-secondary/40 animate-fadeIn">
                  <form
                    onSubmit={handleUploadRecordingSubmit}
                    className="space-y-3"
                  >
                    <div className="flex items-center gap-2 text-xs font-bold text-violet-700">
                      <FileAudio size={16} />
                      Attach Call Recording
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-medium text-brand-primary/70 mb-1">
                          Audio File (.mp3, .wav, .m4a, .aac, .ogg, .awb, .amr)
                        </label>
                        <input
                          type="file"
                          accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.webm,.flac,.awb,.amr"
                          onChange={handleAudioFileChange}
                          className="w-full text-xs text-brand-primary file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-violet-600 file:text-white hover:file:bg-violet-700 file:cursor-pointer cursor-pointer border border-brand-secondary rounded-lg p-1 bg-brand-light"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-brand-primary/70 mb-1">
                          Call Label (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Initial Discovery Call"
                          value={recordingTitle}
                          onChange={(e) => setRecordingTitle(e.target.value)}
                          className="w-full bg-brand-light border border-brand-secondary text-brand-primary text-xs rounded-lg px-2.5 py-1.5 outline-none focus:border-violet-500"
                        />
                      </div>
                    </div>
                    {uploadError && (
                      <div className="text-xs text-red-500 bg-red-500/10 p-2 rounded-md flex items-center gap-1.5">
                        <AlertCircle size={13} />
                        {uploadError}
                      </div>
                    )}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="submit"
                        disabled={isUploadingRecording || !uploadFile}
                        className="px-4 py-1.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        {isUploadingRecording ? (
                          <>
                            <Loader2 size={13} className="animate-spin" /> Uploading...
                          </>
                        ) : (
                          <>
                            <Upload size={13} /> Upload & Analyze
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div className="p-4 space-y-3.5 bg-white">
                {(!lead.recordings || lead.recordings.length === 0) && (
                  <div className="text-center py-7 border border-dashed border-brand-secondary/60 rounded-xl bg-brand-secondary/5">
                    <div className="w-10 h-10 rounded-full bg-violet-500/10 text-violet-500 flex items-center justify-center mx-auto mb-2">
                      <Mic size={18} />
                    </div>
                    <p className="text-xs font-semibold text-brand-primary">
                      No call recordings attached yet
                    </p>
                    <p className="text-[11px] text-brand-primary/60 mt-0.5">
                      Upload an audio recording to transcribe and analyze.
                    </p>
                  </div>
                )}

                {lead.recordings &&
                  lead.recordings.map((rec, index) => {
                    const recId = rec._id || rec.id || index;
                    const isExpanded = expandedRecordings[recId];
                    const isAnalyzing = analyzingRecordingIds[recId];
                    const isPending =
                      rec.analysisStatus === "pending" || isAnalyzing;
                    const isFailed = rec.analysisStatus === "failed";
                    const isCompleted = rec.analysisStatus === "completed";

                    let transcriptText = rec.transcription || "";
                    if (!transcriptText && rec.analysis) {
                      const match = rec.analysis.match(
                        /## (?:Call )?Transcription\s*([\s\S]*?)(?=\n## Short Summary|\n## Customer Requirements|\n## |$)/i,
                      );
                      if (match && match[1]) {
                        transcriptText = match[1].trim();
                      }
                    }

                    return (
                      <div
                        key={recId}
                        className="bg-brand-secondary/10 rounded-xl border border-brand-secondary/30 overflow-hidden transition-all shadow-sm"
                      >
                        <div
                          className="p-3.5 flex flex-wrap items-center justify-between gap-2 cursor-pointer hover:bg-brand-secondary/15 transition-colors"
                          onClick={() => toggleRecording(recId)}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {isExpanded ? (
                              <ChevronUp size={16} className="text-brand-primary shrink-0" />
                            ) : (
                              <ChevronDown size={16} className="text-brand-primary shrink-0" />
                            )}
                            <div className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-500 flex items-center justify-center shrink-0">
                              <FileAudio size={16} />
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-md text-brand-primary block truncate">
                                {rec.name || `Call Recording ${index + 1}`}
                              </span>
                              <span className="text-[13px] text-brand-primary/60 block">
                                {rec.uploadedAt ? new Date(rec.uploadedAt).toLocaleString() : "Uploaded"}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {isPending && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30 flex items-center gap-1 animate-pulse">
                                <Loader2 size={11} className="animate-spin" />
                                Processing
                              </span>
                            )}
                            {isCompleted && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 flex items-center gap-1">
                                <CheckCircle size={11} />
                                Analyzed
                              </span>
                            )}
                            {isFailed && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/15 text-red-500 border border-red-500/30 flex items-center gap-1">
                                <AlertCircle size={11} />
                                Failed
                              </span>
                            )}
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="p-4 pt-1 border-t border-brand-secondary/20 space-y-4 bg-white/50">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
                              <audio
                                controls
                                src={getAudioUrl(rec.url)}
                                className="w-full sm:flex-1 h-10 rounded-lg"
                              />
                              <div className="flex items-center gap-2 shrink-0">
                                {transcriptText && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCopyTranscript(recId, transcriptText);
                                    }}
                                    className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-brand-secondary/20 hover:bg-brand-secondary/30 text-brand-primary transition-all flex items-center gap-1.5 cursor-pointer"
                                  >
                                    {copiedTranscriptId === recId ? (
                                      <><Check size={13} className="text-emerald-500" /><span className="text-emerald-500">Copied!</span></>
                                    ) : (
                                      <><Copy size={13} /><span>Copy</span></>
                                    )}
                                  </button>
                                )}
                                <button
                                  type="button"
                                  disabled={isPending}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleTriggerAnalysis(recId);
                                  }}
                                  className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-violet-600/10 hover:bg-violet-600/20 text-violet-600 border border-violet-500/30 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                                >
                                  <RotateCcw size={13} className={isPending ? "animate-spin" : ""} />
                                  <span>{isPending ? "Running..." : "Re-Analyze"}</span>
                                </button>
                              </div>
                            </div>

                            {/* Analysis Display */}
                            {rec.analysis && (
                              <div className="bg-gradient-to-br from-violet-50 to-fuchsia-50 rounded-xl p-5 border border-violet-100 shadow-sm">
                                <h4 className="text-xs font-bold text-violet-700 flex items-center gap-1.5 mb-3 uppercase tracking-wider">
                                  <CheckCircle size={14} className="text-violet-500" />
                                  AI Sales Intelligence & Coaching
                                </h4>
                                <div className="prose prose-sm prose-violet max-w-none text-brand-primary prose-headings:font-bold prose-headings:text-violet-900 prose-a:text-violet-600 prose-li:marker:text-violet-400">
                                  <div
                                    dangerouslySetInnerHTML={{
                                      __html: formatMarkdownToHtml(rec.analysis),
                                    }}
                                  />
                                </div>
                              </div>
                            )}

                            {/* {transcriptText && (
                              <div className="bg-brand-light p-4 rounded-xl border border-brand-secondary/40">
                                <h4 className="text-xs font-bold text-brand-primary flex items-center gap-1.5 mb-3 uppercase tracking-wider">
                                  <Mic size={14} className="text-brand-primary/60" />
                                  Verbatim Transcript
                                </h4>
                                <div className="bg-white rounded-lg p-3 max-h-60 overflow-y-auto font-mono text-xs leading-relaxed text-brand-primary whitespace-pre-wrap select-text border border-brand-secondary/20 shadow-inner">
                                  {transcriptText}
                                </div>
                              </div>
                            )} */}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
