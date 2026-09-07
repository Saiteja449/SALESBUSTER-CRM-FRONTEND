export const users = [
  {
    id: "u1",
    name: "Alex Mercer",
    role: "Sales Manager",
    email: "alex@kranthielevators.com",
    avatar: "AM",
  },
  {
    id: "u2",
    name: "Sarah Connor",
    role: "Sales Representative",
    email: "sarah@kranthielevators.com",
    avatar: "SC",
  },
  {
    id: "u3",
    name: "David Miller",
    role: "Sales Representative",
    email: "david@kranthielevators.com",
    avatar: "DM",
  },
  {
    id: "u4",
    name: "Emily Davis",
    role: "Sales Representative",
    email: "emily@kranthielevators.com",
    avatar: "ED",
  },
];

export const services = [
  {
    id: "s1",
    name: "General Enquiry",
    code: "General Enquiry",
    active: true,
    color: "#64748b",
  },
  {
    id: "s2",
    name: "Passenger Lift",
    code: "Passenger Lift",
    active: true,
    color: "#0c7dfd",
  },
  {
    id: "s3",
    name: "MRL Lift",
    code: "MRL Lift",
    active: true,
    color: "#8b5cf6",
  },
  {
    id: "s4",
    name: "Hydraulic Lift",
    code: "Hydraulic Lift",
    active: true,
    color: "#f59e0b",
  },
  {
    id: "s5",
    name: "Hospital Bed Lift",
    code: "Hospital Bed Lift",
    active: true,
    color: "#ef4444",
  },
  {
    id: "s6",
    name: "Elevator Maintenance & AMC",
    code: "Elevator Maintenance & AMC",
    active: true,
    color: "#10b981",
  },
  {
    id: "s7",
    name: "Elevator Modernization",
    code: "Elevator Modernization",
    active: true,
    color: "#6366f1",
  },
];



// Empty Leads array for API integration
export const initialLeads = [];

export const initialFollowups = [];

export const initialActivities = [];

export const initialNotifications = [
  {
    id: "nt1",
    type: "followup_overdue",
    title: "Follow-up Overdue",
    message:
      "Site Inspection follow-up with Rajesh Kumar (Villa G+2 Lift) is overdue.",
    time: "2 hours ago",
    read: false,
  },
  {
    id: "nt2",
    type: "lead_inactive",
    title: "Inactive Lead Warning",
    message: "Lead Suresh Reddy has had no activity for over 6 days.",
    time: "4 hours ago",
    read: false,
  },
  {
    id: "nt3",
    type: "amc_renewal",
    title: "AMC Renewal Due",
    message: "Green Heights Apartments 4-Passenger Lift AMC expires in 15 days.",
    time: "1 day ago",
    read: false,
  },
  {
    id: "nt4",
    type: "site_visit",
    title: "Site Visit Reminder",
    message: "Shaft inspection at Cyber Towers scheduled tomorrow at 10:00 AM.",
    time: "1 day ago",
    read: true,
  },
  {
    id: "nt5",
    type: "quote_expiring",
    title: "Modernization Proposal Follow-up",
    message:
      "Sunrise Residency MRL elevator replacement proposal awaiting response.",
    time: "2 days ago",
    read: true,
  },
];

export const leadSources = [
  { name: "Meta", count: 12 },
  { name: "Whatsapp", count: 9 },
  { name: "Social Media", count: 6 },
  { name: "Email", count: 3 },
  { name: "Email", count: 2 },
];
