import React from "react";
import {
  Smartphone,
  CheckCircle2,
  Clock,
  RefreshCw,
  X,
  MessageSquare,
  Users,
} from "lucide-react";

export default function WhatsAppSyncStatusModal({
  isOpen,
  onClose,
  account = null,
}) {
  if (!isOpen) return null;

  const phone = account?.displayPhone || "Your Phone";
  const historyProgress = account?.historyProgress || {};
  const chunksReceived = historyProgress.chunksReceived || 0;
  const messagesImported = historyProgress.messagesImported || 0;
  const isComplete = historyProgress.isComplete || account?.status === "connected";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 text-white shadow-2xl animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100">
                WhatsApp Business Coexistence
              </h3>
              <p className="text-xs text-emerald-400 font-medium">
                {isComplete ? "Connected & Synchronized" : "24-Hour Initial Sync Active"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-5 space-y-4">
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400">Connected Mobile Number</span>
              <p className="text-sm font-semibold text-slate-100 mt-0.5">{phone}</p>
            </div>
            <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Coexistence Live
            </span>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-emerald-400" />
                <div>
                  <h4 className="text-sm font-medium text-slate-200">Phone Address Book</h4>
                  <p className="text-xs text-slate-400">Synced to CRM Contacts</p>
                </div>
              </div>
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-emerald-400" />
                <div>
                  <h4 className="text-sm font-medium text-slate-200">Chat History Backfill</h4>
                  <p className="text-xs text-slate-400">
                    {messagesImported > 0
                      ? `${messagesImported} messages imported (${chunksReceived} chunks)`
                      : "Syncing recent conversations..."}
                  </p>
                </div>
              </div>
              {isComplete ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <RefreshCw className="w-4 h-4 text-amber-400 animate-spin" />
              )}
            </div>
          </div>

          <div className="p-3 bg-slate-800/30 rounded-xl border border-slate-700/30 text-xs text-slate-400 space-y-1">
            <p className="font-medium text-slate-300">💡 Pocket Coexistence Mode:</p>
            <p>
              You can keep chatting on your mobile phone as usual. All replies sent from your phone
              will appear in the CRM inbox with a "Sent from Phone" badge, and will pause the AI bot for 60 minutes so you have full control.
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition"
          >
            Got it, continue
          </button>
        </div>
      </div>
    </div>
  );
}
