import React, { createContext, useContext, useState, useCallback } from "react";

const SupportModalContext = createContext(null);

export function SupportModalProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("instant_ai"); // 'instant_ai' | 'report_issue' | 'my_tickets' | 'consultation'
  const [meetingContext, setMeetingContext] = useState(null);
  const [handoffData, setHandoffData] = useState(null);

  const openSupportModal = useCallback((contextOrTab = null) => {
    if (contextOrTab === "report_issue" || contextOrTab === "my_tickets" || contextOrTab === "instant_ai") {
      setActiveTab(contextOrTab);
      setMeetingContext(null);
    } else if (typeof contextOrTab === "string" && contextOrTab.length > 20) {
      // It's a meeting consultation description
      setActiveTab("consultation");
      setMeetingContext(contextOrTab);
    } else {
      setActiveTab("instant_ai");
      setMeetingContext(null);
    }
    setIsOpen(true);
  }, []);

  const openInstantAiSupport = useCallback(() => {
    setActiveTab("instant_ai");
    setMeetingContext(null);
    setIsOpen(true);
  }, []);

  const openReportIssue = useCallback((prefill = null) => {
    if (prefill) {
      setHandoffData(prefill);
    }
    setActiveTab("report_issue");
    setIsOpen(true);
  }, []);

  const openMyTickets = useCallback(() => {
    setActiveTab("my_tickets");
    setIsOpen(true);
  }, []);

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
