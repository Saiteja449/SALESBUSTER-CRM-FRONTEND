import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { socket } from "../utils/socket.js";
import { useAuth } from "./AuthContext.jsx";
import { useLeads } from "./LeadsContext.jsx";
import { useNotifications } from "./NotificationContext.jsx";
import WhatsAppLeadToastContainer, { playLeadAlertChime } from "../components/WhatsAppLeadToast.jsx";

const WhatsAppToastContext = createContext(null);

export function WhatsAppToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const { isAuthenticated, organization, currentUser } = useAuth();
  const { refreshData } = useLeads();
  const { refreshNotifications } = useNotifications();

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const addLeadToast = useCallback(
    ({ lead, message, assignedRepName, timestamp }) => {
      const newToast = {
        id: "wa_lead_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7),
        lead,
        message,
        assignedRepName: assignedRepName || "Sales Representative",
        timestamp: timestamp || new Date(),
      };

      // Play audio chime alert
      playLeadAlertChime();

      // Show toast (stack max 3 active alerts)
      setToasts((prev) => [newToast, ...prev.slice(0, 2)]);

      // Seamlessly sync leads and notifications in background
      if (typeof refreshData === "function") {
        refreshData();
      }
      if (typeof refreshNotifications === "function") {
        refreshNotifications();
      }
    },
    [refreshData, refreshNotifications]
  );

  useEffect(() => {
    if (!isAuthenticated) return;

    const handleWhatsAppNewLead = (data) => {
      console.log("[DEBUG] Received whatsapp_new_lead socket event:", data);
      if (data && data.lead) {
        addLeadToast({
          lead: data.lead,
          message: data.message,
          assignedRepName: data.assignedRepName,
          timestamp: data.timestamp,
        });
      }
    };

    socket.on("whatsapp_new_lead", handleWhatsAppNewLead);

    return () => {
      socket.off("whatsapp_new_lead", handleWhatsAppNewLead);
    };
  }, [isAuthenticated, addLeadToast]);

  return (
    <WhatsAppToastContext.Provider
      value={{
        toasts,
        dismissToast,
        clearToasts,
        addLeadToast,
      }}
    >
      {children}
      <WhatsAppLeadToastContainer toasts={toasts} onDismiss={dismissToast} />
    </WhatsAppToastContext.Provider>
  );
}

export function useWhatsAppToast() {
  const context = useContext(WhatsAppToastContext);
  if (!context) {
    throw new Error("useWhatsAppToast must be used within a WhatsAppToastProvider");
  }
  return context;
}
