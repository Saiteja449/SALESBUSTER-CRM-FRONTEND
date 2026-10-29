import React, { createContext, useContext, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const SupportModalContext = createContext(null);

export function SupportModalProvider({ children }) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("instant_ai"); // 'instant_ai' | 'report_issue' | 'my_tickets' | 'consultation'
  const [meetingContext, setMeetingContext] = useState(null);
  const [handoffData, setHandoffData] = useState(null);

  const openSupportModal = useCallback((contextOrTab = null) => {
    let targetTab = "instant_ai";
    if (contextOrTab === "report_issue" || contextOrTab === "my_tickets" || contextOrTab === "instant_ai") {
      targetTab = contextOrTab;
      setMeetingContext(null);
    } else if (typeof contextOrTab === "string" && contextOrTab.length > 20) {
      targetTab = "consultation";
      setMeetingContext(contextOrTab);
    } else {
      setMeetingContext(null);
    }
    setActiveTab(targetTab);
    navigate(`/support?tab=${targetTab}`);
  }, [navigate]);

  const openInstantAiSupport = useCallback(() => {
    setActiveTab("instant_ai");
    setMeetingContext(null);
    navigate("/support?tab=instant_ai");
  }, [navigate]);

  const openReportIssue = useCallback((prefill = null) => {
    if (prefill) {
      setHandoffData(prefill);
    }
    setActiveTab("report_issue");
    navigate("/support?tab=report_issue");
  }, [navigate]);

  const openMyTickets = useCallback(() => {
    setActiveTab("my_tickets");
    navigate("/support?tab=my_tickets");
  }, [navigate]);

  const closeSupportModal = useCallback(() => {
    setIsOpen(false);
    setMeetingContext(null);
    setHandoffData(null);
  }, []);

  return (
    <SupportModalContext.Provider
      value={{
        isOpen,
        activeTab,
        setActiveTab,
        meetingContext,
        handoffData,
        setHandoffData,
        openSupportModal,
        openInstantAiSupport,
        openReportIssue,
        openMyTickets,
        closeSupportModal,
      }}
    >
      {children}
    </SupportModalContext.Provider>
  );
}

export function useSupportModal() {
  const context = useContext(SupportModalContext);
  if (!context) {
    throw new Error("useSupportModal must be used within a SupportModalProvider");
  }
  return context;
}

export default SupportModalContext;
