import React, { useState } from "react";
import {
  Sparkles,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  FileText,
  ExternalLink,
  Bot,
  HelpCircle,
  ShieldAlert,
  Globe,
} from "lucide-react";
import { getKbGeneratorPrompt } from "../utils/kbPromptTemplate.js";

export default function KBGeneratorPromptCard({ businessName = "" }) {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const promptText = getKbGeneratorPrompt(businessName);

  const handleCopy = () => {
    navigator.clipboard.writeText(promptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="rounded-3xl border border-purple-500/30 bg-gradient-to-br from-purple-500/5 via-bg-secondary/40 to-indigo-500/5 p-6 shadow-xs space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-purple-500/20 shrink-0">
            <Sparkles size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-text-primary">
                Knowledge Base Generator — Agent Instructions
              </h3>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                Recommended RAG Format
              </span>
            </div>
            <p className="text-xs text-text-secondary mt-0.5">
              Use this system prompt with Claude or ChatGPT to turn your website URL or company documents into a high-accuracy RAG document.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          <button
            type="button"
            onClick={handleCopy}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
              copied
                ? "bg-emerald-500 text-white shadow-emerald-500/30"
                : "bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white shadow-purple-500/25"
            }`}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied ? "Copied to Clipboard!" : "Copy System Prompt"}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-border-main bg-bg-card hover:bg-bg-secondary text-xs font-bold text-text-secondary transition-colors cursor-pointer"
          >
            <span>{isExpanded ? "Hide Prompt" : "View Structure"}</span>
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* 3-Step Instruction Guide */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
        <div className="p-3.5 rounded-2xl bg-bg-card/80 border border-border-main flex items-start gap-2.5">
          <span className="w-5 h-5 rounded-full bg-purple-500/10 text-purple-600 font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
            1
          </span>
          <div className="text-xs">
            <span className="font-bold text-text-primary block mb-0.5">
              Copy the Prompt
            </span>
            <span className="text-text-secondary text-[11px] leading-relaxed">
              Click <strong>Copy System Prompt</strong> above to copy the specialized formatting template.
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-bg-card/80 border border-border-main flex items-start gap-2.5">
          <span className="w-5 h-5 rounded-full bg-indigo-500/10 text-indigo-600 font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
            2
          </span>
          <div className="text-xs">
            <span className="font-bold text-text-primary block mb-0.5">
              Paste in Claude / ChatGPT
            </span>
            <span className="text-text-secondary text-[11px] leading-relaxed">
              Paste the prompt and attach your <strong>website URL(s)</strong>, brochures, PDFs, or company docs.
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-bg-card/80 border border-border-main flex items-start gap-2.5">
          <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
            3
          </span>
          <div className="text-xs">
            <span className="font-bold text-text-primary block mb-0.5">
              Upload Document Below
            </span>
            <span className="text-text-secondary text-[11px] leading-relaxed">
              Save the AI's response as a <strong>.md, .docx, or .pdf</strong> file and drop it into the upload box below.
            </span>
          </div>
        </div>
      </div>

      {/* Expanded Prompt Inspector */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-purple-500/20 space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-text-secondary">
              <FileText size={14} className="text-purple-500" />
              <span className="font-bold text-text-primary">
                Template Preview ({businessName || "Your Organization"})
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-600 hover:text-purple-700 cursor-pointer"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              <span>{copied ? "Copied!" : "Copy Full Prompt"}</span>
            </button>
          </div>

          <div className="relative rounded-2xl bg-slate-950 text-slate-200 border border-slate-800 p-4 font-mono text-[11px] leading-relaxed overflow-x-auto max-h-96 overflow-y-auto selection:bg-purple-500/30">
            <pre className="whitespace-pre-wrap">{promptText}</pre>
          </div>

          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2 text-xs text-amber-700 dark:text-amber-300">
            <ShieldAlert size={16} className="shrink-0 mt-0.5" />
            <span>
              <strong>Strict Pricing Rule Included:</strong> This template directs the AI to never guess or fabricate pricing, and cleanly redirects quote inquiries to sales consultation callbacks.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
