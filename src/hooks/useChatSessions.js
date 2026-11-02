import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import axios from "axios";
import { API_ENDPOINTS } from "../utils/constants.js";

const SESSIONS_CACHE_KEY = "sb_bi_sessions_cache";

export function groupSessionsByDate(sessions) {
  const groups = {
    Today: [],
    Yesterday: [],
    "Previous 7 Days": [],
    Older: [],
  };

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 86400000;
  const startOfLast7Days = startOfToday - 7 * 86400000;

  sessions.forEach((s) => {
    const time = new Date(s.updatedAt || s.createdAt || Date.now()).getTime();
    if (time >= startOfToday) {
      groups["Today"].push(s);
    } else if (time >= startOfYesterday) {
      groups["Yesterday"].push(s);
    } else if (time >= startOfLast7Days) {
      groups["Previous 7 Days"].push(s);
    } else {
      groups["Older"].push(s);
    }
  });

  return groups;
}

export function useChatSessions() {
  const [sessions, setSessions] = useState(() => {
    try {
      const cached = localStorage.getItem(SESSIONS_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          return parsed.map((s) => ({ ...s, id: s.id || s._id }));
        }
      }
    } catch {
      // Ignore cache error
    }
    return [];
  });

  const [activeSessionId, setActiveSessionId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Undo deletion state: { session, timeoutId }
  const [pendingDelete, setPendingDelete] = useState(null);
  const pendingDeleteRef = useRef(null);

  const saveToCache = (data) => {
    try {
      localStorage.setItem(SESSIONS_CACHE_KEY, JSON.stringify(data));
    } catch {
      // Ignore quota error
    }
  };

  const fetchSessions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await axios.get(API_ENDPOINTS.AI_ASSISTANT.SESSIONS);
      const list = (res.data?.data || []).map((s) => ({
        ...s,
        id: s.id || s._id,
      }));
      setSessions(list);
      saveToCache(list);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to load chats.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    const initialLoad = async () => {
      try {
        const res = await axios.get(API_ENDPOINTS.AI_ASSISTANT.SESSIONS);
        if (!ignore) {
          const list = (res.data?.data || []).map((s) => ({
            ...s,
            id: s.id || s._id,
          }));
          setSessions(list);
          saveToCache(list);
        }
      } catch (err) {
        if (!ignore) {
          setError(err.response?.data?.message || err.message || "Failed to load chats.");
        }
      }
    };
    initialLoad();
    return () => {
      ignore = true;
    };
  }, []);

  // Clean up pending delete timeout on unmount
  useEffect(() => {
    return () => {
      if (pendingDeleteRef.current?.timeoutId) {
        clearTimeout(pendingDeleteRef.current.timeoutId);
        // Execute actual delete before unmount if any was pending
        const idToDelete = pendingDeleteRef.current.session?.id;
        if (idToDelete) {
          axios.delete(API_ENDPOINTS.AI_ASSISTANT.SESSION(idToDelete)).catch(() => {});
        }
      }
    };
  }, []);

  // Soft delete with 5-second undo timer
  const requestDeleteSession = useCallback(
    (session) => {
      if (!session) return;

      // If another delete was pending, commit it immediately
      if (pendingDeleteRef.current) {
        clearTimeout(pendingDeleteRef.current.timeoutId);
        const prevId = pendingDeleteRef.current.session?.id;
        if (prevId) {
          axios.delete(API_ENDPOINTS.AI_ASSISTANT.SESSION(prevId)).catch(() => {});
        }
      }

      // Hide from UI immediately
      setSessions((prev) => prev.filter((s) => s.id !== session.id));

      const timeoutId = setTimeout(async () => {
        try {
          await axios.delete(API_ENDPOINTS.AI_ASSISTANT.SESSION(session.id));
        } catch (err) {
          console.error("Failed to delete session on server:", err);
        } finally {
          setPendingDelete(null);
          pendingDeleteRef.current = null;
        }
      }, 5000);

      const stateObj = { session, timeoutId };
      setPendingDelete(stateObj);
      pendingDeleteRef.current = stateObj;
    },
    []
  );

  const undoDelete = useCallback(() => {
    if (!pendingDeleteRef.current) return;
    const { session, timeoutId } = pendingDeleteRef.current;
    clearTimeout(timeoutId);

    // Restore locally
    setSessions((prev) => [session, ...prev]);
    setPendingDelete(null);
    pendingDeleteRef.current = null;
  }, []);

  const addOrUpdateSession = useCallback((sessionData) => {
    if (!sessionData || !sessionData.id) return;
    setSessions((prev) => {
      const existingIdx = prev.findIndex((s) => s.id === sessionData.id);
      let updated;
      if (existingIdx >= 0) {
        updated = [...prev];
        updated[existingIdx] = { ...updated[existingIdx], ...sessionData };
      } else {
        updated = [sessionData, ...prev];
      }
      saveToCache(updated);
      return updated;
    });
  }, []);

  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) return sessions;
    const q = searchQuery.toLowerCase();
    return sessions.filter((s) => (s.title || "Untitled Analysis").toLowerCase().includes(q));
  }, [sessions, searchQuery]);

  const groupedSessions = useMemo(() => {
    return groupSessionsByDate(filteredSessions);
  }, [filteredSessions]);

  return {
    sessions,
    filteredSessions,
    groupedSessions,
    activeSessionId,
    setActiveSessionId,
    searchQuery,
    setSearchQuery,
    isLoading,
    error,
    fetchSessions,
    requestDeleteSession,
    undoDelete,
    pendingDelete,
    addOrUpdateSession,
  };
}

export default useChatSessions;
