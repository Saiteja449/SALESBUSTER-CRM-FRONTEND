import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  PhoneOff,
  Clock,
  TrendingUp,
  FileText
} from "lucide-react";
import axios from "axios";
import { API_ENDPOINTS } from "../utils/constants.js";
import { formatDate } from "../utils/helpers.js";

const formatTalkTime = (seconds) => {
  if (!seconds) return '00:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export default function SalesPersonReports() {
  const { name } = useParams();
  const navigate = useNavigate();
  const decodedName = decodeURIComponent(name);
  const [analytics, setAnalytics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await axios.get(`${API_ENDPOINTS.ANALYTICS.BASE}/${decodedName}`);
        setAnalytics(res.data.data || []);
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnalytics();
  }, [decodedName]);

  const todayStrDate = new Date().toISOString().split("T")[0];
  const todayAnalytics = analytics.find(a => a.date === todayStrDate) || {
    totalCalls: 0, talkTime: 0, incoming: 0, outgoing: 0, missed: 0, connected: 0, rejected: 0, notConnected: 0
  };
  
  const weeklyAnalytics = analytics.reduce((acc, curr) => ({
    totalCalls: acc.totalCalls + (curr.totalCalls || 0),
    talkTime: acc.talkTime + (curr.talkTime || 0),
    incoming: acc.incoming + (curr.incoming || 0),
    outgoing: acc.outgoing + (curr.outgoing || 0),
    missed: acc.missed + (curr.missed || 0),
    connected: acc.connected + (curr.connected || 0),
    rejected: acc.rejected + (curr.rejected || 0),
    notConnected: acc.notConnected + (curr.notConnected || 0),
  }), { totalCalls: 0, talkTime: 0, incoming: 0, outgoing: 0, missed: 0, connected: 0, rejected: 0, notConnected: 0 });

  return (
    <div className="p-4 md:p-6 space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-brand-primary/70 hover:text-brand-primary transition-colors font-medium mb-2"
      >
        <ArrowLeft size={18} />
        Back to Leads
      </button>

      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-full bg-blue-600 text-brand-primary flex items-center justify-center font-bold text-2xl shrink-0">
          {decodedName.substring(0, 1).toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-brand-primary tracking-tight">
            {decodedName}'s Reports
          </h1>
          <p className="text-sm text-brand-primary/70 mt-1">
            Performance Analytics & Daily Logs
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
        </div>
      ) : (
        <>
          {/* Analytics Board */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
            <div className="bg-brand-light border border-brand-secondary rounded-2xl p-4 shadow-sm">
              <h2 className="text-lg font-bold text-brand-primary mb-1 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-500" /> Today's Activity
              </h2>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-brand-secondary/20 p-3 rounded-lg border border-brand-secondary">
                  <span className="text-xs text-brand-primary/70 block mb-1">Calls Today</span>
                  <span className="text-xl font-bold text-brand-primary">{todayAnalytics.totalCalls}</span>
                </div>
                <div className="bg-brand-secondary/20 p-3 rounded-lg border border-brand-secondary">
                  <span className="text-xs text-brand-primary/70 block mb-1">Talk Time</span>
                  <span className="text-xl font-bold text-brand-primary">{formatTalkTime(todayAnalytics.talkTime)}</span>
                </div>
                <div className="bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                  <span className="text-xs text-red-500 block mb-1">Missed Today</span>
                  <span className="text-xl font-bold text-red-500">{todayAnalytics.missed}</span>
                </div>
                <div className="bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20">
                  <span className="text-xs text-emerald-500 block mb-1">Connected Today</span>
                  <span className="text-xl font-bold text-emerald-600">{todayAnalytics.connected}</span>
                </div>
              </div>
            </div>

            <div className="bg-brand-light border border-brand-secondary rounded-2xl p-4 shadow-sm">
              <h2 className="text-lg font-bold text-brand-primary mb-1 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-sky-500" /> Last 7 Days Summary
              </h2>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-4">
                <div className="flex flex-col items-center p-2 bg-brand-secondary/10 rounded-lg">
                  <Phone className="w-4 h-4 text-brand-primary/70 mb-1" />
                  <span className="text-xs text-brand-primary/70 text-center">Total</span>
                  <span className="font-bold text-brand-primary">{weeklyAnalytics.totalCalls}</span>
                </div>
                <div className="flex flex-col items-center p-2 bg-indigo-500/10 rounded-lg">
                  <PhoneIncoming className="w-4 h-4 text-indigo-500 mb-1" />
                  <span className="text-xs text-indigo-500 text-center">Incoming</span>
                  <span className="font-bold text-indigo-600">{weeklyAnalytics.incoming}</span>
                </div>
                <div className="flex flex-col items-center p-2 bg-purple-500/10 rounded-lg">
                  <PhoneOutgoing className="w-4 h-4 text-purple-500 mb-1" />
                  <span className="text-xs text-purple-500 text-center">Outgoing</span>
                  <span className="font-bold text-purple-600">{weeklyAnalytics.outgoing}</span>
                </div>
                <div className="flex flex-col items-center p-2 bg-red-500/10 rounded-lg">
                  <PhoneMissed className="w-4 h-4 text-red-500 mb-1" />
                  <span className="text-xs text-red-500 text-center">Missed</span>
                  <span className="font-bold text-red-600">{weeklyAnalytics.missed}</span>
                </div>
                <div className="flex flex-col items-center p-2 bg-emerald-500/10 rounded-lg">
                  <Phone className="w-4 h-4 text-emerald-500 mb-1" />
                  <span className="text-xs text-emerald-500 text-center">Connected</span>
                  <span className="font-bold text-emerald-600">{weeklyAnalytics.connected}</span>
                </div>
                <div className="flex flex-col items-center p-2 bg-orange-500/10 rounded-lg">
                  <PhoneOff className="w-4 h-4 text-orange-500 mb-1" />
                  <span className="text-xs text-orange-500 text-center">Rejected</span>
                  <span className="font-bold text-orange-600">{weeklyAnalytics.rejected}</span>
                </div>
                <div className="flex flex-col items-center p-2 bg-brand-secondary/20 rounded-lg">
                  <PhoneOff className="w-4 h-4 text-brand-primary/50 mb-1" />
                  <span className="text-[10px] leading-tight text-brand-primary/50 text-center">Not Connect</span>
                  <span className="font-bold text-brand-primary/70">{weeklyAnalytics.notConnected}</span>
                </div>
                <div className="flex flex-col items-center p-2 bg-sky-500/10 rounded-lg">
                  <Clock className="w-4 h-4 text-sky-500 mb-1" />
                  <span className="text-xs text-sky-500 text-center">Talk Time</span>
                  <span className="font-bold text-sky-600 text-xs mt-1">{formatTalkTime(weeklyAnalytics.talkTime)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Daily Reports Table */}
          <div className="bg-brand-light border border-brand-secondary rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-brand-secondary bg-brand-light/50">
              <h2 className="text-lg font-bold text-brand-primary flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-500" /> Daily Reports
              </h2>
            </div>
            
            {analytics.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-brand-primary/70">No daily reports available for this period.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead className="bg-brand-secondary/20 border-b border-brand-secondary">
                    <tr>
                      <th className="px-4 py-3 text-xs font-bold text-brand-primary/70 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-xs font-bold text-brand-primary/70 uppercase tracking-wider">Total Calls</th>
                      <th className="px-4 py-3 text-xs font-bold text-brand-primary/70 uppercase tracking-wider">Connected</th>
                      <th className="px-4 py-3 text-xs font-bold text-brand-primary/70 uppercase tracking-wider">Missed</th>
                      <th className="px-4 py-3 text-xs font-bold text-brand-primary/70 uppercase tracking-wider">Talk Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-secondary">
                    {analytics.map((day, idx) => (
                      <tr key={idx} className="hover:bg-brand-secondary/30 transition-colors">
                        <td className="px-4 py-3 font-medium text-brand-primary">
                          {formatDate(day.date)}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-brand-primary">{day.totalCalls || 0}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded text-xs">{day.connected || 0}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-red-600 bg-red-500/10 px-2 py-0.5 rounded text-xs">{day.missed || 0}</span>
                        </td>
                        <td className="px-4 py-3 font-medium text-brand-primary/80">
                          {formatTalkTime(day.talkTime)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
