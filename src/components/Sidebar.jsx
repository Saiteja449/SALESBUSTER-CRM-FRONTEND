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
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useNotifications } from "../context/NotificationContext.jsx";
import crmLogo from "../assets/images/CRM-LOGO.png";

const sidebarDrawerWidth = 260;

export default function Sidebar({ mobileOpen, handleDrawerToggle }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, currentUser } = useAuth();
  const { unreadCount } = useNotifications();

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
    ...(currentUser?.role === "Sales Manager"
      ? [
          {
            text: "Team Performance",
            icon: <BarChart2 className="w-5 h-5" />,
            path: "/performance",
          },
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
