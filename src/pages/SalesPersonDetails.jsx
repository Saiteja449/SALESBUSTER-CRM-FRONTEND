import React, { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ExternalLink,
  Eye,
  Edit2,
  Calendar,
  Inbox,
  Download,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  PhoneOff,
  Clock,
  TrendingUp,
  BarChart2,
} from "lucide-react";
import axios from "axios";
import { API_ENDPOINTS } from "../utils/constants.js";
import { useLeads } from "../context/LeadsContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { getServiceColor, formatDate, exportToCSV } from "../utils/helpers.js";

const Badge = ({ children, colorClass, className = "" }) => (
  <span
    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${colorClass} ${className}`}
  >
    {children}
  </span>
);

export default function SalesPersonDetails() {
  const { id, name } = useParams();
  const navigate = useNavigate();
  const { leads } = useLeads();
  const { allUsers } = useAuth();
  const paramVal = id || name;
  const decodedParam = decodeURIComponent(paramVal || "");

  const repUser = (allUsers || []).find(
    (u) =>
      u.id === decodedParam ||
      u._id === decodedParam ||
      u.name?.toLowerCase() === decodedParam?.toLowerCase(),
  );
  const repId = repUser ? repUser.id || repUser._id : decodedParam;
  const repName = repUser ? repUser.name : decodedParam;

  const [activeTab, setActiveTab] = useState("New Leads");
  const [analytics, setAnalytics] = useState([]);
  const scrollContainerRef = useRef(null);

  React.useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await axios.get(`${API_ENDPOINTS.ANALYTICS.BASE}/${repId}`);
        setAnalytics(res.data.data || []);
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      }
    };
    if (repId) {
      fetchAnalytics();
    }
  }, [repId]);

  const formatTalkTime = (seconds) => {
    if (!seconds) return '00:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const todayStrDate = new Date().toISOString().split("T")[0];
  const todayAnalytics = analytics.find(a => a.date === todayStrDate) || {
    totalCalls: 0, talkTime: 0, incoming: 0, outgoing: 0, missed: 0, connected: 0, rejected: 0, notConnected: 0
  };
  
  const weeklyAnalytics = analytics.reduce((acc, curr) => ({
    totalCalls: acc.totalCalls + curr.totalCalls,
    talkTime: acc.talkTime + curr.talkTime,
    incoming: acc.incoming + curr.incoming,
    outgoing: acc.outgoing + curr.outgoing,
    missed: acc.missed + curr.missed,
    connected: acc.connected + curr.connected,
    rejected: acc.rejected + curr.rejected,
    notConnected: acc.notConnected + curr.notConnected,
  }), { totalCalls: 0, talkTime: 0, incoming: 0, outgoing: 0, missed: 0, connected: 0, rejected: 0, notConnected: 0 });

  const handleScroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = 200;
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const repLeads = leads.filter((l) => {
    const assigned = String(l.assignedTo || "");
    return (
      assigned === String(repId) ||
      (repName && assigned.toLowerCase() === repName.toLowerCase())
    );
  });

  const newLeads = repLeads.filter((l) => l.status?.toLowerCase() === "new");
  const todayStr = new Date().toISOString().split("T")[0];

  const todayFollowups = repLeads.filter((l) => {
    if (l.status?.toLowerCase() !== "follow up") return false;
    const fDate = l.nextFollowUp?.split("T")[0];
    return !fDate || fDate <= todayStr;
  });

  const upcomingFollowups = repLeads.filter((l) => {
    if (l.status?.toLowerCase() !== "follow up") return false;
    const fDate = l.nextFollowUp?.split("T")[0];
    return fDate && fDate > todayStr;
  });
  const convertedLeads = repLeads.filter(
    (l) => l.status?.toLowerCase() === "converted",
  );
  const notAttendedLeads = repLeads.filter(
    (l) => l.status?.toLowerCase() === "not attended",
  );
  const lostLeads = repLeads.filter((l) => {
    const s = l.status?.toLowerCase();
    return (
      s === "price issue" || s === "not interested"
    );
  });

  const displayedLeads =
    activeTab === "New Leads"
      ? newLeads
      : activeTab === "Today Followups"
        ? todayFollowups
        : activeTab === "Upcoming Followups"
          ? upcomingFollowups
          : activeTab === "Converted Leads"
          ? convertedLeads
          : activeTab === "Lost Leads"
            ? lostLeads
            : activeTab === "Not Attended"
              ? notAttendedLeads
              : repLeads;

  const handleExport = () => {
    exportToCSV(
      displayedLeads,
      `${decodedName.replace(/\s+/g, "_")}_leads.csv`,
    );
  };

  const getTwStatusColorLocal = (statusName) => {
    switch (statusName?.toLowerCase()) {
      case "new":
        return "bg-purple-500/10 text-purple-500 border border-purple-500/20";
      case "follow up":
        return "bg-orange-500/10 text-orange-500 border border-orange-500/20";
      case "converted":
        return "bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 font-extrabold";
      case "not attended":
      case "price issue":
      case "not interested":
        return "bg-red-500/10 text-red-500 border border-red-500/20";
      default:
        return "bg-brand-secondary/40 text-brand-primary/70 border border-brand-secondary/50";
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-brand-primary/70 hover:text-brand-primary transition-colors font-medium mb-2"
      >
        <ArrowLeft size={18} />
        Back to Team Performance
      </button>

      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-blue-600 text-brand-primary flex items-center justify-center font-bold text-2xl shrink-0">
            {repName.substring(0, 1).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-brand-primary tracking-tight">
              {repName}'s Leads
            </h1>
            <div className="flex items-center gap-3 text-sm text-brand-primary/70 mt-1 flex-wrap">
              <span>Total assigned leads: {repLeads.length}</span>
              {repUser?.phone && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                    <Phone size={13} className="shrink-0" />
                    {repUser.phone}
                  </span>
                </>
              )}
              {repUser?.email && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-brand-primary/60">
                    <Mail size={13} className="shrink-0" />
                    {repUser.email}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 border border-brand-secondary rounded-lg p-1 bg-brand-light">
            <button
              onClick={() => handleScroll("left")}
              className="p-1.5 rounded hover:bg-brand-secondary/50 text-brand-primary transition-colors"
              title="Scroll Tabs Left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleScroll("right")}
              className="p-1.5 rounded hover:bg-brand-secondary/50 text-brand-primary transition-colors"
              title="Scroll Tabs Right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => navigate(`/salesperson/${repId}/reports`)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-brand-primary text-sm font-bold rounded-lg transition-colors"
          >
            <BarChart2 className="w-4 h-4" /> View Reports
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-lg transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      <div className="border-b border-brand-secondary w-full overflow-hidden mb-6">
        <div
          ref={scrollContainerRef}
          className="flex overflow-x-auto scroll-smooth w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
        >
          {[
          { name: "New Leads", count: newLeads.length },
          { name: "Not Attended", count: notAttendedLeads.length },
          { name: "Today Followups", count: todayFollowups.length },
          { name: "Upcoming Followups", count: upcomingFollowups.length },
          { name: "Converted Leads", count: convertedLeads.length },
          { name: "Lost Leads", count: lostLeads.length },
        ].map((tab) => (
          <button
            key={tab.name}
            onClick={() => setActiveTab(tab.name)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.name
                ? "border-purple-500 text-purple-500"
                : "border-transparent text-brand-primary/70 hover:text-brand-primary hover:border-brand-secondary"
            }`}
          >
            {tab.name}
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] ${
                activeTab === tab.name
                  ? "bg-purple-500/20 text-purple-500"
                  : "bg-brand-secondary/30 text-brand-primary/70"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
        </div>
      </div>

      {displayedLeads.length === 0 ? (
        <div className="bg-brand-light border border-brand-secondary rounded-2xl p-12 text-center">
          <Inbox className="w-16 h-16 text-brand-primary/70 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-brand-primary">
            No Assigned Leads
          </h3>
          <p className="text-sm text-brand-primary/70 mt-1">
            This representative currently has no leads assigned to them.
          </p>
        </div>
      ) : (
        <div className="bg-brand-light border border-brand-secondary rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="bg-brand-light border-b border-brand-secondary">
                <tr>
                  <th className="px-4 py-3 text-xs font-bold text-brand-primary uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-4 py-3 text-xs font-bold text-brand-primary uppercase tracking-wider">
                    Phone Number
                  </th>
                  <th className="px-4 py-3 text-xs font-bold text-brand-primary uppercase tracking-wider">
                    Service
                  </th>
                  <th className="px-4 py-3 text-xs font-bold text-brand-primary uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-xs font-bold text-brand-primary uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-secondary">
                {displayedLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="hover:bg-brand-secondary/30/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <button
                        onClick={() => navigate(`/lead-details/${lead.id}`)}
                        className="text-sm font-bold text-purple-400 hover:text-purple-300 hover:underline text-left"
                      >
                        {lead.name}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm text-brand-primary">
                      {lead.phone}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{
                            backgroundColor: getServiceColor(lead.service),
                          }}
                        ></div>
                        <span className="text-sm font-semibold text-brand-primary">
                          {lead.service}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        colorClass={getTwStatusColorLocal(lead.status || "New")}
                      >
                        {lead.status || "New"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => navigate(`/lead-details/${lead.id}`)}
                        className="p-1.5 text-purple-500 hover:text-purple-400 hover:bg-purple-500/10 rounded transition-colors"
                        title="Open Detail"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
