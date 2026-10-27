import React, { useState } from "react";
import {
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  X,
  ShieldCheck,
} from "lucide-react";

export default function WhatsAppPreScreenModal({
  isOpen,
  onClose,
  onProceed,
}) {
  const [checkedVersion, setCheckedVersion] = useState(false);
  const [checkedNearby, setCheckedNearby] = useState(false);

  if (!isOpen) return null;
  const canProceed = checkedVersion && checkedNearby;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 text-white shadow-2xl animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-100">
                Connect WhatsApp Business
              </h3>
              <p className="text-xs text-slate-400">
                Official Coexistence Setup (No QR Code Scanning)
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
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-sm flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <p>
              Do <strong>NOT</strong> delete or log out of your WhatsApp Business phone app.
              Your mobile phone will continue working normally alongside the CRM.
            </p>
          </div>

          <div className="space-y-3">
            <label className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800 cursor-pointer transition">
              <input
                type="checkbox"
                checked={checkedVersion}
                onChange={(e) => setCheckedVersion(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500"
              />
              <div className="text-sm">
                <span className="font-medium text-slate-200">
                  WhatsApp Business App Version 2.24.17 or Higher
                </span>
                <p className="text-xs text-slate-400 mt-0.5">
                  Confirm the WhatsApp Business app on your Android or iPhone is up to date in the App Store or Google Play Store.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800 cursor-pointer transition">
              <input
                type="checkbox"
                checked={checkedNearby}
                onChange={(e) => setCheckedNearby(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500"
              />
              <div className="text-sm">
                <span className="font-medium text-slate-200">
                  Keep Your Phone Awake & App Open
                </span>
                <p className="text-xs text-slate-400 mt-0.5">
                  A verification / approval prompt will appear on your phone screen during Facebook login to authorize CRM coexistence.
                </p>
              </div>
            </label>
          </div>

          <div className="flex items-center gap-2 p-3 bg-slate-800/30 rounded-xl border border-slate-700/30 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Official Meta Cloud API OAuth ensures zero ban risk and end-to-end encryption.
            </span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition"
          >
            Cancel
          </button>
          <button
            disabled={!canProceed}
            onClick={onProceed}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl transition shadow-lg ${
              canProceed
                ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30 cursor-pointer"
                : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
            }`}
          >
            Launch Embedded Signup <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
