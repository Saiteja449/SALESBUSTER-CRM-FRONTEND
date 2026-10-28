import axios from "axios";
import { API_BASE_URL } from "../utils/constants.js";

/**
 * AI Target Intelligence Service
 *
 * Backend is the single authority for prospect discovery, quota management,
 * duplicate verification, and lead imports into CRM.
 */
export const targetIntelligenceService = {
  /**
   * Fetch current organization search and import quota limits and usage
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
   * Prospects include verified source, verification date, and consent metadata.
   */
  async executeSearch(filters) {
    const response = await axios.post(
      `${API_BASE_URL}/target-intelligence/search`,
      {
        prompt: filters.prompt,
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
   * Authoritative batch import of selected prospects into CRM leads.
   *
   * Backend enforces:
   * - Tenant permissions & organization membership
   * - Real-time duplicate detection against MongoDB Lead collection
   * - Strict duplicate action policies (skip, update, create)
   * - Contact phone validity (no fabricated or incomplete numbers)
   * - Pipeline status normalization to CRM lead enum
   * - WebSocket emission for live multi-user sync
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
