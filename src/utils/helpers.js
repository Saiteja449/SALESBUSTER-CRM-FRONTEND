/**
 * Ensures service is read as a string.
 */
export function normalizeServices(value) {
  if (!value) return "General Enquiry";
  if (Array.isArray(value)) return value[0] || "General Enquiry";
  return String(value);
}

/**
 * Date Formatter helper
 */
export function formatDate(dateString) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Gets a chip color class/props for standard MUI chip types based on pipeline stage
 */
export function getStageColor(stage) {
  if (!stage) return "default";
  const s = stage.toLowerCase();

  if (s.includes("new") || s === "lead") return "info";
  if (
    s.includes("schedule") ||
    s.includes("planned") ||
    s.includes("scheduled")
  )
    return "secondary";
  if (
    s.includes("complete") ||
    s.includes("enroll") ||
    s.includes("active") ||
    s.includes("client")
  )
    return "success";
  if (
    s.includes("discussion") ||
    s.includes("inquiry") ||
    s.includes("consultation") ||
    s.includes("assessment")
  )
    return "warning";
  if (
    s.includes("renewal") ||
    s.includes("subscription") ||
    s.includes("payment")
  )
    return "primary";

  return "default";
}

/**
 * Service to hex color dictionary and utility
 */
export const serviceColors = {
  "General Enquiry": "#64748b", // Slate Gray
  "Passenger Lift": "#0c7dfd", // Royal Blue
  "MRL Lift": "#8b5cf6", // Purple
  "Hydraulic Lift": "#f59e0b", // Amber
  "Hospital Bed Lift": "#ef4444", // Crimson Red
  "Elevator Maintenance & AMC": "#10b981", // Emerald Green
  "Elevator Modernization": "#6366f1", // Indigo
};

const DYNAMIC_PALETTE = [
  "#0c7dfd",
  "#8b5cf6",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#6366f1",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#06b6d4",
  "#84cc16",
  "#a855f7",
  "#3b82f6",
  "#e11d48",
  "#0ea5e9",
];

export function getServiceColor(serviceName) {
  if (!serviceName) return "#64748b";
  if (serviceColors[serviceName]) return serviceColors[serviceName];

  let hash = 0;
  for (let i = 0; i < serviceName.length; i++) {
    hash = serviceName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return DYNAMIC_PALETTE[Math.abs(hash) % DYNAMIC_PALETTE.length];
}

/**
 * Status color helper
 */
export function getStatusColor(status) {
  if (!status) return "default";
  const st = status.toLowerCase();
  if (st === "converted") return "success";
  if (st === "new") return "info";
  if (st === "follow up" || st === "followup" || st === "followups")
    return "primary";
  if (st === "not interested" || st === "not intersted") return "error";
  if (st === "not attended") return "warning";
  if (st === "price issue" || st === "not responding") return "error";
  return "default";
}

/**
 * Lead source color mapping
 */
export function getSourceColor(source) {
  if (!source) return "default";
  const src = source.toLowerCase();
  if (src.includes("google")) return "primary";
  if (
    src.includes("social") ||
    src.includes("facebook") ||
    src.includes("instagram")
  )
    return "secondary";
  if (src.includes("referral")) return "success";
  if (src.includes("email")) return "warning";
  if (src.includes("mobile")) return "primary";
  return "default";
}

/**
 * Helper to calculate lead aging in days
 */
export function getLeadAge(createdAtString) {
  if (!createdAtString) return 0;
  const created = new Date(createdAtString);
  const today = new Date("2026-05-26"); // Mock environment "today"
  const diffTime = Math.abs(today - created);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Resolves a display name for a lead assignee (handles both User ID and legacy string name)
 */
export function getRepName(assignedTo, allUsers = []) {
  if (!assignedTo || assignedTo === "Unassigned") return "Unassigned";
  const user = allUsers.find(
    (u) => (u.id && String(u.id) === String(assignedTo)) || (u._id && String(u._id) === String(assignedTo))
  );
  if (user && user.name) return user.name;
  return assignedTo; // Return existing name string if legacy
}

/**
 * Filter leads based on query inputs
 */
export function filterLeads(
  leads,
  {
    search = "",
    service = "All",
    stage = "All",
    salesperson = "All",
    status = "All",
    allUsers = [],
  },
) {
  const selectedUser = allUsers.find(
    (u) => u.id === salesperson || u._id === salesperson,
  );
  const selectedUserName = selectedUser?.name?.toLowerCase();

  return leads.filter((lead) => {
    // Search filter (handles name, phone, email)
    const matchSearch =
      !search ||
      lead.name.toLowerCase().includes(search.toLowerCase()) ||
      lead.phone.includes(search) ||
      (lead.email && lead.email.toLowerCase().includes(search.toLowerCase()));

    const matchService =
      service === "All" || lead.service === service;
    const matchStage = stage === "All" || lead.stage === stage;
    const leadAssigned = String(lead.assignedTo || "");
    const matchSalesperson =
      salesperson === "All" ||
      leadAssigned === String(salesperson) ||
      (selectedUserName && leadAssigned.toLowerCase() === selectedUserName);
    const matchStatus = status === "All" || lead.status === status;

    return (
      matchSearch &&
      matchService &&
      matchStage &&
      matchSalesperson &&
      matchStatus
    );
  });
}

/**
 * Export data to CSV
 */
export function exportToCSV(data, filename = "export.csv") {
  if (!data || !data.length) return;
  const headers = Object.keys(data[0]);
  const csvRows = [];

  // Headers
  csvRows.push(headers.join(","));

  // Rows
  for (const row of data) {
    const values = headers.map((header) => {
      const val = row[header];
      if (val === null || val === undefined) return '""';
      const escaped = ("" + val).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(","));
  }

  const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.setAttribute("hidden", "");
  a.setAttribute("href", url);
  a.setAttribute("download", filename);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
