import axios from "axios";
import { API_BASE_URL } from "../utils/constants.js";

/**
 * AI Target Intelligence Service
 * Handles business discovery, contact verification, website enrichment,
 * resolution tracking, target lists, and Excel exports.
 */
export const targetIntelligenceService = {
  /**
   * Fetch current organization search quota limits and usage
   */
  async getUsageQuota() {
    try {
      const response = await axios.get(`${API_BASE_URL}/target-intelligence/quota`);
      if (response.data?.data) {
        return response.data.data;
      }
    } catch (err) {
      console.warn("Could not fetch usage quota from server:", err?.response?.data?.message || err.message);
    }
    return {
      isConfigured: false,
      searchesUsedThisMonth: 0,
      searchesLimit: null,
      resetDate: null,
    };
  },

  /**
   * Fetch provider connectivity and active status
   */
  async getProviderStatus() {
    try {
      const response = await axios.get(`${API_BASE_URL}/target-intelligence/providers/status`);
      if (response.data?.data) {
        return response.data.data;
      }
    } catch (err) {
      console.warn("Could not fetch provider status:", err?.message);
    }
    return {
      gemini: { configured: false },
      tavily: { configured: false },
      openStreetMap: { available: true },
    };
  },

  /**
   * Interpret a natural language prompt into structured ICP filters via backend AI
   */
  async interpretPrompt(promptText) {
    if (!promptText || !promptText.trim()) return null;

    const response = await axios.post(
      `${API_BASE_URL}/target-intelligence/interpret-prompt`,
      { prompt: promptText.trim() }
    );

    if (response.data?.success && response.data?.data) {
      return response.data.data;
    }
    throw new Error(response.data?.message || "Failed to interpret prompt");
  },

  /**
   * Execute business discovery search across providers
   */
  async executeSearch(filters) {
    try {
      const response = await axios.post(`${API_BASE_URL}/target-intelligence/search`, {
        prompt: filters.prompt,
        city: filters.city,
        industry: filters.industry,
        need: filters.need,
        roles: filters.roles,
        searchType: filters.searchType || "all",
        limit: filters.limit || 10,
      });

      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }

      throw new Error(response.data?.message || "Search failed to return verified businesses");
    } catch (err) {
      const backendData = err.response?.data?.data;
      const backendMessage = err.response?.data?.message;
      const customErr = new Error(backendMessage || err.message || "Search failed to return verified businesses");
      customErr.providerStatuses = backendData?.providerStatuses;
      customErr.outcome = backendData?.outcome;
      customErr.backendData = backendData;
      throw customErr;
    }
  },

  /**
   * Mark a prospect as Resolved for this organization
   */
  async resolveProspect(prospect, notes = "") {
    const response = await axios.post(`${API_BASE_URL}/target-intelligence/resolve`, {
      prospect,
      notes,
    });

    if (response.data?.success) {
      return response.data.data;
    }

    throw new Error(response.data?.message || "Failed to mark prospect as resolved");
  },

  /**
   * Unresolve a prospect
   */
  async unresolveProspect(prospectKey, companyName) {
    const response = await axios.post(`${API_BASE_URL}/target-intelligence/unresolve`, {
      prospectKey,
      companyName,
    });

    if (response.data?.success) {
      return response.data.data;
    }

    throw new Error(response.data?.message || "Failed to remove resolved status");
  },

  /**
   * Bulk mark multiple prospects as resolved
   */
  async bulkResolveProspects(prospects, notes = "") {
    const response = await axios.post(`${API_BASE_URL}/target-intelligence/bulk-resolve`, {
      prospects,
      notes,
    });

    if (response.data?.success) {
      return response.data.data;
    }

    throw new Error(response.data?.message || "Failed to bulk resolve prospects");
  },

  /**
   * Fetch all resolved prospects for current organization
   */
  async getResolvedProspects() {
    try {
      const response = await axios.get(`${API_BASE_URL}/target-intelligence/resolved-list`);
      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }
    } catch (err) {
      console.warn("Could not fetch resolved prospects:", err?.message);
    }
    return [];
  },

  /**
   * Get search history
   */
  async getSearches() {
    try {
      const response = await axios.get(`${API_BASE_URL}/target-intelligence/searches`);
      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }
    } catch (err) {
      console.warn("Could not fetch searches:", err?.message);
    }
    return [];
  },

  /**
   * Trigger on-demand website enrichment for a company
   */
  async enrichCompany(companyId) {
    const response = await axios.post(
      `${API_BASE_URL}/target-intelligence/companies/${companyId}/enrich`
    );
    if (response.data?.success && response.data?.data) {
      return response.data.data;
    }
    throw new Error(response.data?.message || "Enrichment failed");
  },

  /**
   * Export discovered prospects to Excel or CSV
   */
  async exportProspects(prospects, format = "xlsx") {
    const response = await axios.post(
      `${API_BASE_URL}/target-intelligence/export`,
      { prospects, format },
      { responseType: "blob" }
    );

    const blob = new Blob([response.data], {
      type:
        format === "csv"
          ? "text/csv"
          : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `Target_Intelligence_${new Date().toISOString().slice(0, 10)}.${format}`
    );
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
    return true;
  },

  /**
   * Target Lists CRUD
   */
  async getTargetLists() {
    try {
      const response = await axios.get(`${API_BASE_URL}/target-intelligence/lists`);
      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }
    } catch {}
    return [];
  },

  async createTargetList(payload) {
    const response = await axios.post(`${API_BASE_URL}/target-intelligence/lists`, payload);
    if (response.data?.success) {
      return response.data.data;
    }
    throw new Error(response.data?.message || "Failed to create target list");
  },

  async updateTargetList(id, payload) {
    const response = await axios.patch(
      `${API_BASE_URL}/target-intelligence/lists/${id}`,
      payload
    );
    if (response.data?.success) {
      return response.data.data;
    }
    throw new Error(response.data?.message || "Failed to update target list");
  },

  async deleteTargetList(id) {
    const response = await axios.delete(`${API_BASE_URL}/target-intelligence/lists/${id}`);
    return response.data?.success;
  },
};

export default targetIntelligenceService;
