import { useState, Suspense, lazy } from "react";
import {
  Lightbulb,
  TrendingUp,
  TrendingDown,
  BarChart2,
  Table as TableIcon,
} from "lucide-react";
import TableExportActions from "./TableExportActions.jsx";
import { detectChartableData } from "../../utils/chartDetection.js";

// Lazy-load DynamicChart so recharts is loaded on-demand
const DynamicChart = lazy(() => import("./DynamicChart.jsx"));

/**
 * Safely extracts plain text from LLM response content:
 * Handles strings, arrays of text blocks ([{ type: "text", text: "..." }]),
 * objects, and stringified JSON arrays.
 */
export function extractTextContent(rawText) {
  if (!rawText) return "";
  if (Array.isArray(rawText)) {
    return rawText
      .map((part) => (typeof part === "string" ? part : part?.text || ""))
      .join("");
  }
  if (typeof rawText === "object" && rawText !== null && typeof rawText.text === "string") {
    return rawText.text;
  }
  if (typeof rawText === "string") {
    const trimmed = rawText.trim();
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (
          Array.isArray(parsed) &&
          parsed.some(
            (p) => p && typeof p === "object" && (p.text !== undefined || p.type === "text")
          )
        ) {
          return parsed
            .map((p) => {
              if (typeof p === "string") return p;
              if (p && typeof p.text === "string") return p.text;
              return "";
            })
            .join("");
        }
      } catch (_) {}
    }
    return rawText;
  }
  return String(rawText);
}

/**
 * Pre-processes and normalizes raw AI output:
 * - Fixes inline run-on bullets into separate lines
 * - Un-wraps accidental huge bold blocks
 * - Normalizes callouts
 */
function normalizeContent(rawText) {
  if (!rawText) return "";

  let text = extractTextContent(rawText);

  // 1. Unwrap accidental outer bold wrapping entire multi-sentence numbered blocks
  text = text.replace(
    /^\s*\*\*(\d+\.\s+[^\n*]+)\s*\*\s+([^*]+)\*\*\s*$/gm,
    "**$1**\n* $2"
  );

  // 2. Break inline asterisks/bullets onto new lines when used horizontally
  text = text.replace(/([^\n])\s+[*•]\s+([A-Z]|\*\*)/g, "$1\n- $2");
  text = text.replace(/([.!?])\s+[*•]\s+/g, "$1\n- ");

  // 3. Normalize "(Note: ...)" or "*(Note: ...)*" or "*Note: ...*"
  text = text.replace(
    /^\s*\*?\(?(Note|Important|Tip|Pro-tip):?\s*(.*?)\)?\*?\s*$/gim,
    (match, label, body) => {
      const cleanBody = body.replace(/^\**:\s*/, "").replace(/\)*$/, "").trim();
      return `> 💡 **${label}:** ${cleanBody}`;
    }
  );

  return text;
}

/**
 * Parses inline formatting:
 * - **bold**
 * - *italic* or _italic_
 * - `code`
 * - [label](url)
 */
function renderInlineFormatting(text) {
  if (!text) return "";

  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|_[^_]+_|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (!part) return null;

    // Bold: **text**
    if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
      return (
        <strong key={index} className="font-semibold text-text-primary">
          {part.slice(2, -2)}
        </strong>
      );
    }

    // Inline Code: `code`
    if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
      return (
        <code
          key={index}
          className="px-1.5 py-0.5 mx-0.5 rounded bg-bg-secondary text-purple-600 dark:text-purple-400 font-mono text-[11px] border border-border-main"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    // Italic: *text* or _text_
    if (
      (part.startsWith("*") && part.endsWith("*") && part.length >= 2) ||
      (part.startsWith("_") && part.endsWith("_") && part.length >= 2)
    ) {
      return (
        <em key={index} className="italic text-text-secondary/90">
          {part.slice(1, -1)}
        </em>
      );
    }

    // Markdown Link: [label](url)
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      return (
        <a
          key={index}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-purple-600 dark:text-purple-400 underline hover:opacity-80 font-medium"
        >
          {linkMatch[1]}
        </a>
      );
    }

    return part;
  });
}

