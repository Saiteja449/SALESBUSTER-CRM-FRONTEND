import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Phone,
  Mail,
  User,
  Calendar,
  CheckCircle,
  Plus,
  X,
  Circle,
  MapPin,
  MessageSquare,
  Building2,
  ChevronDown,
  ChevronUp,
  Upload,
  Mic,
  FileAudio,
  RotateCcw,
  Copy,
  Check,
  Loader2,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import axios from "axios";
import { API_BASE_URL, BACKEND_URL, ENABLE_AI_AUDIO_ANALYSIS } from "../utils/constants.js";
import { useLeads } from "../context/LeadsContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { formatDate, getServiceColor, getRepName } from "../utils/helpers.js";
import { socket } from "../utils/socket.js";
import DatePicker from "../components/DatePicker.jsx";

export default function LeadDetails() {
  const { allUsers, currentUser } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    leads,
    setLeads,
    updateLead,
    followups,
    addFollowup,
    toggleFollowupDone,
    activeServices,
    qualificationFields,
  } = useLeads();

  const currentLead = leads.find((l) => l.id === id);

  // Notes state
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState(currentLead?.notes || "");

  // Update Lead Details Form form data
  const [formData, setFormData] = useState({
    status: currentLead?.status || "New",
    service: currentLead?.service || "General Enquiry",
    nextFollowUp: currentLead?.nextFollowUp || "",
    appointmentDate: currentLead?.appointmentDate || "",
    appointmentTime: currentLead?.appointmentTime || "",
    assignedTo: currentLead?.assignedTo || "",
    importantLead: currentLead?.importantLead || false,
    comments: "",
  });

  // Keep state sync if lead switches or refreshes
  useEffect(() => {
    if (currentLead) {
      setFormData({
        status: currentLead.status || "New",
        service: currentLead.service || "General Enquiry",
        nextFollowUp: currentLead.nextFollowUp || "",
        appointmentDate: currentLead.appointmentDate || "",
        appointmentTime: currentLead.appointmentTime || "",
        assignedTo: currentLead.assignedTo || "",
        importantLead: currentLead.importantLead || false,
        comments: "",
      });
      setNotesText(currentLead.notes || "");
    }
  }, [currentLead]);

  // Add Followup Modal State
  const [followupOpen, setFollowupOpen] = useState(false);
  const [newFw, setNewFw] = useState({
    type: "Call",
    date: "2026-05-26",
    time: "11:00 AM",
    priority: "Medium",
    notes: "",
  });

  // Add Activity Modal State
  const [activityOpen, setActivityOpen] = useState(false);
  const [newAct, setNewAct] = useState({
    type: "Call Completed",
    content: "",
    author: currentUser?.name || "Alex Mercer",
  });

  const [followupType, setFollowupType] = useState("Call");

  const [expandedRecordings, setExpandedRecordings] = useState({});
  const toggleRecording = (id) => {
    setExpandedRecordings((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Audio Upload & Transcription Action States
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [recordingTitle, setRecordingTitle] = useState("");
  const [isUploadingRecording, setIsUploadingRecording] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [analyzingRecordingIds, setAnalyzingRecordingIds] = useState({});
  const [copiedTranscriptId, setCopiedTranscriptId] = useState(null);

  // Audio URL resolver
  const getAudioUrl = (url) => {
    if (!url) return "";

    const parts = url.split("/");
    let filename = parts[parts.length - 1];

    // Fully decode the filename to handle double-encoded cases (like %2520)
    try {
      while (filename !== decodeURIComponent(filename)) {
        filename = decodeURIComponent(filename);
      }
    } catch (e) {
      // Fallback in case of malformed URI components
    }

    // Encode it exactly once
    return `${BACKEND_URL}/uploads/${encodeURIComponent(filename)}`;
  };

  // Socket.IO real-time listener for transcription and audio upload events
  useEffect(() => {
    const handleRecordingAnalyzed = (data) => {
      if (data.leadId === id || data.leadId === currentLead?._id) {
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
      }
    };

    const handleRecordingUploaded = (data) => {
      if (data.leadId === id || data.leadId === currentLead?._id) {
        setLeads((prev) =>
          prev.map((l) => {
            if (l.id === id || l._id === id) {
              const existing = l.recordings || [];
              const exists = existing.some(
                (r) =>
                  (r._id || r.id) ===
                  (data.recording._id || data.recording.id),
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
  }, [id, currentLead?._id, setLeads]);

  // Handle file picker selection
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

  // Submit audio upload to POST /api/leads/:id/recordings
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

  // Trigger re-transcription / analysis for a recording
  const handleTriggerAnalysis = async (recId) => {
    setAnalyzingRecordingIds((prev) => ({ ...prev, [recId]: true }));
    try {
      setLeads((prev) =>
        prev.map((l) => {
          if (l.id === id || l._id === id) {
            const updated = (l.recordings || []).map((r) => {
              if ((r._id || r.id) === recId) {
                return { ...r, analysisStatus: "pending" };
              }
              return r;
            });
            return { ...l, recordings: updated };
          }
          return l;
        }),
      );

      await axios.post(
        `${API_BASE_URL}/leads/${id}/analyze-recording/${recId}`,
      );
    } catch (err) {
      console.error("Error triggering analysis:", err);
    } finally {
      setAnalyzingRecordingIds((prev) => ({ ...prev, [recId]: false }));
    }
  };

  // Copy transcript text to clipboard
  const handleCopyTranscript = (recId, text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedTranscriptId(recId);
    setTimeout(() => {
      setCopiedTranscriptId(null);
    }, 2500);
  };

  // Helper to render markdown sections nicely
  const formatMarkdownToHtml = (content) => {
    if (!content) return "";
    return content
      .replace(/\n/g, "<br/>")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>");
  };

  if (!currentLead) {
    return (
      <div className="p-4 text-center">
        <div className="bg-red-500/10 text-red-500 p-4 rounded-lg mb-4">
          Lead not found in the sales directory database.
        </div>
        <button
          onClick={() => navigate("/leads")}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-brand-primary rounded-lg hover:bg-blue-700 transition-colors mx-auto"
        >
          <ArrowLeft size={18} />
          Back to Directory
        </button>
      </div>
    );
  }

  const leadFollowups = followups.filter((f) => f.leadId === currentLead.id);

  const combinedHistory = leadFollowups
    .map((f) => {
      const scheduledD = new Date(f.date + "T" + (f.time || "00:00:00"));
      const creationDateStr = f.createdAt || new Date().toISOString();
      const creationD = new Date(creationDateStr);
      return {
        id: f.id,
        isFollowup: !f.done,
        type: f.type,
        priority: f.priority,
        rawDate: creationD.getTime(),
        scheduledDate: f.date,
        scheduledTime: f.time || "",
        notes: f.notes,
        author: f.author || currentLead.assignedTo || "System",
        createdAt: creationDateStr,
      };
    })
    .sort((a, b) => b.rawDate - a.rawDate);

  // Move Status directly
  const handleStatusChange = async (e) => {
    try {
      const nextStatus = e.target.value;
      await updateLead(
        currentLead.id,
        { status: nextStatus },
        currentUser?.name || "System",
      );
    } catch (error) {
      console.error(error);
      alert("Failed to update status");
    }
  };

  // Change assignee directly
  const handleAssigneeChange = async (e) => {
    try {
      const nextAssignee = e.target.value;
      await updateLead(
        currentLead.id,
        { assignedTo: nextAssignee },
        currentUser?.name || "System",
      );
    } catch (error) {
      console.error(error);
      alert("Failed to update assignee");
    }
  };

  // Handle lead form submit
  const handleUpdateLeadFormSubmit = async (e) => {
    e.preventDefault();

    if (formData.status === "Follow Up") {
      if (
        !formData.nextFollowUp ||
        !followupType ||
        !formData.comments.trim()
      ) {
        alert("Please supply a valid Follow Up Date, Type, and Comments.");
        return;
      }
    }

    const updatedFields = {
      status: formData.status,
      service: formData.service,
      nextFollowUp: formData.nextFollowUp,
      appointmentDate: formData.appointmentDate,
      appointmentTime: formData.appointmentTime,
      assignedTo: formData.assignedTo,
      importantLead: formData.importantLead,
    };

    const authorName = currentUser?.name || "System";

    try {
      await updateLead(currentLead.id, updatedFields, authorName);

      // If "Follow Up" is selected, automatically schedule a follow-up task
      if (formData.status === "Follow Up") {
        addFollowup({
          leadId: currentLead.id,
          leadName: currentLead.name,

          type: followupType,
          date: formData.nextFollowUp,
          time: formData.appointmentTime || "11:00 AM",
          priority: formData.importantLead ? "High" : "Medium",
          notes:
            formData.comments ||
            `Routine followup scheduled via ${followupType}`,
          author: authorName,
        });
      }

      // Reset local comments box after submitting
      setFormData((prev) => ({ ...prev, comments: "" }));
      alert("Customer lead records were updated successfully.");
      navigate("/leads");
    } catch (error) {
      console.error(error);
      alert("Failed to update lead records.");
    }
  };

  // Save general profile notes
  const handleSaveNotes = async () => {
    try {
      await updateLead(
        currentLead.id,
        { notes: notesText },
        currentUser?.name || "Alex Mercer",
      );
      setEditingNotes(false);
    } catch (error) {
      console.error(error);
      alert("Failed to save notes");
    }
  };

  // Save rescheduled follow up
  const handleSaveFollowup = async (e) => {
    e.preventDefault();
    if (!newFw.date || !newFw.type || !newFw.notes.trim()) {
      alert("Please supply a valid Follow Up Date, Type, and Notes.");
      return;
    }
    try {
      addFollowup({
        leadId: currentLead.id,
        leadName: currentLead.name,

        type: newFw.type,
        date: newFw.date,
        time: newFw.time,
        priority: newFw.priority,
        notes: newFw.notes,
        author: currentUser?.name || "Alex Mercer",
      });
      // Record as lead's next follow up date
      await updateLead(currentLead.id, { nextFollowUp: newFw.date });
      setFollowupOpen(false);
      setNewFw({
        type: "Call",
        date: "2026-05-26",
        time: "11:00 AM",
        priority: "Medium",
        notes: "",
      });
    } catch (error) {
      console.error(error);
      alert("Failed to update follow-up date");
    }
  };

  // Log active sales interaction
  const handleSaveActivity = (e) => {
    e.preventDefault();
    if (!newAct.content) {
      alert("Please provide the activity details content.");
      return;
    }
    // Changed to manual addFollowup for user-initiated activity logs from the modal
    addFollowup({
      leadId: currentLead.id,
      leadName: currentLead.name,
      type: newAct.type,
      date: new Date().toISOString().split("T")[0],
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      priority: "Low",
      notes: newAct.content,
      author: newAct.author,
      done: true,
    });
    setActivityOpen(false);
    setNewAct({
      type: "Call Completed",
      content: "",
      author: currentUser?.name || "Alex Mercer",
    });
  };

  const getStatusBg = (status) => {
    switch (status) {
      case "New":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "Follow Up":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "Not Interested":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "Converted":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      default:
        return "bg-brand-secondary/30 text-brand-primary border-brand-secondary";
    }
  };

  const getSourceBg = (source) => {
    if (source === "Website Chat") {
      return "bg-cyan-500/15 text-cyan-400 border-cyan-500/30 font-semibold";
    }
    return "bg-brand-secondary/30/50 text-brand-primary/70 border-brand-secondary";
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <button
        onClick={() => navigate("/leads")}
        className="flex items-center gap-2 text-brand-primary/70 hover:text-brand-primary transition-colors font-medium mb-2"
      >
        <ArrowLeft size={18} />
        Back to Customer List
      </button>

      <div className="flex flex-col gap-6">
        {/* 1. Lead Primary Profile Card */}
        <div className="bg-brand-light border border-brand-secondary rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-12 h-12 rounded-full bg-blue-600 text-brand-primary flex items-center justify-center font-bold text-xl shrink-0">
              {currentLead.name
                ? currentLead.name.substring(0, 1).toUpperCase()
                : "C"}
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-brand-primary truncate">
                {currentLead.name}
              </h2>
              <p className="text-sm text-brand-primary/70 truncate">
                Registered on {formatDate(currentLead.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            <span
              className={`px-2.5 py-1 rounded-md text-xs font-bold border ${getStatusBg(currentLead.status)}`}
            >
              {currentLead.status}
            </span>
            <span
              className="px-2.5 py-1 rounded-md text-xs font-bold text-white shadow-xs"
              style={{
                backgroundColor: getServiceColor(
                  currentLead.service || "General Enquiry",
                ),
              }}
            >
              {currentLead.service || "General Enquiry"}
            </span>
            <span
              className={`px-2.5 py-1 rounded-md text-xs font-medium border ${getSourceBg(currentLead.source)}`}
            >
              {currentLead.source}
            </span>
            {(currentLead.appointmentDate || currentLead.tags?.includes("Demo Booked")) && (
              <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                📅 Demo Booked{currentLead.appointmentDate ? `: ${currentLead.appointmentDate}` : ""} {currentLead.appointmentTime || ""}
              </span>
            )}
            <button
              type="button"
              onClick={() =>
                navigate("/whatsapp", {
                  state: { selectLeadId: currentLead.id },
                })
              }
              className="px-2.5 py-1 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 border border-purple-500/30 rounded-md text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
            >
              <MessageSquare size={14} />
              {currentLead.source === "Website Chat" ? "Open Chat History" : "Open WhatsApp Chat"}
            </button>
          </div>

          <hr className="border-brand-secondary mb-5" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="flex items-start gap-3">
              <Phone className="text-brand-primary/70 mt-0.5" size={18} />
              <div className="min-w-0">
                <span className="text-xs text-brand-primary/70 block mb-0.5">
                  Client Phone
                </span>
                <span className="text-sm font-semibold text-brand-primary truncate block">
                  {currentLead.phone}
                </span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="text-brand-primary/70 mt-0.5" size={18} />
              <div className="min-w-0">
                <span className="text-xs text-brand-primary/70 block mb-0.5">
                  Email Address
                </span>
                <span className="text-sm font-semibold text-brand-primary truncate block">
                  {currentLead.email || "No email profile"}
                </span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Building2 className="text-brand-primary/70 mt-0.5" size={18} />
              <div className="min-w-0">
                <span className="text-xs text-brand-primary/70 block mb-0.5">
                  Company
                </span>
                <span className="text-sm font-semibold text-brand-primary truncate block">
                  {currentLead.company || currentLead.aiQualification?.company || "Not specified"}
                </span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <User className="text-brand-primary/70 mt-0.5" size={18} />
              <div className="min-w-0">
                <span className="text-xs text-brand-primary/70 block mb-0.5">
                  Sales Representative
                </span>
                {currentUser?.role === "Sales Manager" ? (
                  <select
                    value={
                      allUsers.find(
                        (u) =>
                          u.id === currentLead.assignedTo ||
                          u.name?.toLowerCase() ===
                            String(currentLead.assignedTo).toLowerCase(),
                      )?.id ||
                      currentLead.assignedTo ||
                      ""
                    }
                    onChange={handleAssigneeChange}
                    className="bg-brand-light border border-brand-secondary text-sm font-semibold text-brand-primary rounded px-2 py-1 focus:outline-none focus:border-purple-500 cursor-pointer w-full max-w-[200px]"
                  >
                    <option value="Unassigned">Unassigned</option>
                    {allUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="text-sm font-semibold text-brand-primary truncate block">
                    {getRepName(currentLead.assignedTo, allUsers)}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="text-brand-primary/70 mt-0.5" size={18} />
              <div className="min-w-0">
                <span className="block text-xs text-brand-primary/70 mb-1">
                  Enquired On
                </span>
                <span className="text-sm font-semibold text-brand-primary truncate block">
                  {currentLead.joinedAt
                    ? formatDate(currentLead.joinedAt)
                    : "-"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Special Requirements & Logged Notes */}
        <div className="bg-brand-light border border-brand-secondary rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-brand-primary">
              Special Requirements & Logged Notes
            </h3>
            {editingNotes ? (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingNotes(false);
                    setNotesText(currentLead.notes || "");
                  }}
                  className="px-3 py-1 text-sm text-brand-primary/70 hover:text-brand-primary transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveNotes}
                  className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-brand-primary rounded-md transition-colors"
                >
                  Save
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditingNotes(true)}
                className="px-3 py-1 text-sm border border-brand-secondary text-brand-primary hover:bg-brand-secondary/30 rounded-md transition-colors"
              >
                Edit Notes
              </button>
            )}
          </div>

          {editingNotes ? (
            <textarea
              className="w-full bg-brand-light border border-brand-secondary text-brand-primary text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-3 min-h-[100px] outline-none"
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
            />
          ) : (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
              <p className="text-sm text-amber-600 dark:text-amber-400 italic whitespace-pre-wrap leading-relaxed">
                {currentLead.notes ||
                  "No operational context or requirements notes logged. Click 'Edit' to update."}
              </p>
            </div>
          )}
        </div>

        {/* AI Captured Details (Conditional) */}
        {currentLead.aiQualification &&
          Object.entries(currentLead.aiQualification).some(
            ([k, v]) =>
              !["_id", "__v", "id"].includes(k) &&
              v !== undefined &&
              v !== null &&
              v !== "",
          ) && (
          <div className="bg-brand-light border border-purple-500/30 rounded-xl shadow-sm overflow-hidden mb-6">
            <div className="p-4 border-b border-purple-500/20 bg-purple-500/5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
                <h3 className="font-bold text-purple-600">AI Captured Lead Specifications</h3>
                <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded bg-purple-500/10 text-purple-600">
                  Auto-extracted
                </span>
              </div>
            </div>
            <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Product / Service Intent */}
              {(currentLead.aiQualification?.intent || currentLead.service) && (
                <div className="bg-purple-500/10 p-3 rounded-lg border border-purple-500/30">
                  <span className="text-[10px] uppercase font-bold text-purple-600 block mb-1">
                    Service / Product Line
                  </span>
                  <span className="text-sm font-bold text-purple-700">
                    {currentLead.service || currentLead.aiQualification?.intent}
                  </span>
                </div>
              )}

              {/* Dynamic Organization Qualification Fields */}
              {qualificationFields && qualificationFields.length > 0 ? (
                qualificationFields.map((f) => {
                  const val = currentLead.aiQualification?.[f.key];
                  if (val === undefined || val === null || val === "") return null;
                  return (
                    <div
                      key={f.key}
                      className="bg-brand-secondary/10 p-3 rounded-lg border border-brand-secondary/30"
                    >
                      <span className="text-[10px] uppercase font-bold text-brand-primary/60 block mb-1">
                        {f.label || f.key}
                      </span>
                      <span className="text-sm font-semibold text-brand-primary">
                        {String(val)}
                      </span>
                    </div>
                  );
                })
              ) : (
                /* Fallback for unconfigured schemas */
                Object.entries(currentLead.aiQualification)
                  .filter(
                    ([k, v]) =>
                      ![
                        "intent",
                        "city",
                        "preferredCallDate",
                        "preferredCallTime",
                        "preferredVisitDate",
                        "issueDescription",
                        "urgency",
                        "interestScore",
                        "_id",
                        "__v",
                        "id",
                      ].includes(k) &&
                      v !== undefined &&
                      v !== null &&
                      v !== "",
                  )
                  .map(([key, val]) => (
                    <div
                      key={key}
                      className="bg-brand-secondary/10 p-3 rounded-lg border border-brand-secondary/30"
                    >
                      <span className="text-[10px] uppercase font-bold text-brand-primary/60 block mb-1">
                        {key.replace(/([A-Z])/g, " $1")}
                      </span>
                      <span className="text-sm font-semibold text-brand-primary">
                        {String(val)}
                      </span>
                    </div>
                  ))
              )}

              {/* Extra attributes in aiQualification not covered by schema */}
              {qualificationFields &&
                qualificationFields.length > 0 &&
                Object.entries(currentLead.aiQualification)
                  .filter(
                    ([k, v]) =>
                      ![
                        "intent",
                        "city",
                        "preferredCallDate",
                        "preferredCallTime",
                        "preferredVisitDate",
                        "issueDescription",
                        "urgency",
                        "interestScore",
                        "_id",
                        "__v",
                        "id",
                        ...qualificationFields.map((f) => f.key),
                      ].includes(k) &&
                      v !== undefined &&
                      v !== null &&
                      v !== "",
                  )
                  .map(([key, val]) => (
                    <div
                      key={key}
                      className="bg-brand-secondary/10 p-3 rounded-lg border border-brand-secondary/30"
                    >
                      <span className="text-[10px] uppercase font-bold text-brand-primary/60 block mb-1">
                        {key.replace(/([A-Z])/g, " $1")}
                      </span>
                      <span className="text-sm font-semibold text-brand-primary">
                        {String(val)}
                      </span>
                    </div>
                  ))}

              {/* Standard Attributes */}
              {currentLead.aiQualification?.preferredCallDate && (
                <div className="bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/30 col-span-2">
                  <span className="text-[10px] uppercase font-bold text-emerald-600 block mb-1">
                    Requested Callback Time
                  </span>
                  <span className="text-sm font-bold text-emerald-700">
                    {currentLead.aiQualification.preferredCallDate}{" "}
                    {currentLead.aiQualification.preferredCallTime}
                  </span>
                </div>
              )}
              {currentLead.aiQualification?.preferredVisitDate && (
                <div className="bg-brand-secondary/10 p-3 rounded-lg border border-brand-secondary/30">
                  <span className="text-[10px] uppercase font-bold text-brand-primary/60 block mb-1">
                    Site Visit Date
                  </span>
                  <span className="text-sm font-semibold text-brand-primary">
                    {currentLead.aiQualification.preferredVisitDate}
                  </span>
                </div>
              )}
              {currentLead.aiQualification?.city && (
                <div className="bg-brand-secondary/10 p-3 rounded-lg border border-brand-secondary/30">
                  <span className="text-[10px] uppercase font-bold text-brand-primary/60 block mb-1">
                    Location / City
                  </span>
                  <span className="text-sm font-semibold text-brand-primary capitalize">
                    {currentLead.aiQualification.city}
                  </span>
                </div>
              )}
              {currentLead.aiQualification?.issueDescription && (
                <div className="bg-brand-secondary/10 p-3 rounded-lg border border-brand-secondary/30 col-span-2">
                  <span className="text-[10px] uppercase font-bold text-brand-primary/60 block mb-1">
                    Requirement Summary
                  </span>
                  <span className="text-sm font-semibold text-brand-primary">
                    {currentLead.aiQualification.issueDescription}
                  </span>
                </div>
              )}
              {currentLead.aiQualification?.urgency && (
                <div className="bg-brand-secondary/10 p-3 rounded-lg border border-brand-secondary/30">
                  <span className="text-[10px] uppercase font-bold text-brand-primary/60 block mb-1">
                    Urgency
                  </span>
                  <span className="text-sm font-semibold text-brand-primary capitalize">
                    {currentLead.aiQualification.urgency}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2.5 Call Recordings & AI Transcription Section */}
        {ENABLE_AI_AUDIO_ANALYSIS && (
          <div className="bg-brand-light border border-brand-secondary rounded-xl shadow-sm mb-6 overflow-hidden">
            <div className="p-4 border-b border-brand-secondary bg-brand-light/50 rounded-t-xl flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-500 flex items-center justify-center shrink-0">
                  <Phone size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-brand-primary flex items-center gap-2 text-sm">
                    Call Recordings & AI Transcription
                    {currentLead.recordings && currentLead.recordings.length > 0 && (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-500 border border-violet-500/20">
                        {currentLead.recordings.length}{" "}
                        {currentLead.recordings.length === 1
                          ? "recording"
                          : "recordings"}
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] text-brand-primary/60">
                    Audio recordings, speech-to-text transcriptions, and sales intelligence analysis
                  </p>
                </div>
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
                    <Upload size={14} /> Upload Call Audio
                  </>
                )}
              </button>
            </div>

            {/* Audio Upload Form Drawer */}
            {showUploadModal && (
              <div className="p-4 bg-violet-500/5 border-b border-brand-secondary/40 animate-fadeIn">
                <form
                  onSubmit={handleUploadRecordingSubmit}
                  className="space-y-3 max-w-xl"
                >
                  <div className="flex items-center gap-2 text-xs font-bold text-violet-700">
                    <FileAudio size={16} />
                    Attach Call Recording for AI Transcription
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-brand-primary/70 mb-1">
                        Audio File (.mp3, .wav, .m4a, .aac, .ogg)
                      </label>
                      <input
                        type="file"
                        accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.webm,.flac"
                        onChange={handleAudioFileChange}
                        className="w-full text-xs text-brand-primary file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-violet-600 file:text-white hover:file:bg-violet-700 file:cursor-pointer cursor-pointer border border-brand-secondary rounded-lg p-1 bg-brand-light"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-brand-primary/70 mb-1">
                        Call Label / Title (Optional)
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
                          <Loader2 size={13} className="animate-spin" /> Uploading & Queuing AI...
                        </>
                      ) : (
                        <>
                          <Upload size={13} /> Upload & Start Transcription
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowUploadModal(false);
                        setUploadFile(null);
                        setUploadError("");
                      }}
                      className="px-3 py-1.5 text-xs text-brand-primary/70 hover:text-brand-primary border border-brand-secondary rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Recordings List */}
            <div className="p-4 space-y-3.5">
              {(!currentLead.recordings || currentLead.recordings.length === 0) && (
                <div className="text-center py-7 border border-dashed border-brand-secondary/60 rounded-xl bg-brand-secondary/5">
                  <div className="w-10 h-10 rounded-full bg-violet-500/10 text-violet-500 flex items-center justify-center mx-auto mb-2">
                    <Mic size={18} />
                  </div>
                  <p className="text-xs font-semibold text-brand-primary">
                    No call recordings attached yet
                  </p>
                  <p className="text-[11px] text-brand-primary/60 max-w-sm mx-auto mt-0.5 mb-3">
                    Upload an audio recording from your customer conversations to automatically transcribe dialogue and extract sales coaching suggestions.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(true)}
                    className="px-3 py-1.5 bg-violet-600/10 hover:bg-violet-600/20 text-violet-600 border border-violet-500/30 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload size={13} /> Upload First Recording
                  </button>
                </div>
              )}

              {currentLead.recordings &&
                currentLead.recordings.map((rec, index) => {
                  const recId = rec._id || rec.id || index;
                  const isExpanded = expandedRecordings[recId];
                  const isAnalyzing = analyzingRecordingIds[recId];
                  const isPending =
                    rec.analysisStatus === "pending" || isAnalyzing;
                  const isFailed = rec.analysisStatus === "failed";
                  const isCompleted = rec.analysisStatus === "completed";

                  // Extract transcription from rec.transcription or analysis text fallback
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
                      className="bg-brand-secondary/10 rounded-xl border border-brand-secondary/30 overflow-hidden transition-all shadow-2xs"
                    >
                      {/* Recording Card Header */}
                      <div
                        className="p-3.5 flex flex-wrap items-center justify-between gap-2 cursor-pointer hover:bg-brand-secondary/15 transition-colors"
                        onClick={() => toggleRecording(recId)}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {isExpanded ? (
                            <ChevronUp
                              size={16}
                              className="text-brand-primary shrink-0"
                            />
                          ) : (
                            <ChevronDown
                              size={16}
                              className="text-brand-primary shrink-0"
                            />
                          )}
                          <div className="w-7 h-7 rounded-md bg-violet-500/10 text-violet-500 flex items-center justify-center shrink-0">
                            <FileAudio size={14} />
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-xs text-brand-primary block truncate">
                              {rec.name || `Call Recording ${index + 1}`}
                            </span>
                            <span className="text-[10px] text-brand-primary/60 block">
                              {rec.uploadedAt
                                ? new Date(rec.uploadedAt).toLocaleString()
                                : "Uploaded"}
                            </span>
                          </div>
                        </div>

                        {/* Status Badges */}
                        <div className="flex items-center gap-2">
                          {isPending && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30 flex items-center gap-1 animate-pulse">
                              <Loader2 size={11} className="animate-spin" />
                              Transcribing & Analyzing...
                            </span>
                          )}
                          {isCompleted && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 flex items-center gap-1">
                              <CheckCircle size={11} />
                              Transcribed & Analyzed
                            </span>
                          )}
                          {isFailed && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/15 text-red-500 border border-red-500/30 flex items-center gap-1">
                              <AlertCircle size={11} />
                              Analysis Failed
                            </span>
                          )}
                          {rec.analysisStatus === "paused" && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-500/15 text-gray-500 border border-gray-500/30">
                              Paused
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Expanded Recording Content */}
                      {isExpanded && (
                        <div className="p-4 pt-1 border-t border-brand-secondary/20 space-y-3.5 bg-brand-light/40">
                          {/* Audio Player & Quick Actions */}
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
                            <audio
                              controls
                              src={getAudioUrl(rec.url)}
                              className="w-full sm:flex-1 h-9 rounded-lg"
                            />

                            <div className="flex items-center gap-2 shrink-0">
                              {transcriptText && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopyTranscript(recId, transcriptText);
                                  }}
                                  className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-brand-secondary/20 hover:bg-brand-secondary/30 text-brand-primary border border-brand-secondary/40 transition-all flex items-center gap-1.5 cursor-pointer"
                                  title="Copy conversation transcript"
                                >
                                  {copiedTranscriptId === recId ? (
                                    <>
                                      <Check size={13} className="text-emerald-500" />
                                      <span className="text-emerald-500">Copied!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy size={13} />
                                      <span>Copy Transcript</span>
                                    </>
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
                                title="Re-run AI audio transcription and analysis"
                              >
                                <RotateCcw
                                  size={13}
                                  className={isPending ? "animate-spin" : ""}
                                />
                                <span>
                                  {isPending
                                    ? "Processing..."
                                    : rec.analysis || transcriptText
                                      ? "Re-Analyze"
                                      : "Start AI Transcription"}
                                </span>
                              </button>
                            </div>
                          </div>

                          {/* Progress Notification */}
                          {isPending && (
                            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 flex items-center gap-2">
                              <Loader2 size={14} className="animate-spin shrink-0 text-amber-600" />
                              <span>
                                Google Gemini is currently processing and transcribing this audio recording. The transcript and evaluation will appear automatically when ready.
                              </span>
                            </div>
                          )}

                          {/* Error Notification */}
                          {isFailed && (
                            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-600 flex items-start gap-2">
                              <AlertCircle size={14} className="shrink-0 mt-0.5 text-red-500" />
                              <div className="flex-1">
                                <span className="font-bold block">Transcription / Analysis failed</span>
                                <span className="text-[11px] opacity-80">
                                  {rec.analysisError ||
                                    "Audio could not be processed. Verify your Google Gemini API key or click Re-Analyze above."}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Tab 1: Verbatim Call Transcription */}
                          {transcriptText && (
                            <div className="bg-white p-4 rounded-xl shadow-2xs border border-brand-secondary/40">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="text-xs font-bold text-violet-600 flex items-center gap-1.5 uppercase tracking-wider">
                                  <Mic size={14} className="text-violet-500" />
                                  Verbatim Call Transcription
                                </h4>
                                <span className="text-[10px] text-brand-primary/50 font-mono">
                                  Speech-to-Text
                                </span>
                              </div>
                              <div className="bg-brand-secondary/5 rounded-lg p-3 max-h-60 overflow-y-auto font-mono text-xs leading-relaxed text-brand-primary whitespace-pre-wrap select-text border border-brand-secondary/20">
                                {transcriptText}
                              </div>
                            </div>
                          )}

                          {/* Tab 2: AI Intelligence & Coaching Analysis */}
                          {rec.analysis && (
                            <div className="bg-white p-4 rounded-xl shadow-2xs border border-brand-secondary/40">
                              <h4 className="text-xs font-bold text-violet-600 mb-2 flex items-center gap-1.5 uppercase tracking-wider">
                                <Sparkles size={14} className="text-amber-500" />
                                AI Sales Intelligence & Coaching
                              </h4>
                              <div className="prose prose-xs max-w-none text-brand-primary/85 leading-relaxed text-xs">
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
          </div>
        )}

        {/* 3. Update Lead Details Form */}
        <div className="bg-brand-light border border-brand-secondary rounded-xl shadow-sm">
          <div className="p-4 border-b border-brand-secondary bg-brand-light/50 rounded-t-xl">
            <h3 className="font-bold text-brand-primary">
              Update Lead Details
            </h3>
          </div>
          <div className="p-5">
            <form onSubmit={handleUpdateLeadFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div
                  className={
                    formData.status === "Follow Up"
                      ? "sm:col-span-1"
                      : "sm:col-span-1"
                  }
                >
                  <label className="block text-xs font-medium text-brand-primary/70 mb-1.5">
                    Lead Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                    className="w-full bg-brand-light border border-brand-secondary text-brand-primary text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none"
                  >
                    <option value="New">New</option>
                    <option value="Follow Up">Follow Up</option>
                    <option value="Not Interested">Not Interested</option>
                    <option value="Not Attended">Not Attended</option>
                    <option value="Price Issue">Price Issue</option>
                    <option value="Converted">Converted</option>
                  </select>
                </div>

                {/* Service Field */}
                <div className="sm:col-span-1">
                  <label className="block text-xs font-medium text-brand-primary/70 mb-1.5">
                    Service Interest
                  </label>
                  <select
                    value={formData.service}
                    onChange={(e) =>
                      setFormData({ ...formData, service: e.target.value })
                    }
                    className="w-full bg-brand-light border border-brand-secondary text-brand-primary text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none"
                  >
                    {activeServices?.map((s) => (
                      <option key={s.code} value={s.code}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Follow Up Type */}
                {formData.status === "Follow Up" && (
                  <div className="sm:col-span-1">
                    <label className="block text-xs font-medium text-brand-primary/70 mb-1.5">
                      Follow Up Type
                    </label>
                    <select
                      value={followupType}
                      onChange={(e) => setFollowupType(e.target.value)}
                      className="w-full bg-brand-light border border-brand-secondary text-brand-primary text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none"
                    >
                      <option value="Call">Phone Call</option>
                      <option value="WhatsApp">WhatsApp Message</option>
                      <option value="Email">Email Communication</option>
                      <option value="Meeting">Direct Meeting</option>
                      <option value="Consultation">
                        Consultation Assessment
                      </option>
                    </select>
                  </div>
                )}

                {formData.status === "Follow Up" && (
                  <div className="sm:col-span-1">
                    <label className="block text-xs font-medium text-brand-primary/70 mb-1.5">
                      Follow Up Date
                    </label>
                    <DatePicker
                      value={formData.nextFollowUp}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          nextFollowUp: e.target.value,
                        })
                      }
                    />
                  </div>
                )}

                <div className="sm:col-span-1 flex items-center lg:col-span-3">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center">
                      <input
                        type="checkbox"
                        checked={Boolean(formData.importantLead)}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            importantLead: e.target.checked,
                          })
                        }
                        className="peer sr-only"
                      />
                      <div className="w-5 h-5 border-2 border-brand-secondary rounded bg-brand-light peer-checked:bg-purple-500 peer-checked:border-purple-500 transition-colors flex items-center justify-center">
                        <CheckCircle
                          className="w-3.5 h-3.5 text-brand-light opacity-0 peer-checked:opacity-100"
                          strokeWidth={3}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-bold text-brand-primary group-hover:text-brand-primary transition-colors">
                      🔥 Important Hot Lead
                    </span>
                  </label>
                </div>
                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="block text-xs font-medium text-brand-primary/70 mb-1.5">
                    Comments
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Type customer call summary, special requests, or latest requirement updates here..."
                    value={formData.comments}
                    onChange={(e) =>
                      setFormData({ ...formData, comments: e.target.value })
                    }
                    className="w-full bg-brand-light border border-brand-secondary text-brand-primary text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-3 resize-y outline-none"
                  />
                </div>
                <div className="sm:col-span-2 lg:col-span-3 pt-2">
                  <button
                    type="submit"
                    className="w-full bg-purple-500 hover:bg-purple-600 text-brand-light font-bold py-2.5 px-4 rounded-lg transition-colors"
                  >
                    Submit Update
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* 4. Upcoming Followups schedule */}
        {true && (
          <div className="bg-brand-light border border-purple-500/30 rounded-xl overflow-hidden shadow-sm">
            <div className="p-5">
              <div className="flex justify-between items-center mb-5">
                <h3 className="font-bold text-purple-500">
                  Follow-Up History & Communications Logs
                </h3>
              </div>

              <div className="space-y-3">
                {combinedHistory.length === 0 && (
                  <div className="text-center py-8 border border-dashed border-brand-secondary rounded-lg">
                    <p className="text-sm text-brand-primary/70">
                      No follow-up reminders or activities recorded yet.
                    </p>
                  </div>
                )}
                {combinedHistory.map((f) => (
                  <div
                    key={f.id}
                    className="p-4 bg-brand-light border border-brand-secondary rounded-xl flex justify-between items-start"
                  >
                    <div className="flex gap-4 items-start w-full">
                      <div className="min-w-0 flex-grow">
                        <div className="flex justify-between items-start mb-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-sm font-bold text-brand-primary">
                              {f.type}{" "}
                              {f.isFollowup ? "Engagement Channel" : "Log"}
                            </h4>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                f.priority === "High"
                                  ? "bg-red-500/10 text-red-500 border border-red-500/20"
                                  : f.priority === "Medium"
                                    ? "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                                    : "bg-brand-secondary/30 text-brand-primary/70 border border-brand-secondary"
                              }`}
                            >
                              {f.priority}
                            </span>
                          </div>

                          {f.isFollowup && (
                            <div className="text-right">
                              <span className="block text-[10px] font-bold text-brand-primary/70 uppercase tracking-wider">
                                Scheduled {f.type}
                              </span>
                              <span className="text-xs font-bold text-purple-600 bg-purple-500/10 px-2 py-1 rounded">
                                {formatDate(f.scheduledDate)}{" "}
                                {f.scheduledTime ? `• ${f.scheduledTime}` : ""}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 text-xs text-brand-primary/70 mb-2">
                          <Calendar size={14} />
                          <span>
                            {f.isFollowup ? "Updated on" : "Logged on"}:{" "}
                            {formatDate(f.createdAt)} •{" "}
                            {new Date(f.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        <p className="text-sm italic text-brand-primary mb-3">
                          "{f.notes}"
                        </p>

                        <hr className="border-brand-secondary mb-3" />

                        <div className="text-xs font-bold text-purple-500 flex items-center gap-1.5">
                          <User size={12} />
                          {f.isFollowup ? "Followed up by" : "Logged by"}:{" "}
                          {f.author}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals/Dialogs */}
      {followupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-light/50 backdrop-blur-sm">
          <div className="bg-brand-light border border-brand-secondary rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b border-brand-secondary rounded-t-2xl">
              <h3 className="font-bold text-brand-primary text-lg">
                Schedule Agenda Follow-up
              </h3>
              <button
                onClick={() => setFollowupOpen(false)}
                className="text-brand-primary/70 hover:text-brand-primary transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 overflow-y-auto">
              <form
                id="schedule-form"
                onSubmit={handleSaveFollowup}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-medium text-brand-primary/70 mb-1.5">
                    Task Type
                  </label>
                  <select
                    value={newFw.type}
                    onChange={(e) =>
                      setNewFw({ ...newFw, type: e.target.value })
                    }
                    className="w-full bg-brand-light border border-brand-secondary text-brand-primary text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block p-2.5 outline-none"
                  >
                    <option value="Call">Call</option>
                    <option value="WhatsApp">WhatsApp Message</option>
                    <option value="Email">Email Communication</option>
                    <option value="Meeting">Direct Meeting</option>
                    <option value="Consultation">
                      Consultation Assessment
                    </option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-brand-primary/70 mb-1.5">
                      Due Date
                    </label>
                    <DatePicker
                      value={newFw.date}
                      onChange={(e) =>
                        setNewFw({ ...newFw, date: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-brand-primary/70 mb-1.5">
                      Due Time
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 11:30 AM"
                      value={newFw.time}
                      onChange={(e) =>
                        setNewFw({ ...newFw, time: e.target.value })
                      }
                      className="w-full bg-brand-light border border-brand-secondary text-brand-primary text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block p-2.5 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-brand-primary/70 mb-1.5">
                    Priority level
                  </label>
                  <select
                    value={newFw.priority}
                    onChange={(e) =>
                      setNewFw({ ...newFw, priority: e.target.value })
                    }
                    className="w-full bg-brand-light border border-brand-secondary text-brand-primary text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block p-2.5 outline-none"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High Priority</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-brand-primary/70 mb-1.5">
                    Action Agenda Notes
                  </label>
                  <textarea
                    rows={2}
                    value={newFw.notes}
                    onChange={(e) =>
                      setNewFw({ ...newFw, notes: e.target.value })
                    }
                    className="w-full bg-brand-light border border-brand-secondary text-brand-primary text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block p-2.5 resize-y outline-none"
                  />
                </div>
              </form>
            </div>

            <div className="p-4 border-t border-brand-secondary bg-brand-light flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setFollowupOpen(false)}
                className="px-4 py-2 text-sm font-medium text-brand-primary/70 hover:text-brand-primary transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="schedule-form"
                className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-brand-light text-sm font-bold rounded-lg transition-colors"
              >
                Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
