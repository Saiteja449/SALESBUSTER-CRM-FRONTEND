import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
} from "react";
import axios from "axios";
import { API_ENDPOINTS } from "../utils/constants.js";
import { useLeads } from "./LeadsContext.jsx";
import { useAuth } from "./AuthContext.jsx";
import { normalizeServices } from "../utils/helpers.js";

const DashboardContext = createContext(null);

export function DashboardProvider({ children }) {
  const { currentUser, allUsers } = useAuth();
  const { leads: rawLeads, followups: rawFollowups } = useLeads();
  const [todayAnalytics, setTodayAnalytics] = useState([]);

  useEffect(() => {
    const role = String(currentUser?.role || "").toLowerCase().trim();
    const isSalesRep = ["sales person", "sales representative", "sales_person"].includes(role);
    if (!currentUser || isSalesRep) {
      setTodayAnalytics([]);
      return undefined;
    }

    const fetchAnalytics = async () => {
      try {
        const res = await axios.get(API_ENDPOINTS.ANALYTICS.TODAY);
        setTodayAnalytics(res.data.data || []);
      } catch (err) {
        console.error("Failed to fetch today analytics:", err);
      }
    };
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, [currentUser?.id, currentUser?._id, currentUser?.role]);

  // Filter based on user role: if Sales Representative, only show their assigned leads for simple dashboard KPIs
  const leads = useMemo(() => {
    if (currentUser && currentUser.role === "Sales Representative") {
      const uId = currentUser.id || currentUser._id;
      const uName = currentUser.name?.toLowerCase();
      return rawLeads.filter((l) => {
        const assigned = String(l.assignedTo || "");
        return (
          (uId && assigned === String(uId)) ||
          (uName && assigned.toLowerCase() === uName)
        );
      });
    }
    return rawLeads;
  }, [rawLeads, currentUser]);

  const followups = useMemo(() => {
    if (currentUser && currentUser.role === "Sales Representative") {
      const uId = currentUser.id || currentUser._id;
      const uName = currentUser.name?.toLowerCase();
      return rawFollowups.filter((f) => {
        const lead = rawLeads.find((l) => l.id === f.leadId);
        if (!lead) return false;
        const assigned = String(lead.assignedTo || "");
        return (
          (uId && assigned === String(uId)) ||
          (uName && assigned.toLowerCase() === uName)
        );
      });
    }
    return rawFollowups;
  }, [rawFollowups, rawLeads, currentUser]);

  const stats = useMemo(() => {
    const totalLeads = leads.length;

    // Define what constitutes a Converted lead (strictly status === "Converted")
    const isLeadWon = (lead) => lead.status === "Converted";

    const wonLeads = leads.filter(isLeadWon);
    const totalWonCount = wonLeads.length;
    const convertedCount = totalWonCount;

    // Conversion % (calculated strictly using converted leads)
    const conversionRate =
      totalLeads > 0 ? Math.round((totalWonCount / totalLeads) * 100) : 0;

    // Service Breakdown & Won vs Pipeline counts
    const serviceBreakdown = {};
    const serviceWonLeads = {};

    leads.forEach((lead) => {
      const s = normalizeServices(lead.service);
      serviceBreakdown[s] = (serviceBreakdown[s] || 0) + 1;
      if (isLeadWon(lead)) {
        serviceWonLeads[s] = (serviceWonLeads[s] || 0) + 1;
      }
    });

    // Formatted for Charts
    const leadsByServiceData = Object.keys(serviceBreakdown).map((s) => ({
      name: s,
      value: serviceBreakdown[s],
    }));

    const wonLeadsByServiceData = Object.keys(serviceBreakdown).map((s) => ({
      name: s,
      pipeline: serviceBreakdown[s] || 0,
      won: serviceWonLeads[s] || 0,
    }));

    // Today's Date
    const TODAY = new Date().toISOString().split("T")[0];
    const todaysFws = followups.filter((fw) => fw.date === TODAY && !fw.done);
    const overdueFws = followups.filter((fw) => fw.date < TODAY && !fw.done);

    // Lead Source Analytics
    const sourceMap = {};
    leads.forEach((lead) => {
      sourceMap[lead.source] = (sourceMap[lead.source] || 0) + 1;
    });
    const leadSourceData = Object.keys(sourceMap).map((src) => ({
      name: src,
      value: sourceMap[src],
    }));

    // Top Performers Leaderboard (Calculated globally so representatives see peer benchmarking)
    const performerMap = {};

    // Seed performerMap with all active salespeople so they exist even with zero assigned leads
    (allUsers || []).forEach((user) => {
      if (user.role === "Sales Representative") {
        const userId = user.id || user._id;
        const userAnalytics =
          todayAnalytics.find(
            (a) =>
              (a.salespersonId && String(a.salespersonId) === String(userId)) ||
              a.salesperson === user.name ||
              a.salesperson === String(userId)
          ) || {};
        performerMap[String(userId)] = {
          id: userId,
          name: user.name,
          email: user.email,
          phone: user.phone || user.mobile || "",
          role: user.role,
          assigned: 0,
          won: 0,
          callsMade: userAnalytics.totalCalls || 0,
        };
      }
    });

    // Fill metrics using raw global leads list
    rawLeads.forEach((lead) => {
      const repAssigned = String(lead.assignedTo || "");
      const matchedPerformer = Object.values(performerMap).find(
        (p) =>
          String(p.id) === repAssigned ||
          (p.name && p.name.toLowerCase() === repAssigned.toLowerCase())
      );

      if (matchedPerformer) {
        matchedPerformer.assigned += 1;
        if (isLeadWon(lead)) {
          matchedPerformer.won += 1;
        }
      }
    });

    const performersList = Object.values(performerMap)
      .map((p) => {
        const convPct =
          p.assigned > 0 ? Math.round((p.won / p.assigned) * 100) : 0;
        // Get completion rate of follow-ups assigned to them
        const repFws = rawFollowups.filter((f) => {
          const leadObj = rawLeads.find((l) => l.id === f.leadId);
          if (!leadObj) return false;
          const assigned = String(leadObj.assignedTo || "");
          return (
            assigned === String(p.id) ||
            assigned.toLowerCase() === p.name.toLowerCase()
          );
        });
        const completedRepFws = repFws.filter((f) => f.done).length;
        const fwCompletionPct =
          repFws.length > 0
            ? Math.round((completedRepFws / repFws.length) * 100)
            : 80; // default average

        let dynamicResponseTime = "--";
        const repLeadsData = rawLeads.filter((l) => {
          const assigned = String(l.assignedTo || "");
          return (
            assigned === String(p.id) ||
            assigned.toLowerCase() === p.name.toLowerCase()
          );
        });
        if (repLeadsData.length > 0) {
          let totalResponseMs = 0;
          let respondedLeadsCount = 0;

          repLeadsData.forEach((lead) => {
            const repActivities = rawFollowups.filter(
              (a) =>
                a.done &&
                a.leadId === lead.id &&
                (a.author === p.name || a.author === String(p.id)),
            );
            if (repActivities.length > 0) {
              repActivities.sort((a, b) => new Date(a.date) - new Date(b.date));
              const firstActivityDate = new Date(repActivities[0].date);

              const leadCreationDate = new Date(lead.createdAt);
              leadCreationDate.setHours(9, 0, 0, 0);

              let diffMs = firstActivityDate - leadCreationDate;
              if (diffMs < 0) diffMs = 0;

              totalResponseMs += diffMs;
              respondedLeadsCount++;
            }
          });

          if (respondedLeadsCount > 0) {
            const avgHours =
              totalResponseMs / respondedLeadsCount / (1000 * 60 * 60);
            if (avgHours < 1) {
              dynamicResponseTime =
                Math.max(1, Math.round(avgHours * 60)) + " mins";
            } else {
              dynamicResponseTime = avgHours.toFixed(1) + " hrs";
            }
          } else {
            dynamicResponseTime = "Pending";
          }
        }

        return {
          ...p,
          conversionRate: convPct,
          fwCompletionRate: fwCompletionPct,
          responseTime: dynamicResponseTime,
          activityScore:
            p.assigned > 0
              ? Math.round(convPct * 0.6 + fwCompletionPct * 0.4)
              : 0,
        };
      })
      .sort((a, b) => b.won - a.won);

    return {
      totalLeads,
      totalWonCount,
      conversionRate,
      leadsByServiceData,
      wonLeadsByServiceData,
      convertedCount,
      jobsAssignedCount: convertedCount,
      todaysFollowupsCount: todaysFws.length,
      overdueFollowupsCount: overdueFws.length,
      leadSourceData,
      performersList,
      recentActivities: followups.filter((f) => f.done).slice(0, 10),
    };
  }, [leads, followups, rawLeads, rawFollowups, allUsers, todayAnalytics]);

  return (
    <DashboardContext.Provider value={stats}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
}
