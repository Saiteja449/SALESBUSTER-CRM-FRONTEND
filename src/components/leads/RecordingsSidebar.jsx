import React, { useState, useEffect, useRef } from "react";
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
  Play,
  Pause,
  Volume2,
  VolumeX,
  Clock,
  Sparkles,
  User,
  Calendar,
  FastForward,
  Rewind,
  Search,
  FileText,
  AlertTriangle,
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

const formatSeconds = (sec) => {
  if (!sec || isNaN(sec) || !isFinite(sec)) return "00:00";
  const total = Math.floor(sec);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;
    return `${hours}:${remainingMins < 10 ? "0" : ""}${remainingMins}:${
      seconds < 10 ? "0" : ""
    }${seconds}`;
  }
  return `${minutes < 10 ? "0" : ""}${minutes}:${
    seconds < 10 ? "0" : ""
  }${seconds}`;
};

const formatDateTime = (dateString) => {
  if (!dateString) return "Date unknown";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Recent";
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  } catch {
    return "Recent";
  }
};

const formatMarkdownToHtml = (content) => {
  if (!content) return "";
  return content
    .replace(/\n/g, "<br/>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>");
};

const renderFormattedTranscript = (text) => {
  if (!text) return null;
  const lines = text.split("\n");
  return lines.map((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) {
      return <div key={idx} className="h-2" />;
    }
    const speakerMatch = trimmed.match(
      /^(Sales Rep(?:resentative)?|Customer|Client|Speaker \d+|Agent|Lead):\s*(.*)/i,
    );
    if (speakerMatch) {
      const speaker = speakerMatch[1];
      const speech = speakerMatch[2];
      const isRep = /sales rep|agent/i.test(speaker);
      return (
        <div key={idx} className="mb-2.5 text-xs leading-relaxed flex items-start gap-2">
          <span
            className={`inline-block shrink-0 font-bold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md mt-0.5 ${
              isRep
                ? "bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/25"
                : "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25"
            }`}
          >
            {speaker}
          </span>
          <span className="text-text-primary select-text">{speech}</span>
        </div>
      );
    }
    return (
      <p
        key={idx}
        className="text-xs text-text-primary/90 leading-relaxed mb-1.5 select-text font-sans"
      >
        {trimmed}
      </p>
    );
  });
};

/**
 * Accessible Audio Player with custom playback controls, scrub slider,
 * rewind/forward 10s, speed multiplier (1x, 1.25x, 1.5x, 2x), and volume toggle.
 */
