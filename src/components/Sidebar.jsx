import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  BarChart2,
  Bell,
  LogOut,
  Bot,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Send,
  X,
  LifeBuoy,
  // Target,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useNotifications } from "../context/NotificationContext.jsx";
import { useSupportModal } from "../context/SupportModalContext.jsx";
import LogoutConfirmModal from "./LogoutConfirmModal.jsx";
import crmLogo from "../assets/images/Logo.png";
import { FaWhatsapp } from "react-icons/fa";

const sidebarDrawerWidth = 260;

export default function Sidebar({
  mobileOpen,
  handleDrawerToggle,
  isCollapsed = false,
  handleToggleCollapse,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    logout,
    currentUser,
    organization,
    isManager,
    isSalesPerson,
    hasWhatsAppCampaignsAddon,
    hasBIAnalystAddon,
    // hasTargetIntelligenceAddon,
  } = useAuth();
  const { unreadCount } = useNotifications();
  const { openInstantAiSupport, openMyTickets } = useSupportModal();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const isOrgOwner =
    isManager || currentUser?.role === "Sales Manager" || currentUser?.isOrgOwner;

  // Grouped navigation structure
  const navigationSections = [
    {
      title: "Overview",
      items: [
        {
          text: "Dashboard",
          icon: <LayoutDashboard className="w-5 h-5" />,
          path: "/dashboard",
        },
      ],
    },
    {
      title: "Sales & Pipeline",
      items: [
        {
          text: "Leads Directory",
          icon: <Users className="w-5 h-5" />,
          path: "/leads",
        },
        {
          text: "AI Followups",
          icon: <Sparkles className="w-5 h-5" />,
          path: "/ai-followups",
        },
        {
          text: "Events & Networking",
          icon: <CalendarDays className="w-5 h-5 text-indigo-500" />,
          path: "/events",
        },

        ...(!isSalesPerson && isOrgOwner
          ? [
              {
                text: "Target Intelligence",
                icon: <Target className="w-5 h-5 text-emerald-500" />,
                path: "/target-intelligence",
                isUpgradeTab: !hasTargetIntelligenceAddon,
              },
            ]
          : []),
        ...(isOrgOwner
          ? [
              {
                text: "Team Performance",
                icon: <BarChart2 className="w-5 h-5" />,
                path: "/performance",
              },
            ]
          : []),
      ],
    },
    {
      title: "Communications & AI",
      items: [
        {
          text: "WhatsApp Chat",
          icon: <FaWhatsapp className="w-5 h-5 text-green-500" />,
          path: "/whatsapp",
        },
        ...(!isSalesPerson && isOrgOwner
          ? [
              {
                text: "WhatsApp Campaigns",
                icon: <Send className="w-5 h-5" />,
                path: "/whatsapp/campaigns",
                isUpgradeTab: !hasWhatsAppCampaignsAddon,
              },
            ]
          : []),
        ...(isOrgOwner
          ? [
              {
                text: "BI Analyst",
                icon: <Bot className="w-5 h-5" />,
                path: "/bi-analyst",
                isUpgradeTab: !hasBIAnalystAddon,
              },
            ]
          : []),
        ...(import.meta.env.VITE_PROD === "true" || !isOrgOwner
          ? []
          : [
              {
                text: "Test AI",
                icon: <Bot className="w-5 h-5" />,
                path: "/test-ai",
              },
            ]),
      ],
    },
    {
      title: "System & Alerts",
      items: [
        {
          text: "Notifications",
          icon: <Bell className="w-5 h-5" />,
          path: "/notifications",
          badge: unreadCount,
        },
      ],
    },
    {
      title: "Help & Support",
      items: [
        {
          text: "Support & Help",
          icon: <LifeBuoy className="w-5 h-5 text-purple-500" />,
          path: "/support",
        },
      ],
    },
  ];

  const handleNav = (item) => {
    if (typeof item === "object" && item.onClick) {
      item.onClick();
    } else {
      const path = typeof item === "string" ? item : item?.path;
      if (path === "/leads") {
        const storedPath =
          sessionStorage.getItem("lastLeadsPath") || "/leads/new";
        navigate(storedPath);
      } else if (path) {
        navigate(path);
      }
    }
    if (handleDrawerToggle && mobileOpen) {
      handleDrawerToggle();
    }
  };

  const isItemActive = (item) => {
    if (!item?.path) return false;
    if (location.pathname === item.path) return true;
    if (
      item.path === "/events" &&
      location.pathname.startsWith("/events")
    ) {
      return true;
    }

    if (
      item.path === "/leads" &&
      (location.pathname.startsWith("/leads") ||
        location.pathname.startsWith("/lead-details"))
    ) {
      return true;
    }
    if (
      item.path === "/whatsapp" &&
      location.pathname.startsWith("/whatsapp") &&
      !location.pathname.startsWith("/whatsapp/campaigns") &&
      !location.pathname.startsWith("/whatsapp/templates")
    ) {
      return true;
    }
    if (
      item.path === "/whatsapp/campaigns" &&
      location.pathname.startsWith("/whatsapp/campaigns")
    ) {
      return true;
    }
    if (
      item.path === "/bi-analyst" &&
      location.pathname.startsWith("/bi-analyst")
    ) {
      return true;
    }
    return false;
  };

  const drawerContent = (
    <div className="flex flex-col h-full bg-brand-light text-brand-primary overflow-y-auto overflow-x-hidden">
      {/* â”€â”€ 1. Brand Logo & Collapse Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div
        className={`p-3.5 flex items-center ${
          isCollapsed ? "flex-col gap-2.5 justify-center" : "justify-between gap-2"
        }`}
      >
        {isCollapsed ? (
          <>
            <div
              className="w-12 h-10 bg-white dark:bg-white/95 rounded-xl p-1 flex items-center justify-center shadow-xs border border-slate-200/50 dark:border-slate-700/50"
              title="SalesBuster AI"
            >
              <img
                src={crmLogo}
                alt="SalesBuster AI logo"
                className="w-full h-full object-contain"
              />
            </div>
            {handleToggleCollapse && (
              <button
                type="button"
                onClick={handleToggleCollapse}
                title="Expand sidebar"
                aria-label="Expand sidebar width"
                className="hidden md:flex p-1.5 rounded-lg text-brand-primary/70 hover:text-brand-primary hover:bg-brand-secondary/40 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-pilot-blue focus-visible:outline-none"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </>
        ) : (
          <>
            <div className="flex-1 h-12 bg-white dark:bg-white/95 rounded-xl px-3 py-1 flex items-center justify-center shadow-xs border border-slate-200/50 dark:border-slate-700/50">
              <img
                src={crmLogo}
                alt="SalesBuster AI"
                className="w-full h-full object-contain"
              />
            </div>

            <div className="flex items-center gap-1">
              {/* Mobile Close Button */}
              {mobileOpen && handleDrawerToggle && (
                <button
                  type="button"
                  onClick={handleDrawerToggle}
                  title="Close sidebar menu"
                  aria-label="Close mobile sidebar menu"
                  className="flex md:hidden p-1.5 rounded-lg text-brand-primary/70 hover:text-brand-primary hover:bg-brand-secondary/50 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-pilot-blue focus-visible:outline-none"
                >
                  <X className="w-5 h-5" />
                </button>
              )}

              {/* Desktop Collapse Button */}
              {handleToggleCollapse && (
                <button
                  type="button"
                  onClick={handleToggleCollapse}
                  title="Collapse sidebar"
                  aria-label="Collapse sidebar width"
                  className="hidden md:flex p-1.5 rounded-lg text-brand-primary/70 hover:text-brand-primary hover:bg-brand-secondary/50 transition-colors shrink-0 cursor-pointer focus-visible:ring-2 focus-visible:ring-pilot-blue focus-visible:outline-none"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}
            </div>
          </>
        )}
      </div>

      <hr className="border-brand-secondary/60" />


      {/* â”€â”€ 3. Grouped Navigation Links â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <nav
        aria-label="Main sidebar navigation"
        className={`flex-1 ${isCollapsed ? "px-2" : "px-3"} space-y-4`}
      >
        {navigationSections.map((section, sIdx) => {
          if (!section.items || section.items.length === 0) return null;

          return (
            <div key={section.title} className="space-y-1">
              {/* Section Header */}
              {!isCollapsed ? (
                <div className="px-3 pt-1 pb-1 text-[10px] font-bold uppercase tracking-wider text-brand-primary/50 select-none">
                  {section.title}
                </div>
              ) : sIdx > 0 ? (
                <div className="my-2 border-t border-brand-secondary/50 mx-2" />
              ) : null}

              {/* Section Items */}
              <ul className="space-y-1" role="list">
                {section.items.map((item) => {
                  const isActive = isItemActive(item);

                  return (
                    <li key={item.text} className="relative group">
                      <button
                        type="button"
                        onClick={() => handleNav(item)}
                        aria-current={isActive ? "page" : undefined}
                        aria-label={
                          item.badge !== undefined && item.badge > 0
                            ? `${item.text}, ${item.badge} unread notifications`
                            : item.text
                        }
                        className={`w-full flex items-center ${
                          isCollapsed
                            ? "justify-center px-2 py-2.5"
                            : "gap-3 px-3 py-2"
                        } rounded-xl transition-all relative cursor-pointer focus-visible:ring-2 focus-visible:ring-pilot-blue focus-visible:outline-none ${
                          isActive
                            ? "bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-300 font-bold shadow-2xs"
                            : "bg-transparent text-brand-primary/70 hover:bg-brand-secondary/40 hover:text-brand-primary font-medium"
                        }`}
                      >
                        {/* Non-color Left Edge Active Indicator */}
                        {isActive && (
                          <span
                            className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-md bg-purple-600 dark:bg-purple-400"
                            aria-hidden="true"
                          />
                        )}

                        <span className="shrink-0">{item.icon}</span>

                        {!isCollapsed && (
                          <span className="text-xs md:text-sm flex-1 text-left truncate">
                            {item.text}
                          </span>
                        )}

                        {/* Upgrade to use Tab Badge */}
                        {!isCollapsed && item.isUpgradeTab && (
                          <span
                            title="Upgrade to use this add-on"
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 shrink-0 shadow-2xs"
                          >
                            <Sparkles className="w-2.5 h-2.5" />
                            <span>Upgrade to use</span>
                          </span>
                        )}

                        {/* Collapsed Upgrade Indicator */}
                        {isCollapsed && item.isUpgradeTab && (
                          <span
                            className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full ring-2 ring-brand-light"
                            aria-hidden="true"
                          />
                        )}

                        {/* Notification Badge */}
                        {item.badge !== undefined && item.badge > 0 && (
                          isCollapsed ? (
                            <span
                              className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-brand-light"
                              aria-hidden="true"
                            />
                          ) : (
                            <span
                              title={`${item.badge} unread notifications`}
                              className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[11px] font-bold bg-red-500 text-white rounded-full shrink-0 shadow-xs"
                            >
                              {item.badge > 99 ? "99+" : item.badge}
                            </span>
                          )
                        )}
                      </button>

                      {/* Collapsed Mode Floating Hover Tooltip */}
                      {isCollapsed && (
                        <div
                          role="tooltip"
                          className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xl whitespace-nowrap z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5"
                        >
                          <span>{item.text}</span>
                          {item.isUpgradeTab && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-500 text-slate-900 text-[9px] font-extrabold uppercase">
                              Upgrade to use
                            </span>
                          )}
                          {item.badge !== undefined && item.badge > 0 && (
                            <span className="px-1.5 py-0.2 rounded-full bg-red-500 text-white text-[10px] font-bold">
                              {item.badge}
                            </span>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>


      <hr className="border-brand-secondary/60 mt-2" />

      {/* â”€â”€ 6. Logout Action â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className={`p-2.5 ${isCollapsed ? "flex justify-center relative group" : ""}`}>
        <button
          type="button"
          onClick={() => setShowLogoutModal(true)}
          title="Logout from CRM"
          aria-label="Logout from SalesBuster CRM"
          className={`flex items-center ${
            isCollapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2 w-full"
          } rounded-xl text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none`}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span className="text-xs font-bold text-left">Logout</span>}
        </button>

        {isCollapsed && (
          <div
            role="tooltip"
            className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xl whitespace-nowrap z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
          >
            Logout
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden transition-opacity animate-fadeIn"
          onClick={handleDrawerToggle}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        aria-label="Application Sidebar"
        className={`fixed inset-y-0 left-0 z-50 transform border-r border-brand-secondary bg-brand-light transition-all duration-300 ease-in-out md:translate-x-0 ${
          isCollapsed ? "md:w-20 w-64" : "w-64"
        } ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {drawerContent}
      </aside>

      {/* Logout Confirmation Modal */}
      <LogoutConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={() => {
          setShowLogoutModal(false);
          logout();
        }}
        currentUser={currentUser}
        organization={organization}
      />
    </>
  );
}
export { sidebarDrawerWidth };