function isTableBlock(lines) {
  if (lines.length < 2) return false;
  return lines.every((l) => l.trim().startsWith("|") && l.trim().endsWith("|"));
}

/**
 * Checks if a string looks numeric (digits, commas, decimals, currency, %, +, -)
 */
function isNumericCell(cell) {
  if (!cell) return false;
  const clean = cell.replace(/\*\*/g, "").trim();
  return /^[$₹€£]?\s*[-+]?[0-9,]+(\.[0-9]+)?\s*[%xX]?$/.test(clean);
}

/**
 * Detects if a block of 2+ lines is a KPI metric list (e.g. "Conversion Rate: 24.5%")
 */
function isMetricBlock(lines) {
  if (lines.length < 2 || lines.length > 8) return false;
  return lines.every((l) => {
    const trimmed = l.replace(/^[-*•]\s+/, "").trim();
    const parts = trimmed.split(":");
    if (parts.length < 2) return false;
    const value = parts.slice(1).join(":").trim();
    return value.length > 0 && value.length < 40 && /\d/.test(value);
  });
}

function MetricTile({ label, rawValue, idx }) {
  const deltaMatch = rawValue.match(/([+-]\d+(\.\d+)?%)/);
  const delta = deltaMatch ? deltaMatch[1] : null;
  const isPositive = delta && delta.startsWith("+");
  const isNegative = delta && delta.startsWith("-");

  const displayVal = delta ? rawValue.replace(delta, "").replace(/[()]/g, "").trim() : rawValue;

  return (
    <div
      key={idx}
      className="p-3 rounded-xl bg-bg-card border border-border-main shadow-2xs flex flex-col justify-between"
    >
      <span className="text-[11px] font-medium text-text-secondary line-clamp-1 mb-1">
        {renderInlineFormatting(label)}
      </span>
      <div className="flex items-baseline justify-between gap-1.5 flex-wrap">
        <span className="text-base sm:text-lg font-bold font-mono tabular-nums text-text-primary tracking-tight">
          {renderInlineFormatting(displayVal)}
        </span>
        {delta && (
          <span
            className={`inline-flex items-center gap-0.5 text-[10px] font-semibold font-mono tabular-nums px-1.5 py-0.5 rounded-full ${
              isPositive
                ? "text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20"
                : isNegative
                ? "text-rose-700 dark:text-rose-300 bg-rose-500/10 border border-rose-500/20"
                : "text-text-secondary bg-bg-secondary"
            }`}
          >
            {isPositive && <TrendingUp className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />}
            {isNegative && <TrendingDown className="w-3 h-3 text-rose-600 dark:text-rose-400" />}
            <span>{delta}</span>
          </span>
        )}
      </div>
    </div>
  );
}