function AccessibleAudioPlayer({ src, recordingName }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [hasError, setHasError] = useState(false);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch((err) => {
        console.warn("Audio play prevented:", err);
      });
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0);
      setHasError(false);
    }
  };

  const handleSeek = (e) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const handleSkip = (seconds) => {
    if (!audioRef.current) return;
    const target = Math.min(Math.max(audioRef.current.currentTime + seconds, 0), duration || 9999);
    audioRef.current.currentTime = target;
    setCurrentTime(target);
  };

  const cyclePlaybackRate = () => {
    const rates = [1, 1.25, 1.5, 2];
    const nextIndex = (rates.indexOf(playbackRate) + 1) % rates.length;
    const nextRate = rates[nextIndex];
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    const nextMuted = !isMuted;
    audioRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  if (hasError) {
    return (
      <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/25 text-red-600 dark:text-red-400 text-xs flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <AlertCircle size={15} className="shrink-0" />
          <span>Audio file could not be loaded from server.</span>
        </div>
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="underline font-semibold hover:text-red-700 dark:hover:text-red-300"
        >
          Open direct link
        </a>
      </div>
    );
  }

  return (
    <div className="bg-bg-card rounded-xl border border-border-main p-3.5 shadow-sm space-y-3">
      {/* Hidden native audio element */}
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
        }}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onError={() => setHasError(true)}
        className="hidden"
      />

      {/* Progress slider bar & timestamps */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[11px] font-mono text-text-secondary px-0.5">
          <span>{formatSeconds(currentTime)}</span>
          <span>{duration > 0 ? formatSeconds(duration) : "--:--"}</span>
        </div>
        <input
          type="range"
          min="0"
          max={duration || 100}
          step="0.1"
          value={currentTime}
          onChange={handleSeek}
          disabled={duration === 0}
          aria-label={`Playback scrub for ${recordingName || "recording"}`}
          aria-valuemin="0"
          aria-valuemax={duration || 100}
          aria-valuenow={currentTime}
          aria-valuetext={`${formatSeconds(currentTime)} of ${formatSeconds(duration)}`}
          className="w-full h-1.5 bg-bg-secondary rounded-lg appearance-none cursor-pointer accent-purple-600 dark:accent-purple-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pilot-blue"
        />
      </div>

      {/* Controls row */}
      <div className="flex items-center justify-between gap-2 pt-1">
        {/* Playback speed multiplier */}
        <button
          type="button"
          onClick={cyclePlaybackRate}
          className="px-2 py-1 rounded-md text-xs font-semibold bg-bg-secondary hover:bg-bg-secondary/80 text-text-secondary hover:text-text-primary border border-border-main transition-colors focus-visible:ring-2 focus-visible:ring-pilot-blue focus-visible:outline-none"
          title="Change playback speed"
          aria-label={`Playback speed: ${playbackRate}x. Click to change.`}
        >
          {playbackRate}x
        </button>

        {/* Primary playback cluster */}
        <div className="flex items-center gap-2">
          {/* Rewind 10s */}
          <button
            type="button"
            onClick={() => handleSkip(-10)}
            className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-colors focus-visible:ring-2 focus-visible:ring-pilot-blue focus-visible:outline-none"
            title="Rewind 10 seconds"
            aria-label="Rewind 10 seconds"
          >
            <Rewind size={16} />
          </button>

          {/* Play/Pause Button */}
          <button
            type="button"
            onClick={togglePlay}
            className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-purple-500/20 hover:opacity-90 active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-pilot-blue focus-visible:outline-none"
            title={isPlaying ? "Pause audio (Space)" : "Play audio (Space)"}
            aria-label={isPlaying ? "Pause audio" : "Play audio"}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
          </button>

          {/* Forward 10s */}
          <button
            type="button"
            onClick={() => handleSkip(10)}
            className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-colors focus-visible:ring-2 focus-visible:ring-pilot-blue focus-visible:outline-none"
            title="Fast forward 10 seconds"
            aria-label="Fast forward 10 seconds"
          >
            <FastForward size={16} />
          </button>
        </div>

        {/* Mute / Unmute Toggle */}
        <button
          type="button"
          onClick={toggleMute}
          className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-colors focus-visible:ring-2 focus-visible:ring-pilot-blue focus-visible:outline-none"
          title={isMuted ? "Unmute audio" : "Mute audio"}
          aria-label={isMuted ? "Unmute audio" : "Mute audio"}
        >
          {isMuted ? <VolumeX size={16} className="text-red-500" /> : <Volume2 size={16} />}
        </button>
      </div>
    </div>
  );
}

