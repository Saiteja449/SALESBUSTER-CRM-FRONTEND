import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ClipboardList,
  ExternalLink,
  Calendar,
  Phone,
  Mail,
} from "lucide-react";
import { useLeads } from "../context/LeadsContext.jsx";
import { formatDate } from "../utils/helpers.js";

export default function FollowUpReport() {
  const navigate = useNavigate();
  const { leads, followups } = useLeads();

  const reportData = useMemo(() => {
    const today = new Date();
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(today.getDate() - 5);

    // Get all leads that have an activity or followup in the last 5 days
    const activeLeadIds = new Set();

    followups.forEach((fw) => {
      const fwDate = new Date(fw.date);
      if (fwDate >= fiveDaysAgo && fwDate <= today) {
        activeLeadIds.add(fw.leadId);
      }
    });

    // Group active leads by salesperson
    const grouped = {};
    activeLeadIds.forEach((leadId) => {
      const lead = leads.find((l) => l.id === leadId);
      if (lead) {
        const rep = lead.assignedTo || "Unassigned";
        if (!grouped[rep]) {
          grouped[rep] = [];
        }
        grouped[rep].push(lead);
      }
    });

    return Object.entries(grouped).sort(([repA], [repB]) =>
      repA.localeCompare(repB),
    );
  }, [leads, followups]);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-primary tracking-tight flex items-center gap-3">
            <ClipboardList className="text-purple-500" size={28} />
            Recent Follow-up Report (Last 5 Days)
          </h1>
          <p className="text-sm text-brand-primary/70 mt-1">
            Overview of leads actively followed up by sales representatives in
            the last 5 days.
          </p>
        </div>
      </div>

      {reportData.length === 0 ? (
        <div className="bg-brand-light border border-brand-secondary rounded-2xl p-12 text-center">
          <ClipboardList className="w-16 h-16 text-brand-primary/70 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-brand-primary">
            No Recent Follow-ups
          </h3>
          <p className="text-sm text-brand-primary/70 mt-1">
            No leads have been followed up in the past 5 days.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {reportData.map(([salesperson, activeLeads]) => (
            <div
              key={salesperson}
              className="bg-brand-light border border-brand-secondary rounded-xl overflow-hidden shadow-sm"
            >
              <div className="bg-brand-light px-5 py-4 border-b border-brand-secondary flex justify-between items-center">
                <h3 className="text-lg font-bold text-brand-primary flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-blue-600 text-brand-primary flex items-center justify-center text-sm">
                    {salesperson.substring(0, 1).toUpperCase()}
                  </span>
                  {salesperson}
                </h3>
                <span className="px-3 py-1 bg-purple-500/10 text-purple-500 border border-purple-500/20 rounded-full text-xs font-bold">
                  {activeLeads.length} Active Leads
                </span>
              </div>
              <div className="p-5">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-brand-secondary text-brand-primary/70 text-sm">
                        <th className="p-4 font-semibold">Lead Name</th>
                        <th className="p-4 font-semibold">Contact Info</th>
                        <th className="p-4 font-semibold">Service & Stage</th>
                        <th className="p-4 font-semibold">Enquired On</th>
                        <th className="p-4 font-semibold text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeLeads.map((lead) => (
                        <tr
                          key={lead.id}
                          onClick={() => navigate(`/lead-details/${lead.id}`)}
                          className="border-b border-brand-secondary/50 hover:bg-brand-secondary/10 cursor-pointer transition-colors group"
                        >
                          <td className="p-4">
                            <div className="font-bold text-brand-primary group-hover:text-purple-500 transition-colors flex items-center gap-2">
                              {lead.name}
                              <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-purple-500" />
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="text-sm text-brand-primary/80 flex flex-col gap-1.5">
                              <span className="flex items-center gap-1.5">
                                <Phone
                                  size={14}
                                  className="text-brand-primary/50"
                                />{" "}
                                {lead.phone}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <Mail
                                  size={14}
                                  className="text-brand-primary/50"
                                />{" "}
                                <span className="truncate max-w-[150px]">
                                  {lead.email || "No email"}
                                </span>
                              </span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="text-sm text-brand-primary/80">
                              <div className="font-medium">{lead.service}</div>
                              <div className="text-xs text-brand-primary/60 mt-0.5">
                                {lead.stage}
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="text-sm text-brand-primary/80 flex items-center gap-1.5">
                              <Calendar
                                size={14}
                                className="text-brand-primary/50"
                              />
                              {formatDate(lead.joinedAt || lead.createdAt)}
                            </div>
                          </td>
                          <td className="p-4 text-right">
                            <span
                              className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                                lead.status === "Converted"
                                  ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                  : lead.status === "New"
                                    ? "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                                    : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                              }`}
                            >
                              {lead.status || "New"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
