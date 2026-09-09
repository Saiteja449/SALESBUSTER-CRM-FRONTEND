import React, { useState, createContext, useContext, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import { API_ENDPOINTS } from "../utils/constants.js";
import { services } from "../data.js";
import { useAuth } from "./AuthContext.jsx";
import { getServiceColor, getRepName } from "../utils/helpers.js";
import { socket } from "../utils/socket.js";

const LeadsContext = createContext(null);

const mapServicesToActive = (rawServices) => {
  if (!Array.isArray(rawServices) || rawServices.length === 0) return null;
  return rawServices.map((s, idx) => {
    const name = typeof s === "string" ? s : s.name;
    return {
      id: s._id || `s_${idx}`,
      name,
      code: name,
      active: true,
      color: getServiceColor(name),
      description: s.description || "",
      keywords: s.keywords || [],
    };
  });
};

export function LeadsProvider({ children }) {
  const { organization, allUsers } = useAuth();
  const [leads, setLeads] = useState([]);

  const [activeServices, setActiveServices] = useState(() => {
    const fromOrg = mapServicesToActive(organization?.aiSettings?.services);
    return fromOrg || services;
  });

  const qualificationFields = useMemo(() => {
    return organization?.aiSettings?.qualificationFields || [];
  }, [organization?.aiSettings?.qualificationFields]);

  // Synchronize when organization changes
  useEffect(() => {
    if (organization?.aiSettings?.services && organization.aiSettings.services.length > 0) {
      const dynamic = mapServicesToActive(organization.aiSettings.services);
      if (dynamic) setActiveServices(dynamic);
    }
  }, [organization?.aiSettings?.services]);

  // Listen for real-time socket updates to AI settings
  useEffect(() => {
    const handleAiSettingsUpdate = (aiSettings) => {
      if (aiSettings?.services && aiSettings.services.length > 0) {
        const dynamic = mapServicesToActive(aiSettings.services);
        if (dynamic) setActiveServices(dynamic);
      }
    };

    socket.on("ai_settings_updated", handleAiSettingsUpdate);
    return () => {
      socket.off("ai_settings_updated", handleAiSettingsUpdate);
    };
  }, []);

  const [followups, setFollowups] = useState([]);

  // Listen for real-time AI followup socket events to update active follow-up rather than duplicating
  useEffect(() => {
    const handleAiNewFollowup = (data) => {
      if (data?.followup) {
        const fu = data.followup;
        setFollowups((prev) => {
          const idx = prev.findIndex(
            (item) =>
              (fu.id && (item.id === fu.id || item._id === fu.id)) ||
              (String(item.leadId) === String(fu.leadId) &&
                item.author === "AI Agent" &&
                !item.done),
          );
          if (idx >= 0) {
            const updated = [...prev];
            updated[idx] = { ...updated[idx], ...fu, done: false };
            return updated;
          }
          return [fu, ...prev];
        });
      }
    };

    socket.on("ai_new_followup", handleAiNewFollowup);
    return () => {
      socket.off("ai_new_followup", handleAiNewFollowup);
    };
  }, []);

  const refreshData = React.useCallback(async () => {
    try {
      const [leadsRes, followupsRes] = await Promise.all([
        axios.get(API_ENDPOINTS.LEADS.BASE),
        axios.get(API_ENDPOINTS.FOLLOWUPS.BASE),
      ]);
      setLeads(leadsRes.data.data || leadsRes.data);
      setFollowups(followupsRes.data.data || followupsRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Add a new lead
  const addLead = async (leadData, author = "System") => {
    try {
      const response = await axios.post(API_ENDPOINTS.LEADS.BASE, leadData);
      const newLead = response.data.data || response.data;
      setLeads((prev) => [newLead, ...prev]);

      // If there's a next follow-up date, automatically create a follow-up item
      if (leadData.nextFollowUp) {
        await addFollowup({
          leadId: newLead.id,
          leadName: leadData.name,
          type: "Call", // Default helper
          date: leadData.nextFollowUp,
          time: "10:00 AM",
          priority: "Medium",
          notes: `Initial follow-up scheduled for ${leadData.name}`,
        });
      }
      return newLead.id;
    } catch (error) {
      console.error("Error adding lead:", error);
      throw error;
    }
  };

  // Edit existing lead
  const updateLead = async (leadId, updatedFields, author = "System") => {
    try {
      const response = await axios.put(
        `${API_ENDPOINTS.LEADS.BASE}/${leadId}`,
        updatedFields,
      );
      const updatedLead = response.data.data || response.data;

      const lead = leads.find((l) => l.id === leadId);
      if (lead) {
        // Detect changed fields to log activity
        const changes = [];
        if (
          updatedFields.assignedTo &&
          updatedFields.assignedTo !== lead.assignedTo
        ) {
          const oldName = getRepName(lead.assignedTo, allUsers);
          const newName = getRepName(updatedFields.assignedTo, allUsers);
          changes.push(
            `assignee from "${oldName}" to "${newName}"`,
          );
        }
        if (updatedFields.status && updatedFields.status !== lead.status) {
          if (updatedFields.status !== "Follow Up") {
            changes.push(`status to "${updatedFields.status}"`);
          }
        }

        if (changes.length > 0) {
          const now = new Date();
          addFollowup({
            leadId,
            leadName: lead.name,
            type: "Lead Edited",
            date: now.toISOString().split("T")[0],
            time: now.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            priority: "Low",
            notes: `Updated properties: ${changes.join(", ")} by ${author}`,
            author,
            done: true,
          });
        }
      }

      setLeads((prev) => prev.map((l) => (l.id === leadId ? updatedLead : l)));

      // Automatically mark pending AI follow-ups for this lead as done in local state so it immediately disappears from Immediate Actions
      setFollowups((prev) =>
        prev.map((f) => {
          const isMatch =
            String(f.leadId) === String(leadId) ||
            String(f.leadId) === String(updatedLead?._id) ||
            String(f.leadId) === String(updatedLead?.id);
          if (isMatch && f.author === "AI Agent" && !f.done) {
            return { ...f, done: true };
          }
          return f;
        }),
      );
    } catch (error) {
      console.error("Error updating lead:", error);
      throw error;
    }
  };

  // Toggle service enabled/disabled in Service Management
  const toggleServiceActive = (serviceCode) => {
    setActiveServices((prev) =>
      prev.map((s) => {
        if (s.code === serviceCode) {
          return { ...s, active: !s.active };
        }
        return s;
      }),
    );
  };

  // Follow-ups management
  const addFollowup = async (fwData) => {
    try {
      const response = await axios.post(API_ENDPOINTS.FOLLOWUPS.BASE, {
        ...fwData,
        done: fwData.done !== undefined ? fwData.done : false,
      });
      setFollowups((prev) => [response.data.data || response.data, ...prev]);
    } catch (error) {
      console.error("Error adding followup:", error);
    }
  };

  const toggleFollowupDone = async (fwId) => {
    const f = followups.find((f) => f.id === fwId || f._id === fwId);
    if (!f) return;
    const nextStatus = !f.done;

    try {
      const targetId = f.id || f._id || fwId;
      const response = await axios.put(
        `${API_ENDPOINTS.FOLLOWUPS.BASE}/${targetId}`,
        { done: nextStatus },
      );
      const updatedFollowup = response.data.data || response.data;
      setFollowups((prev) =>
        prev.map((item) =>
          item.id === targetId || item._id === targetId || item.id === fwId
            ? { ...item, ...updatedFollowup, done: nextStatus }
            : item,
        ),
      );
    } catch (error) {
      console.error("Error updating followup:", error);
    }
  };

  // Delete a lead and its related records
  const deleteLead = async (leadId) => {
    try {
      await axios.delete(`${API_ENDPOINTS.LEADS.BASE}/${leadId}`);
      setLeads((prev) => prev.filter((l) => l.id !== leadId));
      setFollowups((prev) => prev.filter((f) => f.leadId !== leadId));
    } catch (error) {
      console.error("Error deleting lead:", error);
    }
  };

  return (
    <LeadsContext.Provider
      value={{
        leads,
        setLeads,
        activeServices,
        setActiveServices,
        qualificationFields,
        followups,
        addLead,
        updateLead,
        toggleServiceActive,
        addFollowup,
        toggleFollowupDone,
        deleteLead,
        refreshData,
      }}
    >
      {children}
    </LeadsContext.Provider>
  );
}

export function useLeads() {
  const context = useContext(LeadsContext);
  if (!context) {
    throw new Error("useLeads must be used within a LeadsProvider");
  }
  return context;
}