function TableSection({ lines, sIdx }) {
  const [showChart, setShowChart] = useState(false);

  const headerCells = lines[0]
    .slice(1, -1)
    .split("|")
    .map((c) => c.trim());

  const startIndex = lines[1].includes("---") ? 2 : 1;
  const dataRows = lines.slice(startIndex).map((row) =>
    row
      .slice(1, -1)
      .split("|")
      .map((c) => c.trim())
  );

  const isColumnNumeric = headerCells.map((_, colIdx) => {
    let numCount = 0;
    dataRows.forEach((r) => {
      if (isNumericCell(r[colIdx])) numCount++;
    });
    return dataRows.length > 0 && numCount / dataRows.length >= 0.7;
  });

  const chartable = detectChartableData(headerCells, dataRows);

  return (
    <div key={sIdx} className="my-3 space-y-2">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          {chartable && (
            <button
              type="button"
              onClick={() => setShowChart((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                showChart
                  ? "bg-purple-600 text-white border-purple-600 shadow-2xs"
                  : "bg-bg-card hover:bg-bg-secondary text-purple-700 dark:text-purple-300 border-border-main"
              }`}
              title={showChart ? "View table only" : "Visualize table as interactive chart"}
              aria-label={showChart ? "Hide visualization" : "Visualize table data"}
              aria-pressed={showChart}
            >
              {showChart ? <TableIcon className="w-3.5 h-3.5" /> : <BarChart2 className="w-3.5 h-3.5" />}
              <span>{showChart ? "Show Table" : "Visualize"}</span>
            </button>
          )}
        </div>

        <TableExportActions headers={headerCells} rows={dataRows} tableName={`bi-report-${sIdx + 1}`} />
      </div>

      {showChart && chartable && (
        <Suspense
          fallback={
            <div className="h-48 rounded-xl border border-border-main bg-bg-card p-4 flex items-center justify-center text-xs text-text-secondary animate-pulse">
              Loading visualization...
            </div>
          }
        >
          <DynamicChart chartable={chartable} />
        </Suspense>
      )}

      <div className="overflow-x-auto rounded-xl border border-border-main bg-bg-card shadow-xs">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-bg-secondary/70 border-b border-border-main sticky top-0 z-10 backdrop-blur-xs">
              {headerCells.map((h, hIdx) => (
                <th
                  key={hIdx}
                  scope="col"
                  className={`px-3.5 py-2.5 font-semibold text-text-primary ${
                    isColumnNumeric[hIdx] ? "text-right font-mono tabular-nums" : "text-left"
                  }`}
                >
                  {renderInlineFormatting(h)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-main/50">
            {dataRows.map((row, rIdx) => (
              <tr
                key={rIdx}
                className="hover:bg-bg-secondary/35 transition-colors odd:bg-bg-card even:bg-bg-secondary/15"
              >
                {row.map((cell, cIdx) => (
                  <td
                    key={cIdx}
                    className={`px-3.5 py-2 text-text-secondary ${
                      isColumnNumeric[cIdx]
                        ? "text-right font-mono tabular-nums text-text-primary font-medium"
                        : "text-left"
                    }`}
                  >
                    {renderInlineFormatting(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function FormattedAIResponse({ content }) {
  if (!content) return null;

  const normalized = normalizeContent(content);
  const rawSections = normalized.split(/\n\n+/);

  return (
    <div className="space-y-3.5 text-sm leading-relaxed text-text-primary">
      {rawSections.map((section, sIdx) => {
        const trimmed = section.trim();
        if (!trimmed) return null;

        const lines = trimmed.split("\n").map((l) => l.trim()).filter(Boolean);

        // 1. Markdown Table
        if (isTableBlock(lines)) {
          return <TableSection key={sIdx} lines={lines} sIdx={sIdx} />;
        }

        // 2. Metric KPI Cards (2+ key: value lines)
        if (isMetricBlock(lines)) {
          return (
            <div
              key={sIdx}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 my-3"
            >
              {lines.map((l, lIdx) => {
                const cleanLine = l.replace(/^[-*•]\s+/, "");
                const colonIdx = cleanLine.indexOf(":");
                const label = cleanLine.slice(0, colonIdx).trim();
                const rawVal = cleanLine.slice(colonIdx + 1).trim();
                return <MetricTile key={lIdx} label={label} rawValue={rawVal} idx={lIdx} />;
              })}
            </div>
          );
        }

        // 3. Code Block (``` ... ```)
        if (trimmed.startsWith("```")) {
          const cleanCode = trimmed
            .replace(/^```[a-z]*\n?/i, "")
            .replace(/```$/, "");
          return (
            <pre
              key={sIdx}
              className="p-3.5 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto my-2 border border-slate-800"
            >
              <code>{cleanCode}</code>
            </pre>
          );
        }

        // 4. Callout / Quote Block (> 💡 Note: ... or > ...)
        if (trimmed.startsWith(">")) {
          const calloutText = trimmed
            .split("\n")
            .map((l) => l.replace(/^>\s*/, ""))
            .join(" ");

          const isWarning = /warn|alert|caution/i.test(calloutText);
          const isSuccess = /success|done|tip/i.test(calloutText);

          return (
            <div
              key={sIdx}
              className={`p-3.5 rounded-xl border flex items-start gap-2.5 my-2.5 text-xs leading-relaxed ${
                isWarning
                  ? "bg-amber-500/10 border-amber-500/25 text-amber-900 dark:text-amber-200"
                  : isSuccess
                  ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-900 dark:text-emerald-200"
                  : "bg-purple-500/10 border-purple-500/20 text-purple-950 dark:text-purple-200"
              }`}
            >
              <Lightbulb className="w-4 h-4 shrink-0 mt-0.5 text-purple-600 dark:text-purple-400" />
              <div className="flex-1 min-w-0">
                {renderInlineFormatting(calloutText)}
              </div>
            </div>
          );
        }

        // 5. Headings (###, ##, #)
        if (trimmed.startsWith("### ")) {
          return (
            <h4
              key={sIdx}
              className="text-sm font-bold text-text-primary mt-2 flex items-center gap-1.5"
            >
              <span>{renderInlineFormatting(trimmed.replace(/^###\s+/, ""))}</span>
            </h4>
          );
        }
        if (trimmed.startsWith("## ")) {
          return (
            <h3
              key={sIdx}
              className="text-base font-bold text-text-primary mt-3 pb-1 border-b border-border-main/50"
            >
              {renderInlineFormatting(trimmed.replace(/^##\s+/, ""))}
            </h3>
          );
        }
        if (trimmed.startsWith("# ")) {
          return (
            <h2
              key={sIdx}
              className="text-lg font-extrabold text-text-primary mt-3"
            >
              {renderInlineFormatting(trimmed.replace(/^#\s+/, ""))}
            </h2>
          );
        }

        // 6. Mixed list parser
        const hasBullets = lines.some((l) => /^[-*•]\s+/.test(l));
        const hasNumbered = lines.some((l) => /^\d+\.\s+/.test(l));

        if (hasBullets || hasNumbered) {
          const elements = [];
          let currentList = null;

          const flushList = () => {
            if (currentList) {
              if (currentList.type === "ul") {
                elements.push(
                  <ul
                    key={`ul_${elements.length}`}
                    className="space-y-1.5 list-none pl-1 my-1.5"
                  >
                    {currentList.items.map((item, iIdx) => (
                      <li key={iIdx} className="flex items-start gap-2 text-text-primary">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 shrink-0 opacity-80" />
                        <span className="flex-1 min-w-0">
                          {renderInlineFormatting(item)}
                        </span>
                      </li>
                    ))}
                  </ul>
                );
              } else if (currentList.type === "ol") {
                elements.push(
                  <ol
                    key={`ol_${elements.length}`}
                    className="space-y-2 list-none pl-0 my-2"
                  >
                    {currentList.items.map((item, iIdx) => (
                      <li key={iIdx} className="flex items-start gap-2.5 text-text-primary">
                        <span className="w-5 h-5 rounded-md bg-purple-500/15 text-purple-700 dark:text-purple-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 border border-purple-500/30">
                          {iIdx + 1}
                        </span>
                        <span className="flex-1 min-w-0 font-medium pt-0.5">
                          {renderInlineFormatting(item)}
                        </span>
                      </li>
                    ))}
                  </ol>
                );
              }
              currentList = null;
            }
          };

          lines.forEach((line) => {
            const isBullet = /^[-*•]\s+/.test(line);
            const isNum = /^\d+\.\s+/.test(line);

            if (isBullet) {
              const textOnly = line.replace(/^[-*•]\s+/, "");
              if (currentList && currentList.type === "ul") {
                currentList.items.push(textOnly);
              } else {
                flushList();
                currentList = { type: "ul", items: [textOnly] };
              }
            } else if (isNum) {
              const textOnly = line.replace(/^\d+\.\s+/, "");
              flushList();
              elements.push(
                <div
                  key={`step_${elements.length}`}
                  className="mt-3.5 mb-1.5 flex items-center gap-2 font-semibold text-text-primary"
                >
                  <span className="w-5 h-5 rounded-md bg-purple-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                    {line.match(/^(\d+)\./)?.[1] || "•"}
                  </span>
                  <span>{renderInlineFormatting(textOnly)}</span>
                </div>
              );
            } else {
              flushList();
              elements.push(
                <p key={`p_${elements.length}`} className="text-text-primary my-1">
                  {renderInlineFormatting(line)}
                </p>
              );
            }
          });

          flushList();

          return (
            <div key={sIdx} className="space-y-1">
              {elements}
            </div>
          );
        }

        // 7. Regular paragraph
        return (
          <p key={sIdx} className="whitespace-pre-line text-text-primary">
            {renderInlineFormatting(trimmed)}
          </p>
        );
      })}
    </div>
  );
}
