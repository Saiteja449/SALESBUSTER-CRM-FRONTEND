import React from "react";
import { AuthProvider } from "./AuthContext.jsx";
import { LeadsProvider } from "./LeadsContext.jsx";
import { NotificationProvider } from "./NotificationContext.jsx";
import { DashboardProvider } from "./DashboardContext.jsx";
import { WhatsAppToastProvider } from "./WhatsAppToastContext.jsx";
import { SupportModalProvider } from "./SupportModalContext.jsx";

export default function RootProvider({ children }) {
  return (
    <AuthProvider>
      <LeadsProvider>
        <NotificationProvider>
          <DashboardProvider>
            <WhatsAppToastProvider>
              <SupportModalProvider>
                {children}
              </SupportModalProvider>
            </WhatsAppToastProvider>
          </DashboardProvider>
        </NotificationProvider>
      </LeadsProvider>
    </AuthProvider>
  );
}

