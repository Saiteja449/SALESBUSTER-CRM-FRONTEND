import React from "react";
import { AuthProvider } from "./AuthContext.jsx";
import { LeadsProvider } from "./LeadsContext.jsx";
import { NotificationProvider } from "./NotificationContext.jsx";
import { DashboardProvider } from "./DashboardContext.jsx";
export default function RootProvider({ children }) {
  return (
    <AuthProvider>
      <LeadsProvider>
        <NotificationProvider>
          <DashboardProvider>
            {children}
          </DashboardProvider>
        </NotificationProvider>
      </LeadsProvider>
    </AuthProvider>
  );
}

