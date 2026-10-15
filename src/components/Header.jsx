import React, { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Menu,
  Bell,
  Plus,
  Headphones,
  Sparkles,
  User,
  Building2,
  LogOut,
  ChevronDown,
  Mail,
  Phone,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useSupportModal } from "../context/SupportModalContext.jsx";
import ThemeToggle from "./ThemeToggle.jsx";
import LogoutConfirmModal from "./LogoutConfirmModal.jsx";

export default function Header({ handleDrawerToggle, onQuickAddLead }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { organization, isManager, currentUser, logout } = useAuth();
  const { openSupportModal } = useSupportModal();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const profileMenuRef = useRef(null);

  // Close profile menu when clicking outside or pressing Escape
  useEffect(() => {
    if (!isProfileMenuOpen) return;

    const handleClickOutside = (e) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(e.target)
      ) {
        setIsProfileMenuOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isProfileMenuOpen]);

  // Close menu on route change
  useEffect(() => {
    setIsProfileMenuOpen(false);
  }, [location.pathname]);

  // Get dynamic title based on path
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith("/dashboard")) return "Dashboard Overview";
    if (path.startsWith("/leads")) return "Leads Repository";
    if (path.startsWith("/lead-details")) return "Lead Workspace";
    if (path.startsWith("/pipeline")) return "Interactive Pipelines";
    if (path.startsWith("/services")) return "Service Offerings & Workflows";
    if (path.startsWith("/ai-followups")) return "AI Follow-ups";
    if (path.startsWith("/followups")) return "Follow-Up Agenda";
    if (path.startsWith("/performance")) return "Sales Leaderboard";
    if (path.startsWith("/bi-analyst")) return "BI Analyst";
    if (path.startsWith("/organization")) return "Organization Profile";
    if (path.startsWith("/notifications")) return "Alerts Panel";
    if (path.startsWith("/settings")) return "CRM Preferences";
    if (path.startsWith("/salesperson")) return "Representative Details";
    return "SalesBuster CRM";
  };

  const displayName = currentUser?.name || "User";
  const userRole = currentUser?.role || "Team Member";
  const userAvatar =
    currentUser?.avatar ||
    displayName.substring(0, 2).toUpperCase() ||
    "U";
  const userEmail = currentUser?.email || "";
  const userPhone = currentUser?.phone || currentUser?.mobile || "";

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
                className="hidden sm:flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-brand-light font-bold py-2 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-brand-light cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                New Lead
              </button>
              <button
                type="button"
                onClick={onQuickAddLead}
                className="sm:hidden flex items-center justify-center bg-purple-500 hover:bg-purple-600 text-brand-light rounded-full w-9 h-9 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                aria-label="New Lead"
              >
                <Plus className="w-5 h-5" />
              </button>
            </>
          )}

         

          {isManager && (
            <>
              <button
                type="button"
                onClick={() =>
                  openSupportModal(
                    "Book 1-on-1 Human Assistance & Consultation Session with our team.",
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
                    "Book 1-on-1 Human Assistance & Consultation Session with our team.",
                  )
                }
                title="Book Human Assistance (Calendly)"
                className="sm:hidden p-2 rounded-lg bg-bg-card border border-border-main hover:bg-bg-secondary/30 transition-colors text-purple-500 cursor-pointer"
                aria-label="Book Human Assistance"
              >
                <Headphones className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Theme Toggle */}
          <ThemeToggle />


          {/* ── Profile Icon Trigger & Dropdown Menu ──────────────────── */}
          <div className="relative" ref={profileMenuRef}>
            <button
              type="button"
              onClick={() => setIsProfileMenuOpen((prev) => !prev)}
              aria-haspopup="true"
              aria-expanded={isProfileMenuOpen}
              aria-label={`Account menu for ${displayName}`}
              title={`Profile & account options (${displayName})`}
              className="flex items-center gap-1.5 p-1 rounded-full hover:bg-bg-secondary/60 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:outline-none"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center font-bold text-white text-xs shadow-xs border border-white/20">
                {userAvatar}
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-text-secondary transition-transform duration-200 hidden sm:block ${
                  isProfileMenuOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Profile Dropdown Menu */}
            {isProfileMenuOpen && (
              <div
                role="menu"
                aria-label="User profile options"
                className="absolute right-0 top-full mt-2 w-64 sm:w-72 bg-bg-card border border-border-main rounded-2xl shadow-xl z-50 overflow-hidden animate-fadeIn max-w-[calc(100vw-1.5rem)] text-text-primary"
              >
                {/* User Identity Header */}
                <div className="p-3.5 sm:p-4 bg-bg-secondary/40 border-b border-border-main">
                  <div className="flex items-start gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-purple-600 flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-xs mt-0.5">
                      {userAvatar}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-text-primary truncate">
                        {displayName}
                      </div>
                      <div className="inline-block mt-0.5 text-[10px] font-bold px-2 py-0.2 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 truncate">
                        {userRole}
                      </div>
                      {userEmail && (
                        <div
                          className="text-[11px] text-text-secondary truncate flex items-center gap-1.5 mt-1"
                          title={userEmail}
                        >
                          <Mail className="w-3 h-3 text-purple-500/70 shrink-0" />
                          <span className="truncate">{userEmail}</span>
                        </div>
                      )}
                      {userPhone && (
                        <div
                          className="text-[11px] text-text-secondary truncate flex items-center gap-1.5 mt-0.5"
                          title={userPhone}
                        >
                          <Phone className="w-3 h-3 text-purple-500/70 shrink-0" />
                          <span className="truncate">{userPhone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Menu Action Items */}
                <div className="p-2 space-y-1">
                  {/* Sales Managers Only: Profile Details & Organization Details */}
                  {isManager && (
                    <>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          const targetId =
                            currentUser?.id ||
                            currentUser?._id ||
                            encodeURIComponent(displayName);
                          navigate(`/salesperson/${targetId}`);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-bg-secondary/70 text-text-primary transition-colors cursor-pointer group focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:outline-none"
                      >
                        <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                          <User className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold leading-tight group-hover:text-purple-600 transition-colors">
                            Profile Details
                          </div>
                          <div className="text-[10px] text-text-secondary truncate mt-0.5">
                            View personal representative stats
                          </div>
                        </div>
                      </button>

                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          navigate("/organization");
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-bg-secondary/70 text-text-primary transition-colors cursor-pointer group focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:outline-none"
                      >
                        <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold leading-tight group-hover:text-blue-600 transition-colors">
                            Organization Details
                          </div>
                          <div className="text-[10px] text-text-secondary truncate mt-0.5">
                            Workspace, AI prompts &amp; team seats
                          </div>
                        </div>
                      </button>

                      <hr className="border-border-main my-1" />
                    </>
                  )}

                  {/* Logout Action (Accessible to all authenticated users) */}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      setShowLogoutModal(true);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
                  >
                    <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                      <LogOut className="w-4 h-4" />
                    </div>
                    <div className="text-xs font-bold">Logout</div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>



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
    </header>
  );
}

