import React, { useState, useEffect, createContext, useContext } from "react";
import axios from "axios";
import { API_ENDPOINTS } from "../utils/constants.js";
import { useAuth } from "./AuthContext.jsx";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const { isAuthenticated, currentUser } = useAuth();

  const fetchNotifications = async (pageNum = 1, isBackground = false) => {
    if (!isAuthenticated || !currentUser?.token) {
      setLoading(false);
      return;
    }

    if (pageNum === 1 && !isBackground) {
      if (notifications.length === 0) setLoading(true);
      else setIsRefreshing(true);
    }
    setError(null);

    try {
      const response = await axios.get(
        `${API_ENDPOINTS.NOTIFICATIONS.BASE}?page=${pageNum}&limit=10`,
        {
          headers: {
            Authorization: `Bearer ${currentUser.token}`,
          },
        },
      );

      if (pageNum === 1) {
        setNotifications(response.data.notifications || []);
      } else {
        setNotifications((prev) => [...prev, ...(response.data.notifications || [])]);
      }

      setHasMore(Boolean(response.data.hasMore));
      setPage(pageNum);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
      setError(err?.response?.data?.message || "Failed to load notifications. Please check your connection.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const loadMore = () => {
    if (hasMore) {
      fetchNotifications(page + 1, false);
    }
  };

  useEffect(() => {
    fetchNotifications(1, false);
    // Poll every 30 seconds for the first page only to get new alerts in background
    const interval = setInterval(() => fetchNotifications(1, true), 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, currentUser]);

  const markAsRead = async (id) => {
    // Optimistic UI update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );

    try {
      await axios.put(
        `${API_ENDPOINTS.NOTIFICATIONS.BASE}/${id}/read`,
        {},
        {
          headers: { Authorization: `Bearer ${currentUser.token}` },
        },
      );
    } catch (e) {
      console.error("Failed to mark as read", e);
    }
  };

  const markAllAsRead = async () => {
    // Optimistic UI update
    const unread = notifications.filter((n) => !n.read);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

    try {
      await Promise.all(
        unread.map((n) =>
          axios.put(
            `${API_ENDPOINTS.NOTIFICATIONS.BASE}/${n.id}/read`,
            {},
            {
              headers: { Authorization: `Bearer ${currentUser.token}` },
            },
          ),
        ),
      );
    } catch (e) {
      console.error("Failed to mark all as read", e);
    }
  };

  const deleteNotification = async (id) => {
    // Optimistic UI update
    setNotifications((prev) => prev.filter((n) => n.id !== id));

    try {
      await axios.delete(`${API_ENDPOINTS.NOTIFICATIONS.BASE}/${id}`, {
        headers: { Authorization: `Bearer ${currentUser.token}` },
      });
    } catch (e) {
      console.error("Failed to delete notification", e);
    }
  };

  // Local only notification for quick UI feedback
  const addNotification = (title, message, type = "general") => {
    const newNotice = {
      id: "nt_" + Date.now(),
      type,
      title,
      message,
      time: new Date().toISOString(),
      read: false,
    };
    setNotifications((prev) => [newNotice, ...prev]);
  };

  const markAsUnread = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: false } : n)),
    );
  };

  const restoreNotification = (notification, index = 0) => {
    if (!notification) return;
    setNotifications((prev) => {
      const exists = prev.some((n) => n.id === notification.id);
      if (exists) return prev;
      const updated = [...prev];
      updated.splice(Math.min(index, updated.length), 0, notification);
      return updated;
    });
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        isRefreshing,
        error,
        markAsRead,
        markAsUnread,
        markAllAsRead,
        deleteNotification,
        restoreNotification,
        addNotification,
        refreshNotifications: () => fetchNotifications(1, false),
        loadMore,
        hasMore,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider",
    );
  }
  return context;
}
