import React, { createContext, useContext, useState, useCallback } from "react";

const SupportModalContext = createContext(null);

export function SupportModalProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [meetingContext, setMeetingContext] = useState(null);

  const openSupportModal = useCallback((context = null) => {
    setMeetingContext(context);
    setIsOpen(true);
  }, []);

  const closeSupportModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <SupportModalContext.Provider
      value={{
        isOpen,
        openSupportModal,
        closeSupportModal,
        meetingContext,
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
