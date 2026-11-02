import { WifiOff } from "lucide-react";

export default function OfflineBanner({ isOffline }) {
  if (!isOffline) return null;

  return (
    <div
      role="status"
      className="mb-2 p-2.5 rounded-xl bg-slate-800 text-slate-100 text-xs flex items-center justify-between gap-2.5 border border-slate-700 shadow-xs animate-in fade-in duration-150"
    >
      <div className="flex items-center gap-2">
        <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
        <span className="font-medium">
          You are currently offline. Please reconnect to your network to query the BI Analyst.
        </span>
      </div>
    </div>
  );
}
