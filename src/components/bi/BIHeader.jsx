import { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  PanelLeft,
  PanelLeftClose,
  Radio,
  Download,
  MoreVertical,
  Trash2,
  RotateCcw,
  Database,
  Plus,
} from "lucide-react";
import TimeRangeSelect from "./TimeRangeSelect.jsx";

export default function BIHeader({
  activeSession,
  sidebarOpen,
  onToggleSidebar,
  rangeId,
  startDate,
  endDate,
  onRangeChange,
  getRangeLabel,
  onOpenLiveVoice,
  isLiveVoiceActive = false,
  onExportChat,
  onClearChat,
  onDeleteChat,
  onOpenScopeModal,
  onStartNewChat,
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu on click outside or escape
  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    };
    const handleKey = (e) => {
      if (e.key === "Escape") setIsMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    window.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      window.removeEventListener("keydown", handleKey);
    };
  }, [isMenuOpen]);

  return (
    <header className="h-14 border-b border-border-main bg-bg-card/75 backdrop-blur-md px-4 flex items-center justify-between shrink-0 z-20">
      {/* Left: Sidebar Toggle, Title, AI Badge, Session Subtitle */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-1.5 rounded-xl text-text-secondary hover:text-text-primary hover:bg-bg-secondary/60 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-purple-500"
          title={sidebarOpen ? "Hide chat history panel" : "Show chat history panel"}
          aria-label={sidebarOpen ? "Collapse history panel" : "Expand history panel"}
          aria-expanded={sidebarOpen}
        >
          {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-text-primary tracking-tight truncate flex items-center gap-1.5">
              <span>BI Analyst</span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                <Sparkles className="w-2.5 h-2.5" /> AI
              </span>
            </h1>
          </div>
          <p className="text-[11px] text-text-secondary truncate max-w-[200px] sm:max-w-xs md:max-w-md">
            {activeSession?.title || "Ask anything about your CRM pipeline & revenue"}
          </p>
        </div>
      </div>

      {/* Right Controls: Range selector, Voice, Export, New Chat, Overflow */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Time Range Selector */}
        <TimeRangeSelect
          rangeId={rangeId}
          startDate={startDate}
          endDate={endDate}
          onRangeChange={onRangeChange}
          getRangeLabel={getRangeLabel}
        />

        {/* Live Voice Button */}
        {onOpenLiveVoice && (
          <button
            type="button"
            onClick={onOpenLiveVoice}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs focus-visible:ring-2 focus-visible:ring-purple-500 ${
              isLiveVoiceActive
                ? "bg-rose-600 text-white shadow-rose-500/20 animate-pulse"
                : "bg-purple-600 hover:bg-purple-700 text-white"
            }`}
            title={isLiveVoiceActive ? "Close Live Voice" : "Start Live Voice"}
            aria-label="Toggle Live Voice mode"
          >
            <Radio className={`w-3.5 h-3.5 ${isLiveVoiceActive ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">{isLiveVoiceActive ? "End Voice" : "Live Voice"}</span>
          </button>
        )}

        {/* New Chat Button */}
        {onStartNewChat && (
          <button
            type="button"
            onClick={onStartNewChat}
            className="hidden md:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-bg-secondary hover:bg-bg-secondary/70 text-text-primary border border-border-main transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-purple-500"
            title="Start new analysis (Ctrl/Cmd + K)"
            aria-label="New chat"
          >
            <Plus className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span>New</span>
          </button>
        )}

        {/* Overflow Menu */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="p-1.5 rounded-xl text-text-secondary hover:text-text-primary hover:bg-bg-secondary/60 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-purple-500"
            title="More actions"
            aria-label="Conversation menu"
            aria-expanded={isMenuOpen}
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 mt-1.5 w-48 bg-bg-card border border-border-main rounded-2xl shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
              {onOpenScopeModal && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenScopeModal();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-text-primary hover:bg-bg-secondary transition-colors text-left cursor-pointer"
                >
                  <Database className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  <span>CRM Data Scope</span>
                </button>
              )}

              {onExportChat && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onExportChat();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-text-primary hover:bg-bg-secondary transition-colors text-left cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-text-secondary" />
                  <span>Export Chat History</span>
                </button>
              )}

              {onClearChat && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onClearChat();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-text-primary hover:bg-bg-secondary transition-colors text-left cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-text-secondary" />
                  <span>Clear Current Chat</span>
                </button>
              )}

              {activeSession && onDeleteChat && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onDeleteChat(activeSession);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors text-left cursor-pointer border-t border-border-main/50 mt-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Session</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
