import axios from "axios";
import { API_BASE_URL } from "../utils/constants.js";

/**
 * AI Target Intelligence Service
 *
 * Backend is the authoritative source for real-time live prospect discovery,
 * accurate verified contact extraction, and persistent resolution status tracking.
 */
export const targetIntelligenceService = {
  /**
   * Fetch current organization search quota limits and usage
   */
  async getUsageQuota() {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/target-intelligence/quota`
      );
      if (response.data?.data) {
        return response.data.data;
      }
    } catch (err) {
      console.warn("Could not fetch usage quota from server:", err?.response?.data?.message || err.message);
    }
    return {
      searchesUsedThisMonth: 0,
      searchesLimit: 100,
      leadsImportedThisMonth: 0,
      leadsImportLimit: 500,
      resetDate: "2026-11-01",
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
   * Execute an ICP prospect discovery search through the backend intelligence engine.
   * Supports LinkedIn-style entity scopes ('all' | 'companies' | 'people'),
   * location, company size, industry, and role filters.
   */
  async executeSearch(filters) {
    const response = await axios.post(
      `${API_BASE_URL}/target-intelligence/search`,
      {
        prompt: filters.prompt,
        searchType: filters.searchType || "all",
        city: filters.city,
        industry: filters.industry,
        need: filters.need,
        companySize: filters.companySize,
        roles: filters.roles,
      }
    );

    if (response.data?.success && response.data?.data) {
      return response.data.data;
    }

    throw new Error(
      response.data?.message || "Search failed to return verified prospects"
    );
  },

  /**
   * Mark a prospect as Resolved for this organization
   */
  async resolveProspect(prospect, notes = "") {
    const response = await axios.post(
      `${API_BASE_URL}/target-intelligence/resolve`,
      {
        prospect,
        entityType: prospect.entityType || "company",
        notes,
      }
    );

    if (response.data?.success) {
      return response.data.data;
    }

    throw new Error(
      response.data?.message || "Failed to mark prospect as resolved"
    );
  },

  /**
   * Unresolve a prospect
   */
  async unresolveProspect(prospectKey, companyName) {
    const response = await axios.post(
      `${API_BASE_URL}/target-intelligence/unresolve`,
      {
        prospectKey,
        companyName,
      }
    );

    if (response.data?.success) {
      return response.data.data;
    }

    throw new Error(
      response.data?.message || "Failed to remove resolved status"
    );
  },

  /**
   * Fetch all resolved prospects for the current organization
   */
  async getResolvedProspects() {
    const response = await axios.get(
      `${API_BASE_URL}/target-intelligence/resolved-list`
    );

    if (response.data?.success && response.data?.data) {
      return response.data.data;
    }

    return [];
  },

  /**
   * Authoritative batch import of selected prospects into CRM leads (legacy compatibility)
   */
  async importProspectsToCrm(importPayload) {
    const response = await axios.post(
      `${API_BASE_URL}/target-intelligence/import-to-crm`,
      {
        prospects: importPayload.prospects,
        assignedUserId: importPayload.assignedUserId || importPayload.assignedTo || undefined,
        pipelineStage: importPayload.pipelineStage || "New",
        duplicateAction: importPayload.duplicateAction || "skip",
        tags: importPayload.tags || ["AI Target Intelligence"],
      }
    );

    if (response.data?.success) {
      return response.data;
    }

    throw new Error(
      response.data?.message || "Backend rejected prospect import"
    );
  },
};

export default targetIntelligenceService;
