import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import {
  MessageSquare,
  Bot,
  User,
  Send,
  Paperclip,
  RefreshCw,
  Play,
  FileText,
  MapPin,
  Tag,
  Plus,
  Trash2,
  Brain,
  Clock,
  Sparkles,
  TrendingUp,
  UserCheck,
  Check,
  CheckCheck,
  Smile,
  AlertCircle,
  FolderMinus,
  Calendar,
  X,
  UserPlus,
} from "lucide-react";
import { socket } from "../utils/socket.js";
import { API_ENDPOINTS, BACKEND_URL } from "../utils/constants.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useLeads } from "../context/LeadsContext.jsx";

export default function WhatsAppChat() {
  const { currentUser, organization } = useAuth();
  const { activeServices, qualificationFields } = useLeads();
  const orgId = organization?.id || organization?._id || currentUser?.organizationId;
  const currentOrgSessionId = orgId ? `org_${orgId}` : "device_1";

  const navigate = useNavigate();
  const location = useLocation();
  const messagesEndRef = useRef(null);

  // Connection & Session States
  const [sessions, setSessions] = useState([]);
  const [sessionLoading, setSessionLoading] = useState(false);

  // Conversations List
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Active Chat Message history
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // AI Lead Qualification Form
  const [qualForm, setQualForm] = useState({
    intent: "",
    city: "",
    preferredCallDate: "",
    preferredCallTime: "",
    urgency: "Medium",
    interestScore: 0,
  });
  const [savingQual, setSavingQual] = useState(false);
  const [newTagInput, setNewTagInput] = useState("");

  // Follow Up Form Modal
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [followUpData, setFollowUpData] = useState({
    type: "WhatsApp",
    date: new Date().toISOString().split("T")[0],
    time: "11:00 AM",
    priority: "Medium",
    notes: "",
  });

  // Ticker for live countdowns
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const isLeadAiPaused = (lead) => {
    if (!lead || !lead.aiEnabled || !lead.aiPausedUntil) return false;
    return new Date(lead.aiPausedUntil).getTime() > now;
  };

  const getRemainingPauseTime = (aiPausedUntil) => {
    if (!aiPausedUntil) return "";
    const diff = new Date(aiPausedUntil).getTime() - now;
    if (diff <= 0) return "";
    const totalSecs = Math.floor(diff / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}m ${secs < 10 ? "0" : ""}${secs}s`;
  };

  // Load Status on mount
  useEffect(() => {
    fetchSessionStatus();
    fetchConversations();

    if (orgId) {
      socket.emit("join_organization", orgId);
    }

    // Socket.IO updates
    socket.on("whatsapp_status", (data) => {
      if (data.organizationId && orgId && String(data.organizationId) !== String(orgId)) {
        return;
      }
      setSessions((prev) => {
        const existingIndex = prev.findIndex(s => s.sessionId === data.sessionId);
        if (existingIndex >= 0) {
          const newSessions = [...prev];
          newSessions[existingIndex] = data;
          return newSessions;
        } else {
          return [...prev, data];
        }
      });
    });

    socket.on("conversation_updated", (data) => {
      // Reload conversations list
      fetchConversations();
    });

    socket.on("ai_status_updated", (data) => {
      if (!data?.leadId) return;
      setConversations((prev) =>
        prev.map((c) => {
          const lId = c.leadId?._id || c.leadId?.id || c.leadId;
          if (String(lId) === String(data.leadId)) {
            return {
              ...c,
              leadId: {
                ...c.leadId,
                aiPausedUntil: data.aiPausedUntil,
              },
            };
          }
          return c;
        })
      );

      setSelectedConv((prev) => {
        if (!prev) return prev;
        const lId = prev.leadId?._id || prev.leadId?.id || prev.leadId;
        if (String(lId) === String(data.leadId)) {
          return {
            ...prev,
            leadId: {
              ...prev.leadId,
              aiPausedUntil: data.aiPausedUntil,
            },
          };
        }
        return prev;
      });
    });

    return () => {
      socket.off("whatsapp_status");
      socket.off("conversation_updated");
      socket.off("ai_status_updated");
    };
  }, [orgId]);

  // Set up socket subscription for selected chat
  useEffect(() => {
    if (!selectedConv) return;
    const currentLeadId = selectedConv.leadId?.id || selectedConv.leadId?._id;

    // Join room
    if (currentLeadId) {
      socket.emit("join_lead_chat", currentLeadId);
    }

    // Listen to new message logs
    socket.on("new_message", (msg) => {
      const msgLeadId = msg.leadId?._id || msg.leadId?.id || msg.leadId;
      if (String(msgLeadId) === String(currentLeadId)) {
        setMessages((prev) => {
          // Prevent duplicates
          if (prev.some((m) => m.messageId === msg.messageId)) return prev;
          return [...prev, msg];
        });
        scrollToBottom();
      }
    });

    // Listen to typing status
    socket.on("typing_status", (data) => {
      if (String(data.leadId) === String(currentLeadId)) {
        setIsTyping(data.isTyping);
      }
    });

    // Reset unread count locally when active chat changes
    setConversations((prev) =>
      prev.map((c) => {
        const cLeadId = c.leadId?._id || c.leadId?.id || c.leadId;
        return String(cLeadId) === String(currentLeadId)
          ? { ...c, unreadCount: 0 }
          : c;
      }),
    );

    return () => {
      if (currentLeadId) {
        socket.emit("leave_lead_chat", currentLeadId);
      }
      socket.off("new_message");
      socket.off("typing_status");
    };
  }, [selectedConv]);

  // Scroll chat timeline to bottom
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const fetchSessionStatus = async () => {
    try {
      const res = await axios.get(API_ENDPOINTS.WHATSAPP.STATUS);
      setSessions(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch WhatsApp connection status", err);
    }
  };

  const fetchConversations = async () => {
    try {
      const res = await axios.get(API_ENDPOINTS.WHATSAPP.CONVERSATIONS, {
        params: {
          role: currentUser?.role,
          name: currentUser?.name,
          userId: currentUser?.id || currentUser?._id,
        },
      });
      const data = res.data;
      setConversations(data);
      setConversationsLoading(false);

      const searchParams = new URLSearchParams(location.search);
      const targetLeadId = location.state?.selectLeadId || searchParams.get("leadId");
      if (targetLeadId) {
        const found = data.find((c) => {
          const lId = c.leadId?._id || c.leadId?.id || c.leadId;
          return String(lId) === String(targetLeadId);
        });
        if (found) {
          handleSelectConversation(found);
        } else {
          // If no conversation thread exists yet, retrieve lead details and create a mock conversation
          try {
            const leadRes = await axios.get(
              `${API_ENDPOINTS.LEADS.BASE}/${targetLeadId}`,
            );
            const newMockConv = {
              id: `mock_${targetLeadId}`,
              leadId: leadRes.data,
              unreadCount: 0,
              lastMessage: "No messages yet",
              lastMessageTime: new Date(),
            };
            setConversations((prev) => {
              if (
                prev.some((c) => {
                  const lId = c.leadId?._id || c.leadId?.id || c.leadId;
                  return String(lId) === String(targetLeadId);
                })
              )
                return prev;
              return [newMockConv, ...prev];
            });
            handleSelectConversation(newMockConv);
          } catch (err) {
            console.error(
              "Failed to load lead details for mock conversation",
              err,
            );
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch conversations", err);
      setConversationsLoading(false);
    }
  };

  const handleConnect = async () => {
    setSessionLoading(true);
    try {
      await axios.post(API_ENDPOINTS.WHATSAPP.CONNECT, { sessionId: currentOrgSessionId });
      setTimeout(fetchSessionStatus, 2000);
    } catch (err) {
      alert("Failed to send connect command.");
    } finally {
      setSessionLoading(false);
    }
  };

  const handleLogout = async (sessionId) => {
    if (
      !window.confirm("Are you sure you want to disconnect WhatsApp session?")
    )
      return;
    setSessionLoading(true);
    try {
      await axios.post(API_ENDPOINTS.WHATSAPP.LOGOUT, { sessionId });
      fetchSessionStatus();
    } catch (err) {
      alert("Failed to send logout command.");
    } finally {
      setSessionLoading(false);
    }
  };

  const handleSelectConversation = async (conv) => {
    setSelectedConv(conv);
    setMessagesLoading(true);
    setMessages([]);

    // Set up lead qualification state fields
    const lead = conv.leadId;
    if (lead) {
      setQualForm({
        ...(lead.aiQualification || {}),
        city: lead.city || lead.aiQualification?.city || "",
        preferredCallDate: lead.aiQualification?.preferredCallDate || "",
        preferredCallTime: lead.aiQualification?.preferredCallTime || "",
        intent: lead.aiQualification?.intent || lead.service || "",
        urgency: lead.aiQualification?.urgency || "Medium",
        interestScore: lead.aiQualification?.interestScore ?? 0,
      });
    }

    try {
      const res = await axios.get(
        API_ENDPOINTS.WHATSAPP.CONVERSATION(conv.leadId?.id),
      );
      setMessages(res.data);
      setMessagesLoading(false);
      scrollToBottom();
    } catch (err) {
      console.error("Failed to load message logs", err);
      setMessagesLoading(false);
    }
  };

  // Toggle AI on/off for lead
  const handleToggleAI = async () => {
    if (!selectedConv) return;
    const leadId = selectedConv.leadId?._id || selectedConv.leadId?.id;
    const nextState = !selectedConv.leadId?.aiEnabled;
    try {
      const res = await axios.post(API_ENDPOINTS.WHATSAPP.AI_TOGGLE, {
        leadId,
        aiEnabled: nextState,
      });

      // Update local state
      const updatedLead = res.data.lead;
      setSelectedConv((prev) => ({
        ...prev,
        leadId: {
          ...prev.leadId,
          aiEnabled: updatedLead.aiEnabled,
          aiPausedUntil: updatedLead.aiPausedUntil || null,
        },
      }));
      setConversations((prev) =>
        prev.map((c) => {
          const lId = c.leadId?._id || c.leadId?.id || c.leadId;
          return String(lId) === String(leadId)
            ? {
                ...c,
                leadId: {
                  ...c.leadId,
                  aiEnabled: updatedLead.aiEnabled,
                  aiPausedUntil: updatedLead.aiPausedUntil || null,
                },
              }
            : c;
        }),
      );
    } catch (err) {
      alert("Failed to toggle AI state.");
    }
  };

  // Instant Resume AI (clears active 5-minute pause)
  const handleResumeAI = async () => {
    if (!selectedConv) return;
    const leadId = selectedConv.leadId?._id || selectedConv.leadId?.id;
    try {
      const res = await axios.post(API_ENDPOINTS.WHATSAPP.AI_TOGGLE, {
        leadId,
        aiEnabled: true,
      });
      const updatedLead = res.data.lead;
      setSelectedConv((prev) => ({
        ...prev,
        leadId: {
          ...prev.leadId,
          aiEnabled: updatedLead?.aiEnabled ?? true,
          aiPausedUntil: null,
        },
      }));
      setConversations((prev) =>
        prev.map((c) => {
          const lId = c.leadId?._id || c.leadId?.id || c.leadId;
          return String(lId) === String(leadId)
            ? {
                ...c,
                leadId: {
                  ...c.leadId,
                  aiEnabled: updatedLead?.aiEnabled ?? true,
                  aiPausedUntil: null,
                },
              }
            : c;
        }),
      );
    } catch (err) {
      alert("Failed to resume AI.");
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!selectedConv) return;
    if (!inputValue.trim()) return;

    const messageText = inputValue.trim();
    const leadId = selectedConv.leadId?._id || selectedConv.leadId?.id;
    setInputValue("");

    // Optimistically snooze AI for 5 minutes if AI is enabled for this lead
    if (selectedConv.leadId?.aiEnabled) {
      const optimisticPausedUntil = new Date(Date.now() + 5 * 60 * 1000).toISOString();
      setSelectedConv((prev) => ({
        ...prev,
        leadId: {
          ...prev.leadId,
          aiPausedUntil: optimisticPausedUntil,
        },
      }));
      setConversations((prev) =>
        prev.map((c) => {
          const lId = c.leadId?._id || c.leadId?.id || c.leadId;
          return String(lId) === String(leadId)
            ? {
                ...c,
                leadId: {
                  ...c.leadId,
                  aiPausedUntil: optimisticPausedUntil,
                },
              }
            : c;
        }),
      );
    }

    try {
      await axios.post(API_ENDPOINTS.WHATSAPP.SEND_MESSAGE, {
        leadId,
        text: messageText,
        senderName: currentUser?.name || "System",
      });
    } catch (err) {
      alert("Failed to send message.");
    }
  };

  // Update lead qualification parameters in DB
  const handleUpdateQualification = async (e) => {
    e.preventDefault();
    if (!selectedConv) return;
    setSavingQual(true);

    try {
      // Update CRM lead
      await axios.put(
        `${API_ENDPOINTS.LEADS.BASE}/${selectedConv.leadId?.id}`,
        {
          aiQualification: qualForm,
        },
      );
      alert("AI Qualification fields updated successfully!");
    } catch (err) {
      alert("Failed to save updates.");
    } finally {
      setSavingQual(false);
    }
  };

  // Add Tags
  const handleAddTag = async (e) => {
    e.preventDefault();
    if (!selectedConv || !newTagInput.trim()) return;

    const nextTags = [
      ...(selectedConv.leadId?.aiTags || []),
      newTagInput.trim(),
    ];
    try {
      const res = await axios.put(
        `${API_ENDPOINTS.LEADS.BASE}/${selectedConv.leadId?.id}`,
        {
          aiTags: nextTags,
        },
      );

      setSelectedConv((prev) => ({
        ...prev,
        leadId: { ...prev.leadId, aiTags: res.data.aiTags },
      }));
      setNewTagInput("");
    } catch (err) {
      alert("Failed to add tag.");
    }
  };

  // Delete Tag
  const handleDeleteTag = async (tagToDelete) => {
    if (!selectedConv) return;
    const nextTags = (selectedConv.leadId?.aiTags || []).filter(
      (t) => t !== tagToDelete,
    );
    try {
      const res = await axios.put(
        `${API_ENDPOINTS.LEADS.BASE}/${selectedConv.leadId?.id}`,
        {
          aiTags: nextTags,
        },
      );

      setSelectedConv((prev) => ({
        ...prev,
        leadId: { ...prev.leadId, aiTags: res.data.aiTags },
      }));
    } catch (err) {
      alert("Failed to remove tag.");
    }
  };

  // Create follow up
  const handleCreateFollowUp = async (e) => {
    e.preventDefault();
    if (!selectedConv) return;

    try {
      await axios.post(API_ENDPOINTS.FOLLOWUPS.BASE, {
        leadId: selectedConv.leadId?.id,
        leadName: selectedConv.leadId?.name,
        type: followUpData.type,
        date: followUpData.date,
        time: followUpData.time,
        priority: followUpData.priority,
        notes: followUpData.notes,
        author: currentUser?.name || "Agent",
      });

      alert("Follow up task scheduled successfully!");
      setFollowUpOpen(false);
      setFollowUpData({
        type: "WhatsApp",
        date: new Date().toISOString().split("T")[0],
        time: "11:00 AM",
        priority: "Medium",
        notes: "",
      });
    } catch (err) {
      alert("Failed to schedule follow up.");
    }
  };

  // Filter conversations
  const filteredConversations = conversations.filter((c) => {
    const name = c.leadId?.name || "Unknown";
    const phone = c.leadId?.phone || "";
    const cleanQuery = searchQuery.toLowerCase();
    return (
      name.toLowerCase().includes(cleanQuery) || phone.includes(cleanQuery)
    );
  });

  const activeSessions = sessions.filter(
    (s) =>
      (s.sessionId === currentOrgSessionId ||
        (orgId && (s.organizationId === orgId || s.sessionId === `org_${orgId}`)) ||
        (!orgId && s.sessionId === "device_1")) &&
      s.status !== "disconnected",
  );

  return (
    <div className="flex flex-col h-[calc(100vh-70px)] relative overflow-hidden bg-[#130a28] text-white">
      {/* Top Header Connection Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-b border-[#361c5a] bg-[#1a0c35]">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#361c5a] rounded-xl">
            <MessageSquare className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">
              WhatsApp AI Lead Hub
            </h1>
            <div className="flex flex-col gap-1 mt-1">
              {activeSessions.map((session) => (
                <div key={session.sessionId} className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      session.status === "connected"
                        ? "bg-emerald-500 animate-pulse"
                        : session.status === "qr"
                          ? "bg-amber-400"
                          : session.status === "connecting"
                            ? "bg-blue-400 animate-spin border-t-transparent"
                            : "bg-red-500"
                    }`}
                  />
                  <span className="text-xs font-semibold capitalize text-brand-secondary/80">
                    WhatsApp: {session.status === "qr" ? "Scan QR Code" : session.status}
                  </span>
                  {session.status === "connected" && session.connectedPhone && (
                    <span className="text-xs text-emerald-400 font-bold ml-1">
                      ({session.connectedPhone})
                    </span>
                  )}
                </div>
              ))}
              {activeSessions.length === 0 && (
                <span className="text-xs font-semibold text-red-400">
                  No device connected
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Setup actions */}
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            {activeSessions.map((session) => (
              <div key={session.sessionId} className="flex items-center gap-2">
                {session.status === "qr" && session.qrCode && (
                  <div className="relative group">
                    <button className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-4 rounded-xl text-sm">
                      Scan QR Code
                    </button>
                    {/* QR Popup */}
                    <div className="absolute right-0 top-12 z-50 p-4 bg-white text-black border border-gray-200 rounded-2xl shadow-2xl flex flex-col items-center">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(session.qrCode)}`}
                        alt="WhatsApp QR Code"
                        className="w-48 h-48"
                      />
                      <p className="text-xs font-bold text-center mt-2 text-gray-600">
                        Scan via WhatsApp Link Device
                      </p>
                    </div>
                  </div>
                )}
                {session.status === "connected" && (
                  <button
                    onClick={() => handleLogout(session.sessionId)}
                    disabled={sessionLoading}
                    className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold py-2 px-3 rounded-xl transition-all border border-red-500/30 text-sm"
                  >
                    Disconnect WhatsApp
                  </button>
                )}
              </div>
            ))}
          </div>

          {activeSessions.length === 0 && (
            <button
              onClick={handleConnect}
              disabled={sessionLoading}
              className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white font-bold py-2 px-4 rounded-xl transition-all text-sm"
            >
              <RefreshCw className={`w-4 h-4 ${sessionLoading ? "animate-spin" : ""}`} />
              Link WhatsApp
            </button>
          )}
        </div>
      </div>

      {/* Main Layout Pane */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Left Side: Conversation List */}
        <div className="w-80 flex flex-col border-r border-[#361c5a] bg-[#1a0c35] shrink-0">
          <div className="p-3 border-b border-[#361c5a]">
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#21103f] border border-[#3e206c] rounded-xl px-4 py-2.5 outline-none focus:border-purple-400 text-sm"
            />
          </div>

          <div className="flex-1 overflow-y-auto">
            {conversationsLoading ? (
              <div className="p-6 text-center text-brand-secondary/50">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-purple-400" />
                Loading conversations...
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-6 text-center text-brand-secondary/50">
                No active conversations found
              </div>
            ) : (
              <ul className="divide-y divide-[#301855]/40">
                {filteredConversations.map((conv) => {
                  const lead = conv.leadId;
                  const isSelected = selectedConv?.id === conv.id;
                  const leadName = lead?.name || "Unknown Customer";
                  const status = lead?.status || "New";

                  return (
                    <li key={conv.id}>
                      <button
                        onClick={() => handleSelectConversation(conv)}
                        className={`w-full flex items-start gap-3 p-3.5 text-left transition-colors ${
                          isSelected ? "bg-[#2f1658]" : "hover:bg-[#24114d]"
                        }`}
                      >
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-sm shrink-0 border border-purple-500/30">
                          {leadName.substring(0, 2).toUpperCase()}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-bold text-sm truncate text-white">
                              {leadName}
                            </h3>
                            <span className="text-[10px] text-brand-secondary/50 font-medium">
                              {conv.lastMessageTime
                                ? new Date(
                                    conv.lastMessageTime,
                                  ).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : ""}
                            </span>
                          </div>
                          <p className="text-xs text-brand-secondary/70 truncate mt-0.5">
                            {conv.lastMessage || "No messages yet"}
                          </p>

                          <div className="flex items-center justify-between mt-2">
                            <span className="px-1.5 py-0.5 bg-purple-500/10 text-purple-400 text-[9px] rounded-md font-bold uppercase tracking-wider">
                              {status}
                            </span>

                            <div className="flex items-center gap-2">
                              {/* AI State badge */}
                              {lead?.aiEnabled ? (
                                isLeadAiPaused(lead) ? (
                                  <span className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-500/15 text-amber-400 text-[9px] rounded-md font-bold border border-amber-500/30">
                                    <Clock className="w-2.5 h-2.5 animate-pulse" /> Snoozed ({getRemainingPauseTime(lead.aiPausedUntil)})
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 text-[9px] rounded-md font-bold">
                                    <Brain className="w-2.5 h-2.5" /> AI Active
                                  </span>
                                )
                              ) : (
                                <span className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-500/10 text-amber-400 text-[9px] rounded-md font-bold">
                                  <User className="w-2.5 h-2.5" /> Human
                                </span>
                              )}

                              {/* Unread badge */}
                              {conv.unreadCount > 0 && (
                                <span className="w-5 h-5 flex items-center justify-center bg-emerald-500 text-black text-[10px] font-extrabold rounded-full">
                                  {conv.unreadCount}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Center: Message Logs timeline */}
        <div className="flex-1 flex flex-col bg-[#0f0822] min-w-0">
          {selectedConv ? (
            <>
              {/* Chat room Header */}
              <div className="flex items-center justify-between p-3.5 border-b border-[#361c5a] bg-[#1a0c35]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold text-sm shrink-0">
                    {(selectedConv.leadId?.name || "Unknown")
                      .substring(0, 2)
                      .toUpperCase()}
                  </div>
                  <div>
                    <h2 className="font-bold text-sm text-white">
                      {selectedConv.leadId?.name || "Unknown Customer"}
                    </h2>
                    <p className="text-xs text-brand-secondary/60">
                      WhatsApp: {selectedConv.leadId?.phone}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* AI toggle slider */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-brand-secondary/80 font-bold">
                      Auto-AI:
                    </span>
                    <button
                      onClick={handleToggleAI}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        selectedConv.leadId?.aiEnabled
                          ? "bg-purple-500"
                          : "bg-[#361c5a]"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          selectedConv.leadId?.aiEnabled
                            ? "translate-x-5"
                            : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  <button
                    onClick={() =>
                      navigate(`/lead-details/${selectedConv.leadId?.id}`)
                    }
                    className="text-xs font-bold text-purple-400 hover:text-purple-300 border border-purple-500/30 bg-purple-500/5 px-3 py-1.5 rounded-lg"
                  >
                    View Lead Record
                  </button>
                </div>
              </div>

              {/* AI 5-Minute Pause / Snooze Banner */}
              {selectedConv.leadId?.aiEnabled && isLeadAiPaused(selectedConv.leadId) && (
                <div className="bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-[#1a0c35] border-b border-amber-500/30 px-4 py-2.5 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2.5 text-xs text-amber-300">
                    <Clock className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
                    <span>
                      <strong className="text-amber-200">AI Snoozed (5 min):</strong> Manual message sent. Auto-resumes in{" "}
                      <span className="font-mono font-bold text-amber-100 bg-amber-500/25 px-1.5 py-0.5 rounded">
                        {getRemainingPauseTime(selectedConv.leadId.aiPausedUntil)}
                      </span>
                    </span>
                  </div>
                  <button
                    onClick={handleResumeAI}
                    className="flex items-center gap-1.5 text-xs font-bold text-amber-200 hover:text-white bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 px-3 py-1 rounded-md transition-all shadow-sm active:scale-95"
                  >
                    <Play className="w-3 h-3 fill-current" /> Resume AI Now
                  </button>
                </div>
              )}

              {/* Chat Timeline body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messagesLoading ? (
                  <div className="flex flex-col items-center justify-center h-full text-brand-secondary/50">
                    <RefreshCw className="w-8 h-8 animate-spin text-purple-400 mb-2" />
                    Fetching chat transcripts...
                  </div>
                ) : (
                  <>
                    {messages.map((msg) => {
                      const isIncoming = msg.direction === "incoming";

                      return (
                        <div
                          key={msg.id || msg.messageId}
                          className={`flex ${isIncoming ? "justify-start" : "justify-end"}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-2xl p-3 shadow-md relative group ${
                              isIncoming
                                ? "bg-[#281645] text-white rounded-tl-none border border-[#3e2164]"
                                : "bg-purple-600 text-white rounded-tr-none"
                            }`}
                          >
                            {/* AI Generated tag badge */}
                            {!isIncoming && msg.aiGenerated && (
                              <span className="inline-flex items-center gap-0.5 px-1 py-0.2 bg-[#130a28]/40 text-purple-200 text-[8px] rounded font-semibold mb-1">
                                <Bot className="w-2.5 h-2.5" /> AI Reply
                              </span>
                            )}

                            {/* Campaign or Human Agent badge */}
                            {!isIncoming &&
                              !msg.aiGenerated &&
                              msg.senderName && (
                                <span
                                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold mb-1 ${
                                    msg.source === "cloud_api_campaign"
                                      ? "bg-purple-500/20 text-purple-200 border border-purple-400/20"
                                      : "bg-[#130a28]/20 text-white"
                                  }`}
                                >
                                  {msg.source === "cloud_api_campaign" ? (
                                    <>
                                      <Send className="w-2.5 h-2.5 text-purple-300" />
                                      <span>Campaign: {msg.senderName}</span>
                                    </>
                                  ) : (
                                    <>
                                      <User className="w-2.5 h-2.5" />
                                      <span>{msg.senderName}</span>
                                    </>
                                  )}
                                </span>
                              )}

                            {/* Image Attachment Rendering */}
                            {msg.mediaUrl && msg.messageType === "image" && (
                              <div className="mb-2 max-w-sm rounded-lg overflow-hidden border border-black/20">
                                <img
                                  src={`${BACKEND_URL}${msg.mediaUrl}`}
                                  alt="Attachment"
                                  className="w-full object-cover max-h-60"
                                />
                              </div>
                            )}

                            {/* Audio message handler */}
                            {msg.mediaUrl && msg.messageType === "audio" && (
                              <div className="mb-2 flex items-center gap-2 p-2 bg-black/10 rounded-lg">
                                <Play className="w-4 h-4 text-purple-200 cursor-pointer" />
                                <audio
                                  controls
                                  src={`${BACKEND_URL}${msg.mediaUrl}`}
                                  className="h-6 w-48 text-xs"
                                />
                              </div>
                            )}

                            {/* Doc Attachment */}
                            {msg.mediaUrl && msg.messageType === "document" && (
                              <a
                                href={`${BACKEND_URL}${msg.mediaUrl}`}
                                target="_blank"
                                rel="noreferrer"
                                className="mb-2 flex items-center gap-2 p-2.5 bg-black/10 rounded-lg text-purple-100 hover:text-white border border-white/10"
                              >
                                <FileText className="w-5 h-5" />
                                <span className="text-xs font-semibold truncate max-w-[180px]">
                                  {msg.text || "Document Attachment"}
                                </span>
                              </a>
                            )}

                            {/* Location rendering */}
                            {msg.messageType === "location" && (
                              <div className="mb-2 flex items-center gap-2 p-2 bg-[#130a28]/35 rounded-lg text-xs font-medium">
                                <MapPin className="w-4 h-4 text-red-400" />
                                <span>{msg.text}</span>
                              </div>
                            )}

                            {/* Text message content */}
                            {msg.messageType !== "document" && (
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                {msg.text}
                              </p>
                            )}

                            {/* Date time and checkmarks status */}
                            <div className="flex items-center justify-end gap-1.5 mt-1.5 text-[9px] text-brand-secondary/65">
                              <span>
                                {new Date(msg.timestamp).toLocaleTimeString(
                                  [],
                                  { hour: "2-digit", minute: "2-digit" },
                                )}
                              </span>

                              {!isIncoming && (
                                <span>
                                  {msg.status === "read" ? (
                                    <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                                  ) : msg.status === "delivered" ? (
                                    <CheckCheck className="w-3.5 h-3.5 text-brand-secondary/60" />
                                  ) : (
                                    <Check className="w-3.5 h-3.5 text-brand-secondary/60" />
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Live typing status */}
                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="bg-[#281645] text-purple-400 rounded-2xl rounded-tl-none p-3 border border-[#3e2164] flex items-center gap-2">
                          <Bot className="w-4 h-4 animate-bounce" />
                          <span className="text-xs font-semibold">
                            Gemini AI is crafting reply...
                          </span>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Chat Input footer */}
              <form
                onSubmit={handleSend}
                className="p-3 border-t border-[#361c5a] bg-[#1a0c35] flex items-center gap-2"
              >
                <div className="flex-1 relative flex items-center bg-[#21103f] border border-[#3e206c] rounded-xl px-4 py-2.5">
                  <input
                    type="text"
                    placeholder="Type message..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="w-full bg-transparent outline-none text-white text-sm"
                  />
                </div>

                <button
                  type="submit"
                  className="p-2.5 bg-purple-500 hover:bg-purple-600 rounded-xl text-white transition-all shrink-0 shadow-lg"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-brand-secondary/45">
              <MessageSquare className="w-16 h-16 mb-4 text-[#381d5a]" />
              <h2 className="text-xl font-bold text-white mb-1">
                Select a Conversation
              </h2>
              <p className="text-sm max-w-xs text-brand-secondary/70">
                Pick a chat thread from the left panel to begin managing
                customer inquiries or review AI actions.
              </p>
            </div>
          )}
        </div>

        {/* Right side: AI Qualification insights sidebar */}
        {selectedConv && (
          <div className="w-80 border-l border-[#361c5a] bg-[#1a0c35] flex flex-col overflow-y-auto shrink-0 p-4 space-y-6">
            {/* Qualification Form */}
            <div>
              <div className="flex items-center gap-2 mb-4 border-b border-[#361c5a] pb-2 text-white">
                <Brain className="w-5 h-5 text-indigo-400" />
                <h2 className="font-bold text-sm uppercase tracking-wide">
                  Lead Qualifications
                </h2>
              </div>

              <form
                onSubmit={handleUpdateQualification}
                className="space-y-3.5"
              >
                {/* Service / Product Line */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-secondary/60 mb-1">
                    Service / Product Line
                  </label>
                  <div className="space-y-1.5">
                    {activeServices && activeServices.length > 0 && (
                      <select
                        value={qualForm.intent || ""}
                        onChange={(e) =>
                          setQualForm({
                            ...qualForm,
                            intent: e.target.value,
                          })
                        }
                        className="w-full bg-[#21103f] border border-[#3e206c] text-white text-xs rounded-lg p-2 outline-none focus:border-purple-500"
                      >
                        <option value="">Select Service / Custom...</option>
                        {activeServices.map((s) => (
                          <option key={s.code} value={s.name}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    )}
                    <input
                      type="text"
                      value={qualForm.intent || ""}
                      onChange={(e) =>
                        setQualForm({
                          ...qualForm,
                          intent: e.target.value,
                        })
                      }
                      className="w-full bg-[#21103f] border border-[#3e206c] text-white text-xs rounded-lg p-2 outline-none focus:border-purple-500"
                      placeholder="Or specify custom service / requirement..."
                    />
                  </div>
                </div>

                {/* Configured Qualification Fields from Organization */}
                {qualificationFields && qualificationFields.length > 0
                  ? qualificationFields.map((field) => {
                      const val = qualForm[field.key] ?? "";
                      return (
                        <div key={field.key}>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-secondary/60 mb-1">
                            {field.label || field.key}
                            {field.required && (
                              <span className="text-red-400 ml-0.5">*</span>
                            )}
                          </label>
                          {field.type === "select" &&
                          field.options &&
                          field.options.length > 0 ? (
                            <select
                              value={val}
                              onChange={(e) =>
                                setQualForm({
                                  ...qualForm,
                                  [field.key]: e.target.value,
                                })
                              }
                              className="w-full bg-[#21103f] border border-[#3e206c] text-white text-xs rounded-lg p-2 outline-none focus:border-purple-500"
                            >
                              <option value="">Select...</option>
                              {field.options.map((opt, i) => (
                                <option key={i} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          ) : field.type === "boolean" ? (
                            <select
                              value={
                                val === true || val === "true" || val === "Yes"
                                  ? "Yes"
                                  : val === false ||
                                      val === "false" ||
                                      val === "No"
                                    ? "No"
                                    : ""
                              }
                              onChange={(e) =>
                                setQualForm({
                                  ...qualForm,
                                  [field.key]: e.target.value,
                                })
                              }
                              className="w-full bg-[#21103f] border border-[#3e206c] text-white text-xs rounded-lg p-2 outline-none focus:border-purple-500"
                            >
                              <option value="">Not Specified</option>
                              <option value="Yes">Yes</option>
                              <option value="No">No</option>
                            </select>
                          ) : (
                            <input
                              type={field.type === "number" ? "number" : "text"}
                              value={val}
                              onChange={(e) =>
                                setQualForm({
                                  ...qualForm,
                                  [field.key]: e.target.value,
                                })
                              }
                              className="w-full bg-[#21103f] border border-[#3e206c] text-white text-xs rounded-lg p-2 outline-none focus:border-purple-500"
                              placeholder={
                                field.description || `Enter ${field.label}...`
                              }
                            />
                          )}
                        </div>
                      );
                    })
                  : null}

                {/* Additional captured attributes in lead.aiQualification not covered by schema */}
                {Object.entries(qualForm)
                  .filter(([k]) => {
                    const excluded = [
                      "city",
                      "preferredCallDate",
                      "preferredCallTime",
                      "preferredVisitDate",
                      "urgency",
                      "interestScore",
                      "intent",
                      "liftType",
                      "_id",
                      "__v",
                      "id",
                      ...(qualificationFields || []).map((f) => f.key),
                    ];
                    return !excluded.includes(k);
                  })
                  .map(([key, value]) => {
                    const label = key
                      .replace(/([A-Z])/g, " $1")
                      .replace(/^./, (str) => str.toUpperCase());
                    return (
                      <div key={key}>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-secondary/60 mb-1">
                          {label}
                        </label>
                        <input
                          type="text"
                          value={value ?? ""}
                          onChange={(e) =>
                            setQualForm({ ...qualForm, [key]: e.target.value })
                          }
                          className="w-full bg-[#21103f] border border-[#3e206c] text-white text-xs rounded-lg p-2 outline-none focus:border-purple-500"
                          placeholder={`Enter ${label}...`}
                        />
                      </div>
                    );
                  })}

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-secondary/60 mb-1">
                    City / Site Location
                  </label>
                  <input
                    type="text"
                    value={qualForm.city}
                    onChange={(e) =>
                      setQualForm({ ...qualForm, city: e.target.value })
                    }
                    className="w-full bg-[#21103f] border border-[#3e206c] text-white text-xs rounded-lg p-2 outline-none"
                    placeholder="e.g. Hyderabad, Vijayawada"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-secondary/60 mb-1">
                      Callback Date
                    </label>
                    <input
                      type="text"
                      value={qualForm.preferredCallDate}
                      onChange={(e) =>
                        setQualForm({ ...qualForm, preferredCallDate: e.target.value })
                      }
                      className="w-full bg-[#21103f] border border-[#3e206c] text-white text-xs rounded-lg p-2 outline-none"
                      placeholder="e.g. Tomorrow, Monday"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-secondary/60 mb-1">
                      Callback Time
                    </label>
                    <input
                      type="text"
                      value={qualForm.preferredCallTime}
                      onChange={(e) =>
                        setQualForm({ ...qualForm, preferredCallTime: e.target.value })
                      }
                      className="w-full bg-[#21103f] border border-[#3e206c] text-white text-xs rounded-lg p-2 outline-none"
                      placeholder="e.g. 11:00 AM, Evening"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-secondary/60 mb-1">
                      Urgency
                    </label>
                    <select
                      value={qualForm.urgency}
                      onChange={(e) =>
                        setQualForm({ ...qualForm, urgency: e.target.value })
                      }
                      className="w-full bg-[#21103f] border border-[#3e206c] text-white text-xs rounded-lg p-2 outline-none"
                    >
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-secondary/60 mb-1">
                      Interest Score (0-10)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={qualForm.interestScore}
                      onChange={(e) =>
                        setQualForm({
                          ...qualForm,
                          interestScore: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full bg-[#21103f] border border-[#3e206c] text-white text-xs rounded-lg p-2 outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={savingQual}
                  className="w-full bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white font-bold py-2 rounded-lg text-xs transition-colors"
                >
                  {savingQual ? "Saving..." : "Update Qualification Data"}
                </button>
              </form>
            </div>

            {/* AI Tags Section */}
            <div>
              <div className="flex items-center gap-2 mb-3 border-b border-[#361c5a] pb-2 text-white">
                <Tag className="w-5 h-5 text-purple-400" />
                <h2 className="font-bold text-sm uppercase tracking-wide">
                  Lead Tags
                </h2>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-3">
                {(selectedConv.leadId?.aiTags || []).map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-500/10 text-purple-300 rounded-full text-xs font-semibold"
                  >
                    {tag}
                    <button
                      onClick={() => handleDeleteTag(tag)}
                      className="text-purple-400 hover:text-red-400 transition-colors ml-1 font-bold text-[10px]"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              <form onSubmit={handleAddTag} className="flex gap-2">
                <input
                  type="text"
                  placeholder="New tag..."
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  className="flex-grow bg-[#21103f] border border-[#3e206c] text-white text-xs rounded-lg p-2 outline-none"
                />
                <button
                  type="submit"
                  className="px-3 bg-[#3e206c] hover:bg-[#592e9c] text-white rounded-lg text-xs"
                >
                  Add
                </button>
              </form>
            </div>

            {/* Summary Insights */}
            <div>
              <div className="flex items-center gap-2 mb-3 border-b border-[#361c5a] pb-2 text-white">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <h2 className="font-bold text-sm uppercase tracking-wide">
                  Conversation Insights
                </h2>
              </div>

              <div className="space-y-3.5 bg-[#21103f]/40 p-3 rounded-xl border border-[#351b5a]/60 text-xs">
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-brand-secondary/50 mb-1">
                    AI Summary
                  </h4>
                  <p className="text-brand-secondary/90 leading-relaxed font-medium">
                    {selectedConv.leadId?.conversationSummary ||
                      "No summary compiled yet."}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-brand-secondary/50 mb-0.5">
                      Sentiment
                    </h4>
                    <span className="font-bold text-white text-xs">
                      {selectedConv.leadId?.sentiment || "Neutral"}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-brand-secondary/50 mb-0.5">
                      Prob. Conversion
                    </h4>
                    <span className="font-bold text-purple-400 text-xs flex items-center gap-0.5">
                      <TrendingUp className="w-3.5 h-3.5" />
                      {selectedConv.leadId?.probabilityOfConversion ?? 50}%
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-brand-secondary/50 mb-1">
                    Next Action
                  </h4>
                  <p className="text-white font-semibold">
                    {selectedConv.leadId?.nextAction || "None"}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Tools */}
            <div>
              <div className="flex items-center gap-2 mb-3 border-b border-[#361c5a] pb-2 text-white">
                <UserCheck className="w-5 h-5 text-purple-400" />
                <h2 className="font-bold text-sm uppercase tracking-wide">
                  CRM Actions
                </h2>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setFollowUpOpen(true)}
                  className="flex items-center justify-center gap-2 w-full bg-[#361c5a] hover:bg-[#482575] text-white py-2 rounded-lg text-xs font-semibold transition-all border border-[#502b7b]"
                >
                  <Calendar className="w-4 h-4 text-purple-400" />
                  Schedule Follow Up
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Follow Up scheduling modal */}
      {followUpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs">
          <div className="w-96 bg-[#1a0c35] text-white rounded-2xl shadow-2xl border border-[#361c5a] p-5">
            <div className="flex items-center justify-between mb-4 border-b border-[#361c5a] pb-2">
              <h3 className="font-bold text-md flex items-center gap-1.5">
                <Calendar className="w-5 h-5 text-purple-400" />
                Schedule CRM Follow Up
              </h3>
              <button
                onClick={() => setFollowUpOpen(false)}
                className="p-1 hover:bg-[#361c5a] rounded-lg text-brand-secondary/80"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFollowUp} className="space-y-4 text-xs">
              <div>
                <label className="block text-brand-secondary/65 font-bold uppercase tracking-wider mb-1 text-[9px]">
                  Method Mode
                </label>
                <select
                  value={followUpData.type}
                  onChange={(e) =>
                    setFollowUpData({ ...followUpData, type: e.target.value })
                  }
                  className="w-full bg-[#21103f] border border-[#3e206c] text-white rounded-lg p-2.5 outline-none"
                >
                  <option value="WhatsApp">WhatsApp Message</option>
                  <option value="Call">Phone Call</option>
                  <option value="Email">Email Broadcast</option>
                  <option value="Meeting">In-Person Meeting</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-brand-secondary/65 font-bold uppercase tracking-wider mb-1 text-[9px]">
                    Schedule Date
                  </label>
                  <input
                    type="date"
                    required
                    value={followUpData.date}
                    onChange={(e) =>
                      setFollowUpData({ ...followUpData, date: e.target.value })
                    }
                    className="w-full bg-[#21103f] border border-[#3e206c] text-white rounded-lg p-2.5 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-brand-secondary/65 font-bold uppercase tracking-wider mb-1 text-[9px]">
                    Schedule Time
                  </label>
                  <input
                    type="text"
                    required
                    value={followUpData.time}
                    onChange={(e) =>
                      setFollowUpData({ ...followUpData, time: e.target.value })
                    }
                    className="w-full bg-[#21103f] border border-[#3e206c] text-white rounded-lg p-2.5 outline-none"
                    placeholder="e.g. 11:00 AM"
                  />
                </div>
              </div>

              <div>
                <label className="block text-brand-secondary/65 font-bold uppercase tracking-wider mb-1 text-[9px]">
                  Priority
                </label>
                <div className="flex gap-4 mt-1">
                  {["Low", "Medium", "High"].map((p) => (
                    <label
                      key={p}
                      className="flex items-center gap-1.5 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="priority"
                        value={p}
                        checked={followUpData.priority === p}
                        onChange={(e) =>
                          setFollowUpData({
                            ...followUpData,
                            priority: e.target.value,
                          })
                        }
                        className="text-purple-400 focus:ring-0 bg-transparent border-[#3e206c]"
                      />
                      <span>{p}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-brand-secondary/65 font-bold uppercase tracking-wider mb-1 text-[9px]">
                  Task Notes / Details
                </label>
                <textarea
                  rows={3}
                  required
                  value={followUpData.notes}
                  onChange={(e) =>
                    setFollowUpData({ ...followUpData, notes: e.target.value })
                  }
                  className="w-full bg-[#21103f] border border-[#3e206c] text-white rounded-lg p-2.5 outline-none"
                  placeholder="Task instruction for sales agent..."
                />
              </div>

              <button
                type="submit"
                className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-4 rounded-xl text-xs transition-colors shadow-lg"
              >
                Schedule Task
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
