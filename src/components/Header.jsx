import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Menu, Bell, Plus, Search, Headphones } from "lucide-react";
import { useNotifications } from "../context/NotificationContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useSupportModal } from "../context/SupportModalContext.jsx";
import ThemeToggle from "./ThemeToggle.jsx";

export default function Header({ handleDrawerToggle, onQuickAddLead }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();
  const { organization, isManager } = useAuth();
  const { openSupportModal } = useSupportModal();

  // Get dynamic title based on path
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith("/dashboard")) return "Dashboard Overview";
    if (path.startsWith("/leads")) return "Leads Repository";
    if (path.startsWith("/lead-details")) return "Lead Workspace";
    if (path.startsWith("/pipeline")) return "Interactive Pipelines";
    if (path.startsWith("/services")) return "Service Offerings & Workflows";
    if (path.startsWith("/followups")) return "Follow-Up Agenda";
    if (path.startsWith("/performance")) return "Sales Leaderboard";
    if (path.startsWith("/organization")) return "Organization Profile";
    if (path.startsWith("/notifications")) return "Alerts Panel";
    if (path.startsWith("/settings")) return "CRM Preferences";
    return "SalesBuster CRM";
  };

  return (
    <header className="sticky top-0 z-40 bg-bg-card/80 backdrop-blur-md border-b border-border-main text-text-primary">
      <div className="flex items-center justify-between px-4 py-3 sm:px-6">
        {/* Left: Mobile Toggle & Page Title */}
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            type="button"
            className="md:hidden p-2 -ml-2 text-text-secondary hover:text-text-primary rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            onClick={handleDrawerToggle}
            aria-label="open drawer"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3 truncate">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-text-primary truncate">
              {getPageTitle()}
            </h1>
            {organization && (
              isManager ? (
                <button
                  type="button"
                  onClick={() => navigate("/organization")}
                  title="View Organization Profile"
                  className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/20 truncate max-w-[220px] transition-colors cursor-pointer"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                  <span className="truncate">{organization.name}</span>
                </button>
              ) : (
                <div
                  title={`Workspace: ${organization.name}`}
                  className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20 truncate max-w-[220px]"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                  <span className="truncate">{organization.name}</span>
                </div>
              )
            )}
          </div>
        </div>

        {/* Right: Quick Action Controls */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Quick Add Lead */}
          {onQuickAddLead && (
            <>
              <button
                type="button"
                onClick={onQuickAddLead}
                className="hidden sm:flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-brand-light font-bold py-2 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-brand-light"
              >
                <Plus className="w-4 h-4" />
                New Lead
              </button>
              <button
                type="button"
                onClick={onQuickAddLead}
                className="sm:hidden flex items-center justify-center bg-purple-500 hover:bg-purple-600 text-brand-light rounded-full w-9 h-9 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
                aria-label="New Lead"
              >
                <Plus className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Human Assistance / Calendly Meeting Button - Managers Only */}
          {isManager && (
            <>
              <button
                type="button"
                onClick={() =>
                  openSupportModal(
                    "Book 1-on-1 Human Assistance & Consultation Session with our team."
                  )
                }
                title="Book Human Assistance & Support Meeting (Calendly)"
                className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/20 hover:border-purple-500/40 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
              >
                <Headphones className="w-4 h-4 text-purple-500 shrink-0" />
                <span className="hidden md:inline">Human Assistance</span>
                <span className="md:hidden">Support</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  openSupportModal(
                    "Book 1-on-1 Human Assistance & Consultation Session with our team."
                  )
                }
                title="Book Human Assistance (Calendly)"
                className="sm:hidden p-2 rounded-lg bg-bg-card border border-border-main hover:bg-bg-secondary/30 transition-colors text-purple-500"
                aria-label="Book Human Assistance"
              >
                <Headphones className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Alert Bell */}
          <button
            type="button"
            title="View System Notifications"
            onClick={() => navigate("/notifications")}
            className="relative p-2 rounded-lg bg-bg-card border border-border-main hover:bg-bg-secondary/30 transition-colors text-text-secondary hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-text-primary">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
