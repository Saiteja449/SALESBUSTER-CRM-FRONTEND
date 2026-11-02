import { useState, useEffect, useCallback, useRef } from "react";
import {
  TrendingUp,
  Users,
  Phone,
  BarChart3,
  MessageSquare,
  Database,
  X,
  Lock,
  ShieldAlert,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useGeminiLiveVoice } from "../hooks/useGeminiLiveVoice.js";
import { useTextToSpeech } from "../hooks/useTextToSpeech.js";
import { useSpeechToText } from "../hooks/useSpeechToText.js";
import { useTimeRange } from "../hooks/useTimeRange.js";
import { useChatSessions } from "../hooks/useChatSessions.js";
import { useBIChat } from "../hooks/useBIChat.js";
import { useStickToBottom } from "../hooks/useStickToBottom.js";

import VoiceShell from "../components/voice/VoiceShell.jsx";
import VoiceDock from "../components/voice/VoiceDock.jsx";
import AddonUpgradePrompt from "../components/AddonUpgradePrompt.jsx";

import BIHeader from "../components/bi/BIHeader.jsx";
import HistoryPanel from "../components/bi/HistoryPanel.jsx";
import EmptyState from "../components/bi/EmptyState.jsx";
import MessageList from "../components/bi/MessageList.jsx";
import Composer from "../components/bi/Composer.jsx";
import OfflineBanner from "../components/bi/OfflineBanner.jsx";
import EmailConfirmationCard from "../components/bi/EmailConfirmationCard.jsx";

const DATA_CAPABILITIES = [
  {
    title: "Leads & Conversion Pipeline",
    desc: "Stage distribution (New, Follow Up, Converted, Lost), intake dates, and qualification notes.",
    icon: TrendingUp,
  },
  {
    title: "Salesperson Performance",
    desc: "Assigned lead count, win rates, conversion speed, and active workload by representative.",
    icon: Users,
  },
  {
    title: "Follow-Up Schedules",
    desc: "Overdue tasks, today's call queue, scheduled customer touches, and pending action items.",
    icon: Phone,
  },
  {
    title: "Service & Product Demand",
    desc: "Lead volume categorized by requested offerings and service interests.",
    icon: BarChart3,
  },
  {
    title: "WhatsApp Communication",
    desc: "Inbound customer activity, response responsiveness, and unreplied message tracking.",
    icon: MessageSquare,
  },
];

