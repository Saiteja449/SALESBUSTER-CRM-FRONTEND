import { useState } from "react";
import { ChevronDown, Database, Cpu } from "lucide-react";

function humanizeToolName(raw) {
  if (!raw) return "CRM database query";
  // Replace underscores and convert to title case
  const text = String(raw).replace(/_/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export default function SourcesRow({ toolsUsed = [], modelUsed = "Gemini 3.5 Flash" }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const count = toolsUsed.length;
  if (count === 0 && !modelUsed) return null;

  const countLabel = count === 1 ? "Analyzed 1 data source" : `Analyzed ${count} data sources`;

  return (
    <div className="mt-2 text-xs">
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-bg-secondary/60 hover:bg-bg-secondary text-text-secondary hover:text-text-primary transition-colors cursor-pointer border border-border-main/60 focus-visible:ring-1 focus-visible:ring-purple-500"
        aria-expanded={isExpanded}
        aria-label="Toggle analysis data sources disclosure"
      >
        <Database className="w-3 h-3 text-purple-600 dark:text-purple-400 shrink-0" />
        <span className="font-medium text-[11px]">{count > 0 ? countLabel : "Model analysis"}</span>
        <ChevronDown
          className={`w-3 h-3 text-text-secondary transition-transform duration-200 ${
            isExpanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {isExpanded && (
        <div className="mt-2 p-2.5 rounded-xl bg-bg-secondary/40 border border-border-main space-y-2 animate-in fade-in duration-150">
          {count > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary block">
                Connected CRM Data Entities
              </span>
              <ul className="space-y-1 list-none pl-0">
                {toolsUsed.map((tool, idx) => (
                  <li
                    key={idx}
                    className="flex items-center gap-1.5 text-[11px] text-text-primary font-mono"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
                    <span>{humanizeToolName(tool)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {modelUsed && (
            <div className="pt-1 border-t border-border-main/50 flex items-center justify-between text-[10px] text-text-secondary">
              <span className="flex items-center gap-1">
                <Cpu className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                <span>Engine:</span>
              </span>
              <span className="font-semibold text-text-primary">{modelUsed}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