export default function RecordingsSidebar({
  lead,
  isOpen,
  onClose,
  initialRepFilter = null,
}) {
  const { setLeads } = useLeads();
  const id = lead?._id || lead?.id;

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [recordingTitle, setRecordingTitle] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [isUploadingRecording, setIsUploadingRecording] = useState(false);
  const [expandedRecordings, setExpandedRecordings] = useState({});
  const [expandedTranscripts, setExpandedTranscripts] = useState({});
  const [analyzingRecordingIds, setAnalyzingRecordingIds] = useState({});
  const [copiedTranscriptId, setCopiedTranscriptId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRepFilter, setSelectedRepFilter] = useState(initialRepFilter);

  useEffect(() => {
    setSelectedRepFilter(initialRepFilter);
  }, [initialRepFilter]);

  const closeBtnRef = useRef(null);

  // Keyboard navigation & body scroll lock
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Set focus to close button upon open for keyboard users
    setTimeout(() => {
      closeBtnRef.current?.focus();
    }, 100);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  // Real-time WebSocket subscriptions for recordings
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
      if (String(data.leadId) === String(id)) {
        const recItem = data.recording || data.newRecording;
        if (!recItem) return;
        setLeads((prev) =>
          prev.map((l) => {
            if (String(l.id || l._id) === String(id)) {
              const existing = l.recordings || [];
              const exists = existing.some(
                (r) =>
                  String(r._id || r.id) === String(recItem._id || recItem.id),
              );
              return {
                ...l,
                recordings: exists ? existing : [...existing, recItem],
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

  // If sidebar is closed or lead is missing, don't render
  if (!isOpen || !lead) return null;

  const recordings = lead.recordings || [];

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
          "Failed to upload audio recording. Please verify the file format and size, then try again.",
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
      alert("Failed to start analysis. Please check network connection and try again.");
    }
  };

  const toggleRecording = (recId) => {
    setExpandedRecordings((prev) => ({
      ...prev,
      [recId]: !prev[recId],
    }));
  };

  const toggleTranscript = (recId) => {
    setExpandedTranscripts((prev) => ({
      ...prev,
      [recId]: !prev[recId],
    }));
  };

  const handleCopyTranscript = (recId, text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedTranscriptId(recId);
    setTimeout(() => setCopiedTranscriptId(null), 2000);
  };

  // Filter recordings by search query and optional sales rep filter
  const filteredRecordings = recordings.filter((rec, idx) => {
    if (selectedRepFilter) {
      const repFilterStr = String(selectedRepFilter).toLowerCase();
      const matchRepId =
        rec.salespersonId && String(rec.salespersonId).toLowerCase() === repFilterStr;
      const matchRepName =
        rec.salespersonName &&
        rec.salespersonName.toLowerCase() === repFilterStr;
      if (!matchRepId && !matchRepName) return false;
    }

    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const nameMatch = (rec.name || `Call Recording ${idx + 1}`)
      .toLowerCase()
      .includes(query);
    const transcriptMatch = (rec.transcription || "")
      .toLowerCase()
      .includes(query);
    const analysisMatch = (rec.analysis || "").toLowerCase().includes(query);
    return nameMatch || transcriptMatch || analysisMatch;
  });

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Container */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="recordings-drawer-title"
        className="relative w-full sm:max-w-xl md:max-w-2xl bg-bg-card border-l border-border-main text-text-primary shadow-2xl flex flex-col h-screen h-[100dvh] z-10 animate-in slide-in-from-right duration-300"
      >
        {/* Drawer Header */}
        <div className="px-5 py-4 border-b border-border-main bg-bg-card/95 backdrop-blur-md flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-500/20 shrink-0">
              <Phone size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 id="recordings-drawer-title" className="text-base font-bold text-text-primary truncate">
                  Call Recordings & AI Intelligence
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 shrink-0">
                  {recordings.length} {recordings.length === 1 ? "call" : "calls"}
                </span>
              </div>
              {/* Context chip: Lead Name, phone & representative */}
              <div className="flex items-center gap-2 text-xs text-text-secondary mt-0.5 truncate">
                <span className="font-semibold text-text-primary truncate">
                  {lead.name || "Unnamed Lead"}
                </span>
                {lead.phone && (
                  <>
                    <span className="text-border-main">•</span>
                    <a
                      href={`tel:${lead.phone}`}
                      className="hover:text-purple-600 dark:hover:text-purple-400 hover:underline flex items-center gap-1 shrink-0"
                      title={`Call ${lead.phone}`}
                    >
                      {lead.phone}
                    </a>
                  </>
                )}
                {lead.assignedTo && (
                  <>
                    <span className="text-border-main">•</span>
                    <span className="inline-flex items-center gap-1 text-[11px] text-text-secondary shrink-0">
                      <User size={11} />
                      {typeof lead.assignedTo === "object"
                        ? lead.assignedTo.name
                        : "Assigned Rep"}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            className="p-2.5 rounded-xl bg-bg-secondary hover:bg-bg-secondary/80 text-text-secondary hover:text-text-primary transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-pilot-blue focus-visible:outline-none shrink-0"
            aria-label="Close recordings drawer"
            title="Close recordings drawer (Esc)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Action Bar: Search & Upload CTA */}
        <div className="p-4 border-b border-border-main bg-bg-secondary/40 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="relative flex-1 min-w-[180px]">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search recordings, transcripts, insights..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-bg-card border border-border-main rounded-lg text-text-primary placeholder:text-text-secondary/60 focus:border-purple-500 focus-visible:ring-1 focus-visible:ring-purple-500 focus-visible:outline-none"
              aria-label="Search recordings and transcripts"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary p-0.5"
                aria-label="Clear search query"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {selectedRepFilter && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/15 text-purple-600 dark:text-purple-300 border border-purple-500/30 text-xs font-semibold">
              <User size={12} />
              <span>Rep: {selectedRepFilter}</span>
              <button
                type="button"
                onClick={() => setSelectedRepFilter(null)}
                className="hover:opacity-80 p-0.5 cursor-pointer"
                title="Clear rep filter"
                aria-label="Clear rep filter"
              >
                <X size={12} />
              </button>
            </div>
          )}

          {ENABLE_AI_AUDIO_ANALYSIS && (
            <button
              type="button"
              onClick={() => setShowUploadModal(!showUploadModal)}
              className="px-3 py-1.5 bg-gradient-to-tr from-purple-600 to-indigo-600 hover:opacity-95 text-white rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-pilot-blue focus-visible:outline-none shrink-0"
              aria-expanded={showUploadModal}
              aria-controls="upload-recording-panel"
            >
              {showUploadModal ? (
                <>
                  <X size={14} /> Cancel Upload
                </>
              ) : (
                <>
                  <Upload size={14} /> Upload Audio
                </>
              )}
            </button>
          )}
        </div>

        {/* Upload Drawer Panel */}
        {showUploadModal && (
          <div
            id="upload-recording-panel"
            className="p-4 border-b border-border-main bg-purple-500/5 dark:bg-purple-950/20 animate-in fade-in slide-in-from-top-2 duration-200"
          >
            <form onSubmit={handleUploadRecordingSubmit} className="space-y-3.5">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-700 dark:text-purple-300">
                <FileAudio size={16} />
                Attach Call Recording File
              </div>

              <div className="space-y-3">
                {/* Audio file input */}
                <div>
                  <label
                    htmlFor="recording-file-input"
                    className="block text-[11px] font-medium text-text-secondary mb-1"
                  >
                    Audio File (.mp3, .wav, .m4a, .aac, .ogg, .webm, .flac)
                  </label>
                  <input
                    id="recording-file-input"
                    type="file"
                    accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.webm,.flac,.awb,.amr"
                    onChange={handleAudioFileChange}
                    className="w-full text-xs text-text-primary file:mr-2.5 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700 file:cursor-pointer cursor-pointer border border-border-main rounded-lg p-1 bg-bg-card focus-visible:ring-2 focus-visible:ring-pilot-blue"
                  />
                  {uploadFile && (
                    <p className="text-[11px] text-text-secondary mt-1 flex items-center gap-1">
                      <CheckCircle size={12} className="text-emerald-500" />
                      Selected: <span className="font-medium text-text-primary">{uploadFile.name}</span> ({(uploadFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                </div>

                {/* Call Label input */}
                <div>
                  <label
                    htmlFor="recording-title-input"
                    className="block text-[11px] font-medium text-text-secondary mb-1"
                  >
                    Call Label or Description (Optional)
                  </label>
                  <input
                    id="recording-title-input"
                    type="text"
                    placeholder="e.g. Discovery Call - Pricing Discussion"
                    value={recordingTitle}
                    onChange={(e) => setRecordingTitle(e.target.value)}
                    className="w-full bg-bg-card border border-border-main text-text-primary text-xs rounded-lg px-3 py-2 outline-none focus:border-purple-500 focus-visible:ring-1 focus-visible:ring-purple-500"
                  />
                </div>
              </div>

              {uploadError && (
                <div
                  role="alert"
                  className="text-xs text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/20 p-2.5 rounded-lg flex items-start gap-2"
                >
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  <span>{uploadError}</span>
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  disabled={isUploadingRecording || !uploadFile}
                  className="px-4 py-2 bg-gradient-to-tr from-purple-600 to-indigo-600 hover:opacity-95 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-sm focus-visible:ring-2 focus-visible:ring-pilot-blue focus-visible:outline-none"
                >
                  {isUploadingRecording ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Uploading & Analyzing...
                    </>
                  ) : (
                    <>
                      <Upload size={14} /> Upload & Start AI Analysis
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-3 py-2 bg-bg-secondary hover:bg-bg-secondary/80 text-text-secondary hover:text-text-primary text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Recordings Scrollable Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Empty State */}
          {recordings.length === 0 && (
            <div className="text-center py-12 px-6 border border-dashed border-border-main rounded-2xl bg-bg-secondary/20">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto mb-3">
                <Mic size={24} />
              </div>
              <h3 className="text-sm font-bold text-text-primary mb-1">
                No Call Recordings Yet
              </h3>
              <p className="text-xs text-text-secondary max-w-sm mx-auto mb-4 leading-relaxed">
                Upload recorded sales conversations to generate automatic speech-to-text transcripts, buyer intent signals, and AI coaching insights.
              </p>
              {ENABLE_AI_AUDIO_ANALYSIS && (
                <button
                  type="button"
                  onClick={() => setShowUploadModal(true)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-pilot-blue"
                >
                  <Upload size={14} /> Upload First Recording
                </button>
              )}
            </div>
          )}

          {/* Search filtered empty state */}
          {recordings.length > 0 && filteredRecordings.length === 0 && (
            <div className="text-center py-8 border border-border-main rounded-xl bg-bg-secondary/20">
              <Search size={20} className="mx-auto text-text-secondary mb-2" />
              <p className="text-xs font-semibold text-text-primary">
                No recordings match "{searchQuery}"
              </p>
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="mt-2 text-xs text-purple-600 dark:text-purple-400 hover:underline font-semibold"
              >
                Clear search filter
              </button>
            </div>
          )}

          {/* Recordings list */}
          {filteredRecordings.map((rec, index) => {
            const recId = rec._id || rec.id || index;
            const isExpanded = !!expandedRecordings[recId];
            const isTranscriptExpanded = !!expandedTranscripts[recId];
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
                className="bg-bg-card rounded-xl border border-border-main overflow-hidden transition-all shadow-sm hover:border-purple-500/40"
              >
                {/* Card Header (Accordion toggle button) */}
                <button
                  type="button"
                  onClick={() => toggleRecording(recId)}
                  aria-expanded={isExpanded}
                  aria-controls={`recording-details-${recId}`}
                  className="w-full text-left p-3.5 flex items-center justify-between gap-3 hover:bg-bg-secondary/40 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-pilot-blue focus-visible:outline-none"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="text-text-secondary shrink-0">
                      {isExpanded ? (
                        <ChevronUp size={16} />
                      ) : (
                        <ChevronDown size={16} />
                      )}
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                      <FileAudio size={18} />
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-sm text-text-primary block truncate">
                        {rec.name || `Call Recording ${index + 1}`}
                      </span>
                      <div className="flex items-center gap-2 text-[11px] text-text-secondary mt-0.5 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar size={11} />
                          {formatDateTime(rec.uploadedAt)}
                        </span>
                        {rec.salespersonName && (
                          <span className="flex items-center gap-1 font-semibold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">
                            <User size={10} />
                            {rec.salespersonName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Multi-modal status badges */}
                  <div className="flex items-center gap-2 shrink-0">
                    {isPending && (
                      <span
                        className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1 animate-pulse"
                        title="AI transcription and analysis in progress"
                      >
                        <Loader2 size={11} className="animate-spin" />
                        Analyzing...
                      </span>
                    )}
                    {isCompleted && (
                      <span
                        className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1"
                        title="AI Analysis Complete"
                      >
                        <CheckCircle size={11} />
                        Analyzed
                      </span>
                    )}
                    {isFailed && (
                      <span
                        className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30 flex items-center gap-1"
                        title="Analysis failed. Click to re-try."
                      >
                        <AlertCircle size={11} />
                        Failed
                      </span>
                    )}
                  </div>
                </button>

                {/* Expanded Details Panel */}
                {isExpanded && (
                  <div
                    id={`recording-details-${recId}`}
                    className="p-4 pt-2 border-t border-border-main space-y-4 bg-bg-secondary/20"
                  >
                    {/* Audio Player */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1">
                          <Volume2 size={13} />
                          Audio Playback
                        </span>
                        {/* Re-Analyze Action */}
                        {ENABLE_AI_AUDIO_ANALYSIS && (
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTriggerAnalysis(recId);
                            }}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer focus-visible:ring-2 focus-visible:ring-pilot-blue"
                            title="Re-run AI audio analysis with Gemini"
                            aria-label="Re-run AI audio analysis"
                          >
                            <RotateCcw
                              size={12}
                              className={isPending ? "animate-spin" : ""}
                            />
                            <span>
                              {isPending
                                ? "Processing..."
                                : rec.analysis
                                  ? "Re-Analyze"
                                  : "Analyze Call"}
                            </span>
                          </button>
                        )}
                      </div>

                      <AccessibleAudioPlayer
                        src={getAudioUrl(rec.url)}
                        recordingName={rec.name}
                      />
                    </div>

                    {/* Pending State Banner */}
                    {isPending && (
                      <div
                        role="status"
                        className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2.5"
                      >
                        <Loader2 size={16} className="animate-spin text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold block">AI Analysis in Progress</span>
                          <span className="text-[11px] opacity-90">
                            Gemini is actively transcribing dialogue, identifying customer objections, and extracting actionable next steps. This updates in real-time.
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Failed State Banner */}
                    {isFailed && (
                      <div
                        role="alert"
                        className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/25 text-xs text-red-600 dark:text-red-400 flex items-start justify-between gap-2.5"
                      >
                        <div className="flex items-start gap-2.5">
                          <AlertTriangle size={16} className="shrink-0 mt-0.5 text-red-500" />
                          <div>
                            <span className="font-bold block">Audio Analysis Failed</span>
                            <span className="text-[11px] opacity-90">
                              {rec.analysisError ||
                                "Could not complete speech recognition or AI extraction. Click Retry to re-run the job."}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleTriggerAnalysis(recId)}
                          className="px-2.5 py-1 text-xs font-bold rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors shrink-0 cursor-pointer"
                        >
                          Retry
                        </button>
                      </div>
                    )}

                    {/* Verbatim Transcript Section */}
                    {transcriptText && (
                      <div className="bg-bg-card rounded-xl border border-border-main p-4 space-y-3 shadow-xs">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-text-primary flex items-center gap-1.5 uppercase tracking-wider">
                              <Mic size={14} className="text-purple-600 dark:text-purple-400" />
                              Call Transcript
                            </span>
                            <span className="text-[10px] font-semibold text-text-secondary bg-bg-secondary px-2 py-0.5 rounded-full">
                              Speech-to-Text
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyTranscript(recId, transcriptText);
                              }}
                              className="text-xs font-semibold text-text-secondary hover:text-text-primary flex items-center gap-1 px-2.5 py-1 rounded-lg bg-bg-secondary hover:bg-bg-secondary/80 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-pilot-blue"
                              title="Copy full transcript to clipboard"
                              aria-label="Copy transcript"
                            >
                              {copiedTranscriptId === recId ? (
                                <>
                                  <Check size={13} className="text-emerald-500" />
                                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy size={13} />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => toggleTranscript(recId)}
                              className="text-xs font-semibold text-text-secondary hover:text-text-primary flex items-center gap-1 px-2.5 py-1 rounded-lg bg-bg-secondary hover:bg-bg-secondary/80 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-pilot-blue"
                              aria-expanded={isTranscriptExpanded}
                              aria-label={isTranscriptExpanded ? "Collapse transcript" : "Expand transcript"}
                            >
                              {isTranscriptExpanded ? (
                                <>
                                  <ChevronUp size={13} /> Collapse
                                </>
                              ) : (
                                <>
                                  <ChevronDown size={13} /> Expand
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Collapsible Transcript Body */}
                        {isTranscriptExpanded ? (
                          <div className="bg-bg-secondary/30 rounded-lg p-3.5 max-h-72 overflow-y-auto border border-border-main text-left select-text space-y-1">
                            {renderFormattedTranscript(transcriptText)}
                          </div>
                        ) : (
                          <p className="text-xs text-text-secondary italic line-clamp-2 select-text">
                            "{transcriptText.slice(0, 180)}..."
                          </p>
                        )}
                      </div>
                    )}

                    {/* AI Analysis Display */}
                    {rec.analysis && (
                      <div className="bg-purple-500/5 dark:bg-purple-950/20 rounded-xl p-4 border border-purple-500/20 shadow-xs space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1.5 uppercase tracking-wider">
                            <Sparkles size={14} className="text-purple-600 dark:text-purple-400" />
                            AI Sales Intelligence & Coaching
                          </h4>
                          <span className="text-[10px] font-semibold text-purple-700 dark:text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-full">
                            Gemini Analysis
                          </span>
                        </div>
                        <div className="prose prose-sm max-w-none text-text-primary prose-headings:font-bold prose-headings:text-text-primary prose-strong:text-text-primary prose-a:text-purple-600 dark:prose-a:text-purple-400 leading-relaxed text-xs">
                          <div
                            dangerouslySetInnerHTML={{
                              __html: formatMarkdownToHtml(rec.analysis),
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>
    </div>
  );
}
