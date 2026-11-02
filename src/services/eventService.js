import axios from "axios";
import { API_ENDPOINTS } from "../utils/constants.js";
import * as XLSX from "xlsx";

/**
 * Get authorization header fallback if axios defaults not ready
 */
const getAuthHeaders = () => {
  const token =
    localStorage.getItem("salesbuster_token") ||
    localStorage.getItem("kranthi_token") ||
    (axios.defaults.headers.common["Authorization"]
      ? axios.defaults.headers.common["Authorization"].replace(/^Bearer\s+/i, "")
      : null);
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const eventService = {
  /**
   * Fetch all events for the current organization
   */
  async getEvents() {
    try {
      const response = await axios.get(API_ENDPOINTS.EVENTS.BASE, {
        headers: getAuthHeaders(),
      });
      return response.data?.data || [];
    } catch (err) {
      console.error("[eventService] getEvents error:", err);
      throw new Error(
        err.response?.data?.message || "Failed to load events list."
      );
    }
  },

  /**
   * Create a new event
   */
  async createEvent({ name, description = "", eventDate = null, location = "" }) {
    try {
      const response = await axios.post(
        API_ENDPOINTS.EVENTS.BASE,
        { name, description, eventDate, location },
        { headers: getAuthHeaders() }
      );
      return response.data?.data;
    } catch (err) {
      console.error("[eventService] createEvent error:", err);
      throw new Error(
        err.response?.data?.message || "Failed to create new event."
      );
    }
  },

  /**
   * Get single event details by ID
   */
  async getEventById(eventId) {
    try {
      const response = await axios.get(API_ENDPOINTS.EVENTS.EVENT(eventId), {
        headers: getAuthHeaders(),
      });
      return response.data?.data;
    } catch (err) {
      console.error("[eventService] getEventById error:", err);
      throw new Error(
        err.response?.data?.message || "Failed to load event details."
      );
    }
  },

  /**
   * Get contacts captured strictly under an event
   */
  async getEventContacts(eventId, { search = "", page = 1, limit = 100 } = {}) {
    try {
      const response = await axios.get(
        API_ENDPOINTS.EVENTS.CONTACTS(eventId),
        {
          params: { search, page, limit },
          headers: getAuthHeaders(),
        }
      );
      return (
        response.data?.data || {
          contacts: [],
          total: 0,
          page: 1,
          totalPages: 1,
        }
      );
    } catch (err) {
      console.error("[eventService] getEventContacts error:", err);
      throw new Error(
        err.response?.data?.message || "Failed to load event attendees."
      );
    }
  },

  /**
   * Manually add or log an event attendee/contact
   */
  async createEventContact(eventId, contactData) {
    try {
      const response = await axios.post(
        API_ENDPOINTS.EVENTS.CONTACTS(eventId),
        contactData,
        { headers: getAuthHeaders() }
      );
      return response.data?.data;
    } catch (err) {
      console.error("[eventService] createEventContact error:", err);
      throw new Error(
        err.response?.data?.message || "Failed to save attendee contact."
      );
    }
  },

  /**
   * Update contact status (e.g., whatsapp_opened, completed, pending)
   */
  async updateContactStatus(eventId, contactId, status) {
    try {
      const response = await axios.patch(
        API_ENDPOINTS.EVENTS.CONTACT_STATUS(eventId, contactId),
        { status },
        { headers: getAuthHeaders() }
      );
      return response.data?.data;
    } catch (err) {
      console.error("[eventService] updateContactStatus error:", err);
      throw new Error(
        err.response?.data?.message || "Failed to update contact status."
      );
    }
  },

  /**
   * Summarize speech transcript via Gemini AI
   */
  async summarizeTranscript(transcript, eventName = "") {
    try {
      const response = await axios.post(
        API_ENDPOINTS.EVENTS.SUMMARIZE_TEXT,
        { transcript, eventName },
        { headers: getAuthHeaders() }
      );
      return response.data?.data;
    } catch (err) {
      console.error("[eventService] summarizeTranscript error:", err);
      throw new Error(
        err.response?.data?.message || "Failed to summarize voice transcript."
      );
    }
  },

  /**
   * Export attendees to an Excel (.xlsx) file
   */
  exportToExcel(contacts, eventName = "Event_Attendees") {
    if (!contacts || contacts.length === 0) {
      alert("No attendee contacts to export.");
      return;
    }

    const rows = contacts.map((c, index) => ({
      "S.No": index + 1,
      "Attendee Name": c.name || "N/A",
      "Phone Number": c.phone || "N/A",
      "Company": c.companyName || "N/A",
      "Designation": c.designation || "N/A",
      "Discussion Summary": c.summary || "N/A",
      "Personalized WhatsApp Message": c.messageText || "N/A",
      "Status": c.status === "whatsapp_opened" || c.status === "completed" ? "WhatsApp Sent" : "Pending",
      "Captured By": c.capturedByName || "Sales Rep",
      "Captured At": c.createdAt ? new Date(c.createdAt).toLocaleString() : "N/A",
      "WhatsApp Sent At": c.sentAt ? new Date(c.sentAt).toLocaleString() : "N/A",
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendees");

    // Adjust column widths
    worksheet["!cols"] = [
      { wch: 6 },
      { wch: 22 },
      { wch: 16 },
      { wch: 25 },
      { wch: 40 },
      { wch: 50 },
      { wch: 16 },
      { wch: 18 },
      { wch: 20 },
      { wch: 20 },
    ];

    const safeTitle = (eventName || "Event_Attendees").replace(/[^a-z0-9_-]/gi, "_");
    XLSX.writeFile(workbook, `${safeTitle}_Contacts.xlsx`);
  },
};

