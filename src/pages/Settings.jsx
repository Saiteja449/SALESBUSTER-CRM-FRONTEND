import React, { useState } from "react";
import {
  User as ProfileIcon,
  Palette as ThemeIcon,
  BellRing as NotificationIcon,
  Save as SaveIcon,
  Check as CheckIcon,
  X as CloseIcon,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

export default function Settings() {
  const { currentUser } = useAuth();

  // Local settings states
  const [profile, setProfile] = useState({
    name: currentUser?.name || "SalesBuster AI Admin",
    email: currentUser?.email || "admin@salesbuster.ai",
    role: currentUser?.role || "Sales Manager",
    department: "Sales & Client Relations",
    joined: "Aug 2023",
    phone: "9876543210",
    timezone: "UTC - 5 (Eastern Time)",
  });

  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    overdueTasks: true,
    weeklyReport: false,
    insurances: true,
    groomreminders: true,
  });

  const [themePref, setThemePref] = useState("dark");
  const [accentColor, setAccentColor] = useState("teal");

  const [toastOpen, setToastOpen] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setToastOpen(true);
    setTimeout(() => setToastOpen(false), 4000);
  };

  return (
    <div className="p-4 md:p-6 relative">
      {/* Upper header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-brand-primary tracking-tight mb-1">
          Global CRM Configurations
        </h1>
        <p className="text-sm text-brand-primary/70">
          Tweak representative profile cards, alert thresholds, and operational
          options.
        </p>
      </div>

      <form
        onSubmit={handleSave}
        className="grid grid-cols-1 md:grid-cols-12 gap-6"
      >
        {/* Left Hand: Profile & Themes */}
        <div className="md:col-span-7 space-y-6">
          {/* User Profile credentials card */}
          <div className="bg-brand-light border border-brand-secondary rounded-2xl p-6 shadow-sm">
            <h2 className="text-sm font-bold text-brand-primary mb-5 flex items-center gap-2">
              <ProfileIcon className="text-purple-500 w-5 h-5" /> Representative
              Profile Workspace
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-brand-primary/70 mb-1.5">
                  Full Display Name
                </label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) =>
                    setProfile({ ...profile, name: e.target.value })
                  }
                  className="w-full bg-brand-light border border-brand-secondary text-brand-primary text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block p-2.5 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-brand-primary/70 mb-1.5">
                  Official Email address
                </label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) =>
                    setProfile({ ...profile, email: e.target.value })
                  }
                  className="w-full bg-brand-light border border-brand-secondary text-brand-primary text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block p-2.5 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-brand-primary/70 mb-1.5">
                  Callback Phone
                </label>
                <input
                  type="text"
                  value={profile.phone}
                  onChange={(e) =>
                    setProfile({ ...profile, phone: e.target.value })
                  }
                  className="w-full bg-brand-light border border-brand-secondary text-brand-primary text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block p-2.5 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-brand-primary/70 mb-1.5">
                  Local Timezone
                </label>
                <input
                  type="text"
                  value={profile.timezone}
                  onChange={(e) =>
                    setProfile({ ...profile, timezone: e.target.value })
                  }
                  className="w-full bg-brand-light border border-brand-secondary text-brand-primary text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block p-2.5 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Aesthetics and themes preferentials */}
          <div className="bg-brand-light border border-brand-secondary rounded-2xl p-6 shadow-sm">
            <h2 className="text-sm font-bold text-brand-primary mb-5 flex items-center gap-2">
              <ThemeIcon className="text-purple-500 w-5 h-5" /> Cosmetics & Theme
              Settings
            </h2>

            <div className="mb-5">
              <label className="block text-sm font-bold text-brand-primary mb-3">
                Selected Interface Mode
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-not-allowed opacity-50">
                  <input
                    type="radio"
                    name="theme"
                    value="light"
                    disabled
                    checked={themePref === "light"}
                    onChange={(e) => setThemePref(e.target.value)}
                    className="text-purple-500 focus:ring-purple-500 bg-brand-light border-brand-secondary w-4 h-4"
                  />
                  <span className="text-sm text-brand-primary">
                    Classic Alabaster (Light)
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="theme"
                    value="dark"
                    checked={themePref === "dark"}
                    onChange={(e) => setThemePref(e.target.value)}
                    className="text-purple-500 focus:ring-purple-500 bg-brand-light border-brand-secondary w-4 h-4"
                  />
                  <span className="text-sm text-brand-primary">
                    Deep Charcoal (Dark)
                  </span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-brand-primary mb-3">
                Accent Visual Colorways
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-not-allowed opacity-50">
                  <input
                    type="radio"
                    name="color"
                    value="blue"
                    disabled
                    checked={accentColor === "blue"}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="text-purple-500 focus:ring-purple-500 bg-brand-light border-brand-secondary w-4 h-4"
                  />
                  <span className="text-sm text-brand-primary">
                    Sapphire Blue
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="color"
                    value="teal"
                    checked={accentColor === "teal"}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="text-purple-500 focus:ring-purple-500 bg-brand-light border-brand-secondary w-4 h-4"
                  />
                  <span className="text-sm text-brand-primary">Ocean Teal</span>
                </label>
                <label className="flex items-center gap-2 cursor-not-allowed opacity-50">
                  <input
                    type="radio"
                    name="color"
                    value="purple"
                    disabled
                    checked={accentColor === "purple"}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="text-purple-500 focus:ring-purple-500 bg-brand-light border-brand-secondary w-4 h-4"
                  />
                  <span className="text-sm text-brand-primary">
                    Amethyst Purple
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Right Hand: Preferences notifications and priority units */}
        <div className="md:col-span-5 space-y-6">
          {/* System notifications channels preferences */}
          <div className="bg-brand-light border border-brand-secondary rounded-2xl p-6 shadow-sm">
            <h2 className="text-sm font-bold text-brand-primary mb-5 flex items-center gap-2">
              <NotificationIcon className="text-purple-500 w-5 h-5" />{" "}
              Communication Preferences
            </h2>

            <ul className="flex flex-col">
              <li className="flex items-center justify-between py-3 border-b border-brand-secondary last:border-0 last:pb-0 first:pt-0">
                <div className="flex-grow min-w-0 pr-4">
                  <p className="text-sm font-bold text-brand-primary mb-0.5">
                    Lead Assigned Email Alerts
                  </p>
                  <p className="text-xs text-brand-primary/70">
                    Broadcast an inbox notice when a new inquiry lands on your
                    roster.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setNotifications({
                      ...notifications,
                      emailAlerts: !notifications.emailAlerts,
                    })
                  }
                  className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-brand-light ${
                    notifications.emailAlerts
                      ? "bg-purple-500"
                      : "bg-brand-secondary/30"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${notifications.emailAlerts ? "translate-x-4" : "translate-x-0"}`}
                  />
                </button>
              </li>

              <li className="flex items-center justify-between py-3 border-b border-brand-secondary last:border-0 last:pb-0">
                <div className="flex-grow min-w-0 pr-4">
                  <p className="text-sm font-bold text-brand-primary mb-0.5">
                    Overdue Backlog Indicators
                  </p>
                  <p className="text-xs text-brand-primary/70">
                    Flag daily task alerts that breach execution timers.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setNotifications({
                      ...notifications,
                      overdueTasks: !notifications.overdueTasks,
                    })
                  }
                  className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-brand-light ${
                    notifications.overdueTasks
                      ? "bg-purple-500"
                      : "bg-brand-secondary/30"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${notifications.overdueTasks ? "translate-x-4" : "translate-x-0"}`}
                  />
                </button>
              </li>

              <li className="flex items-center justify-between py-3 border-b border-brand-secondary last:border-0 last:pb-0">
                <div className="flex-grow min-w-0 pr-4">
                  <p className="text-sm font-bold text-brand-primary mb-0.5">
                    Insurance Expiring Toggles
                  </p>
                  <p className="text-xs text-brand-primary/70">
                    Enable policy alert prompts 10 days prior to contract
                    expiration.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setNotifications({
                      ...notifications,
                      insurances: !notifications.insurances,
                    })
                  }
                  className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-brand-light ${
                    notifications.insurances
                      ? "bg-purple-500"
                      : "bg-brand-secondary/30"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${notifications.insurances ? "translate-x-4" : "translate-x-0"}`}
                  />
                </button>
              </li>
            </ul>
          </div>

          {/* Quick Action save */}
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-purple-500 hover:bg-purple-600 text-brand-light font-bold py-3 px-4 rounded-xl transition-colors"
          >
            <SaveIcon className="w-5 h-5" />
            Save configurations
          </button>
        </div>
      </form>

      {/* Snackbar prompt */}
      {toastOpen && (
        <div className="fixed bottom-4 right-4 z-50 animate-[pulse_0.5s_ease-in-out]">
          <div className="bg-emerald-500/10 border border-emerald-500 text-emerald-500 px-4 py-3 rounded-xl flex items-center gap-3 shadow-lg backdrop-blur-sm">
            <CheckIcon className="w-5 h-5 text-emerald-500" />
            <span className="text-sm font-medium">
              Configurations verified and saved locally.
            </span>
            <button
              onClick={() => setToastOpen(false)}
              className="text-emerald-500/70 hover:text-emerald-500 ml-2"
            >
              <CloseIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
