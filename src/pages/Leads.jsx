import React, { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Plus,
  Search,
  Edit2,
  Eye,
  X,
  Mic,
  Info,
  User,
  Phone,
  Calendar,
  Clock,
  ExternalLink,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  FileSpreadsheet,
  Download,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  PhoneMissed,
  XCircle,
  DollarSign,
  Ban,
  RotateCcw,
  Filter,
  Check,
  Copy,
  RefreshCw,
  Inbox,
  UserCheck,
  Building,
} from "lucide-react";
import axios from "axios";
import { API_ENDPOINTS } from "../utils/constants.js";
import { useLeads } from "../context/LeadsContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import ImportLeadsModal from "../components/leads/ImportLeadsModal.jsx";
import RecordingsSidebar from "../components/leads/RecordingsSidebar.jsx";
import {
  formatDate,
  formatTime,
  formatDateTime,
  getStageColor,
  getServiceColor,
  getStatusColor,
  getSourceColor,
  filterLeads,
  normalizeServices,
  getRepName,
  exportToCSV,
  getLocalTodayDateString,
} from "../utils/helpers.js";

// Helper components for UI
const Badge = ({ children, colorClass, className = "" }) => (
  <span
    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${colorClass} ${className}`}
  >
    {children}
  </span>
);

export default function Leads() {
  const navigate = useNavigate();
  const { statusParam } = useParams();
  const scrollContainerRef = useRef(null);

  const handleScroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = 250;
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const {
    addLead,
    updateLead,
    deleteLead,
    activeServices = [],
    qualificationFields,
  } = useLeads();
  const { allUsers, currentUser } = useAuth();

  const isSalesRep =
    currentUser?.role === "Sales Representative" ||
    currentUser?.role === "sales person" ||
    currentUser?.role === "sales_person";

  const paramToTab = {
    new: "New",
    missedcalls: "MissedCalls",
    todayfollowups: "TodayFollowup",
    upcomingfollowups: "UpcomingFollowup",
    notattended: "NotAttended",
    converted: "Converted",
    lost: "Lost",
    oldleads: "OldLeads",
  };

  const tabToParam = {
    New: "new",
    MissedCalls: "missedcalls",
    TodayFollowup: "todayfollowups",
    UpcomingFollowup: "upcomingfollowups",
    NotAttended: "notattended",
    Converted: "converted",
    Lost: "lost",
    OldLeads: "oldleads",
  };

  const [search, setSearch] = useState("");
  const [service, setService] = useState("All");
  const [salesperson, setSalesperson] = useState("All");
  const [status, setStatus] = useState("All");

  const leadTypeTab = paramToTab[statusParam?.toLowerCase()] || "New";

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [paginatedLeads, setPaginatedLeads] = useState([]);
  const [totalLeadsCount, setTotalLeadsCount] = useState(0);
  const [tabCounts, setTabCounts] = useState({});
  const [triggerFetch, setTriggerFetch] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  const [addOpen, setAddOpen] = useState(false);
  const [activeRecordingsLead, setActiveRecordingsLead] = useState(null);
  const [importOpen, setImportOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [copiedPhoneId, setCopiedPhoneId] = useState(null);

  const defaultFormFields = {
    name: "",
    phone: "",
    email: "",
    source: "Manual Entry",
    service: activeServices?.[0]?.code || "General Enquiry",
    assignedTo: isSalesRep
      ? currentUser?.id || currentUser?._id || "Unassigned"
      : "Unassigned",
    nextFollowUp: getLocalTodayDateString(),
    followupTime: "11:00",
    followupType: "Call",
    status: "New",
    leadType: "Client",
    notes: "",
  };

  const [formFields, setFormFields] = useState(defaultFormFields);
  const [formError, setFormError] = useState("");
  const [deleteId, setDeleteId] = useState(null);

  const tabsData = [
    { name: "OldLeads", label: "Old Leads", count: tabCounts.OldLeads || 0 },
    { name: "New", label: "New Leads", count: tabCounts.New || 0 },
    {
      name: "MissedCalls",
      label: "Missed Calls",
      count: tabCounts.MissedCalls || 0,
    },
    {
      name: "TodayFollowup",
      label: "Today Followups",
      count: tabCounts.TodayFollowup || 0,
    },
    {
      name: "UpcomingFollowup",
      label: "Upcoming Followups",
      count: tabCounts.UpcomingFollowup || 0,
    },
    {
      name: "NotAttended",
      label: "Not Attended",
      count: tabCounts.NotAttended || 0,
    },
    {
      name: "Converted",
      label: "Converted",
      count: tabCounts.Converted || 0,
    },
    { name: "Lost", label: "Lost/Dropped", count: tabCounts.Lost || 0 },
  ];

  const sources = [
    "Email",
    "WhatsApp",
    "Meta Ads",
    "Website Form",
    "Website Chat",
    "Call",
    "Manual Entry",
    "Mobile App",
  ];

  const todayStr = useMemo(() => getLocalTodayDateString(), []);

  // Fetch paginated leads
  useEffect(() => {
    let isCancelled = false;

    const fetchLeads = async () => {
      setIsLoading(true);
      setFetchError("");
      try {
        const queryParams = new URLSearchParams({
          page,
          limit: rowsPerPage,
          search,
          service,
          salesperson,
          salespersonId: salesperson !== "All" ? salesperson : "",
          status,
          leadTypeTab,
          currentUserRole: currentUser?.role || "",
          currentUserName: currentUser?.name || "",
          currentUserId: currentUser?.id || currentUser?._id || "",
          clientDate: getLocalTodayDateString(),
        });
        const res = await axios.get(
          `${API_ENDPOINTS.LEADS.BASE}/paginated?${queryParams}`,
        );
        if (!isCancelled) {
          setPaginatedLeads(res.data.leads || []);
          setTotalLeadsCount(res.data.totalCount || 0);
          setTabCounts(res.data.tabCounts || {});
        }
      } catch (error) {
        if (!isCancelled) {
          console.error("Error fetching paginated leads:", error);
          setFetchError(
            error.response?.data?.message ||
              "Failed to load leads directory. Please check your connection and retry.",
          );
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    if (currentUser) {
      fetchLeads();
    }

    return () => {
      isCancelled = true;
    };
  }, [
    page,
    rowsPerPage,
    search,
    service,
    salesperson,
    status,
    leadTypeTab,
    currentUser,
    triggerFetch,
  ]);

  useEffect(() => {
    sessionStorage.setItem(
      "lastLeadsPath",
      `/leads/${tabToParam[leadTypeTab] || "new"}`,
    );
  }, [leadTypeTab]);

  const isAll = rowsPerPage === "All" || rowsPerPage === "all";
  const effectiveLimit = isAll ? totalLeadsCount || 1 : Number(rowsPerPage);
  const totalPages = isAll
    ? 1
    : Math.max(1, Math.ceil(totalLeadsCount / effectiveLimit));

  // Only show the "Next Follow-up" column on Today Followups and Upcoming Followups (or when filtered to Follow Up)
  const showFollowUpColumn =
    leadTypeTab === "TodayFollowup" ||
    leadTypeTab === "UpcomingFollowup" ||
    status === "Follow Up";

  // Filter state indicators
  const hasActiveFilters = Boolean(
    search.trim() !== "" ||
    service !== "All" ||
    salesperson !== "All" ||
    status !== "All",
  );

  const handleResetFilters = () => {
    setSearch("");
    setService("All");
    setSalesperson("All");
    setStatus("All");
    setPage(0);
  };

  const handleOpenAdd = () => {
    setFormFields({
      ...defaultFormFields,
      service: activeServices?.[0]?.code || "General Enquiry",
      nextFollowUp: getLocalTodayDateString(),
      followupTime: "11:00",
      assignedTo: isSalesRep
        ? currentUser?.id || currentUser?._id || "Unassigned"
        : "Unassigned",
    });
    setFormError("");
    setAddOpen(true);
  };

  const handleSaveAdd = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!formFields.name || !formFields.phone || !formFields.service) {
      const msg =
        "Please fill in required fields: Customer Name, Phone, and at least one Service.";
      setFormError(msg);
      return;
    }
    if (
      formFields.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formFields.email)
    ) {
      const msg = "Please enter a valid email address.";
      setFormError(msg);
      return;
    }
    const toSave = { ...formFields, status: formFields.status || "New" };
    if (toSave.status === "Follow Up" && !toSave.nextFollowUp) {
      toSave.nextFollowUp = getLocalTodayDateString();
    }
    try {
      await addLead(toSave, currentUser?.name || "System");
      setAddOpen(false);
      setTriggerFetch((prev) => prev + 1);
    } catch (error) {
      const errMsg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Failed to add lead. Please try again.";
      setFormError(errMsg);
    }
  };

  const handleImportSuccess = () => {
    setTriggerFetch((prev) => prev + 1);
    setPage(0);
    navigate("/leads/oldleads");
  };

  const handleOpenEdit = (lead) => {
    setSelectedLead(lead);
    let currentAssignee = lead.assignedTo || "Unassigned";
    const foundUser = (allUsers || []).find(
      (u) =>
        u.id === currentAssignee ||
        u._id === currentAssignee ||
        u.name?.toLowerCase() === currentAssignee?.toLowerCase(),
    );
    if (foundUser) {
      currentAssignee = foundUser.id || foundUser._id;
    }

    setFormFields({
      name: lead.name,
      phone: lead.phone,
      email: lead.email || "",
      source: lead.source,
      service: normalizeServices(lead.service),
      assignedTo: currentAssignee,
      nextFollowUp: lead.nextFollowUp || getLocalTodayDateString(),
      followupTime: lead.followupTime || "11:00",
      followupType: lead.followupType || "Call",
      status: lead.status || "New",
      leadType: lead.leadType || "Client",
      notes: lead.notes || "",
    });
    setFormError("");
    setEditOpen(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setFormError("");
    if (
      formFields.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formFields.email)
    ) {
      const msg = "Please enter a valid email address.";
      setFormError(msg);
      return;
    }
    try {
      await updateLead(
        selectedLead.id || selectedLead._id,
        formFields,
        currentUser?.name || "System",
      );
      setEditOpen(false);
      setTriggerFetch((prev) => prev + 1);
    } catch (error) {
      const errMsg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Failed to update lead. Please try again.";
      setFormError(errMsg);
    }
  };

  // Multi-modal Status Badge (Semantic icon + text, never relying on color alone)
  const renderStatusBadge = (statusName) => {
    const s = (statusName || "New").toLowerCase().trim();
    switch (s) {
      case "new":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/25">
            <Sparkles className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>New</span>
          </span>
        );
      case "missed call":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
            <PhoneMissed className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>Missed Call</span>
          </span>
        );
      case "follow up":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>Follow Up</span>
          </span>
        );
      case "converted":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>Converted</span>
          </span>
        );
      case "not attended":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>Not Attended</span>
          </span>
        );
      case "price issue":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/25">
            <DollarSign className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>Price Issue</span>
          </span>
        );
      case "not interested":
      case "lost":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/30">
            <XCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>{statusName || "Lost"}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-brand-secondary/40 text-brand-primary border border-brand-secondary/60">
            <Info className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>{statusName}</span>
          </span>
        );
    }
  };

  // Follow-up Urgency Indicator (Explicit Overdue icon + text, never relying on color alone)
  const renderFollowUpIndicator = (lead) => {
    if (!lead.nextFollowUp) {
      return (
        <span className="text-xs text-brand-primary/45 font-medium">—</span>
      );
    }

    const fwDate = lead.nextFollowUp;
    const isOverdue = fwDate < todayStr && lead.status === "Follow Up";
    const isToday = fwDate === todayStr;

    if (isOverdue) {
      return (
        <div className="flex flex-col gap-0.5">
          <span
            className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 dark:text-red-400 bg-red-500/10 px-2 py-0.5 rounded-md border border-red-500/20"
            title={`Follow-up was scheduled for ${formatDate(fwDate)}`}
          >
            <AlertTriangle
              className="w-3.5 h-3.5 shrink-0"
              aria-hidden="true"
            />
            <span>({formatDate(fwDate)})</span>
          </span>
          {lead.followupTime && (
            <span className="text-[11px] text-brand-primary/60 pl-5">
              Time: {lead.followupTime}
            </span>
          )}
        </div>
      );
    }

    if (isToday) {
      return (
        <div className="flex flex-col gap-0.5">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
            <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>
              Today{lead.followupTime ? `, ${lead.followupTime}` : ""}
            </span>
          </span>
          <span className="text-[11px] text-brand-primary/60 pl-5">
            Type: {lead.followupType || "Call"}
          </span>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-0.5">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-primary">
          <Calendar
            className="w-3.5 h-3.5 text-brand-primary/50 shrink-0"
            aria-hidden="true"
          />
          <span>{formatDate(fwDate)}</span>
        </span>
        {lead.followupTime && (
          <span className="text-[11px] text-brand-primary/60 pl-5">
            {lead.followupTime} · {lead.followupType || "Call"}
          </span>
        )}
      </div>
    );
  };

  const handleCopyPhone = (id, phone) => {
    if (!phone) return;
    navigator.clipboard?.writeText(phone);
    setCopiedPhoneId(id);
    setTimeout(() => setCopiedPhoneId(null), 1500);
  };

  const handleExportLeads = () => {
    if (!paginatedLeads || paginatedLeads.length === 0) {
      alert("No leads available to export in the current view.");
      return;
    }
    const formattedData = paginatedLeads.map((lead) => ({
      "Lead Name": lead.name || "",
      "Phone Number": lead.phone || "",
      "Email Address": lead.email || "",
      "Service / Category": normalizeServices(lead.service) || "",
      Status: lead.status || "New",
      "Sales Representative": getRepName(lead.assignedTo, allUsers),
      "Next Follow Up": lead.nextFollowUp || "",
      "Follow Up Time": lead.followupTime || "",
      "Enquired Date & Time": formatDateTime(lead.joinedAt || lead.createdAt),
      Source: lead.source || "",
      Notes: lead.notes || "",
    }));
    exportToCSV(formattedData, `leads_${leadTypeTab.toLowerCase()}_export.csv`);
  };

  return (
    <div className="p-4 md:p-6 space-y-5 w-full max-w-full overflow-x-hidden">
      {/* ── 1. Top Header & Fast Action Buttons ────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-brand-secondary/40">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl md:text-3xl font-extrabold text-brand-primary tracking-tight">
              Leads Directory
            </h1>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-pilot-blue/15 text-pilot-blue border border-pilot-blue/30 capitalize">
              {isSalesRep ? "Representative Workspace" : "Management View"}
            </span>
          </div>
          <p className="text-xs md:text-sm text-brand-primary/70 mt-1">
            Query, manage, schedule, and track customer lead profiles across the
            pipeline.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap w-full sm:w-auto">
          <button
            type="button"
            onClick={handleExportLeads}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-2 bg-brand-light hover:bg-brand-secondary/40 text-brand-primary text-xs font-bold rounded-xl border border-brand-secondary transition-colors cursor-pointer shadow-2xs focus-visible:ring-2 focus-visible:ring-pilot-blue focus-visible:outline-none"
            title="Export current leads view to CSV spreadsheet"
            aria-label="Export leads to spreadsheet with Sales Rep name"
          >
            <Download className="w-4 h-4 text-purple-500" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setImportOpen(true)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-colors shadow-2xs cursor-pointer focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:outline-none"
            aria-label="Bulk import leads from Excel spreadsheet"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Import Excel</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-pilot-blue hover:bg-pilot-blue-hover text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-pilot-blue focus-visible:outline-none"
            aria-label="Create a new customer lead"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Lead</span>
          </button>
        </div>
      </div>

      {/* ── 2. Scrollable Pipeline Category Tabs ────────────────────────── */}
      <div className="relative border-b border-brand-secondary/60 w-full flex items-center">
        {/* Scroll Left Button */}
        <button
          type="button"
          onClick={() => handleScroll("left")}
          className="p-1.5 rounded-lg border border-brand-secondary hover:bg-brand-secondary/40 text-brand-primary/70 transition-colors mr-2 hidden sm:flex shrink-0 focus-visible:ring-2 focus-visible:ring-pilot-blue focus-visible:outline-none"
          title="Scroll Tabs Left"
          aria-label="Scroll tabs to the left"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div
          ref={scrollContainerRef}
          role="tablist"
          aria-label="Lead status pipeline tabs"
          className="flex overflow-x-auto scroll-smooth w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] py-1"
        >
          {tabsData.map((tab) => {
            const isActive = leadTypeTab === tab.name;
            return (
              <button
                key={tab.name}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => {
                  setPage(0);
                  navigate(`/leads/${tabToParam[tab.name]}`);
                }}
                className={`flex-shrink-0 px-4 py-2.5 text-xs md:text-sm font-bold border-b-2 whitespace-nowrap transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-pilot-blue focus-visible:outline-none ${
                  isActive
                    ? "border-purple-600 text-purple-600 dark:text-purple-400 bg-purple-500/5 rounded-t-lg"
                    : "border-transparent text-brand-primary/70 hover:text-brand-primary hover:border-brand-secondary"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`ml-2 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                    isActive
                      ? "bg-purple-600 text-white"
                      : "bg-brand-secondary/50 text-brand-primary/70"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Scroll Right Button */}
        <button
          type="button"
          onClick={() => handleScroll("right")}
          className="p-1.5 rounded-lg border border-brand-secondary hover:bg-brand-secondary/40 text-brand-primary/70 transition-colors ml-2 hidden sm:flex shrink-0 focus-visible:ring-2 focus-visible:ring-pilot-blue focus-visible:outline-none"
          title="Scroll Tabs Right"
          aria-label="Scroll tabs to the right"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* ── 3. Smart Search & Filter Control Bar ─────────────────────────── */}
      <div className="bg-brand-light border border-brand-secondary rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
          {/* Search Box with Clear Button */}
          <div className="lg:col-span-5 relative">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-primary/50"
              aria-hidden="true"
            />
            <input
              type="text"
              placeholder="Search by name, phone, email, or service..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              className="w-full pl-9 pr-9 py-2.5 bg-bg-main border border-brand-secondary rounded-xl text-xs md:text-sm text-brand-primary placeholder:text-brand-primary/50 focus:outline-none focus:border-purple-500 focus-visible:ring-2 focus-visible:ring-purple-500 transition-colors"
              aria-label="Search leads by customer name, phone number, email address, or service"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setPage(0);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-brand-primary/50 hover:text-brand-primary rounded-md transition-colors cursor-pointer"
                title="Clear search text"
                aria-label="Clear search text"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Service Filter */}
          <div className="lg:col-span-3 relative">
            <select
              value={service}
              onChange={(e) => {
                setService(e.target.value);
                setPage(0);
              }}
              aria-label="Filter leads by service category"
              className="w-full px-3.5 py-2.5 bg-bg-main border border-brand-secondary rounded-xl text-xs md:text-sm text-brand-primary focus:outline-none focus:border-purple-500 focus-visible:ring-2 focus-visible:ring-purple-500 transition-colors appearance-none pr-8 cursor-pointer"
            >
              <option value="All">
                All Services ({activeServices.length})
              </option>
              {activeServices.map((s) => (
                <option key={s.code || s.id} value={s.code || s.name}>
                  {s.name}
                </option>
              ))}
            </select>
            <ChevronDown
              className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-primary/50 pointer-events-none"
              aria-hidden="true"
            />
          </div>

          {/* Sales Representative Filter (Manager Only) */}
          {!isSalesRep ? (
            <div className="lg:col-span-2 relative">
              <select
                value={salesperson}
                onChange={(e) => {
                  setSalesperson(e.target.value);
                  setPage(0);
                }}
                aria-label="Filter leads by sales representative"
                className="w-full px-3.5 py-2.5 bg-bg-main border border-brand-secondary rounded-xl text-xs md:text-sm text-brand-primary focus:outline-none focus:border-purple-500 focus-visible:ring-2 focus-visible:ring-purple-500 transition-colors appearance-none pr-8 cursor-pointer"
              >
                <option value="All">All Reps</option>
                {(allUsers || []).map((rep) => (
                  <option key={rep.id || rep._id} value={rep.id || rep._id}>
                    {rep.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-primary/50 pointer-events-none"
                aria-hidden="true"
              />
            </div>
          ) : (
            <div className="lg:col-span-2 hidden lg:block" />
          )}

          {/* Status Filter */}
          <div className="lg:col-span-2 relative">
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(0);
              }}
              aria-label="Filter leads by lead status"
              className="w-full px-3.5 py-2.5 bg-bg-main border border-brand-secondary rounded-xl text-xs md:text-sm text-brand-primary focus:outline-none focus:border-purple-500 focus-visible:ring-2 focus-visible:ring-purple-500 transition-colors appearance-none pr-8 cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="New">New</option>
              <option value="Missed Call">Missed Call</option>
              <option value="Follow Up">Follow Up</option>
              <option value="Not Interested">Not Interested</option>
              <option value="Not Attended">Not Attended</option>
              <option value="Price Issue">Price Issue</option>
              <option value="Converted">Converted</option>
            </select>
            <ChevronDown
              className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-primary/50 pointer-events-none"
              aria-hidden="true"
            />
          </div>
        </div>

        {/* ── Active Filter Summary Strip & Reset ─────────────────────── */}
        <div className="pt-2 border-t border-brand-secondary/40 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-brand-primary/70">
              {isLoading ? (
                <span className="flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Loading directory...
                </span>
              ) : (
                <span>
                  Showing{" "}
                  <strong className="text-brand-primary">
                    {totalLeadsCount === 0
                      ? 0
                      : isAll
                        ? totalLeadsCount
                        : `${page * effectiveLimit + 1}–${Math.min(
                            (page + 1) * effectiveLimit,
                            totalLeadsCount,
                          )}`}
                  </strong>{" "}
                  of{" "}
                  <strong className="text-brand-primary">
                    {totalLeadsCount}
                  </strong>{" "}
                  matching leads
                </span>
              )}
            </span>

            {/* Active filter badges */}
            {search && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/25">
                <span>Search: "{search}"</span>
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="hover:text-purple-800 dark:hover:text-purple-200 cursor-pointer"
                  aria-label="Remove search filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {service !== "All" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/25">
                <span>Service: {service}</span>
                <button
                  type="button"
                  onClick={() => setService("All")}
                  className="hover:text-teal-800 dark:hover:text-teal-200 cursor-pointer"
                  aria-label="Remove service filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {salesperson !== "All" && !isSalesRep && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/25">
                <span>Rep: {getRepName(salesperson, allUsers)}</span>
                <button
                  type="button"
                  onClick={() => setSalesperson("All")}
                  className="hover:text-blue-800 dark:hover:text-blue-200 cursor-pointer"
                  aria-label="Remove representative filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {status !== "All" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25">
                <span>Status: {status}</span>
                <button
                  type="button"
                  onClick={() => setStatus("All")}
                  className="hover:text-amber-800 dark:hover:text-amber-200 cursor-pointer"
                  aria-label="Remove status filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-red-600 hover:text-red-700 dark:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none"
              aria-label="Reset all search and filter dropdowns to defaults"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* ── 4. Error Banner ──────────────────────────────────────────────── */}
      {fetchError && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-between gap-3 text-red-600 dark:text-red-400"
        >
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="text-xs md:text-sm font-semibold">
              {fetchError}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setTriggerFetch((prev) => prev + 1)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-600 text-white hover:bg-red-700 transition-colors cursor-pointer shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── 5. Leads Directory Results ───────────────────────────────────── */}
      <div className="bg-brand-light border border-brand-secondary rounded-2xl overflow-hidden shadow-2xs">
        {/* Desktop Table View (Hidden on mobile) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[950px]">
            <thead>
              <tr className="bg-bg-main/60 border-b border-brand-secondary text-[11px] font-bold text-brand-primary/70 uppercase tracking-wider">
                <th className="px-4 py-3.5">Client & Contact</th>
                <th className="px-4 py-3.5">Service</th>
                <th className="px-4 py-3.5">Source</th>
                <th className="px-4 py-3.5">Status</th>
                {showFollowUpColumn && (
                  <th className="px-4 py-3.5">Next Follow-up</th>
                )}
                {!isSalesRep && <th className="px-4 py-3.5">Assigned Rep</th>}
                <th className="px-4 py-3.5">Enquired On</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-secondary/40 text-xs">
              {isLoading ? (
                // Skeleton loading rows
                [
                  ...Array(
                    rowsPerPage === "All" ? 10 : Math.min(rowsPerPage, 8),
                  ),
                ].map((_, i) => (
                  <tr key={`skeleton-${i}`} className="animate-pulse">
                    <td className="px-4 py-3.5">
                      <div className="h-4 bg-brand-secondary/40 rounded w-32 mb-1.5" />
                      <div className="h-3 bg-brand-secondary/30 rounded w-24" />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="h-4 bg-brand-secondary/30 rounded w-24" />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="h-4 bg-brand-secondary/30 rounded w-16" />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="h-5 bg-brand-secondary/40 rounded-full w-20" />
                    </td>
                    {showFollowUpColumn && (
                      <td className="px-4 py-3.5">
                        <div className="h-4 bg-brand-secondary/30 rounded w-28" />
                      </td>
                    )}
                    {!isSalesRep && (
                      <td className="px-4 py-3.5">
                        <div className="h-4 bg-brand-secondary/30 rounded w-20" />
                      </td>
                    )}
                    <td className="px-4 py-3.5">
                      <div className="h-4 bg-brand-secondary/30 rounded w-20" />
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="h-6 bg-brand-secondary/30 rounded w-24 ml-auto" />
                    </td>
                  </tr>
                ))
              ) : paginatedLeads.length === 0 ? (
                <tr>
                  <td
                    colSpan={(!isSalesRep ? 7 : 6) + (showFollowUpColumn ? 1 : 0)}
                    className="py-14 text-center"
                  >
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto px-4">
                      <div className="w-12 h-12 rounded-2xl bg-brand-secondary/30 flex items-center justify-center text-brand-primary/50 mb-3">
                        <Inbox className="w-6 h-6" />
                      </div>
                      <h3 className="text-sm font-bold text-brand-primary">
                        {hasActiveFilters
                          ? "No matching leads found"
                          : `No leads in ${leadTypeTab}`}
                      </h3>
                      <p className="text-xs text-brand-primary/60 mt-1 text-center">
                        {hasActiveFilters
                          ? "Try clearing or adjusting your search and filter criteria to view results."
                          : "New inquiries and assigned contacts in this category will appear here."}
                      </p>
                      <div className="mt-4 flex items-center gap-2.5">
                        {hasActiveFilters ? (
                          <button
                            type="button"
                            onClick={handleResetFilters}
                            className="px-3.5 py-1.5 rounded-xl bg-pilot-blue text-white text-xs font-bold cursor-pointer"
                          >
                            Reset Filters
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={handleOpenAdd}
                            className="px-3.5 py-1.5 rounded-xl bg-pilot-blue text-white text-xs font-bold cursor-pointer"
                          >
                            Add New Lead
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedLeads.map((lead) => {
                  const leadId = lead.id || lead._id;
                  const serviceName = normalizeServices(lead.service);
                  const sColor = getServiceColor(serviceName);

                  return (
                    <tr
                      key={leadId}
                      className="hover:bg-brand-secondary/20 transition-colors group"
                    >
                      {/* 1. Client & Contact */}
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col gap-0.5">
                          <button
                            type="button"
                            onClick={() => navigate(`/lead-details/${leadId}`)}
                            className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline text-left cursor-pointer flex items-center gap-1.5 group-hover:text-pilot-blue transition-colors"
                          >
                            <span>{lead.name || "Unnamed Client"}</span>
                          </button>
                          {lead.company && (
                            <span className="text-[11px] text-brand-primary/60 font-medium flex items-center gap-1 truncate max-w-[200px]">
                              <Building className="w-3 h-3 shrink-0" />
                              <span>{lead.company}</span>
                            </span>
                          )}
                          <div className="flex items-center gap-2 mt-0.5">
                            <a
                              href={`tel:${lead.phone}`}
                              className="text-[11px] text-brand-primary/75 hover:text-emerald-600 flex items-center gap-1"
                              title="Call client"
                            >
                              <Phone className="w-3 h-3 text-emerald-500" />
                              <span>{lead.phone}</span>
                            </a>
                            <button
                              type="button"
                              onClick={() =>
                                handleCopyPhone(leadId, lead.phone)
                              }
                              className="p-0.5 text-brand-primary/40 hover:text-brand-primary transition-colors cursor-pointer"
                              title="Copy phone number"
                              aria-label={`Copy phone number for ${lead.name}`}
                            >
                              {copiedPhoneId === leadId ? (
                                <Check className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                          {lead.email && (
                            <span className="text-[10px] text-brand-primary/50 truncate max-w-[200px]">
                              {lead.email}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 2. Service */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: sColor }}
                          />
                          <span className="text-xs font-semibold text-brand-primary truncate max-w-[140px]">
                            {serviceName}
                          </span>
                        </div>
                      </td>

                      {/* 3. Source */}
                      <td className="px-4 py-3.5">
                        <Badge
                          colorClass={
                            lead.source === "Website Chat"
                              ? "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30"
                              : lead.source === "WhatsApp"
                                ? "bg-green-500/15 text-green-600 dark:text-green-400 border border-green-500/30"
                                : lead.source === "Meta Ads"
                                  ? "bg-pink-500/15 text-pink-600 dark:text-pink-400 border border-pink-500/30"
                                  : "bg-brand-secondary/40 text-brand-primary border border-brand-secondary/60"
                          }
                        >
                          {lead.source || "Direct"}
                        </Badge>
                      </td>

                      {/* 4. Status (Multi-modal) */}
                      <td className="px-4 py-3.5">
                        {renderStatusBadge(lead.status)}
                      </td>

                      {/* 5. Next Follow-up (Non-color Overdue Warning) */}
                      {showFollowUpColumn && (
                        <td className="px-4 py-3.5">
                          {renderFollowUpIndicator(lead)}
                        </td>
                      )}

                      {/* 6. Assigned Representative */}
                      {!isSalesRep && (
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-brand-secondary/60 flex items-center justify-center text-[9px] font-bold text-brand-primary shrink-0">
                              {getRepName(lead.assignedTo, allUsers)[0] || "?"}
                            </div>
                            <span className="text-xs text-brand-primary truncate max-w-[120px]">
                              {getRepName(lead.assignedTo, allUsers)}
                            </span>
                          </div>
                        </td>
                      )}

                      {/* 7. Enquired On */}
                      <td className="px-4 py-3.5 text-xs text-brand-primary/70">
                        {lead.joinedAt || lead.createdAt ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="font-medium text-brand-primary">
                              {formatDate(lead.joinedAt || lead.createdAt)}
                            </span>
                            <span className="text-[11px] text-brand-primary/50">
                              {formatTime(lead.joinedAt || lead.createdAt)}
                            </span>
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>

                      {/* 8. Action Tools */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setActiveRecordingsLead(lead)}
                            className="p-1.5 text-brand-primary/70 hover:text-purple-600 hover:bg-brand-secondary/40 rounded-lg transition-colors relative cursor-pointer focus-visible:ring-2 focus-visible:ring-pilot-blue focus-visible:outline-none"
                            title="Call recordings & AI conversation analysis"
                            aria-label={`Open AI audio recordings for ${lead.name}`}
                          >
                            <Mic className="w-4 h-4" />
                            {lead.recordings && lead.recordings.length > 0 && (
                              <span
                                className="absolute top-1 right-1 w-2 h-2 bg-purple-600 rounded-full ring-2 ring-brand-light"
                                aria-label="Recordings available"
                              />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEdit(lead)}
                            className="p-1.5 text-brand-primary/70 hover:text-brand-primary hover:bg-brand-secondary/40 rounded-lg transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-pilot-blue focus-visible:outline-none"
                            title="Edit customer lead details"
                            aria-label={`Edit lead details for ${lead.name}`}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => navigate(`/lead-details/${leadId}`)}
                            className="p-1.5 text-purple-600 hover:text-purple-700 hover:bg-purple-500/10 rounded-lg transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-pilot-blue focus-visible:outline-none"
                            title="Open full lead profile workspace"
                            aria-label={`Open workspace details for ${lead.name}`}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>

                          {!isSalesRep && (
                            <button
                              type="button"
                              onClick={() => setDeleteId(leadId)}
                              className="p-1.5 text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none"
                              title="Delete customer record"
                              aria-label={`Delete customer record for ${lead.name}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Mobile Touch Cards View (md:hidden) ───────────────────────── */}
        <div className="block md:hidden divide-y divide-brand-secondary/40">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[...Array(4)].map((_, i) => (
                <div
                  key={`mobile-skeleton-${i}`}
                  className="p-4 rounded-xl border border-brand-secondary/40 animate-pulse space-y-2.5"
                >
                  <div className="h-4 bg-brand-secondary/40 rounded w-40" />
                  <div className="h-3 bg-brand-secondary/30 rounded w-28" />
                  <div className="h-6 bg-brand-secondary/30 rounded w-20" />
                </div>
              ))}
            </div>
          ) : paginatedLeads.length === 0 ? (
            <div className="p-8 text-center">
              <Inbox className="w-8 h-8 text-brand-primary/40 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-brand-primary">
                No matching leads
              </h3>
              <p className="text-xs text-brand-primary/60 mt-1">
                {hasActiveFilters
                  ? "Adjust search or filters to see leads."
                  : "No customer leads in this category."}
              </p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="mt-3 px-3.5 py-1.5 rounded-xl bg-pilot-blue text-white text-xs font-bold"
                >
                  Reset Filters
                </button>
              )}
            </div>
          ) : (
            paginatedLeads.map((lead) => {
              const leadId = lead.id || lead._id;
              const serviceName = normalizeServices(lead.service);
              const sColor = getServiceColor(serviceName);

              return (
                <div
                  key={`mobile-lead-${leadId}`}
                  className="p-4 space-y-3 hover:bg-brand-secondary/10 transition-colors"
                >
                  {/* Card Header: Name + Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <button
                        type="button"
                        onClick={() => navigate(`/lead-details/${leadId}`)}
                        className="text-sm font-bold text-purple-600 dark:text-purple-400 text-left hover:underline"
                      >
                        {lead.name || "Unnamed Client"}
                      </button>
                      {lead.company && (
                        <p className="text-xs text-brand-primary/60 font-medium">
                          {lead.company}
                        </p>
                      )}
                    </div>
                    {renderStatusBadge(lead.status)}
                  </div>

                  {/* Contact & Service Row */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-brand-primary/50 block uppercase font-bold">
                        Phone
                      </span>
                      <a
                        href={`tel:${lead.phone}`}
                        className="font-semibold text-brand-primary hover:text-emerald-600 flex items-center gap-1 mt-0.5"
                      >
                        <Phone className="w-3 h-3 text-emerald-500" />
                        <span>{lead.phone}</span>
                      </a>
                    </div>

                    <div>
                      <span className="text-[10px] text-brand-primary/50 block uppercase font-bold">
                        Service
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: sColor }}
                        />
                        <span className="font-medium text-brand-primary truncate">
                          {serviceName}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Follow-up info */}
                  {showFollowUpColumn && (
                    <div className="p-2.5 rounded-xl bg-bg-main border border-brand-secondary/40 text-xs">
                      <span className="text-[10px] text-brand-primary/50 block uppercase font-bold mb-1">
                        Next Follow-up
                      </span>
                      {renderFollowUpIndicator(lead)}
                    </div>
                  )}

                  {/* Card Bottom Actions */}
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-brand-secondary/30">
                    <div className="text-[11px] text-brand-primary/60">
                      {!isSalesRep && (
                        <span>
                          Rep: {getRepName(lead.assignedTo, allUsers)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <a
                        href={`tel:${lead.phone}`}
                        className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
                        title="Call lead"
                        aria-label={`Call ${lead.name}`}
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>

                      <button
                        type="button"
                        onClick={() => setActiveRecordingsLead(lead)}
                        className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 relative"
                        title="AI Recordings"
                        aria-label={`AI audio analysis for ${lead.name}`}
                      >
                        <Mic className="w-3.5 h-3.5" />
                        {lead.recordings && lead.recordings.length > 0 && (
                          <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-purple-600 rounded-full" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEdit(lead)}
                        className="p-2 rounded-lg border border-brand-secondary text-brand-primary hover:bg-brand-secondary/40"
                        title="Edit lead"
                        aria-label={`Edit ${lead.name}`}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => navigate(`/lead-details/${leadId}`)}
                        className="px-3 py-1.5 rounded-lg bg-pilot-blue text-white text-xs font-bold flex items-center gap-1"
                        aria-label={`Open details for ${lead.name}`}
                      >
                        <span>Workspace</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── 6. Enhanced Pagination Bar ──────────────────────────────────── */}
        <div className="px-4 py-3 border-t border-brand-secondary/60 bg-bg-main/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-brand-primary/70">
          <div className="flex items-center gap-3">
            <span className="font-medium">Rows per page:</span>
            <select
              value={rowsPerPage}
              onChange={(e) => {
                const val =
                  e.target.value === "All" ? "All" : Number(e.target.value);
                setRowsPerPage(val);
                setPage(0);
              }}
              aria-label="Select number of leads displayed per page"
              className="bg-brand-light border border-brand-secondary rounded-lg px-2.5 py-1 text-xs text-brand-primary focus:outline-none focus:border-purple-500 cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value="All">All</option>
            </select>
          </div>

          <div className="flex items-center gap-4">
            <span className="font-semibold text-brand-primary">
              {totalLeadsCount === 0
                ? "0 of 0"
                : isAll
                  ? `All ${totalLeadsCount} leads`
                  : `Page ${page + 1} of ${totalPages} (${totalLeadsCount} total)`}
            </span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage(0)}
                disabled={page === 0 || isAll}
                className="p-1.5 hover:bg-brand-secondary/40 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-visible:ring-2 focus-visible:ring-pilot-blue focus-visible:outline-none"
                title="First Page"
                aria-label="Go to first page"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0 || isAll}
                className="p-1.5 hover:bg-brand-secondary/40 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-visible:ring-2 focus-visible:ring-pilot-blue focus-visible:outline-none"
                title="Previous Page"
                aria-label="Go to previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1 || isAll}
                className="p-1.5 hover:bg-brand-secondary/40 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-visible:ring-2 focus-visible:ring-pilot-blue focus-visible:outline-none"
                title="Next Page"
                aria-label="Go to next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setPage(totalPages - 1)}
                disabled={page >= totalPages - 1 || isAll}
                className="p-1.5 hover:bg-brand-secondary/40 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-visible:ring-2 focus-visible:ring-pilot-blue focus-visible:outline-none"
                title="Last Page"
                aria-label="Go to last page"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── 7. Add / Edit Lead Dialog Modal ──────────────────────────────── */}
      {(addOpen || editOpen) && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="lead-modal-title"
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => {
            setAddOpen(false);
            setEditOpen(false);
          }}
        >
          <div
            className="bg-bg-card border border-border-main rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 md:p-6 border-b border-border-main flex justify-between items-center bg-bg-card">
              <h2
                id="lead-modal-title"
                className="text-base md:text-lg font-bold text-text-primary"
              >
                {addOpen
                  ? "Register New Customer Entry"
                  : "Modify Customer Lead File"}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setAddOpen(false);
                  setEditOpen(false);
                }}
                className="p-1 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-pilot-blue focus-visible:outline-none"
                aria-label="Close modal dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 md:p-6 overflow-y-auto">
              <form
                onSubmit={addOpen ? handleSaveAdd : handleSaveEdit}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                {formError && (
                  <div
                    role="alert"
                    className="md:col-span-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2 text-red-500 text-xs font-semibold"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="lead-form-name"
                    className="block text-xs font-bold text-text-primary mb-1"
                  >
                    Customer Full Name *
                  </label>
                  <input
                    id="lead-form-name"
                    type="text"
                    required
                    value={formFields.name}
                    onChange={(e) =>
                      setFormFields({ ...formFields, name: e.target.value })
                    }
                    className="w-full bg-bg-secondary border border-border-main rounded-xl px-3.5 py-2.5 text-xs md:text-sm text-text-primary focus:outline-none focus:border-pilot-blue focus-visible:ring-2 focus-visible:ring-pilot-blue"
                  />
                </div>

                <div>
                  <label
                    htmlFor="lead-form-phone"
                    className="block text-xs font-bold text-text-primary mb-1"
                  >
                    Contact Phone Number *
                  </label>
                  <input
                    id="lead-form-phone"
                    type="tel"
                    required
                    placeholder="+919876543210"
                    value={formFields.phone}
                    onChange={(e) =>
                      setFormFields({
                        ...formFields,
                        phone: e.target.value.replace(/[^0-9+]/g, ""),
                      })
                    }
                    className="w-full bg-bg-secondary border border-border-main rounded-xl px-3.5 py-2.5 text-xs md:text-sm text-text-primary focus:outline-none focus:border-pilot-blue focus-visible:ring-2 focus-visible:ring-pilot-blue"
                  />
                </div>

                <div>
                  <label
                    htmlFor="lead-form-email"
                    className="block text-xs font-bold text-text-primary mb-1"
                  >
                    Contact Email Address
                  </label>
                  <input
                    id="lead-form-email"
                    type="email"
                    placeholder="client@company.com"
                    value={formFields.email}
                    onChange={(e) =>
                      setFormFields({ ...formFields, email: e.target.value })
                    }
                    className="w-full bg-bg-secondary border border-border-main rounded-xl px-3.5 py-2.5 text-xs md:text-sm text-text-primary focus:outline-none focus:border-pilot-blue focus-visible:ring-2 focus-visible:ring-pilot-blue"
                  />
                </div>

                <div>
                  <label
                    htmlFor="lead-form-source"
                    className="block text-xs font-bold text-text-primary mb-1"
                  >
                    Lead Source Channel
                  </label>
                  <select
                    id="lead-form-source"
                    value={formFields.source}
                    onChange={(e) =>
                      setFormFields({ ...formFields, source: e.target.value })
                    }
                    className="w-full bg-bg-secondary border border-border-main rounded-xl px-3.5 py-2.5 text-xs md:text-sm text-text-primary focus:outline-none focus:border-pilot-blue focus-visible:ring-2 focus-visible:ring-pilot-blue cursor-pointer"
                  >
                    {sources.map((src) => (
                      <option key={src} value={src}>
                        {src}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="lead-form-service"
                    className="block text-xs font-bold text-text-primary mb-1"
                  >
                    Service Offering *
                  </label>
                  <select
                    id="lead-form-service"
                    value={formFields.service}
                    onChange={(e) =>
                      setFormFields({
                        ...formFields,
                        service: e.target.value,
                      })
                    }
                    className="w-full bg-bg-secondary border border-border-main rounded-xl px-3.5 py-2.5 text-xs md:text-sm text-text-primary focus:outline-none focus:border-pilot-blue focus-visible:ring-2 focus-visible:ring-pilot-blue cursor-pointer"
                  >
                    {activeServices.map((s) => (
                      <option key={s.code || s.id} value={s.code || s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="lead-form-assignee"
                    className="block text-xs font-bold text-text-primary mb-1"
                  >
                    Assign Sales Representative
                  </label>
                  <select
                    id="lead-form-assignee"
                    value={formFields.assignedTo}
                    onChange={(e) =>
                      setFormFields({
                        ...formFields,
                        assignedTo: e.target.value,
                      })
                    }
                    disabled={isSalesRep}
                    className="w-full bg-bg-secondary border border-border-main rounded-xl px-3.5 py-2.5 text-xs md:text-sm text-text-primary focus:outline-none focus:border-pilot-blue disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-pilot-blue cursor-pointer"
                  >
                    <option value="Unassigned">Unassigned (Auto-Assign)</option>
                    {(allUsers || []).map((rep) => (
                      <option key={rep.id || rep._id} value={rep.id || rep._id}>
                        {rep.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="lead-form-status"
                    className="block text-xs font-bold text-text-primary mb-1"
                  >
                    Lead Status
                  </label>
                  <select
                    id="lead-form-status"
                    value={formFields.status || "New"}
                    onChange={(e) => {
                      const newStatus = e.target.value;
                      setFormFields((prev) => ({
                        ...prev,
                        status: newStatus,
                        nextFollowUp:
                          newStatus === "Follow Up" && !prev.nextFollowUp
                            ? getLocalTodayDateString()
                            : prev.nextFollowUp,
                        followupTime:
                          newStatus === "Follow Up" && !prev.followupTime
                            ? "11:00"
                            : prev.followupTime,
                      }));
                    }}
                    className="w-full bg-bg-secondary border border-border-main rounded-xl px-3.5 py-2.5 text-xs md:text-sm text-text-primary focus:outline-none focus:border-pilot-blue focus-visible:ring-2 focus-visible:ring-pilot-blue cursor-pointer"
                  >
                    <option value="New">New</option>
                    <option value="Missed Call">Missed Call</option>
                    <option value="Follow Up">Follow Up</option>
                    <option value="Not Interested">Not Interested</option>
                    <option value="Not Attended">Not Attended</option>
                    <option value="Price Issue">Price Issue</option>
                    <option value="Converted">Converted</option>
                  </select>
                </div>

                {formFields.status === "Follow Up" && (
                  <>
                    <div>
                      <label
                        htmlFor="lead-form-fwtype"
                        className="block text-xs font-bold text-text-primary mb-1"
                      >
                        Follow Up Channel
                      </label>
                      <select
                        id="lead-form-fwtype"
                        value={formFields.followupType}
                        onChange={(e) =>
                          setFormFields({
                            ...formFields,
                            followupType: e.target.value,
                          })
                        }
                        className="w-full bg-bg-secondary border border-border-main rounded-xl px-3.5 py-2.5 text-xs md:text-sm text-text-primary focus:outline-none focus:border-pilot-blue focus-visible:ring-2 focus-visible:ring-pilot-blue cursor-pointer"
                      >
                        <option value="Call">Phone Call</option>
                        <option value="WhatsApp">WhatsApp</option>
                        <option value="Email">Email</option>
                        <option value="Meeting">Meeting</option>
                        <option value="Consultation">Consultation</option>
                      </select>
                    </div>
                    <div>
                      <label
                        htmlFor="lead-form-fwdate"
                        className="block text-xs font-bold text-text-primary mb-1"
                      >
                        Next Follow Up Date
                      </label>
                      <input
                        id="lead-form-fwdate"
                        type="date"
                        value={formFields.nextFollowUp}
                        onChange={(e) =>
                          setFormFields({
                            ...formFields,
                            nextFollowUp: e.target.value,
                          })
                        }
                        className="w-full bg-bg-secondary border border-border-main rounded-xl px-3.5 py-2.5 text-xs md:text-sm text-text-primary focus:outline-none focus:border-pilot-blue focus-visible:ring-2 focus-visible:ring-pilot-blue"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="lead-form-fwtime"
                        className="block text-xs font-bold text-text-primary mb-1"
                      >
                        Follow Up Time
                      </label>
                      <input
                        id="lead-form-fwtime"
                        type="time"
                        value={formFields.followupTime}
                        onChange={(e) =>
                          setFormFields({
                            ...formFields,
                            followupTime: e.target.value,
                          })
                        }
                        className="w-full bg-bg-secondary border border-border-main rounded-xl px-3.5 py-2.5 text-xs md:text-sm text-text-primary focus:outline-none focus:border-pilot-blue focus-visible:ring-2 focus-visible:ring-pilot-blue"
                      />
                    </div>
                  </>
                )}

                <div className="md:col-span-2">
                  <label
                    htmlFor="lead-form-notes"
                    className="block text-xs font-bold text-text-primary mb-1"
                  >
                    Client Requirements & Internal Notes
                  </label>
                  <textarea
                    id="lead-form-notes"
                    rows={3}
                    placeholder="Enter customer specific requirements, deal value, or conversation highlights..."
                    value={formFields.notes}
                    onChange={(e) =>
                      setFormFields({ ...formFields, notes: e.target.value })
                    }
                    className="w-full bg-bg-secondary border border-border-main rounded-xl px-3.5 py-2.5 text-xs md:text-sm text-text-primary focus:outline-none focus:border-pilot-blue focus-visible:ring-2 focus-visible:ring-pilot-blue resize-none"
                  />
                </div>
              </form>
            </div>

            <div className="p-4 md:p-6 border-t border-border-main bg-bg-card flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setAddOpen(false);
                  setEditOpen(false);
                }}
                className="px-4 py-2 text-xs md:text-sm font-bold text-text-secondary hover:text-text-primary rounded-xl border border-border-main transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-pilot-blue focus-visible:outline-none"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={addOpen ? handleSaveAdd : handleSaveEdit}
                className="px-6 py-2 bg-pilot-blue hover:bg-pilot-blue-hover text-white text-xs md:text-sm font-bold rounded-xl transition-all shadow-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-pilot-blue focus-visible:outline-none"
              >
                {addOpen ? "Register Lead" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 8. Delete Confirmation Modal ─────────────────────────────────── */}
      {deleteId && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-lead-modal-title"
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn"
        >
          <div className="bg-bg-card border border-border-main rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3
                  id="delete-lead-modal-title"
                  className="text-base font-bold text-text-primary"
                >
                  Delete Customer Lead
                </h3>
                <p className="text-xs text-text-secondary">
                  Irreversible action
                </p>
              </div>
            </div>

            <p className="text-xs text-text-secondary leading-relaxed">
              Are you sure you want to permanently delete this lead? This will
              also purge all linked activities, notes, and scheduled follow-up
              alerts.
            </p>

            <div className="mt-5 pt-4 border-t border-border-main flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 text-xs font-bold text-text-secondary hover:text-text-primary rounded-xl border border-border-main transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-pilot-blue focus-visible:outline-none"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await deleteLead(deleteId);
                    setDeleteId(null);
                    setTriggerFetch((prev) => prev + 1);
                  } catch (error) {
                    alert("Failed to delete lead. Please try again.");
                  }
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 9. Call Audio Recordings Sidebar ─────────────────────────────── */}
      <RecordingsSidebar
        isOpen={Boolean(activeRecordingsLead)}
        onClose={() => setActiveRecordingsLead(null)}
        lead={activeRecordingsLead}
      />

      {/* ── 10. Bulk Import Leads Modal ───────────────────────────────────── */}
      <ImportLeadsModal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        onImportSuccess={handleImportSuccess}
      />
    </div>
  );
}