export default function BIAnalyst() {
  const { organization, currentUser, isSalesPerson, isManager, hasBIAnalystAddon } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth >= 1024;
    }
    return true;
  });

  const [inputValue, setInputValue] = useState("");
  const [showScopeModal, setShowScopeModal] = useState(false);
  const [isLiveVoiceActive, setIsLiveVoiceActive] = useState(false);
  const [isVoiceMinimised, setIsVoiceMinimised] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [voiceSummaryData, setVoiceSummaryData] = useState(null);

  // Time Range
  const {
    rangeId,
    startDate,
    endDate,
    setTimeRange,
    getRangeLabel,
    injectRangeIntoPrompt,
  } = useTimeRange();

  // Sessions
  const {
    sessions,
    groupedSessions,
    activeSessionId,
    setActiveSessionId,
    searchQuery,
    setSearchQuery,
    isLoading: isSessionsLoading,
    error: sessionsError,
    fetchSessions,
    requestDeleteSession,
    undoDelete,
    pendingDelete,
  } = useChatSessions();

  // Chat engine
  const handleSessionCreated = useCallback(
    (newChatId) => {
      setActiveSessionId(newChatId);
      fetchSessions();
    },
    [fetchSessions, setActiveSessionId]
  );

  const {
    messages,
    setMessages,
    loading,
    isSessionLoading,
    error,
    limitError,
    addonRequired,
    options,
    isOffline,
    sendMessage,
    stopRequest,
    retryLastMessage,
    regenerateResponse,
    clearChat,
    loadSessionMessages,
    confirmEmailReport: confirmChatEmailReport,
  } = useBIChat({
    activeSessionId,
    onSessionCreated: handleSessionCreated,
  });

  // Scroll management
  const {
    containerRef: chatScrollRef,
    isScrolledUp,
    scrollToBottom,
    scrollToMessage,
  } = useStickToBottom();

  // Speech-To-Text (Voice Typing)
  const {
    isListening: isVoiceTyping,
    toggleListening: toggleVoiceTyping,
    stopListening: stopVoiceTyping,
  } = useSpeechToText();

  const handleToggleVoiceTyping = () => {
    toggleVoiceTyping((newText) => {
      setInputValue(newText);
    }, inputValue);
  };

  // Text-To-Speech (Read aloud)
  const {
    speakingMessageId,
    speakMessage,
    stopSpeaking,
  } = useTextToSpeech();

  const handleVoiceSessionEnd = useCallback(({ turns: sessionTurns, durationMs }) => {
    setIsLiveVoiceActive(false);
    setIsVoiceMinimised(false);
    if (sessionTurns && sessionTurns.length > 0) {
      setVoiceSummaryData({ turns: sessionTurns, durationMs });
      setIsVoiceModalOpen(true);
    } else {
      setIsVoiceModalOpen(false);
    }
  }, []);

  // Gemini Live Real-time Voice Hook
  const {
    status: liveStatus,
    activeToolName: liveActiveToolName,
    toolDetails: liveToolDetails,
    inputVolume: liveInputVolume,
    outputVolume: liveOutputVolume,
    liveTranscript,
    conversationTurns: liveConversationTurns,
    turns: liveTurns,
    sessionStartedAt,
    error: liveVoiceError,
    voiceName,
    isMuted: isLiveMuted,
    setVoiceName,
    startLiveVoice,
    stopLiveVoice,
    toggleMute: toggleLiveMute,
    interrupt: interruptLive,
    retry: retryLiveVoice,
    pendingEmailDraft,
    setPendingEmailDraft,
    confirmEmailReport: confirmLiveEmailReport,
  } = useGeminiLiveVoice({
    onSessionEnd: handleVoiceSessionEnd,
  });

  // Toggle Live Voice
  const handleOpenLiveVoice = () => {
    if (isLiveVoiceActive) {
      setIsVoiceMinimised(false);
      setIsVoiceModalOpen(true);
    } else {
      setIsLiveVoiceActive(true);
      setIsVoiceMinimised(false);
      setIsVoiceModalOpen(true);
      setVoiceSummaryData(null);
      startLiveVoice(voiceName, activeSessionId);
    }
  };

  const handleCloseLiveVoice = () => {
    stopLiveVoice();
    setIsLiveVoiceActive(false);
    setIsVoiceMinimised(false);
    setIsVoiceModalOpen(false);
  };

  const handleSaveVoiceToChat = useCallback(() => {
    if (!voiceSummaryData) return;
    const { turns: sessionTurns, durationMs } = voiceSummaryData;
    const mins = Math.max(1, Math.round(durationMs / 60000));

    const voiceCardMsg = {
      id: `voice_session_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      role: "assistant",
      content: `🎙️ **Voice Session - ${mins} min (${sessionTurns.length} turns)**\n\n${sessionTurns
        .map((t) => `* **${t.role === "user" ? "You" : "BI Analyst"}:** ${t.text}`)
        .join("\n")}`,
      timestamp: new Date().toISOString(),
      isVoice: true,
    };
    setMessages((prev) => [...prev, voiceCardMsg]);
    setVoiceSummaryData(null);
    setIsVoiceModalOpen(false);
  }, [voiceSummaryData, setMessages]);

  // Tab Title Awareness
  useEffect(() => {
    if (isLiveVoiceActive) {
      const prevTitle = document.title;
      document.title = "● Live | BI Analyst";
      return () => {
        document.title = prevTitle;
      };
    }
  }, [isLiveVoiceActive]);

  // Unified Confirmation Mail Handler
  const handleConfirmEmailReport = useCallback(
    async (draftId, confirmed) => {
      if (confirmLiveEmailReport) {
        confirmLiveEmailReport(draftId, confirmed);
      }
      if (confirmChatEmailReport) {
        await confirmChatEmailReport(draftId, confirmed);
      }
    },
    [confirmLiveEmailReport, confirmChatEmailReport]
  );

  // Auto-scroll on new messages or when loading begins
  useEffect(() => {
    if (!isScrolledUp && messages.length > 0) {
      scrollToBottom({ smooth: true });
    }
  }, [messages.length, loading, isScrolledUp, scrollToBottom]);

  // Select a session
  const handleSelectSession = useCallback(
    (chatId) => {
      if (!chatId) return;
      stopSpeaking();
      stopVoiceTyping();
      setActiveSessionId(chatId);
      loadSessionMessages(chatId);
    },
    [loadSessionMessages, setActiveSessionId, stopSpeaking, stopVoiceTyping]
  );

  // Start new chat
  const handleStartNewChat = useCallback(() => {
    stopSpeaking();
    stopVoiceTyping();
    setActiveSessionId(null);
    clearChat();
    setInputValue("");
  }, [clearChat, setActiveSessionId, stopSpeaking, stopVoiceTyping]);

  // Delete session handler
  const handleDeleteSession = useCallback(
    (session) => {
      requestDeleteSession(session);
      if (activeSessionId === session.id) {
        handleStartNewChat();
      }
    },
    [activeSessionId, handleStartNewChat, requestDeleteSession]
  );

  // Send message
  const handleSend = async (customPrompt) => {
    stopSpeaking();
    stopVoiceTyping();

    const text = (customPrompt || inputValue).trim();
    if (!text || loading) return;

    // Reset input immediately
    setInputValue("");

    // Immediately scroll down so the new question and typing indicator appear instantly
    setTimeout(() => {
      scrollToBottom({ smooth: false });
    }, 20);

    const res = await sendMessage(text);
    if (res?.success) {
      if (res.assistantMsgId) {
        // Scroll to the start of the assistant's answer
        setTimeout(() => {
          scrollToMessage(res.assistantMsgId);
        }, 100);
      } else {
        scrollToBottom();
      }
    } else if (res?.aborted || res?.error) {
      // Restore draft into input on abort or failure
      setInputValue(text);
    }
  };

  // Export entire chat transcript
  const handleExportChat = () => {
    if (messages.length === 0) return;
    const transcript = messages
      .map((m) => {
        const sender = m.role === "user" ? "You" : "BI Analyst";
        const time = m.timestamp ? ` (${new Date(m.timestamp).toLocaleString()})` : "";
        return `### ${sender}${time}\n\n${m.content}\n`;
      })
      .join("\n---\n\n");

    const blob = new Blob([transcript], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `bi-analyst-transcript-${Date.now()}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Access Guard: sales rep role blocking
  const isBlockedRole = isSalesPerson && !isManager && !currentUser?.isOrgOwner;
  if (isBlockedRole) {
    return (
      <div className="flex h-full w-full items-center justify-center p-6 bg-bg-main text-text-primary">
        <div className="max-w-md w-full p-8 rounded-3xl bg-bg-card border border-border-main text-center shadow-lg space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-text-primary">Access Restricted</h2>
          <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
            The BI Analyst workspace provides executive-level revenue reporting and team performance metrics. It is available only for Sales Managers and Organization Owners.
          </p>
          <div className="p-3 rounded-xl bg-bg-secondary/60 text-xs text-text-secondary flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Please contact your organization administrator to request access.</span>
          </div>
        </div>
      </div>
    );
  }

  // Access Guard: add-on upgrade required
  if (!hasBIAnalystAddon || addonRequired) {
    return (
      <div className="h-full w-full overflow-y-auto bg-bg-main">
        <AddonUpgradePrompt addon="biAnalyst" />
      </div>
    );
  }

  const activeSession = sessions.find((s) => (s.id || s._id) === activeSessionId);

  return (
    <div className="flex h-full w-full bg-bg-main overflow-hidden text-text-primary">
      {/* =========================================================================
          LEFT HISTORY PANEL (Desktop ~280px, Mobile slide-over drawer)
          ========================================================================= */}
      <HistoryPanel
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        sessions={sessions}
        groupedSessions={groupedSessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onStartNewChat={handleStartNewChat}
        onDeleteSession={handleDeleteSession}
        undoDelete={undoDelete}
        pendingDelete={pendingDelete}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isLoading={isSessionsLoading}
        error={sessionsError}
        onRetry={fetchSessions}
        organizationName={organization?.name || "SalesBuster"}
      />

      {/* =========================================================================
          MAIN CHAT WORKSPACE
          ========================================================================= */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Sticky Slim Page Header */}
        <BIHeader
          activeSession={activeSession}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          rangeId={rangeId}
          startDate={startDate}
          endDate={endDate}
          onRangeChange={setTimeRange}
          getRangeLabel={getRangeLabel}
          onOpenLiveVoice={handleOpenLiveVoice}
          isLiveVoiceActive={isLiveVoiceActive}
          onExportChat={handleExportChat}
          onClearChat={clearChat}
          onDeleteChat={activeSession ? () => handleDeleteSession(activeSession) : null}
          onOpenScopeModal={() => setShowScopeModal(true)}
          onStartNewChat={handleStartNewChat}
        />

        {/* Unified Live Voice Modal */}
        <VoiceShell
          isOpen={isVoiceModalOpen && !isVoiceMinimised}
          onClose={handleCloseLiveVoice}
          onMinimize={() => setIsVoiceMinimised(true)}
          status={liveStatus}
          activeToolName={liveActiveToolName}
          toolDetails={liveToolDetails}
          inputVolume={liveInputVolume}
          outputVolume={liveOutputVolume}
          liveTranscript={liveTranscript}
          turns={liveTurns}
          sessionStartedAt={sessionStartedAt}
          error={liveVoiceError}
          voiceName={voiceName}
          onVoiceChange={setVoiceName}
          isMuted={isLiveMuted}
          onToggleMute={toggleLiveMute}
          onInterrupt={interruptLive}
          onRetry={retryLiveVoice}
          onTypeInstead={() => {
            handleCloseLiveVoice();
          }}
          onSaveToChat={handleSaveVoiceToChat}
          onDoneSummary={() => {
            setVoiceSummaryData(null);
            setIsVoiceModalOpen(false);
          }}
          summaryData={voiceSummaryData}
          leadName={currentUser?.organization?.name || "Acme Enterprises"}
          pendingEmailDraft={pendingEmailDraft}
          onConfirmEmailReport={handleConfirmEmailReport}
          onDismissEmailReport={() => setPendingEmailDraft(null)}
        />

        {/* Live Voice Minimised Dock */}
        <VoiceDock
          isOpen={isLiveVoiceActive && isVoiceMinimised}
          status={liveStatus}
          liveTranscript={liveTranscript}
          isMuted={isLiveMuted}
          onToggleMute={toggleLiveMute}
          onExpand={() => {
            setIsVoiceMinimised(false);
            setIsVoiceModalOpen(true);
          }}
          onEndCall={handleCloseLiveVoice}
        />

        {/* Offline Status Banner */}
        <div className="px-4 pt-2">
          <OfflineBanner isOffline={isOffline} />
        </div>

        {/* Floating/Pinned Staged Email Report Confirmation Card */}
        {pendingEmailDraft && !isVoiceModalOpen && (
          <div className="px-4 py-2 max-w-3xl sm:max-w-4xl mx-auto w-full animate-in fade-in zoom-in-95 duration-200">
            <EmailConfirmationCard
              draft={pendingEmailDraft}
              onConfirm={handleConfirmEmailReport}
              onDismiss={() => setPendingEmailDraft(null)}
            />
          </div>
        )}

        {/* Chat Canvas / Empty State */}
        {!activeSessionId && messages.length === 0 && !loading && !isSessionLoading ? (
          <div ref={chatScrollRef} className="flex-1 overflow-y-auto">
            <EmptyState
              userName={currentUser?.name}
              onSelectPrompt={(p) => handleSend(p)}
              injectRangeIntoPrompt={injectRangeIntoPrompt}
              onOpenLiveVoice={handleOpenLiveVoice}
              onOpenScopeModal={() => setShowScopeModal(true)}
            />
          </div>
        ) : (
          <MessageList
            scrollRef={chatScrollRef}
            messages={messages}
            loading={loading || isSessionLoading}
            error={error}
            limitError={limitError}
            options={options}
            onSelectOption={(p) => handleSend(p)}
            onRegenerate={regenerateResponse}
            onRetry={retryLastMessage}
            onStop={stopRequest}
            onSpeak={speakMessage}
            onStopSpeaking={stopSpeaking}
            onConfirmEmailReport={handleConfirmEmailReport}
            speakingMessageId={speakingMessageId}
            isScrolledUp={isScrolledUp}
            onJumpToLatest={() => scrollToBottom({ smooth: true })}
          />
        )}

        {/* Sticky Composer */}
        <Composer
          inputValue={inputValue}
          onInputChange={setInputValue}
          onSend={() => handleSend()}
          onStop={stopRequest}
          loading={loading}
          disabled={Boolean(limitError) || isOffline}
          isVoiceTyping={isVoiceTyping}
          onToggleVoiceTyping={handleToggleVoiceTyping}
          onOpenLiveVoice={handleOpenLiveVoice}
          isLiveVoiceActive={isLiveVoiceActive}
          onFocusSearch={() => {
            setSidebarOpen(true);
            window.dispatchEvent(new CustomEvent("sb:focus-search"));
          }}
        />
      </div>

      {/* CRM Data Capabilities Scope Modal */}
      {showScopeModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="scope-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="w-full max-w-lg bg-bg-card rounded-2xl shadow-2xl border border-border-main p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border-main">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 id="scope-modal-title" className="text-sm font-bold text-text-primary">
                    BI Analyst Supported Data Scope
                  </h3>
                  <p className="text-[11px] text-text-secondary">
                    Live CRM datasets available for querying
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowScopeModal(false)}
                className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-secondary"
                aria-label="Close data scope modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {DATA_CAPABILITIES.map((cap, cIdx) => {
                const Icon = cap.icon;
                return (
                  <div
                    key={cIdx}
                    className="p-3 rounded-xl bg-bg-secondary/40 border border-border-main flex items-start gap-3"
                  >
                    <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-text-primary">{cap.title}</h4>
                      <p className="text-[11px] text-text-secondary mt-0.5 leading-relaxed">
                        {cap.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-border-main flex items-center justify-between">
              <span className="text-[10px] text-text-secondary">
                Protected by organization role policies
              </span>
              <button
                type="button"
                onClick={() => setShowScopeModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600 text-white hover:bg-purple-700 transition-colors cursor-pointer"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
