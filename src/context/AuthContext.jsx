import React, { useEffect, useState, createContext, useContext } from "react";
import axios from "axios";
import { API_ENDPOINTS } from "../utils/constants.js";
import { socket } from "../utils/socket.js";

// Initialize default axios authorization header from stored token
const initialToken = localStorage.getItem("kranthi_token");
if (initialToken) {
  axios.defaults.headers.common["Authorization"] = `Bearer ${initialToken}`;
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [allUsers, setAllUsers] = useState([]);

  const [currentUser, setCurrentUser] = useState(() => {
    const savedSession = localStorage.getItem("kranthi_session_user");
    if (savedSession) {
      try {
        return JSON.parse(savedSession);
      } catch (e) {
        console.error("Failed to parse saved session");
      }
    }
    return null;
  });

  const [organization, setOrganization] = useState(() => {
    const savedOrg = localStorage.getItem("kranthi_session_org");
    if (savedOrg) {
      try {
        return JSON.parse(savedOrg);
      } catch (e) {
        console.error("Failed to parse saved organization");
      }
    }
    return null;
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const savedSession = localStorage.getItem("kranthi_session_user");
    return !!savedSession;
  });

  // Fetch users from backend
  const fetchUsers = async () => {
    const token = localStorage.getItem("kranthi_token");
    if (!token) return;

    try {
      const response = await axios.get(API_ENDPOINTS.USERS.BASE, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const roleMap = {
        "sales manager": "Sales Manager",
        "sales person": "Sales Representative",
        super_admin: "Super Admin",
        user: "User",
      };

      const usersList = response.data.data || [];
      const formattedUsers = usersList.map((user) => ({
        id: user._id,
        name: user.name || user.email.split("@")[0],
        email: user.email,
        role: roleMap[user.role?.toLowerCase()] || user.role,
        avatar: (user.name || user.email).substring(0, 2).toUpperCase(),
      }));

      setAllUsers(formattedUsers);

      // Update seat statistics if returned
      if (response.data.seats && organization) {
        const updatedOrg = {
          ...organization,
          seats: response.data.seats.totalSeats,
          totalSeats: response.data.seats.totalSeats,
          usedSeats: response.data.seats.usedSeats,
          remainingSeats: response.data.seats.remainingSeats,
          ...(response.data.organization || {}),
        };
        setOrganization(updatedOrg);
        localStorage.setItem("kranthi_session_org", JSON.stringify(updatedOrg));
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  // Set up global Axios interceptor for 403 suspension / expiration responses
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (
          error.response &&
          error.response.status === 403 &&
          (error.response.data?.accountSuspended ||
            error.response.data?.organizationStatus ||
            error.response.data?.subscriptionExpired)
        ) {
          if (error.response.data?.subscriptionExpired) {
            setOrganization((prev) => {
              const updated = { ...(prev || {}), isExpired: true };
              localStorage.setItem("kranthi_session_org", JSON.stringify(updated));
              return updated;
            });
          }
          if (error.response.data?.organizationStatus) {
            const newStatus = error.response.data.organizationStatus;
            setOrganization((prev) => {
              const updated = { ...(prev || {}), status: newStatus };
              localStorage.setItem("kranthi_session_org", JSON.stringify(updated));
              return updated;
            });
          } else if (error.response.data?.accountSuspended) {
            setOrganization((prev) => {
              const updated = { ...(prev || {}), status: "suspended" };
              localStorage.setItem("kranthi_session_org", JSON.stringify(updated));
              return updated;
            });
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  // Fetch full organization profile from backend to ensure fresh license seats & subscription dates
  const fetchOrganization = async () => {
    const token = localStorage.getItem("kranthi_token");
    if (!token) return;

    try {
      const res = await axios.get(API_ENDPOINTS.ORGANIZATIONS.MY_ORG, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success && res.data.data) {
        setOrganization(res.data.data);
        localStorage.setItem("kranthi_session_org", JSON.stringify(res.data.data));
      }
    } catch (err) {
      if (err.response?.status === 403) {
        if (err.response.data?.subscriptionExpired) {
          setOrganization((prev) => {
            const updated = { ...(prev || {}), isExpired: true };
            localStorage.setItem("kranthi_session_org", JSON.stringify(updated));
            return updated;
          });
        }
        if (err.response.data?.organizationStatus) {
          const newStatus = err.response.data.organizationStatus;
          setOrganization((prev) => {
            const updated = { ...(prev || {}), status: newStatus };
            localStorage.setItem("kranthi_session_org", JSON.stringify(updated));
            return updated;
          });
        }
      }
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      const token = localStorage.getItem("kranthi_token");
      if (token) {
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      }
      fetchUsers();
      fetchOrganization();

      const orgId = organization?.id || organization?._id || currentUser?.organizationId;
      if (orgId) {
        socket.emit("join_organization", orgId);
      }

      const handleOrgUpdate = (updatedOrg) => {
        if (updatedOrg) {
          setOrganization((prev) => {
            const merged = { ...prev, ...updatedOrg };
            localStorage.setItem("kranthi_session_org", JSON.stringify(merged));
            return merged;
          });
        }
      };

      socket.on("organization_updated", handleOrgUpdate);
      return () => {
        socket.off("organization_updated", handleOrgUpdate);
      };
    }
  }, [isAuthenticated, organization?.id, organization?._id, currentUser?.organizationId]);

  // Authentication using credentials
  const login = async (email, password) => {
    try {
      const response = await axios.post(API_ENDPOINTS.AUTH.LOGIN, {
        email,
        password,
      });
      const data = response.data;

      if (data.success === false) {
        return { success: false, message: data.message || "Login failed" };
      }

      const roleMap = {
        "sales manager": "Sales Manager",
        "sales person": "Sales Representative",
        super_admin: "Super Admin",
        user: "User",
      };

      const orgId = data.organization?.id || data.organization?._id || data.organizationId || null;

      const userWithToken = {
        id: data._id,
        name: data.name || email.split("@")[0],
        email: data.email,
        role: roleMap[data.role?.toLowerCase()] || data.role,
        token: data.token,
        organizationId: orgId,
        tenantDbName: data.tenantDbName || null,
        isOrgOwner: !!data.organization?.isOrgOwner,
        avatar: data.name
          ? data.name.substring(0, 2).toUpperCase()
          : email.substring(0, 2).toUpperCase(),
      };

      // Set global axios Authorization header
      axios.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;

      setCurrentUser(userWithToken);
      setIsAuthenticated(true);
      localStorage.setItem("kranthi_session_user", JSON.stringify(userWithToken));
      localStorage.setItem("kranthi_token", data.token);

      if (data.organization) {
        setOrganization(data.organization);
        localStorage.setItem("kranthi_session_org", JSON.stringify(data.organization));
      } else {
        setOrganization(null);
        localStorage.removeItem("kranthi_session_org");
      }

      if (orgId) {
        socket.emit("join_organization", orgId);
      }

      return { success: true, user: userWithToken, organization: data.organization };
    } catch (error) {
      console.error("Login error:", error);
      const message =
        error.response?.data?.message || "Network error connecting to server.";
      const success = error.response?.data?.success ?? false;
      return { success, message };
    }
  };

  const logout = () => {
    const orgId = organization?.id || organization?._id || currentUser?.organizationId;
    if (orgId) {
      socket.emit("leave_organization", orgId);
    }
    setCurrentUser(null);
    setOrganization(null);
    setIsAuthenticated(false);
    delete axios.defaults.headers.common["Authorization"];
    localStorage.removeItem("kranthi_session_user");
    localStorage.removeItem("kranthi_session_org");
    localStorage.removeItem("kranthi_token");
  };

  const addSalesPerson = async (name, email, password) => {
    try {
      const response = await axios.post(API_ENDPOINTS.USERS.BASE, {
        name,
        email,
        password,
      });

      // Refresh the users list and seat counts
      await fetchUsers();
      return response.data;
    } catch (error) {
      console.error("Add salesperson error:", error);
      const errData = error.response?.data;
      const message =
        errData?.message || "Failed to add sales representative.";
      const err = new Error(message);
      err.seatLimitReached = !!errData?.seatLimitReached;
      err.subscriptionExpired = !!errData?.subscriptionExpired;
      throw err;
    }
  };

  const deleteSalesPerson = async (userId) => {
    // Prevent self-deletion if logged in
    if (currentUser && currentUser.id === userId) {
      throw new Error(
        "You cannot delete your own logged-in representative account!",
      );
    }

    try {
      await axios.delete(`${API_ENDPOINTS.USERS.BASE}/${userId}`);
      // Refresh the users list and seat counts
      await fetchUsers();
    } catch (error) {
      console.error("Delete salesperson error:", error);
      const message =
        error.response?.data?.message ||
        "Could not delete this representative.";
      throw new Error(message);
    }
  };

  // Helper getters
  const usedSeats = allUsers.filter(u => u.role === "Sales Representative").length;
  const salesRepCount = usedSeats;
  const hasSalesPerson = salesRepCount >= 1;

  const isAiConfigured = Boolean(
    organization?.isAiConfigured ??
    organization?.aiSettings?.isAiConfigured ??
    false
  );
  const isOrgSetupComplete = hasSalesPerson && isAiConfigured;

  const totalSeats = organization?.seats || organization?.totalSeats || Math.max(1, usedSeats);
  const remainingSeats = Math.max(0, totalSeats - usedSeats);
  const isSeatLimitReached = usedSeats >= totalSeats;

  const isSubscriptionExpired = Boolean(
    organization?.isExpired ||
      (organization?.subscriptionEndDate &&
        new Date() > new Date(organization.subscriptionEndDate))
  );

  const isAccountSuspended = Boolean(
    organization?.status === "suspended" || organization?.status === "inactive"
  );

  const isOrganizationBlocked = isAccountSuspended || isSubscriptionExpired;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        allUsers,
        organization,
        setOrganization,
        totalSeats,
        usedSeats,
        salesRepCount,
        hasSalesPerson,
        isAiConfigured,
        isOrgSetupComplete,
        remainingSeats,
        isSeatLimitReached,
        isSubscriptionExpired,
        isAccountSuspended,
        isOrganizationBlocked,
        login,
        logout,
        fetchUsers,
        fetchOrganization,
        addSalesPerson,
        deleteSalesPerson,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
