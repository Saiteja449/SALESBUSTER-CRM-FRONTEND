export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://holyminicow.com/kranthi/api";

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login`,
  },
  USERS: {
    BASE: `${API_BASE_URL}/users`,
  },
  NOTIFICATIONS: {
    BASE: `${API_BASE_URL}/notifications`,
  },
  LEADS: {
    BASE: `${API_BASE_URL}/leads`,
  },
  ACTIVITIES: {
    BASE: `${API_BASE_URL}/activities`,
  },
  FOLLOWUPS: {
    BASE: `${API_BASE_URL}/followups`,
  },
  WHATSAPP: {
    CONNECT: `${API_BASE_URL}/whatsapp/connect`,
    STATUS: `${API_BASE_URL}/whatsapp/status`,
    LOGOUT: `${API_BASE_URL}/whatsapp/logout`,
    QR: `${API_BASE_URL}/whatsapp/qr`,
    CONVERSATIONS: `${API_BASE_URL}/whatsapp/conversations`,
    CONVERSATION: (leadId) => `${API_BASE_URL}/whatsapp/conversation/${leadId}`,
    SEND_MESSAGE: `${API_BASE_URL}/whatsapp/message/send`,
    AI_TOGGLE: `${API_BASE_URL}/whatsapp/ai/toggle`,
    SETTINGS: `${API_BASE_URL}/whatsapp/settings`,
  },
  ANALYTICS: {
    BASE: `${API_BASE_URL}/analytics`,
    TODAY: `${API_BASE_URL}/analytics/today`,
    AI_LIMITS: `${API_BASE_URL}/analytics/ai-limits`,
    AI_LIMITS_REFRESH: `${API_BASE_URL}/analytics/ai-limits/refresh`,
  },
};

export const BACKEND_URL = API_BASE_URL.replace(/\/api$/, "");

export const ENABLE_AI_AUDIO_ANALYSIS =
  import.meta.env.VITE_ENABLE_AI_AUDIO_ANALYSIS === "true";
