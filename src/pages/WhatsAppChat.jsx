import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import {
  MessageSquare,
  Bot,
  User,
  Send,
  RefreshCw,
  Play,
  FileText,
  MapPin,
  Tag,
  Clock,
  Sparkles,
  TrendingUp,
  UserCheck,
  Check,
  CheckCheck,
  Smile,
  AlertCircle,
  Calendar,
  X,
  QrCode,
  Eye,
  Copy,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Users,
  SlidersHorizontal,
  Search,
  ExternalLink,
  ShieldCheck,
  Filter,
  Paperclip,
} from "lucide-react";
import { socket } from "../utils/socket.js";
import { API_ENDPOINTS, BACKEND_URL } from "../utils/constants.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useLeads } from "../context/LeadsContext.jsx";
import WhatsAppConnectModal from "../components/whatsapp/WhatsAppConnectModal.jsx";
import { getLocalTodayDateString } from "../utils/helpers.js";

export default function WhatsAppChat() {
  const { currentUser, organization, allUsers } = useAuth();
  const { activeServices, qualificationFields } = useLeads();
  const orgId = organization?.id || organization?._id || currentUser?.organizationId;
  const currentOrgSessionId = orgId ? `org_${orgId}` : "device_1";

  const navigate = useNavigate();
  const location = useLocation();
  const messagesEndRef = useRef(null);

  // Connection & Session States
  const [sessions, setSessions] = useState([]);
  const [whatsappLineLimit, setWhatsappLineLimit] = useState(1);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [sessionLoadingMap, setSessionLoadingMap] = useState({});
  const [connectModalOpen, setConnectModalOpen] = useState(false);

  // Multi-user feature states
  const normalizedRole = String(currentUser?.role || "").toLowerCase().trim();
  const isManager =
    ["sales manager", "super_admin", "super admin"].includes(normalizedRole) ||
    Boolean(currentUser?.isOrgOwner);
  const isSalesRep =
    ["sales person", "sales representative", "sales_person"].includes(normalizedRole);
  const [repSessionError, setRepSessionError] = useState("");
  const [repFilterUserId, setRepFilterUserId] = useState("all");
  const [teamStatuses, setTeamStatuses] = useState([]);
  const [summaryModal, setSummaryModal] = useState(false);
  const [chatSummary, setChatSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Conversations List
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalConversations, setTotalConversations] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [isQualPanelOpen, setIsQualPanelOpen] = useState(false);

  // Active Chat Message history
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [sendError, setSendError] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

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
    date: getLocalTodayDateString(),
    time: "11:00 AM",
    priority: "Medium",
    notes: "",
  });

  // Live countdown ticker
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

  const getAssignedRepName = (lead) => {
    if (!lead || !lead.assignedTo) return "Unassigned";
    const assigned = lead.assignedTo;
    if (typeof assigned === "object" && assigned?.name) {
      return assigned.name;
    }
    const assignedStr = String(assigned).trim();
    if (!assignedStr) return "Unassigned";
    const matchedUser = allUsers?.find(
      (u) => String(u.id || u._id) === assignedStr
    );
    if (matchedUser?.name) return matchedUser.name;
    if (!assignedStr.match(/^[0-9a-fA-F]{24}$/)) {
      return assignedStr;
    }
    return "Unassigned";
  };

  const formatConversationTime = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "";
    const nowDate = new Date();
    const today = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate());
    const msgDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffDays = Math.floor((today - msgDay) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    if (diffDays === 1) {
      return "Yesterday";
    }
    if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: "short" });
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const getMessageDateLabel = (dateStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    const nowDate = new Date();
    const today = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate());
    const msgDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffDays = Math.floor((today - msgDay) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    return date.toLocaleDateString([], {
      day: "numeric",
      month: "short",
      year: date.getFullYear() !== nowDate.getFullYear() ? "numeric" : undefined,
    });
  };

  const primarySessionId = orgId ? `org_${orgId}` : "device_1";
  const secondarySessionId = orgId ? `org_${orgId}_device_2` : "device_2";
  const currentUserId = currentUser?.id || currentUser?._id;
  const ownRepSessionId = orgId
    ? `org_${orgId}_user_${currentUserId}`
    : `user_${currentUserId}`;

  const primarySession = sessions.find(
    (s) =>
      (isSalesRep && (s.isRepSession || s.sessionId === ownRepSessionId)) ||
      (!isSalesRep && (s.sessionId === primarySessionId || s.isPrimary)) ||
      s.sessionId === primarySessionId ||
      s.isPrimary
  ) || {
    sessionId: isSalesRep ? ownRepSessionId : primarySessionId,
    status: "disconnected",
    qrCode: "",
    connectedPhone: "",
    connectedName: "",
    label: isSalesRep ? "My WhatsApp Line" : "Line 1 (Primary)",
    isPrimary: true,
    isRepSession: isSalesRep,
  };

  const secondarySession = sessions.find(
    (s) =>
      s.sessionId === secondarySessionId ||
      (!s.isPrimary && s.sessionId?.includes("device_2"))
  ) || {
    sessionId: secondarySessionId,
    status: "disconnected",
    qrCode: "",
    connectedPhone: "",
    connectedName: "",
    label: "Line 2 (Secondary)",
    isPrimary: false,
  };

  const formatPhoneNumber = (phone) => {
    if (!phone) return "";
    const clean = String(phone).replace(/\D/g, "");
    if (clean.length === 12 && clean.startsWith("91")) {
      return `+91 ${clean.slice(2, 7)} ${clean.slice(7)}`;
    }
    if (clean.length === 10) {
      return `+${clean.slice(0, 5)} ${clean.slice(5)}`;
    }
    return `+${clean}`;
  };

  // Load Status on mount
  useEffect(() => {
    fetchSessionStatus();
    fetchConversations();

    if (isManager) {
      axios
        .get(API_ENDPOINTS.WHATSAPP.TEAM_STATUS)
        .then((res) => setTeamStatuses(Array.isArray(res.data?.data) ? res.data.data : []))
        .catch((err) => console.error("Failed to fetch WhatsApp team statuses", err));
    }

    if (orgId) {
      socket.emit("join_organization", orgId);
    }

    socket.on("whatsapp_status", (data) => {
      if (data.organizationId && orgId && String(data.organizationId) !== String(orgId)) {
        return;
      }
      if (isSalesRep && data.error === "phone_mismatch" && data.sessionId === ownRepSessionId) {
        setRepSessionError(
          data.errorMessage || "Phone number mismatch. Please scan using your registered WhatsApp number."
        );
      } else if (
        isSalesRep &&
        data.sessionId === ownRepSessionId &&
        (data.status === "connected" || data.status === "qr" || data.status === "connecting")
      ) {
        setRepSessionError("");
      }

      setSessions((prev) => {
        const existingIndex = prev.findIndex((s) => s.sessionId === data.sessionId);
        if (existingIndex >= 0) {
          const newSessions = [...prev];
          newSessions[existingIndex] = {
            ...newSessions[existingIndex],
            ...data,
            isRepSession:
              newSessions[existingIndex].isRepSession ??
              (isSalesRep && data.sessionId === ownRepSessionId),
            isPrimary:
              newSessions[existingIndex].isPrimary ??
              (data.sessionId === primarySessionId ||
                (isSalesRep && data.sessionId === ownRepSessionId)),
          };
          return newSessions;
        } else {
          return [
            ...prev,
            {
              ...data,
              isRepSession: isSalesRep && data.sessionId === ownRepSessionId,
              isPrimary:
                data.sessionId === primarySessionId ||
                (isSalesRep && data.sessionId === ownRepSessionId),
            },
          ];
        }
      });
    });

    socket.on("conversation_updated", () => {
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

    socket.on("organization_updated", (data) => {
      if (data?.whatsappLineLimit) {
        setWhatsappLineLimit(data.whatsappLineLimit);
        fetchSessionStatus();
      }
    });

    return () => {
      socket.off("whatsapp_status");
      socket.off("conversation_updated");
      socket.off("ai_status_updated");
      socket.off("organization_updated");
    };
  }, [orgId, isManager, isSalesRep, currentUser?.id, currentUser?._id]);

  // Set up socket subscription for selected chat
  useEffect(() => {
    if (!selectedConv) return;
    const currentLeadId = selectedConv.leadId?.id || selectedConv.leadId?._id;

    if (currentLeadId) {
      socket.emit("join_lead_chat", currentLeadId);
    }

    socket.on("new_message", (msg) => {
      const msgLeadId = msg.leadId?._id || msg.leadId?.id || msg.leadId;
      if (String(msgLeadId) === String(currentLeadId)) {
        setMessages((prev) => {
          if (prev.some((m) => m.messageId === msg.messageId)) return prev;
          return [...prev, msg];
        });
        scrollToBottom();
      }
    });

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
      })
    );

    return () => {
      if (currentLeadId) {
        socket.emit("leave_lead_chat", currentLeadId);
      }
      socket.off("new_message");
      socket.off("typing_status");
    };
  }, [selectedConv]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const fetchSessionStatus = async () => {
    try {
      const res = await axios.get(API_ENDPOINTS.WHATSAPP.STATUS);
      if (res.data && res.data.sessions) {
        const nextSessions = Array.isArray(res.data.sessions) ? res.data.sessions : [];
        setSessions(nextSessions);
        if (isSalesRep) {
          const repSession = nextSessions.find((session) => session.isRepSession);
          if (
            repSession?.status === "connected" ||
            repSession?.status === "qr" ||
            repSession?.status === "connecting"
          ) {
            setRepSessionError("");
          } else if (repSession?.errorMessage) {
            setRepSessionError(repSession.errorMessage);
          } else {
            setRepSessionError("");
          }
        }
        if (res.data.whatsappLineLimit) {
          setWhatsappLineLimit(res.data.whatsappLineLimit);
        }
      } else {
        const nextSessions = Array.isArray(res.data) ? res.data : [];
        setSessions(nextSessions);
        if (isSalesRep) {
          const repSession = nextSessions.find((session) => session.isRepSession);
          if (
            repSession?.status === "connected" ||
            repSession?.status === "qr" ||
            repSession?.status === "connecting"
          ) {
            setRepSessionError("");
          } else if (repSession?.errorMessage) {
            setRepSessionError(repSession.errorMessage);
          } else {
            setRepSessionError("");
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch WhatsApp connection status", err);
    }
  };

  useEffect(() => {
    if (!connectModalOpen) {
      fetchSessionStatus();
      return undefined;
    }
    const timer = window.setInterval(fetchSessionStatus, 1500);
    return () => window.clearInterval(timer);
  }, [connectModalOpen, isSalesRep]);

  useEffect(() => {
    const timer = window.setInterval(fetchSessionStatus, 30000);
    return () => window.clearInterval(timer);
  }, []);

  const fetchConversations = async (pageNum = 1, append = false, queryOverrides = {}) => {
    try {
      if (pageNum === 1 && !append) {
        setConversationsLoading(true);
      } else {
        setLoadingMore(true);
      }

      const activeSearch =
        queryOverrides.search !== undefined ? queryOverrides.search : searchQuery;
      const activeUnread =
        queryOverrides.unreadOnly !== undefined ? queryOverrides.unreadOnly : unreadOnly;
      const activeRep =
        queryOverrides.repFilterUserId !== undefined
          ? queryOverrides.repFilterUserId
          : repFilterUserId;

      const params = {
        page: pageNum,
        limit: 30,
      };

      if (activeSearch && activeSearch.trim()) {
        params.search = activeSearch.trim();
      }
      if (activeUnread) {
        params.unreadOnly = "true";
      }
      if (isManager && activeRep !== "all" && activeRep !== "admin") {
        params.userId = activeRep;
      }

      const res = await axios.get(API_ENDPOINTS.WHATSAPP.CONVERSATIONS, { params });
      const rawData = res.data;
      const list = Array.isArray(rawData) ? rawData : (rawData?.conversations || []);
      const total = typeof rawData?.total === "number" ? rawData.total : list.length;
      const more = typeof rawData?.hasMore === "boolean" ? rawData.hasMore : false;

      setTotalConversations(total);
      setHasMore(more);
      setPage(pageNum);

      setConversations((prev) => {
        if (append && pageNum > 1) {
          const existingIds = new Set(prev.map((c) => String(c.id || c._id)));
          const freshItems = list.filter((c) => !existingIds.has(String(c.id || c._id)));
          return [...prev, ...freshItems];
        }
        return list;
      });

      setConversationsLoading(false);
      setLoadingMore(false);

      if (pageNum === 1) {
        const searchParams = new URLSearchParams(location.search);
        const targetLeadId = location.state?.selectLeadId || searchParams.get("leadId");
        if (targetLeadId) {
          const found = list.find((c) => {
            const lId = c.leadId?._id || c.leadId?.id || c.leadId;
            return String(lId) === String(targetLeadId);
          });
          if (found) {
            handleSelectConversation(found);
          } else {
            try {
              const leadRes = await axios.get(
                `${API_ENDPOINTS.LEADS.BASE}/${targetLeadId}`
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
              console.error("Failed to load lead details for mock conversation", err);
            }
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch conversations", err);
      setConversationsLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (hasMore && !loadingMore && !conversationsLoading) {
      fetchConversations(page + 1, true);
    }
  };

  const handleConversationScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 60) {
      if (hasMore && !loadingMore && !conversationsLoading) {
        handleLoadMore();
      }
    }
  };

  // Debounce search query to trigger server-side pagination
  const isInitialSearchRender = useRef(true);
  useEffect(() => {
    if (isInitialSearchRender.current) {
      isInitialSearchRender.current = false;
      return;
    }
    const timer = setTimeout(() => {
      fetchConversations(1, false, { search: searchQuery });
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Re-fetch conversations when sales rep filter changes
  const isInitialRepRender = useRef(true);
  useEffect(() => {
    if (isInitialRepRender.current) {
      isInitialRepRender.current = false;
      return;
    }
    fetchConversations(1, false, { repFilterUserId });
  }, [repFilterUserId]);

  const handleConnect = async (targetSessionId, deviceNum = 1) => {
    const sId =
      targetSessionId ||
      (isSalesRep
        ? ownRepSessionId
        : deviceNum === 2
        ? secondarySessionId
        : primarySessionId);
    setSessionLoadingMap((prev) => ({ ...prev, [sId]: true }));
    setSessionLoading(true);
    setConnectModalOpen(true);
    if (isSalesRep) setRepSessionError("");
    try {
      await axios.post(API_ENDPOINTS.WHATSAPP.CONNECT, {
        sessionId: sId,
        device: deviceNum,
      });
      setTimeout(fetchSessionStatus, 1500);
    } catch (err) {
      console.error("Failed to connect WhatsApp session:", err);
      alert("Failed to send connect command.");
    } finally {
      setSessionLoadingMap((prev) => ({ ...prev, [sId]: false }));
      setSessionLoading(false);
    }
  };

  const handleLogout = async (sessionId) => {
    if (!sessionId) return;
    if (
      !window.confirm("Are you sure you want to disconnect this WhatsApp session?")
    )
      return;
    setSessionLoadingMap((prev) => ({ ...prev, [sessionId]: true }));
    setSessionLoading(true);
    try {
      await axios.post(API_ENDPOINTS.WHATSAPP.LOGOUT, { sessionId });
      fetchSessionStatus();
    } catch (err) {
      console.error("Failed to logout WhatsApp session:", err);
      alert("Failed to send logout command.");
    } finally {
      setSessionLoadingMap((prev) => ({ ...prev, [sessionId]: false }));
      setSessionLoading(false);
    }
  };

  const handleSelectConversation = async (conv) => {
    setSelectedConv(conv);
    setMessagesLoading(true);
    setMessages([]);

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
        API_ENDPOINTS.WHATSAPP.CONVERSATION(conv.leadId?.id)
      );
      setMessages(res.data);
      setMessagesLoading(false);
      scrollToBottom();
    } catch (err) {
      console.error("Failed to load message logs", err);
      setMessagesLoading(false);
    }
  };

  const handleToggleAI = async () => {
    if (!selectedConv) return;
    const leadId = selectedConv.leadId?._id || selectedConv.leadId?.id;
    const nextState = !selectedConv.leadId?.aiEnabled;
    try {
      const res = await axios.post(API_ENDPOINTS.WHATSAPP.AI_TOGGLE, {
        leadId,
        aiEnabled: nextState,
      });

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
        })
      );
    } catch {
      alert("Failed to toggle AI state.");
    }
  };

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
        })
      );
    } catch {
      alert("Failed to resume AI.");
    }
  };

  const handleSend = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!selectedConv) return;
    if (!inputValue.trim() && !selectedFile) return;

    const messageText = inputValue.trim();
    const leadId = selectedConv.leadId?._id || selectedConv.leadId?.id;
    setInputValue("");
    setSendError("");
    setSendingMessage(true);

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
        })
      );
    }

    if (selectedFile) {
      try {
        const formData = new FormData();
        formData.append("leadId", leadId);
        formData.append("file", selectedFile);
        if (messageText) formData.append("caption", messageText);
        formData.append("senderName", currentUser?.name || "System");

        const token =
          localStorage.getItem("salesbuster_token") ||
          localStorage.getItem("kranthi_token");

        await axios.post(`${BACKEND_URL}/api/whatsapp/send-document`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        setSelectedFile(null);
      } catch (err) {
        setSendError(
          err.response?.data?.message ||
            "Failed to send document. Please verify your WhatsApp connection and try again."
        );
      } finally {
        setSendingMessage(false);
      }
      return;
    }

    try {
      await axios.post(API_ENDPOINTS.WHATSAPP.SEND_MESSAGE, {
        leadId,
        text: messageText,
        senderName: currentUser?.name || "System",
      });
    } catch (err) {
      setSendError(
        err.response?.data?.message ||
          "Failed to send message. Please verify your WhatsApp connection and try again."
      );
    } finally {
      setSendingMessage(false);
    }
  };

  const handleSummarizeChat = async (forceRefresh = false) => {
    if (!selectedConv) return;
    const leadId = selectedConv.leadId?._id || selectedConv.leadId?.id;
    if (!leadId) return;
    setSummaryLoading(true);
    setSummaryModal(true);
    if (forceRefresh) setChatSummary(null);
    try {
      const res = await axios.post(
        API_ENDPOINTS.WHATSAPP.SUMMARIZE_CONVERSATION(leadId),
        forceRefresh ? { forceRefresh: true } : {}
      );
      setChatSummary(res.data.data);
    } catch (err) {
      setChatSummary({
        error: err.response?.data?.message || "Failed to generate summary. Please try again.",
      });
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleUpdateQualification = async (e) => {
    e.preventDefault();
    if (!selectedConv) return;
    setSavingQual(true);

    try {
      await axios.put(
        `${API_ENDPOINTS.LEADS.BASE}/${selectedConv.leadId?.id}`,
        {
          aiQualification: qualForm,
        }
      );
      alert("AI Qualification fields updated successfully!");
    } catch {
      alert("Failed to save updates.");
    } finally {
      setSavingQual(false);
    }
  };

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
        }
      );

      setSelectedConv((prev) => ({
        ...prev,
        leadId: { ...prev.leadId, aiTags: res.data.aiTags },
      }));
      setNewTagInput("");
    } catch {
      alert("Failed to add tag.");
    }
  };

  const handleDeleteTag = async (tagToDelete) => {
    if (!selectedConv) return;
    const nextTags = (selectedConv.leadId?.aiTags || []).filter(
      (t) => t !== tagToDelete
    );
    try {
      const res = await axios.put(
        `${API_ENDPOINTS.LEADS.BASE}/${selectedConv.leadId?.id}`,
        {
          aiTags: nextTags,
        }
      );

      setSelectedConv((prev) => ({
        ...prev,
        leadId: { ...prev.leadId, aiTags: res.data.aiTags },
      }));
    } catch {
      alert("Failed to remove tag.");
    }
  };

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
        date: getLocalTodayDateString(),
        time: "11:00 AM",
        priority: "Medium",
        notes: "",
      });
    } catch {
      alert("Failed to schedule follow up.");
    }
  };

  const filteredConversations = useMemo(() => {
    return conversations.filter((c) => {
      const name = c.leadId?.name || "Unknown";
      const phone = c.leadId?.phone || "";
      const cleanQuery = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !cleanQuery ||
        name.toLowerCase().includes(cleanQuery) ||
        phone.includes(cleanQuery);

      if (!matchesSearch) return false;

      if (unreadOnly && (c.unreadCount || 0) <= 0) {
        return false;
      }

      if (dateFilter !== "all") {
        const rawDate = c.lastMessageTime || c.updatedAt || c.createdAt;
        if (!rawDate) return false;
        const itemDate = new Date(rawDate);
        if (isNaN(itemDate.getTime())) return false;

        const nowDate = new Date();
        const today = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate());
        const itemDay = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());
        const diffDays = Math.floor((today.getTime() - itemDay.getTime()) / (1000 * 60 * 60 * 24));

        if (dateFilter === "today" && diffDays !== 0) return false;
        if (dateFilter === "yesterday" && diffDays !== 1) return false;
        if (dateFilter === "last7days" && (diffDays < 0 || diffDays > 7)) return false;
        if (dateFilter === "last30days" && (diffDays < 0 || diffDays > 30)) return false;
      }

      if (!isManager || repFilterUserId === "all") return true;
      if (repFilterUserId === "admin") {
        const msgSessionId = c.leadId?.lastSessionId || "";
        return !msgSessionId.includes("_user_");
      }

      const assignedTo = c.leadId?.assignedTo?._id || c.leadId?.assignedTo;
      const selectedRep = teamStatuses.find(
        (rep) => String(rep.userId) === repFilterUserId
      );
      return (
        String(assignedTo) === repFilterUserId ||
        (selectedRep?.name &&
          String(assignedTo).toLowerCase() === selectedRep.name.toLowerCase())
      );
    });
  }, [conversations, searchQuery, unreadOnly, dateFilter, isManager, repFilterUserId, teamStatuses]);

  const hasActiveFilters = Boolean(
    searchQuery.trim() ||
    unreadOnly ||
    dateFilter !== "all" ||
    (isManager && repFilterUserId !== "all")
  );

  const handleClearFilters = () => {
    setSearchQuery("");
    setUnreadOnly(false);
    setDateFilter("all");
    setRepFilterUserId("all");
    fetchConversations(1, false, { search: "", unreadOnly: false, repFilterUserId: "all" });
  };

  // Channel Connection status helpers
  const isDual = !isSalesRep && whatsappLineLimit >= 2;
  const isPrimaryConnected = primarySession.status === "connected";
  const isSecondaryConnected = isDual && secondarySession.status === "connected";
  const isBothConnected = isDual
    ? isPrimaryConnected && isSecondaryConnected
    : isPrimaryConnected;
  const isPrimaryQR = primarySession.status === "qr";
  const isSecondaryQR = isDual && secondarySession.status === "qr";
  const isAnyQR = isPrimaryQR || isSecondaryQR;
  const isPrimaryConnecting =
    primarySession.status === "connecting" || primarySession.status === "pairing";
  const isSecondaryConnecting =
    isDual && (secondarySession.status === "connecting" || secondarySession.status === "pairing");
  const isAnyConnecting = isPrimaryConnecting || isSecondaryConnecting;

  return (
    <div className="flex flex-col h-[calc(100dvh-65px)] -mb-6 relative overflow-hidden bg-bg-main text-text-primary font-sans select-none">
      {/* Top Header Strip: Channel Connection Status & Quick Controls */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-bg-card border-b border-border-main shrink-0 z-10">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#00a884]/15 text-[#00a884] flex items-center justify-center shrink-0">
              <MessageSquare className="w-4 h-4 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-text-primary tracking-tight">
                  WhatsApp Hub
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#00a884]/10 text-[#00a884] border border-[#00a884]/25">
                  {isDual ? "2 Channels" : "1 Channel"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Channel Connection Status Button */}
        <div className="flex items-center gap-2">
          {isBothConnected ? (
            <button
              type="button"
              onClick={() => setConnectModalOpen(true)}
              className="flex items-center gap-2 bg-[#00a884]/10 hover:bg-[#00a884]/20 text-[#00a884] border border-[#00a884]/30 font-semibold py-1.5 px-3 rounded-full text-xs transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[#00a884]"
              title="WhatsApp Line Active · Click to manage"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00a884] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00a884]"></span>
              </span>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="font-medium text-xs">
                {isDual
                  ? "2 Lines Active"
                  : primarySession.connectedPhone
                  ? formatPhoneNumber(primarySession.connectedPhone)
                  : "WhatsApp Connected"}
              </span>
            </button>
          ) : isDual && (isPrimaryConnected || isSecondaryConnected) ? (
            <button
              type="button"
              onClick={() => setConnectModalOpen(true)}
              className="flex items-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-semibold py-1.5 px-3 rounded-full text-xs transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-500"
              title="1 channel active · Click to connect second line"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <span>1/2 Active · Connect Line {isPrimaryConnected ? "2" : "1"}</span>
            </button>
          ) : isAnyQR ? (
            <button
              type="button"
              onClick={() => setConnectModalOpen(true)}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold py-1.5 px-3 rounded-full text-xs shadow-xs animate-pulse transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-500"
              title="Scan QR Code to connect"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Scan QR Code</span>
            </button>
          ) : isAnyConnecting ? (
            <button
              type="button"
              onClick={() => setConnectModalOpen(true)}
              className="flex items-center gap-2 bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/30 font-semibold py-1.5 px-3 rounded-full text-xs transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-sky-500"
            >
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Connecting WhatsApp...</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setConnectModalOpen(true)}
              className="flex items-center gap-2 bg-[#00a884] hover:bg-[#008f72] text-white font-semibold py-1.5 px-3.5 rounded-full text-xs shadow-sm transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#00a884]"
              title="Connect WhatsApp"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Connect WhatsApp</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Two-Panel Workspace */}
      <div className="flex flex-1 overflow-hidden min-h-0 select-text">
        {/* Left Side: WhatsApp Conversation List */}
        <div
          className={`w-full md:w-[360px] flex flex-col border-r border-border-main bg-bg-card shrink-0 ${
            selectedConv ? "hidden md:flex" : "flex"
          }`}
        >
          {/* Search & Filter Toolbar */}
          <div className="p-2.5 border-b border-border-main space-y-2 bg-bg-card">
            {/* Search Input Bar */}
            <div className="relative flex items-center">
              <Search className="absolute left-3 w-4 h-4 text-text-secondary pointer-events-none" />
              <input
                id="whatsapp-conversation-search"
                type="text"
                aria-label="Search or start new chat"
                placeholder="Search or start new chat"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-bg-secondary/60 hover:bg-bg-secondary focus:bg-bg-card border border-transparent focus:border-border-main rounded-lg pl-9 pr-9 py-1.5 text-xs text-text-primary placeholder:text-text-secondary outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 p-1 text-text-secondary hover:text-text-primary rounded-md focus-visible:ring-1 focus-visible:ring-[#00a884]"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Filter Chips: All, Unread, Date filters */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              <button
                type="button"
                onClick={() => {
                  setUnreadOnly(false);
                  setDateFilter("all");
                }}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors ${
                  !unreadOnly && dateFilter === "all"
                    ? "bg-[#00a884]/15 text-[#00a884] font-semibold"
                    : "bg-bg-secondary text-text-secondary hover:text-text-primary"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setUnreadOnly((prev) => !prev)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors ${
                  unreadOnly
                    ? "bg-[#00a884] text-white font-semibold"
                    : "bg-bg-secondary text-text-secondary hover:text-text-primary"
                }`}
              >
                Unread
              </button>
              <select
                aria-label="Filter conversations by date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className={`px-2 py-1 rounded-full text-[11px] font-medium bg-bg-secondary border-none outline-none cursor-pointer ${
                  dateFilter !== "all" ? "text-[#00a884] font-semibold bg-[#00a884]/10" : "text-text-secondary"
                }`}
              >
                <option value="all">Any Date</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="last7days">Last 7 Days</option>
                <option value="last30days">Last 30 Days</option>
              </select>

              {/* Manager: Sales Rep filter */}
              {isManager && (
                <select
                  aria-label="Filter conversations by sales representative"
                  value={repFilterUserId}
                  onChange={(e) => setRepFilterUserId(e.target.value)}
                  className={`px-2 py-1 rounded-full text-[11px] font-medium bg-bg-secondary border-none outline-none cursor-pointer max-w-[130px] truncate ${
                    repFilterUserId !== "all" ? "text-[#00a884] font-semibold bg-[#00a884]/10" : "text-text-secondary"
                  }`}
                  title="Filter by Sales Representative"
                >
                  <option value="all">All Reps</option>
                  <option value="admin">Org Line</option>
                  {teamStatuses.map((rep) => (
                    <option key={rep.userId} value={String(rep.userId)}>
                      {rep.name || "Rep"}
                    </option>
                  ))}
                </select>
              )}

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="text-[11px] text-[#00a884] hover:underline font-semibold ml-auto shrink-0 px-1"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Conversation List Items */}
          <div
            className="flex-1 overflow-y-auto divide-y divide-border-main/50"
            role="region"
            aria-label="Conversation list"
            onScroll={handleConversationScroll}
          >
            {conversationsLoading ? (
              <div
                className="flex flex-col items-center justify-center p-8 text-text-secondary"
                role="status"
                aria-live="polite"
              >
                <RefreshCw className="w-6 h-6 animate-spin text-[#00a884] mb-2" />
                <span className="text-xs">Loading chats...</span>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-text-secondary flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-bg-secondary flex items-center justify-center text-text-secondary mb-3">
                  <MessageSquare className="w-6 h-6 opacity-60" />
                </div>
                <h4 className="text-sm font-semibold text-text-primary mb-1">
                  {hasActiveFilters ? "No chats match your filter" : "No chats yet"}
                </h4>
                <p className="text-xs text-text-secondary max-w-xs mb-3">
                  {hasActiveFilters
                    ? "Try adjusting your search terms or resetting filters."
                    : "When customer leads send a WhatsApp message, conversations appear here."}
                </p>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-bg-secondary hover:bg-bg-secondary/80 text-text-primary transition-colors"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <ul className="divide-y divide-border-main/40" role="list">
                {filteredConversations.map((conv) => {
                  const lead = conv.leadId;
                  const isSelected = selectedConv?.id === conv.id;
                  const leadName = lead?.name || "Unknown Customer";
                  const status = lead?.status || "New";
                  const hasUnread = (conv.unreadCount || 0) > 0;

                  return (
                    <li key={conv.id}>
                      <button
                        onClick={() => handleSelectConversation(conv)}
                        className={`w-full flex items-start gap-3 px-3.5 py-3 text-left transition-colors focus-visible:outline-none focus-visible:bg-bg-secondary ${
                          isSelected
                            ? "bg-bg-secondary/90 dark:bg-[#2a3942]"
                            : "hover:bg-bg-secondary/60 dark:hover:bg-[#202c33]"
                        }`}
                      >
                        {/* Circular WhatsApp Avatar */}
                        <div className="relative shrink-0">
                          <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-[#374248] text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-sm">
                            {leadName.substring(0, 2).toUpperCase()}
                          </div>
                          {lead?.aiEnabled && (
                            <span
                              className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-bg-card flex items-center justify-center ${
                                isLeadAiPaused(lead) ? "bg-amber-500" : "bg-[#00a884]"
                              }`}
                              title={
                                isLeadAiPaused(lead)
                                  ? `AI Snoozed (${getRemainingPauseTime(lead.aiPausedUntil)})`
                                  : "Gemini AI Active"
                              }
                            >
                              <Bot className="w-2 h-2 text-white" />
                            </span>
                          )}
                        </div>

                        {/* Middle & Right Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <h3
                              className="font-semibold text-sm text-text-primary truncate"
                              title={leadName}
                            >
                              {leadName}
                            </h3>
                            <span
                              className={`text-[11px] font-medium whitespace-nowrap shrink-0 ${
                                hasUnread
                                  ? "text-[#00a884] font-semibold"
                                  : "text-text-secondary"
                              }`}
                            >
                              {formatConversationTime(conv.lastMessageTime)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-2 mt-0.5">
                            <p
                              className="text-xs text-text-secondary truncate"
                              title={conv.lastMessage || ""}
                            >
                              {conv.lastMessage || "No messages yet"}
                            </p>

                            {/* Unread Message Counter Badge */}
                            {hasUnread && (
                              <span
                                className="min-w-5 h-5 px-1.5 flex items-center justify-center bg-[#00a884] text-white text-[10px] font-bold rounded-full shadow-xs shrink-0"
                                aria-label={`${conv.unreadCount} unread`}
                              >
                                {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
                              </span>
                            )}
                          </div>

                          {/* Secondary CRM badges: Lead Status & Assigned Rep */}
                          <div className="flex items-center justify-between gap-2 mt-1.5 pt-0.5">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-bg-secondary text-text-secondary shrink-0">
                                {status}
                              </span>
                              {lead?.assignedTo && (
                                <span
                                  className="text-[10px] text-text-secondary truncate max-w-[100px]"
                                  title={`Assigned Rep: ${getAssignedRepName(lead)}`}
                                >
                                  • {getAssignedRepName(lead)}
                                </span>
                              )}
                            </div>

                            {/* AI / Snooze indicator */}
                            {lead?.aiEnabled && isLeadAiPaused(lead) && (
                              <span className="flex items-center gap-1 text-[10px] text-amber-500 font-semibold shrink-0">
                                <Clock className="w-2.5 h-2.5 animate-pulse" />
                                {getRemainingPauseTime(lead.aiPausedUntil)}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            {/* Pagination Load More Controls */}
            {hasMore && !conversationsLoading && (
              <div className="p-3 text-center border-t border-border-main/40">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-bg-secondary hover:bg-bg-secondary/80 text-text-primary transition-colors flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                >
                  {loadingMore ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#00a884]" />
                      <span>Loading more chats...</span>
                    </>
                  ) : (
                    <span>Load more chats</span>
                  )}
                </button>
              </div>
            )}
            {!hasMore && !conversationsLoading && conversations.length > 0 && totalConversations > 0 && (
              <div className="py-3 px-4 text-center text-[11px] text-text-secondary border-t border-border-main/20">
                All {totalConversations} {totalConversations === 1 ? "chat" : "chats"} loaded
              </div>
            )}
          </div>
        </div>

        {/* Center / Right: Selected Conversation Pane */}
        <div
          className={`flex-1 flex flex-col min-w-0 bg-[#efeae2] dark:bg-[#0b141a] relative ${
            selectedConv ? "flex" : "hidden md:flex"
          }`}
        >
          {selectedConv ? (
            <>
              {/* WhatsApp Web Style Contact Header */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-bg-card border-b border-border-main gap-2 shrink-0 z-10 shadow-xs">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Mobile Back Button */}
                  <button
                    type="button"
                    onClick={() => setSelectedConv(null)}
                    className="md:hidden p-1.5 -ml-1 text-text-secondary hover:text-text-primary rounded-full hover:bg-bg-secondary focus-visible:ring-2 focus-visible:ring-[#00a884] transition-colors shrink-0"
                    aria-label="Back to conversations list"
                    title="Back to conversations"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  {/* Header Avatar */}
                  <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-[#374248] text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-sm shrink-0">
                    {(selectedConv.leadId?.name || "Unknown")
                      .substring(0, 2)
                      .toUpperCase()}
                  </div>

                  {/* Contact Info */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2
                        className="font-semibold text-sm text-text-primary truncate max-w-[160px] sm:max-w-xs"
                        title={selectedConv.leadId?.name || "Customer"}
                      >
                        {selectedConv.leadId?.name || "Customer"}
                      </h2>
                      {/* Assigned Rep Badge */}
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-bg-secondary text-text-secondary border border-border-main truncate max-w-[140px]"
                        title={`Assigned Rep: ${getAssignedRepName(selectedConv.leadId)}`}
                      >
                        <UserCheck className="w-3 h-3 text-[#00a884] shrink-0" />
                        <span className="truncate">{getAssignedRepName(selectedConv.leadId)}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                      <span>
                        {formatPhoneNumber(selectedConv.leadId?.phone) || selectedConv.leadId?.phone || "N/A"}
                      </span>
                      {selectedConv.leadId?.phone && (
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(selectedConv.leadId.phone);
                            setCopiedPhone(true);
                            setTimeout(() => setCopiedPhone(false), 2000);
                          }}
                          className="text-text-secondary hover:text-text-primary p-0.5 rounded"
                          title="Copy phone number"
                          aria-label="Copy phone number"
                        >
                          {copiedPhone ? (
                            <Check className="w-3 h-3 text-[#00a884]" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Header Action Tools */}
                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  {/* AI Summarize Chat Button */}
                  <button
                    id="summarize-chat-btn"
                    onClick={() => handleSummarizeChat(false)}
                    disabled={summaryLoading}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-bg-secondary border border-border-main transition-colors disabled:opacity-50"
                    title="Summarize conversation with AI"
                    aria-label="Summarize conversation with AI"
                  >
                    {summaryLoading ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-[#00a884]" />
                    )}
                    <span className="hidden sm:inline">Summarize</span>
                  </button>

                  {/* Auto-AI Toggle */}
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-bg-secondary/70 rounded-lg border border-border-main">
                    <span className="text-[11px] text-text-secondary font-medium hidden sm:inline">
                      Auto AI
                    </span>
                    <button
                      type="button"
                      onClick={handleToggleAI}
                      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:ring-2 focus-visible:ring-[#00a884] ${
                        selectedConv.leadId?.aiEnabled ? "bg-[#00a884]" : "bg-slate-300 dark:bg-slate-600"
                      }`}
                      title={
                        selectedConv.leadId?.aiEnabled
                          ? "Disable automated AI replies"
                          : "Enable automated AI replies"
                      }
                      aria-label="Toggle automated AI replies"
                      role="switch"
                      aria-checked={Boolean(selectedConv.leadId?.aiEnabled)}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          selectedConv.leadId?.aiEnabled ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* View Lead Details Link */}
                  <button
                    type="button"
                    onClick={() =>
                      navigate(`/lead-details/${selectedConv.leadId?.id || selectedConv.leadId?._id}`)
                    }
                    className="text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-bg-secondary border border-border-main px-2.5 py-1.5 rounded-lg transition-colors hidden sm:flex items-center gap-1"
                    title="Open full CRM Lead Details"
                  >
                    <span>Lead</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>

                  {/* Lead Qualifications Toggle */}
                  <button
                    type="button"
                    onClick={() => setIsQualPanelOpen((prev) => !prev)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors border cursor-pointer ${
                      isQualPanelOpen
                        ? "bg-[#00a884]/15 text-[#00a884] border-[#00a884]/35"
                        : "bg-bg-secondary/70 text-text-secondary hover:text-text-primary border-border-main"
                    }`}
                    title={isQualPanelOpen ? "Hide Lead Qualifications" : "Show Lead Qualifications"}
                    aria-label="Toggle Lead Qualifications sidebar"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Quals</span>
                  </button>
                </div>
              </div>

              {/* AI 5-Minute Snooze Alert Banner */}
              {selectedConv.leadId?.aiEnabled && isLeadAiPaused(selectedConv.leadId) && (
                <div className="bg-amber-500/10 border-b border-amber-500/25 px-4 py-2 flex items-center justify-between shrink-0 z-10">
                  <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300">
                    <Clock className="w-4 h-4 text-amber-500 animate-pulse shrink-0" />
                    <span>
                      <strong>AI Snoozed (5 min):</strong> Manual message sent. Auto-resumes in{" "}
                      <span className="font-mono font-bold bg-amber-500/20 px-1.5 py-0.5 rounded">
                        {getRemainingPauseTime(selectedConv.leadId.aiPausedUntil)}
                      </span>
                    </span>
                  </div>
                  <button
                    onClick={handleResumeAI}
                    className="flex items-center gap-1 text-xs font-bold text-amber-800 dark:text-amber-200 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 px-2.5 py-1 rounded-md transition-colors"
                  >
                    <Play className="w-3 h-3 fill-current" /> Resume AI
                  </button>
                </div>
              )}

              {/* Message History Timeline */}
              <div
                className="flex-1 overflow-y-auto p-4 space-y-3"
                role="region"
                aria-label="Message history"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at center, rgba(0,0,0,0.03) 1px, transparent 1px)",
                  backgroundSize: "20px 20px",
                }}
              >
                {messagesLoading ? (
                  <div
                    className="flex flex-col items-center justify-center h-full text-text-secondary"
                    role="status"
                    aria-live="polite"
                  >
                    <RefreshCw className="w-7 h-7 animate-spin text-[#00a884] mb-2" />
                    <span className="text-xs">Loading messages...</span>
                  </div>
                ) : (
                  <>
                    {messages.map((msg, index) => {
                      const isIncoming = msg.direction === "incoming";
                      const prevMsg = messages[index - 1];
                      const currentDateLabel = getMessageDateLabel(msg.timestamp);
                      const prevDateLabel = prevMsg ? getMessageDateLabel(prevMsg.timestamp) : null;
                      const showDateDivider = currentDateLabel && currentDateLabel !== prevDateLabel;

                      return (
                        <React.Fragment key={msg.id || msg.messageId || index}>
                          {/* Centered Date Separator Pill */}
                          {showDateDivider && (
                            <div className="flex justify-center my-2">
                              <span className="bg-bg-card/90 text-text-secondary text-[11px] font-semibold px-3 py-1 rounded-lg shadow-2xs border border-border-main/50 uppercase tracking-wide">
                                {currentDateLabel}
                              </span>
                            </div>
                          )}

                          {/* Message Bubble Container */}
                          <div className={`flex ${isIncoming ? "justify-start" : "justify-end"}`}>
                            <div
                              className={`max-w-[85%] sm:max-w-[72%] rounded-lg p-2.5 px-3 shadow-xs relative group break-words [overflow-wrap:anywhere] ${
                                isIncoming
                                  ? "bg-white dark:bg-[#202c33] text-gray-900 dark:text-[#e9edef] rounded-tl-none border border-black/5 dark:border-white/5"
                                  : "bg-[#d9fdd3] dark:bg-[#005c4b] text-gray-900 dark:text-[#e9edef] rounded-tr-none border border-black/5 dark:border-white/5"
                              }`}
                            >
                              {/* AI Reply Tag */}
                              {!isIncoming && msg.aiGenerated && (
                                <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#00a884]/15 text-[#00a884] text-[9px] font-semibold mb-1">
                                  <Bot className="w-2.5 h-2.5" />
                                  <span>Gemini AI</span>
                                </div>
                              )}

                              {/* Campaign or Rep Name Badge */}
                              {!isIncoming && !msg.aiGenerated && msg.senderName && (
                                <div
                                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold mb-1 ${
                                    msg.source === "cloud_api_campaign"
                                      ? "bg-purple-500/15 text-purple-700 dark:text-purple-300"
                                      : "bg-black/5 dark:bg-white/10 text-text-secondary"
                                  }`}
                                >
                                  {msg.source === "cloud_api_campaign" ? (
                                    <>
                                      <Send className="w-2.5 h-2.5" />
                                      <span>Campaign: {msg.senderName}</span>
                                    </>
                                  ) : (
                                    <>
                                      <User className="w-2.5 h-2.5" />
                                      <span>{msg.senderName}</span>
                                    </>
                                  )}
                                </div>
                              )}

                              {/* Image Attachment */}
                              {msg.mediaUrl && msg.messageType === "image" && (
                                <div className="mb-2 max-w-full sm:max-w-sm rounded-md overflow-hidden border border-black/10">
                                  <img
                                    src={
                                      msg.mediaUrl?.startsWith("http")
                                        ? msg.mediaUrl
                                        : `${BACKEND_URL}${msg.mediaUrl}`
                                    }
                                    alt="WhatsApp attachment"
                                    className="w-full object-contain max-h-60"
                                  />
                                </div>
                              )}

                              {/* Audio Message */}
                              {msg.mediaUrl && msg.messageType === "audio" && (
                                <div className="mb-2 flex items-center gap-2 p-2 bg-black/5 dark:bg-black/20 rounded-lg max-w-full overflow-hidden">
                                  <Play className="w-4 h-4 text-[#00a884] shrink-0" />
                                  <audio
                                    controls
                                    src={`${BACKEND_URL}${msg.mediaUrl}`}
                                    className="h-8 max-w-full w-56 text-xs"
                                    aria-label="Voice audio message"
                                  />
                                </div>
                              )}

                              {/* Document Attachment */}
                              {msg.mediaUrl && msg.messageType === "document" && (
                                <a
                                  href={`${BACKEND_URL}${msg.mediaUrl}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="mb-2 flex items-center gap-2.5 p-2.5 bg-black/5 dark:bg-black/20 hover:bg-black/10 rounded-xl text-text-primary border border-border-main transition-colors shadow-2xs"
                                  aria-label={`Open document: ${msg.fileName || msg.text || "Document Attachment"}`}
                                >
                                  <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-[#00a884] flex items-center justify-center shrink-0">
                                    <FileText className="w-4 h-4" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold truncate">
                                      {msg.fileName || (msg.mediaUrl ? msg.mediaUrl.split("/").pop() : "Document Attachment")}
                                    </p>
                                    <span className="text-[10px] text-text-secondary uppercase">
                                      {msg.mediaUrl?.endsWith(".docx") || msg.fileName?.endsWith(".docx")
                                        ? "Word Document"
                                        : "PDF Document"}
                                    </span>
                                  </div>
                                </a>
                              )}

                              {/* Location Message */}
                              {msg.messageType === "location" && (
                                <div className="mb-2 flex items-center gap-2 p-2 bg-black/5 dark:bg-black/20 rounded-lg text-xs font-medium">
                                  <MapPin className="w-4 h-4 text-red-500 shrink-0" />
                                  <span>{msg.text}</span>
                                </div>
                              )}

                              {/* Message Text / Caption */}
                              {Boolean(msg.text && (msg.messageType !== "document" || msg.fileName || (msg.text && !msg.text.startsWith("doc-")))) && (
                                <p className="text-[13px] leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                                  {msg.text}
                                </p>
                              )}

                              {/* Timestamp and Delivery Status Checks */}
                              <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-gray-500 dark:text-gray-400">
                                <span>
                                  {msg.timestamp
                                    ? new Date(msg.timestamp).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })
                                    : ""}
                                </span>

                                {!isIncoming && (
                                  <span
                                    className="inline-flex items-center ml-0.5"
                                    title={
                                      msg.status === "read"
                                        ? "Read"
                                        : msg.status === "delivered"
                                        ? "Delivered"
                                        : "Sent"
                                    }
                                  >
                                    {msg.status === "read" ? (
                                      <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
                                    ) : msg.status === "delivered" ? (
                                      <CheckCheck className="w-3.5 h-3.5 text-gray-400" />
                                    ) : (
                                      <Check className="w-3.5 h-3.5 text-gray-400" />
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </React.Fragment>
                      );
                    })}

                    {/* Live Gemini AI typing indicator */}
                    {isTyping && (
                      <div className="flex justify-start">
                        <div
                          className="bg-white dark:bg-[#202c33] text-[#00a884] rounded-lg rounded-tl-none p-2.5 shadow-xs flex items-center gap-2 text-xs font-semibold border border-black/5 dark:border-white/5"
                          role="status"
                          aria-live="polite"
                        >
                          <Bot className="w-4 h-4 animate-bounce" />
                          <span>Gemini AI is crafting reply...</span>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Chat Composer Footer */}
              {isManager ? (
                <div
                  className="p-3 border-t border-border-main bg-bg-card flex items-center justify-center gap-2 text-xs font-medium text-text-secondary shrink-0"
                  role="status"
                >
                  <Eye className="w-4 h-4 text-[#00a884] shrink-0" />
                  <span>
                    <strong>Admin Oversight Mode:</strong> View-only access. Messages are handled by{" "}
                    <strong>
                      {selectedConv?.leadId?.assignedTo?.name || "the assigned representative"}
                    </strong>{" "}
                    or organization line.
                  </span>
                </div>
              ) : (
                <div className="border-t border-border-main bg-bg-card shrink-0">
                  {sendError && (
                    <div
                      className="px-4 py-2 bg-red-500/10 border-b border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center justify-between gap-2"
                      role="alert"
                    >
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{sendError}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSendError("")}
                        className="p-0.5 rounded hover:bg-red-500/20"
                        aria-label="Dismiss error"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Attached File Pill */}
                  {selectedFile && (
                    <div className="mx-2.5 sm:mx-3 mb-1 px-3 py-1.5 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-between text-xs animate-fadeIn">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                        <span className="font-bold text-teal-700 dark:text-teal-300 truncate">
                          {selectedFile.name}
                        </span>
                        <span className="text-[10px] text-text-secondary shrink-0">
                          ({(selectedFile.size / 1024).toFixed(0)} KB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedFile(null)}
                        className="text-text-secondary hover:text-text-primary p-1 cursor-pointer ml-2"
                        title="Remove attachment"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <form
                    onSubmit={handleSend}
                    className="p-2.5 sm:p-3 flex items-center gap-2"
                  >
                    <label htmlFor="whatsapp-chat-message-input" className="sr-only">
                      Type a message
                    </label>

                    {/* Hidden file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 25 * 1024 * 1024) {
                            alert("Document exceeds 25 MB limit.");
                            return;
                          }
                          setSelectedFile(file);
                        }
                      }}
                    />

                    {/* Paperclip button */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className={`p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-colors cursor-pointer shrink-0 ${
                        selectedFile ? "text-teal-600 dark:text-teal-400 bg-teal-500/10" : ""
                      }`}
                      title="Attach PDF or Word document (.pdf, .docx, .doc)"
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>

                    <div className="flex-1 relative flex items-center bg-bg-secondary/70 hover:bg-bg-secondary focus-within:bg-bg-card border border-transparent focus-within:border-border-main rounded-lg px-3 py-2 transition-colors">
                      <input
                        id="whatsapp-chat-message-input"
                        type="text"
                        placeholder={selectedFile ? "Add a caption for this document..." : "Type a message (Press Enter to send)"}
                        value={inputValue}
                        onChange={(e) => {
                          setInputValue(e.target.value);
                          if (sendError) setSendError("");
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSend(e);
                          }
                        }}
                        className="w-full bg-transparent outline-none text-text-primary text-xs sm:text-sm placeholder:text-text-secondary"
                      />
                      {inputValue && (
                        <button
                          type="button"
                          onClick={() => setInputValue("")}
                          className="text-text-secondary hover:text-text-primary p-0.5 ml-1"
                          title="Clear message"
                          aria-label="Clear message"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={(!inputValue.trim() && !selectedFile) || sendingMessage}
                      className="p-2.5 bg-[#00a884] hover:bg-[#008f72] disabled:opacity-40 disabled:hover:bg-[#00a884] disabled:cursor-not-allowed rounded-full text-white transition-all shrink-0 shadow-xs focus-visible:ring-2 focus-visible:ring-[#00a884] cursor-pointer"
                      title={inputValue.trim() || selectedFile ? "Send message" : "Type a message or attach a document"}
                      aria-label="Send WhatsApp message"
                    >
                      {sendingMessage ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </button>
                  </form>
                </div>
              )}
            </>
          ) : (
            /* WhatsApp Web Styled Splash / Empty State */
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 sm:p-8 bg-bg-main">
              {primarySession.status === "disconnected" &&
              (isSalesRep || secondarySession.status === "disconnected") ? (
                <div className="max-w-md w-full p-6 sm:p-8 rounded-2xl bg-bg-card border border-border-main flex flex-col items-center shadow-sm text-center">
                  <div className="w-14 h-14 rounded-2xl bg-[#00a884]/10 text-[#00a884] flex items-center justify-center mb-4">
                    <QrCode className="w-7 h-7" />
                  </div>
                  <h2 className="text-lg font-bold text-text-primary mb-2">
                    {isSalesRep ? "Connect Your WhatsApp" : "Connect WhatsApp Lines"}
                  </h2>
                  <p className="text-xs text-text-secondary mb-5 leading-relaxed max-w-sm">
                    {isSalesRep
                      ? "Link your mobile WhatsApp account to engage with leads directly and leverage automated CRM logging."
                      : whatsappLineLimit >= 2
                      ? "Your organization supports 2 simultaneous WhatsApp connections. Click below to view and link channels."
                      : "Connect your organization WhatsApp account to activate real-time chat sync and automated AI qualification."}
                  </p>

                  <button
                    onClick={() => setConnectModalOpen(true)}
                    className="flex items-center gap-2 bg-[#00a884] hover:bg-[#008f72] text-white font-bold py-2.5 px-5 rounded-xl text-xs shadow-sm transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#00a884]"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>
                      {isSalesRep
                        ? "Connect My WhatsApp"
                        : whatsappLineLimit >= 2
                        ? "View & Scan 2 QR Codes"
                        : "Connect WhatsApp"}
                    </span>
                  </button>
                </div>
              ) : (
                <div className="max-w-sm flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-[#00a884]/10 text-[#00a884] flex items-center justify-center mb-4">
                    <MessageSquare className="w-8 h-8 fill-current" />
                  </div>
                  <h2 className="text-xl font-bold text-text-primary mb-2">
                    WhatsApp Web for SalesBuster
                  </h2>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    Select a conversation from the left to start chatting with customer leads, view AI suggestions, and manage qualifications.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Collapsible Panel: Lead Qualifications & CRM Actions */}
        {selectedConv && isQualPanelOpen && (
          <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-96 xl:static xl:w-84 border-l border-border-main bg-bg-card flex flex-col overflow-y-auto shrink-0 p-4 space-y-5 shadow-2xl xl:shadow-none transition-all">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border-main pb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#00a884]" />
                <h3 className="font-bold text-sm text-text-primary uppercase tracking-wide">
                  Lead Qualifications
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsQualPanelOpen(false)}
                className="p-1 rounded-lg hover:bg-bg-secondary text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                aria-label="Close qualifications panel"
                title="Close qualifications"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleUpdateQualification} className="space-y-3.5">
              {/* Service / Product line */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1">
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
                      className="w-full bg-bg-secondary border border-border-main text-text-primary text-xs rounded-lg p-2 outline-none focus:border-[#00a884]"
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
                    className="w-full bg-bg-secondary border border-border-main text-text-primary text-xs rounded-lg p-2 outline-none focus:border-[#00a884]"
                    placeholder="Or specify requirement..."
                  />
                </div>
              </div>

              {/* Dynamic Org Qualification Fields */}
              {qualificationFields && qualificationFields.length > 0
                ? qualificationFields.map((field) => {
                    const val = qualForm[field.key] ?? "";
                    return (
                      <div key={field.key}>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1">
                          {field.label || field.key}
                          {field.required && <span className="text-red-500 ml-0.5">*</span>}
                        </label>
                        {field.type === "select" && field.options && field.options.length > 0 ? (
                          <select
                            value={val}
                            onChange={(e) =>
                              setQualForm({
                                ...qualForm,
                                [field.key]: e.target.value,
                              })
                            }
                            className="w-full bg-bg-secondary border border-border-main text-text-primary text-xs rounded-lg p-2 outline-none focus:border-[#00a884]"
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
                                : val === false || val === "false" || val === "No"
                                ? "No"
                                : ""
                            }
                            onChange={(e) =>
                              setQualForm({
                                ...qualForm,
                                [field.key]: e.target.value,
                              })
                            }
                            className="w-full bg-bg-secondary border border-border-main text-text-primary text-xs rounded-lg p-2 outline-none focus:border-[#00a884]"
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
                            className="w-full bg-bg-secondary border border-border-main text-text-primary text-xs rounded-lg p-2 outline-none focus:border-[#00a884]"
                            placeholder={field.description || `Enter ${field.label}...`}
                          />
                        )}
                      </div>
                    );
                  })
                : null}

              {/* City */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1">
                  City / Location
                </label>
                <input
                  type="text"
                  value={qualForm.city}
                  onChange={(e) =>
                    setQualForm({ ...qualForm, city: e.target.value })
                  }
                  className="w-full bg-bg-secondary border border-border-main text-text-primary text-xs rounded-lg p-2 outline-none focus:border-[#00a884]"
                  placeholder="e.g. Hyderabad, Vijayawada"
                />
              </div>

              {/* Callback Date & Time */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1">
                    Callback Date
                  </label>
                  <input
                    type="text"
                    value={qualForm.preferredCallDate}
                    onChange={(e) =>
                      setQualForm({ ...qualForm, preferredCallDate: e.target.value })
                    }
                    className="w-full bg-bg-secondary border border-border-main text-text-primary text-xs rounded-lg p-2 outline-none focus:border-[#00a884]"
                    placeholder="e.g. Tomorrow"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1">
                    Callback Time
                  </label>
                  <input
                    type="text"
                    value={qualForm.preferredCallTime}
                    onChange={(e) =>
                      setQualForm({ ...qualForm, preferredCallTime: e.target.value })
                    }
                    className="w-full bg-bg-secondary border border-border-main text-text-primary text-xs rounded-lg p-2 outline-none focus:border-[#00a884]"
                    placeholder="e.g. 11:00 AM"
                  />
                </div>
              </div>

              {/* Urgency & Score */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1">
                    Urgency
                  </label>
                  <select
                    value={qualForm.urgency}
                    onChange={(e) =>
                      setQualForm({ ...qualForm, urgency: e.target.value })
                    }
                    className="w-full bg-bg-secondary border border-border-main text-text-primary text-xs rounded-lg p-2 outline-none focus:border-[#00a884]"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1">
                    Score (0-10)
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
                    className="w-full bg-bg-secondary border border-border-main text-text-primary text-xs rounded-lg p-2 outline-none focus:border-[#00a884]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={savingQual}
                className="w-full bg-[#00a884] hover:bg-[#008f72] disabled:opacity-50 text-white font-bold py-2 rounded-lg text-xs transition-colors cursor-pointer"
              >
                {savingQual ? "Saving..." : "Save Qualifications"}
              </button>
            </form>

            {/* AI Tags Section */}
            <div className="pt-2 border-t border-border-main">
              <div className="flex items-center gap-1.5 mb-2.5">
                <Tag className="w-4 h-4 text-[#00a884]" />
                <span className="font-bold text-xs uppercase tracking-wide text-text-primary">
                  Lead Tags
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-2.5">
                {(selectedConv.leadId?.aiTags || []).map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-bg-secondary text-text-primary rounded-full text-xs font-medium border border-border-main"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleDeleteTag(tag)}
                      className="text-text-secondary hover:text-red-500 ml-1 font-bold"
                      title={`Remove tag ${tag}`}
                      aria-label={`Remove tag ${tag}`}
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
                  aria-label="New lead tag"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  className="flex-grow bg-bg-secondary border border-border-main text-text-primary text-xs rounded-lg p-1.5 outline-none focus:border-[#00a884]"
                />
                <button
                  type="submit"
                  className="px-3 bg-bg-secondary hover:bg-bg-secondary/80 text-text-primary border border-border-main rounded-lg text-xs font-semibold"
                >
                  Add
                </button>
              </form>
            </div>

            {/* Conversation Insights */}
            <div className="pt-2 border-t border-border-main">
              <div className="flex items-center gap-1.5 mb-2.5">
                <Sparkles className="w-4 h-4 text-[#00a884]" />
                <span className="font-bold text-xs uppercase tracking-wide text-text-primary">
                  Insights
                </span>
              </div>

              <div className="space-y-2.5 bg-bg-secondary/50 p-2.5 rounded-lg border border-border-main text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary block mb-0.5">
                    Summary
                  </span>
                  <p className="text-text-primary leading-relaxed">
                    {selectedConv.leadId?.conversationSummary || "No summary compiled yet."}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary block mb-0.5">
                      Sentiment
                    </span>
                    <span className="font-bold text-text-primary">
                      {selectedConv.leadId?.sentiment || "Neutral"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary block mb-0.5">
                      Conversion
                    </span>
                    <span className="font-bold text-[#00a884] flex items-center gap-0.5">
                      <TrendingUp className="w-3.5 h-3.5" />
                      {selectedConv.leadId?.probabilityOfConversion ?? 50}%
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary block mb-0.5">
                    Next Action
                  </span>
                  <p className="font-semibold text-text-primary">
                    {selectedConv.leadId?.nextAction || "None"}
                  </p>
                </div>
              </div>
            </div>

            {/* CRM Actions */}
            <div className="pt-2 border-t border-border-main">
              <button
                type="button"
                onClick={() => setFollowUpOpen(true)}
                className="flex items-center justify-center gap-2 w-full bg-bg-secondary hover:bg-bg-secondary/80 text-text-primary py-2 rounded-lg text-xs font-semibold transition-colors border border-border-main cursor-pointer"
              >
                <Calendar className="w-4 h-4 text-[#00a884]" />
                Schedule Follow Up
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Follow Up Scheduling Modal */}
      {followUpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-bg-card text-text-primary rounded-2xl shadow-xl border border-border-main p-5 animate-fadeIn">
            <div className="flex items-center justify-between mb-4 border-b border-border-main pb-2">
              <h3 className="font-bold text-sm flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#00a884]" />
                Schedule CRM Follow Up
              </h3>
              <button
                type="button"
                onClick={() => setFollowUpOpen(false)}
                className="p-1 hover:bg-bg-secondary rounded-lg text-text-secondary"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateFollowUp} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-text-secondary font-bold uppercase tracking-wider mb-1 text-[9px]">
                  Mode
                </label>
                <select
                  value={followUpData.type}
                  onChange={(e) =>
                    setFollowUpData({ ...followUpData, type: e.target.value })
                  }
                  className="w-full bg-bg-secondary border border-border-main text-text-primary rounded-lg p-2 outline-none focus:border-[#00a884]"
                >
                  <option value="WhatsApp">WhatsApp Message</option>
                  <option value="Call">Phone Call</option>
                  <option value="Email">Email Broadcast</option>
                  <option value="Meeting">In-Person Meeting</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-text-secondary font-bold uppercase tracking-wider mb-1 text-[9px]">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={followUpData.date}
                    onChange={(e) =>
                      setFollowUpData({ ...followUpData, date: e.target.value })
                    }
                    className="w-full bg-bg-secondary border border-border-main text-text-primary rounded-lg p-2 outline-none focus:border-[#00a884]"
                  />
                </div>
                <div>
                  <label className="block text-text-secondary font-bold uppercase tracking-wider mb-1 text-[9px]">
                    Time
                  </label>
                  <input
                    type="text"
                    required
                    value={followUpData.time}
                    onChange={(e) =>
                      setFollowUpData({ ...followUpData, time: e.target.value })
                    }
                    className="w-full bg-bg-secondary border border-border-main text-text-primary rounded-lg p-2 outline-none focus:border-[#00a884]"
                    placeholder="11:00 AM"
                  />
                </div>
              </div>

              <div>
                <label className="block text-text-secondary font-bold uppercase tracking-wider mb-1 text-[9px]">
                  Priority
                </label>
                <div className="flex gap-4 mt-1">
                  {["Low", "Medium", "High"].map((p) => (
                    <label key={p} className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="priority"
                        value={p}
                        checked={followUpData.priority === p}
                        onChange={(e) =>
                          setFollowUpData({ ...followUpData, priority: e.target.value })
                        }
                        className="text-[#00a884] focus:ring-0"
                      />
                      <span>{p}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-text-secondary font-bold uppercase tracking-wider mb-1 text-[9px]">
                  Notes
                </label>
                <textarea
                  rows={3}
                  required
                  value={followUpData.notes}
                  onChange={(e) =>
                    setFollowUpData({ ...followUpData, notes: e.target.value })
                  }
                  className="w-full bg-bg-secondary border border-border-main text-text-primary rounded-lg p-2 outline-none focus:border-[#00a884]"
                  placeholder="Task instruction for sales rep..."
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#00a884] hover:bg-[#008f72] text-white font-bold py-2.5 rounded-lg text-xs transition-colors cursor-pointer"
              >
                Schedule Task
              </button>
            </form>
          </div>
        </div>
      )}

      {/* WhatsApp QR Connection Modal */}
      <WhatsAppConnectModal
        isOpen={connectModalOpen}
        onClose={() => {
          setConnectModalOpen(false);
          fetchSessionStatus();
        }}
        sessions={
          isSalesRep
            ? [primarySession]
            : whatsappLineLimit >= 2
            ? [primarySession, secondarySession]
            : [primarySession]
        }
        onConnect={handleConnect}
        onDisconnect={handleLogout}
        onRefresh={fetchSessionStatus}
        loadingSessions={sessionLoadingMap}
        organizationName={organization?.name || currentUser?.organizationName || ""}
        whatsappLineLimit={isSalesRep ? 1 : whatsappLineLimit}
        currentUser={currentUser}
        repSessionError={repSessionError}
      />

      {/* AI Chat Summary Modal */}
      {summaryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-bg-card border border-border-main rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] animate-fadeIn text-text-primary">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border-main shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#00a884]" />
                <h2 className="font-bold text-base text-text-primary">AI Chat Summary</h2>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleSummarizeChat(true)}
                  title="Re-analyze conversation"
                  aria-label="Re-analyze conversation"
                  className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setSummaryModal(false)}
                  title="Close modal"
                  aria-label="Close modal"
                  className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4 overflow-y-auto">
              {summaryLoading && (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                  <RefreshCw className="w-7 h-7 text-[#00a884] animate-spin" />
                  <p className="text-text-secondary text-sm font-medium">Analyzing conversation with AI...</p>
                </div>
              )}

              {chatSummary?.error && !summaryLoading && (
                <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{chatSummary.error}</span>
                </div>
              )}

              {chatSummary && !chatSummary.error && !summaryLoading && (
                <>
                  <div className="p-3.5 bg-bg-secondary/70 border border-border-main rounded-xl">
                    <p className="text-[10px] text-[#00a884] font-bold mb-1 uppercase tracking-wider">Executive Overview</p>
                    <p className="text-xs sm:text-sm text-text-primary leading-relaxed">{chatSummary.summary}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-secondary font-semibold">Customer Sentiment:</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                      chatSummary.sentiment === "High Intent" || chatSummary.sentiment === "Warm"
                        ? "bg-[#00a884]/15 border-[#00a884]/30 text-[#00a884]"
                        : chatSummary.sentiment === "Cold" || chatSummary.sentiment === "Hesitant"
                        ? "bg-red-500/15 border-red-500/30 text-red-600 dark:text-red-400"
                        : "bg-bg-secondary border-border-main text-text-primary"
                    }`}>
                      {chatSummary.sentiment || "Neutral"}
                    </span>
                  </div>

                  {chatSummary.keyPoints?.length > 0 && (
                    <div>
                      <p className="text-[10px] text-[#00a884] font-bold mb-1.5 uppercase tracking-wider">Key Discussion Points</p>
                      <ul className="space-y-1">
                        {chatSummary.keyPoints.map((pt, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-text-primary">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#00a884] mt-0.5 shrink-0" />
                            <span>{pt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {chatSummary.nextSteps?.length > 0 && (
                    <div>
                      <p className="text-[10px] text-[#00a884] font-bold mb-1.5 uppercase tracking-wider">Recommended Next Steps</p>
                      <ul className="space-y-1">
                        {chatSummary.nextSteps.map((step, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-text-primary">
                            <span className="w-4 h-4 shrink-0 bg-[#00a884] rounded-full flex items-center justify-center text-[9px] font-bold text-white mt-0.5">
                              {i + 1}
                            </span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-border-main">
                    <span className="text-[11px] text-text-secondary">
                      {chatSummary.messagesAnalyzed} messages analyzed
                    </span>
                    <button
                      type="button"
                      id="copy-summary-btn"
                      onClick={() => {
                        const text = [
                          `Summary: ${chatSummary.summary}`,
                          `\nSentiment: ${chatSummary.sentiment}`,
                          chatSummary.keyPoints?.length ? `\nKey Points:\n${chatSummary.keyPoints.map((p) => `• ${p}`).join("\n")}` : "",
                          chatSummary.nextSteps?.length ? `\nNext Steps:\n${chatSummary.nextSteps.map((s, i) => `${i + 1}. ${s}`).join("\n")}` : "",
                        ].join("");
                        navigator.clipboard.writeText(text);
                      }}
                      className="text-xs text-[#00a884] hover:underline flex items-center gap-1 font-semibold px-2 py-1"
                    >
                      <Copy className="w-3.5 h-3.5" /> Copy Summary
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
