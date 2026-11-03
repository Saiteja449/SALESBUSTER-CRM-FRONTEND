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

    </div>
  );
}
