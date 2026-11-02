import {
  TrendingUp,
  Users,
  Clock,
  Phone,
  MessageSquare,
  BarChart3,
  Sparkles,
  Radio,
  Database,
  ArrowRight,
} from "lucide-react";
import InsightCard from "./InsightCard.jsx";

const SUGGESTED_PROMPTS = [
  {
    icon: TrendingUp,
    category: "Pipeline",
    title: "Conversion & Growth",
    prompt: "What is our lead-to-won conversion rate this month?",
  },
  {
    icon: Users,
    category: "Team",
    title: "Sales Leaderboard",
    prompt: "Which salesperson generated the most won leads and highest conversion?",
  },
  {
    icon: Clock,
    category: "Inflow",
    title: "Lead Volume Trend",
    prompt: "How many new leads came in today compared to yesterday?",
  },
  {
    icon: Phone,
    category: "Tasks",
    title: "Pending Follow-ups",
    prompt: "How many follow-ups are overdue or scheduled for today?",
  },
  {
    icon: MessageSquare,
    category: "Messaging",
    title: "WhatsApp Engagement",
    prompt: "Which active leads haven't received a WhatsApp reply yet?",
  },
  {
    icon: BarChart3,
    category: "Offerings",
    title: "Service Breakdown",
    prompt: "Give me a summary of leads grouped by requested service offering.",
  },
];

export default function EmptyState({
  userName = "there",
  onSelectPrompt,
  injectRangeIntoPrompt,
  onOpenLiveVoice,
  onOpenScopeModal,
}) {
  const firstName = userName ? userName.split(" ")[0] : "there";

  return (
    <div className="min-h-full flex flex-col items-center justify-center max-w-3xl sm:max-w-4xl mx-auto px-4 py-8 text-center animate-in fade-in duration-300">
      {/* Icon Orb */}
      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-purple-500/20 mb-4">
        <Sparkles className="w-7 h-7 sm:w-8 sm:h-8" />
      </div>

      {/* Greeting & Subtitle */}
      <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary mb-2">
        Hello, {firstName}. How can I assist your pipeline?
      </h2>
      <p className="text-xs sm:text-sm text-text-secondary max-w-xl mb-6 leading-relaxed">
        Your AI Business Intelligence Analyst queries live CRM data to calculate pipeline conversions, salesperson win rates, overdue tasks, and WhatsApp response bottlenecks.
      </p>

      {/* Connected Data Banner */}
      <div className="w-full max-w-2xl p-3.5 rounded-2xl bg-purple-500/5 dark:bg-purple-950/20 border border-purple-500/20 text-xs text-text-secondary mb-6 text-left flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <Database className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
          <span>
            <strong className="text-text-primary font-semibold">Live CRM Entities:</strong> Leads, Sales Reps, Follow-Ups, Offerings &amp; WhatsApp logs.
          </span>
        </div>
        {onOpenScopeModal && (
          <button
            type="button"
            onClick={onOpenScopeModal}
            className="text-purple-600 dark:text-purple-400 hover:underline font-semibold whitespace-nowrap self-start sm:self-auto cursor-pointer"
          >
            View data sources &rarr;
          </button>
        )}
      </div>

      {/* Grid of Insight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 w-full text-left mb-4">
        {SUGGESTED_PROMPTS.map((item, idx) => {
          const adaptedPrompt = injectRangeIntoPrompt
            ? injectRangeIntoPrompt(item.prompt)
            : item.prompt;

          return (
            <InsightCard
              key={idx}
              icon={item.icon}
              title={item.title}
              category={item.category}
              prompt={adaptedPrompt}
              onClick={() => onSelectPrompt(adaptedPrompt)}
            />
          );
        })}
      </div>

      {/* "Talk to it" Live Voice Card */}
      {onOpenLiveVoice && (
        <button
          type="button"
          onClick={onOpenLiveVoice}
          className="w-full max-w-2xl p-3.5 rounded-2xl bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-transparent hover:from-purple-500/15 border border-purple-500/25 text-left flex items-center justify-between gap-3 group transition-all shadow-2xs cursor-pointer focus-visible:ring-2 focus-visible:ring-purple-500"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-600 text-white shrink-0 group-hover:scale-105 transition-transform shadow-xs">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <span className="text-xs font-bold text-text-primary block">
                Talk to your CRM in Real Time
              </span>
              <span className="text-[11px] text-text-secondary">
                Hands-free voice analytics powered by Gemini Multimodal Live API.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold text-purple-600 dark:text-purple-400 group-hover:translate-x-0.5 transition-transform shrink-0">
            <span>Start Voice</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </button>
      )}
    </div>
  );
}
