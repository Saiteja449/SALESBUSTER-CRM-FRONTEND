import { useState } from "react";
import { Copy, Check, RotateCcw, Volume2, VolumeX, Download } from "lucide-react";

export default function AnswerActions({
  messageId,
  content,
  onRegenerate,
  isSpeaking,
  onSpeak,
  onStopSpeaking,
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleDownload = () => {
    try {
      const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `bi-analysis-${messageId}.md`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download answer:", err);
    }
  };

  return (
    <div
      role="toolbar"
      aria-label="Message actions"
      className="flex items-center gap-1 mt-2 text-text-secondary text-[11px] opacity-80 group-hover:opacity-100 transition-opacity flex-wrap"
    >
      {/* Copy Action */}
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex items-center gap-1 px-2 py-1 rounded-md hover:bg-bg-secondary hover:text-text-primary transition-colors cursor-pointer focus-visible:ring-1 focus-visible:ring-purple-500"
        title="Copy answer to clipboard"
        aria-label={copied ? "Copied to clipboard" : "Copy response"}
      >
        {copied ? (
          <>
            <Check className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-emerald-500 font-medium">Copied</span>
          </>
        ) : (
          <>
            <Copy className="w-3.5 h-3.5" />
            <span>Copy</span>
          </>
        )}
      </button>

      {/* Read Aloud / Speak */}
      {onSpeak && (
        <button
          type="button"
          onClick={() => (isSpeaking ? onStopSpeaking?.() : onSpeak?.(messageId, content))}
          className={`inline-flex items-center gap-1 px-2 py-1 rounded-md transition-colors cursor-pointer focus-visible:ring-1 focus-visible:ring-purple-500 ${
            isSpeaking
              ? "bg-purple-500/15 text-purple-700 dark:text-purple-300 font-semibold"
              : "hover:bg-bg-secondary hover:text-text-primary"
          }`}
          title={isSpeaking ? "Stop reading aloud" : "Read aloud (text-to-speech)"}
          aria-label={isSpeaking ? "Stop reading aloud" : "Read response aloud"}
          aria-pressed={isSpeaking}
        >
          {isSpeaking ? (
            <>
              <VolumeX className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 animate-pulse" />
              <span>Stop</span>
            </>
          ) : (
            <>
              <Volume2 className="w-3.5 h-3.5" />
              <span>Speak</span>
            </>
          )}
        </button>
      )}

      {/* Regenerate */}
      {onRegenerate && (
        <button
          type="button"
          onClick={() => onRegenerate(messageId)}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-md hover:bg-bg-secondary hover:text-text-primary transition-colors cursor-pointer focus-visible:ring-1 focus-visible:ring-purple-500"
          title="Regenerate this response"
          aria-label="Regenerate response"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Regenerate</span>
        </button>
      )}

      {/* Download Markdown */}
      <button
        type="button"
        onClick={handleDownload}
        className="inline-flex items-center gap-1 px-2 py-1 rounded-md hover:bg-bg-secondary hover:text-text-primary transition-colors cursor-pointer focus-visible:ring-1 focus-visible:ring-purple-500"
        title="Download response as Markdown file"
        aria-label="Download response as Markdown"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Export</span>
      </button>
    </div>
  );
}
