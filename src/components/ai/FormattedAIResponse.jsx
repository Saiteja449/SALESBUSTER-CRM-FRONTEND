import { Lightbulb } from "lucide-react";

/**
 * Pre-processes and normalizes raw AI output:
 * - Fixes inline run-on bullets (e.g., "1. Title * Step 1 * Step 2") into separate lines
 * - Un-wraps accidental huge bold blocks that wrap entire paragraphs
 * - Normalizes callouts like "*(Note: ...)*" into Markdown quote format "> 💡 **Note:** ..."
 */
function normalizeContent(rawText) {
  if (!rawText) return "";

  let text = String(rawText);

  // 1. Unwrap accidental outer bold wrapping entire multi-sentence numbered blocks
  // e.g., "**1. Step Title * Bullet 1 ... Bullet 2**" -> "1. Step Title * Bullet 1 ..."
  text = text.replace(
    /^\s*\*\*(\d+\.\s+[^\n*]+)\s*\*\s+([^*]+)\*\*\s*$/gm,
    "**$1**\n* $2"
  );

  // 2. Break inline asterisks/bullets onto new lines when used horizontally
  // e.g. "1. Step Title * Sub-point: info * Another: info"
  // Look for " * CapitalLetter" or " * **Label**" not preceded by a newline
  text = text.replace(/([^\n])\s+[*•]\s+([A-Z]|\*\*)/g, "$1\n- $2");

  // Also handle cases like "button. * Details to Enter:"
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

  // Tokenize bold, italic, code, links
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

/**
 * Checks if a block of lines is a Markdown table
 */
function isTableBlock(lines) {
  if (lines.length < 2) return false;
  return lines.every((l) => l.trim().startsWith("|") && l.trim().endsWith("|"));
}

/**
 * Main structured response renderer
 */
export default function FormattedAIResponse({ content }) {
  if (!content) return null;

  const normalized = normalizeContent(content);

  // Split into primary paragraphs / sections by double newlines
  const rawSections = normalized.split(/\n\n+/);

  return (
    <div className="space-y-3.5 text-sm leading-relaxed text-text-primary">
      {rawSections.map((section, sIdx) => {
        const trimmed = section.trim();
        if (!trimmed) return null;

        const lines = trimmed.split("\n").map((l) => l.trim()).filter(Boolean);

        // 1. Markdown Table
        if (isTableBlock(lines)) {
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

          return (
            <div
              key={sIdx}
              className="overflow-x-auto my-3 rounded-xl border border-border-main bg-bg-card shadow-xs"
            >
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-bg-secondary/70 border-b border-border-main">
                    {headerCells.map((h, hIdx) => (
                      <th
                        key={hIdx}
                        className="px-3.5 py-2.5 font-semibold text-text-primary"
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
                      className="hover:bg-bg-secondary/25 transition-colors"
                    >
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="px-3.5 py-2 text-text-secondary">
                          {renderInlineFormatting(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        // 2. Code Block (``` ... ```)
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

        // 3. Callout / Quote Block (> 💡 Note: ... or > ...)
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

        // 4. Headings (###, ##, #)
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

        // 5. Line-by-line smart parser for mixed content (e.g. Step header + Bullet sub-items)
        // Check if section contains numbered steps or bullet points
        const hasBullets = lines.some((l) => /^[-*•]\s+/.test(l));
        const hasNumbered = lines.some((l) => /^\d+\.\s+/.test(l));

        if (hasBullets || hasNumbered) {
          // Group contiguous items into sub-blocks
          const elements = [];
          let currentList = null; // { type: 'ul' | 'ol', items: [] }

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
              // If the numbered line looks like a major step heading (e.g. "1. Creating a New Lead Manually"),
              // render it with nice step card emphasis
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

        // 6. Regular clean paragraph
        return (
          <p key={sIdx} className="whitespace-pre-line text-text-primary">
            {renderInlineFormatting(trimmed)}
          </p>
        );
      })}
    </div>
  );
}
