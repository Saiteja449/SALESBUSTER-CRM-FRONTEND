import { useState, memo } from "react";
import { Trash2, MessageSquare, Check, X } from "lucide-react";

function formatRelativeTime(dateString) {
  if (!dateString) return "";
  try {
    const time = new Date(dateString).getTime();
    const diffMs = Date.now() - time;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(dateString).toLocaleDateString([], { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

function SessionRowComponent({
  session,
  isActive = false,
  onSelect,
  onDelete,
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const sessionId = session.id || session._id;
  const title = session.title || "Untitled Analysis";
  const timeStr = formatRelativeTime(session.updatedAt || session.createdAt);

  return (
    <div
      onClick={() => {
        if (!confirmDelete && sessionId) onSelect(sessionId);
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          if (!confirmDelete && sessionId) onSelect(sessionId);
        } else if (e.key === "Delete") {
          setConfirmDelete(true);
        }
      }}
      className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:outline-none ${
        isActive
          ? "bg-purple-500/15 text-purple-700 dark:text-purple-300 font-semibold border-l-2 border-purple-600"
          : "text-text-secondary hover:text-text-primary hover:bg-bg-secondary/50"
      }`}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
        <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-60 group-hover:opacity-100" />
        <div className="min-w-0 flex-1">
          <span className="block truncate text-xs leading-snug">{title}</span>
          {timeStr && <span className="block text-[10px] text-text-secondary/60 leading-none mt-0.5">{timeStr}</span>}
        </div>
      </div>

      {/* Delete trigger or Inline confirmation */}
      {confirmDelete ? (
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1 shrink-0 animate-in fade-in duration-150"
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(session);
              setConfirmDelete(false);
            }}
            className="p-1 rounded-md bg-rose-600 text-white hover:bg-rose-700 transition-colors"
            title="Confirm delete"
            aria-label="Confirm delete"
          >
            <Check className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setConfirmDelete(false);
            }}
            className="p-1 rounded-md bg-bg-secondary hover:bg-bg-secondary/80 text-text-secondary hover:text-text-primary transition-colors"
            title="Cancel"
            aria-label="Cancel delete"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setConfirmDelete(true);
          }}
          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:text-rose-600 transition-opacity focus-visible:opacity-100 focus-visible:ring-1 focus-visible:ring-rose-500 shrink-0"
          title="Delete chat session"
          aria-label={`Delete chat session ${title}`}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

export const SessionRow = memo(SessionRowComponent);
export default SessionRow;
