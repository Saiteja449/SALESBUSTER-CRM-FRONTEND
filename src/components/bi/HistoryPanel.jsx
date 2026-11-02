import { useRef, useEffect } from "react";
import {
  Plus,
  Search,
  X,
  RotateCcw,
  Bot,
  PanelLeftClose,
  Sparkles,
} from "lucide-react";
import SessionRow from "./SessionRow.jsx";

export default function HistoryPanel({
  isOpen,
  onClose,
  sessions = [],
  groupedSessions = {},
  activeSessionId,
  onSelectSession,
  onStartNewChat,
  onDeleteSession,
  undoDelete,
  pendingDelete,
  searchQuery,
  onSearchChange,
  isLoading = false,
  error = null,
  onRetry,
  organizationName = "SalesBuster",
}) {
  const searchInputRef = useRef(null);

  // Focus search input when called
  useEffect(() => {
    const handleFocusSearch = () => searchInputRef.current?.focus();
    window.addEventListener("sb:focus-search", handleFocusSearch);
    return () => window.removeEventListener("sb:focus-search", handleFocusSearch);
  }, []);

  return (
    <>
      {/* Mobile Backdrop overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-30 lg:hidden animate-in fade-in duration-200"
          aria-hidden="true"
        />
      )}

      {/* Panel container */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 lg:z-10 h-full w-72 shrink-0 bg-bg-card border-r border-border-main flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:-ml-72"
        }`}
        aria-label="Chat history panel"
      >
        {/* Panel Header: New Chat & Close (on mobile) */}
        <div className="p-3 border-b border-border-main flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              onStartNewChat();
              if (window.innerWidth < 1024) onClose();
            }}
            className="flex-1 flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold bg-bg-secondary hover:bg-bg-secondary/70 border border-border-main transition-colors text-text-primary group shadow-2xs cursor-pointer focus-visible:ring-2 focus-visible:ring-purple-500"
            aria-label="Start new chat analysis"
          >
            <Plus className="w-4 h-4 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform" />
            <span>New chat</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            title="Collapse sidebar"
            aria-label="Collapse sidebar"
            className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-secondary/50 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-purple-500"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-2 border-b border-border-main/50">
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-text-secondary absolute left-3 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search chat history..."
              className="w-full bg-bg-secondary/60 text-xs text-text-primary placeholder:text-text-secondary rounded-xl pl-8 pr-7 py-1.5 border border-border-main/60 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="absolute right-2 text-text-secondary hover:text-text-primary p-0.5 cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Undo Toast Notification (5-second banner) */}
        {pendingDelete && (
          <div className="mx-2 mt-2 p-2.5 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-900 dark:text-purple-200 text-xs flex items-center justify-between gap-2 animate-in fade-in duration-200">
            <span className="truncate text-[11px] font-medium">Chat deleted</span>
            <button
              type="button"
              onClick={undoDelete}
              className="font-bold underline hover:opacity-80 text-purple-700 dark:text-purple-300 cursor-pointer text-xs shrink-0"
            >
              Undo
            </button>
          </div>
        )}

        {/* Session List Container */}
        <div className="flex-1 overflow-y-auto p-2 space-y-4">
          {isLoading && sessions.length === 0 ? (
            <div className="p-3 space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-9 rounded-xl bg-bg-secondary/60 animate-pulse" />
              ))}
            </div>
          ) : error && sessions.length === 0 ? (
            <div className="p-4 text-center space-y-2">
              <p className="text-xs text-rose-500 font-medium">{error}</p>
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Retry</span>
                </button>
              )}
            </div>
          ) : sessions.length === 0 ? (
            <div className="p-6 text-center">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 mx-auto flex items-center justify-center mb-2">
                <Bot className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-text-primary">No conversations</p>
              <p className="text-[11px] text-text-secondary mt-1">
                Ask a question about your CRM pipeline to start your first analysis.
              </p>
            </div>
          ) : (
            Object.entries(groupedSessions).map(([period, items]) => {
              if (items.length === 0) return null;
              return (
                <div key={period} className="space-y-1">
                  <div className="px-3 pt-2 pb-1 text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                    {period}
                  </div>
                  {items.map((s) => {
                    const sId = s.id || s._id;
                    return (
                      <SessionRow
                        key={sId}
                        session={s}
                        isActive={activeSessionId === sId}
                        onSelect={(id) => {
                          onSelectSession(id || sId);
                          if (window.innerWidth < 1024) onClose();
                        }}
                        onDelete={onDeleteSession}
                      />
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        {/* Sidebar Footer: Org / RAG Status */}
        <div className="p-3 border-t border-border-main bg-bg-card/50 flex items-center justify-between text-xs text-text-secondary">
          <div className="flex items-center gap-2 truncate">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
            <span className="truncate font-semibold text-text-primary">{organizationName}</span>
          </div>
          <span className="text-[10px] font-mono opacity-70 flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5 text-purple-600 dark:text-purple-400" />
            CRM RAG
          </span>
        </div>
      </aside>
    </>
  );
}
