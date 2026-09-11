export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://api.salesbuster.ai/api";

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
  WHATSAPP_CLOUD: {
    STATUS: `${API_BASE_URL}/whatsapp/cloud/status`,
    CONNECT: `${API_BASE_URL}/whatsapp/cloud/connect`,
    DISCONNECT: `${API_BASE_URL}/whatsapp/cloud/disconnect`,
    TEMPLATES: `${API_BASE_URL}/whatsapp/cloud/templates`,
    SYNC_TEMPLATES: `${API_BASE_URL}/whatsapp/cloud/templates/sync`,
    AUDIENCE_ESTIMATE: `${API_BASE_URL}/whatsapp/cloud/audience/estimate`,
    CAMPAIGNS: `${API_BASE_URL}/whatsapp/cloud/campaigns`,
    CAMPAIGN: (id) => `${API_BASE_URL}/whatsapp/cloud/campaigns/${id}`,
    START: (id) => `${API_BASE_URL}/whatsapp/cloud/campaigns/${id}/start`,
    PAUSE: (id) => `${API_BASE_URL}/whatsapp/cloud/campaigns/${id}/pause`,
    RESUME: (id) => `${API_BASE_URL}/whatsapp/cloud/campaigns/${id}/resume`,
    CANCEL: (id) => `${API_BASE_URL}/whatsapp/cloud/campaigns/${id}/cancel`,
    RETRY_FAILED: (id) =>
      `${API_BASE_URL}/whatsapp/cloud/campaigns/${id}/retry-failed`,
    RECIPIENTS: (id) =>
      `${API_BASE_URL}/whatsapp/cloud/campaigns/${id}/recipients`,
    ANALYTICS: (id) =>
      `${API_BASE_URL}/whatsapp/cloud/campaigns/${id}/analytics`,
  },
  ANALYTICS: {
    BASE: `${API_BASE_URL}/analytics`,
    TODAY: `${API_BASE_URL}/analytics/today`,
    AI_LIMITS: `${API_BASE_URL}/analytics/ai-limits`,
    AI_LIMITS_REFRESH: `${API_BASE_URL}/analytics/ai-limits/refresh`,
  },
  ORGANIZATIONS: {
    MY_ORG: `${API_BASE_URL}/organizations/my-org`,
    AI_SETTINGS: `${API_BASE_URL}/organizations/my-org/ai-settings`,
    VALIDATE_GEMINI_KEY: `${API_BASE_URL}/organizations/my-org/validate-gemini-key`,
    KNOWLEDGE_UPLOAD: `${API_BASE_URL}/organizations/my-org/knowledge-base/upload`,
    KNOWLEDGE_DELETE: (docId) => `${API_BASE_URL}/organizations/my-org/knowledge-base/${docId}`,
  },
};

export const BACKEND_URL = API_BASE_URL.replace(/\/api$/, "");

export const ENABLE_AI_AUDIO_ANALYSIS =
  import.meta.env.VITE_ENABLE_AI_AUDIO_ANALYSIS === "true";
