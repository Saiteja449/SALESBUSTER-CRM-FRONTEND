import { Clock, AlertTriangle, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function LimitCard({ limitInfo }) {
  const navigate = useNavigate();
  if (!limitInfo) return null;

  const rawReset = limitInfo.resetTime || "00:00 UTC";
  // Convert 00:00 UTC to local time string
  const getLocalResetTime = () => {
    try {
      const now = new Date();
      const resetDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));
      return resetDate.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    } catch {
      return rawReset;
    }
  };

  return (
    <div
      role="alert"
      className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-900 dark:text-amber-200 text-xs shadow-2xs space-y-2.5 animate-in fade-in duration-200"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 shrink-0">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-sm text-amber-950 dark:text-amber-100">
            Daily AI Query Limit Reached
          </h4>
          <p className="mt-1 text-xs text-amber-800 dark:text-amber-200/90 leading-relaxed">
            {limitInfo.message || "You have reached your daily quota for BI Analyst questions."}
          </p>
          <div className="mt-2.5 flex items-center gap-2 text-xs font-semibold text-amber-900 dark:text-amber-200">
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>
              Quota resets at midnight UTC (approximately {getLocalResetTime()} in your local time).
            </span>
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-amber-500/20 flex items-center justify-between">
        <span className="text-[11px] text-amber-800/80 dark:text-amber-300/80">
          Need higher limits for executive reporting?
        </span>
        <button
          type="button"
          onClick={() => navigate("/organization")}
          className="inline-flex items-center gap-1 text-xs font-bold text-amber-900 dark:text-amber-100 hover:underline cursor-pointer"
        >
          <span>View Tier Quotas</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
