import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  BarChart2,
  Bell,
  Settings,
  LogOut,
  ClipboardList,
  MessageSquare,
  Bot,
  Sparkles,
  Building2,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useNotifications } from "../context/NotificationContext.jsx";
import crmLogo from "../assets/images/CRM-LOGO.png";

const sidebarDrawerWidth = 260;

export default function Sidebar({ mobileOpen, handleDrawerToggle }) {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    logout,
    currentUser,
    organization,
    totalSeats,
    usedSeats,
    isSubscriptionExpired,
  } = useAuth();
  const { unreadCount } = useNotifications();

  const isOrgOwner =
    currentUser?.role === "Sales Manager" || currentUser?.isOrgOwner;

  const menuItems = [
    {
      text: "Dashboard",
      icon: <LayoutDashboard className="w-5 h-5" />,
      path: "/dashboard",
    },
    { text: "Leads", icon: <Users className="w-5 h-5" />, path: "/leads" },
    {
      text: "AI Followups",
      icon: <Sparkles className="w-5 h-5" />,
      path: "/ai-followups",
    },
    ...(isOrgOwner
      ? [
          {
            text: "Team Performance",
            icon: <BarChart2 className="w-5 h-5" />,
            path: "/performance",
          },
          // {
          //   text: "Organization Profile",
          //   icon: <Building2 className="w-5 h-5" />,
          //   path: "/organization",
          // },
        ]
      : []),
    {
      text: "Notifications",
      icon: <Bell className="w-5 h-5" />,
      path: "/notifications",
      badge: unreadCount,
    },
    {
      text: "WhatsApp Chat",
      icon: <MessageSquare className="w-5 h-5" />,
      path: "/whatsapp",
    },
    ...(import.meta.env.VITE_PROD === "true"
      ? []
      : [
          {
            text: "Test AI",
            icon: <Bot className="w-5 h-5" />,
            path: "/test-ai",
          },
        ]),
  ];

  const handleNav = (path) => {
    if (path === "/leads") {
      const storedPath =
        sessionStorage.getItem("lastLeadsPath") || "/leads/new";
      navigate(storedPath);
    } else {
      navigate(path);
    }
    if (handleDrawerToggle && mobileOpen) {
      handleDrawerToggle();
    }
  };

  const drawerContent = (
    <div className="flex flex-col h-full bg-brand-light text-brand-primary overflow-y-auto">
      {/* Brand Section */}
      <div className="p-4 pb-3">
        <div className="w-full h-11 bg-white flex items-center justify-center">
          <img
            src={crmLogo}
            alt="Kranthi Elevators"
            className="w-full h-full object-contain"
          />
        </div>
      </div>

      <hr className="border-brand-secondary" />

      {/* Organization Badge (Tenant Info) */}

      {/* User Section */}
      {currentUser && (
        <div className="p-4 flex items-center gap-3 bg-brand-light">
          <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center font-bold text-brand-light shrink-0">
            {currentUser.avatar}
          </div>
          <div className="overflow-hidden">
            <div className="text-sm font-semibold truncate text-brand-primary">
              {currentUser.name}
            </div>
            <div className="text-xs font-medium text-purple-500 truncate">
              {currentUser.role}
            </div>
          </div>
        </div>
      )}

      <hr className="border-brand-secondary mb-2" />

      {/* Navigation Links */}
      <nav className="flex-1 px-3">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.path === "/leads" &&
                (location.pathname.startsWith("/leads") ||
                  location.pathname.startsWith("/lead-details")));
            return (
              <li key={item.text}>
                <button
                  type="button"
                  onClick={() => handleNav(item.path)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors border ${
                    isActive
                      ? "bg-brand-light text-purple-500 border-brand-secondary"
                      : "bg-transparent text-brand-primary/70 border-transparent hover:bg-brand-light hover:text-brand-primary"
                  }`}
                >
                  <span className="shrink-0">{item.icon}</span>
                  <span
                    className={`text-sm flex-1 text-left ${isActive ? "font-bold" : "font-medium"}`}
                  >
                    {item.text}
                  </span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold bg-red-500 text-brand-primary rounded-full">
                      {item.badge}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {organization && (
        <button
          type="button"
          onClick={() => handleNav("/organization")}
          className="mx-3 mt-3 p-3.5 bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-[#132742] dark:via-[#132742]/90 dark:to-[#0f1f35] hover:from-blue-50/50 hover:to-indigo-50/50 dark:hover:from-[#162d4c] dark:hover:to-[#132742] border border-slate-200/90 dark:border-slate-700/80 hover:border-blue-300 dark:hover:border-blue-500/50 rounded-2xl text-left transition-all duration-200 block cursor-pointer group shadow-sm hover:shadow-md w-[calc(100%-24px)]"
          title="View Organization Profile"
        >
          {/* Top Row: Workspace Label & Subscription Status */}
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-2 h-2 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50 shrink-0" />
              <span className="text-[11px] font-bold tracking-wider uppercase text-slate-600 dark:text-slate-300 truncate">
                Workspace
              </span>
            </div>

            {isSubscriptionExpired ? (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-200/80 dark:border-rose-500/30 whitespace-nowrap shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                Expired
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-500/30 whitespace-nowrap shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active
              </span>
            )}
          </div>

          {/* Middle Row: Org Avatar + Org Name + Navigation Arrow */}
          <div className="flex items-center gap-2.5 my-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-sm flex items-center justify-center shadow-sm shrink-0">
              {organization.name
                ? organization.name.charAt(0).toUpperCase()
                : "O"}
            </div>
            <div className="min-w-0 flex-1">
              <div
                className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight"
                title={organization.name}
              >
                {organization.name}
              </div>
              <div className="text-xs font-medium text-slate-600 dark:text-slate-300 capitalize truncate mt-0.5">
                {organization.subscriptionPlan || "Monthly"} Plan
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all shrink-0" />
          </div>

          {/* Bottom Row: Seat Utilization & Progress Bar */}
          <div className="mt-3 pt-2.5 border-t border-slate-200/80 dark:border-slate-700/60">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-medium text-slate-600 dark:text-slate-300">Team Seats</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {usedSeats} / {totalSeats} used
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700/70 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, Math.max(usedSeats > 0 ? 8 : 0, (usedSeats / Math.max(totalSeats, 1)) * 100))}%`,
                }}
              />
            </div>
          </div>
        </button>
      )}

      <hr className="border-brand-secondary mt-2" />

      {/* Logout button */}
      <div className="p-3">
        <button
          type="button"
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <span className="text-sm font-semibold text-left">Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-brand-light/60 z-40 md:hidden transition-opacity"
          onClick={handleDrawerToggle}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-brand-secondary bg-brand-light transition-transform duration-300 ease-in-out md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {drawerContent}
      </aside>
    </>
  );
}
export { sidebarDrawerWidth };
