import React from "react";
import {
  Bell,
  Check,
  Trash2,
  BellRing,
  AlertTriangle,
  Mail,
  Calendar,
  Frown,
  CheckCheck,
} from "lucide-react";
import { useNotifications } from "../context/NotificationContext.jsx";

export default function NotificationsPage() {
  const {
    notifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    unreadCount,
    loadMore,
    hasMore,
  } = useNotifications();

  const getAlertColor = (type) => {
    if (type === "followup_overdue")
      return "text-red-500 bg-red-500/10 border-red-500/20";
    if (type === "lead_inactive")
      return "text-orange-500 bg-orange-500/10 border-orange-500/20";
    if (type === "insurance_renewal")
      return "text-purple-500 bg-purple-500/10 border-purple-500/20";
    return "text-blue-500 bg-blue-500/10 border-blue-500/20";
  };

  const getAlertIcon = (type) => {
    if (type === "followup_overdue")
      return <AlertTriangle size={20} className="text-red-500" />;
    if (type === "lead_inactive")
      return <BellRing size={20} className="text-orange-500" />;
    if (type === "insurance_renewal")
      return <Mail size={20} className="text-purple-500" />;
    return <Calendar size={20} className="text-blue-500" />;
  };

  return (
    <div className="p-4 md:p-6">
      {/* Description header */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-primary tracking-tight mb-1">
            Alerts & System Notifications
          </h1>
          <p className="text-sm text-brand-primary/70">
            Review pending system reminders, expiring subscription agreements,
            and salesperson call alerts.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-2 px-4 py-2 border border-brand-secondary hover:bg-brand-secondary/30 text-brand-primary text-sm font-bold rounded-lg transition-colors"
          >
            <CheckCheck size={18} />
            Mark All Read
          </button>
        )}
      </div>

      {/* Main Container */}
      <div className="bg-brand-light border border-brand-secondary rounded-2xl overflow-hidden shadow-sm">
        <ul className="divide-y divide-brand-secondary">
          {notifications.map((n) => (
            <li
              key={n.id}
              className={`flex items-start p-4 sm:p-5 transition-colors relative group ${
                n.read ? "bg-brand-light" : "bg-purple-500/5"
              }`}
            >
              {/* Visual Avatar */}
              <div className="mr-4 shrink-0 mt-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border ${getAlertColor(n.type)}`}
                >
                  {getAlertIcon(n.type)}
                </div>
              </div>

              {/* Contents textual */}
              <div className="flex-grow min-w-0 pr-16 sm:pr-24">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3
                    className={`text-sm ${n.read ? "font-semibold text-brand-primary" : "font-extrabold text-brand-primary"}`}
                  >
                    {n.title}
                  </h3>
                  {!n.read && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-black tracking-wider bg-purple-500 text-brand-light">
                      NEW
                    </span>
                  )}
                </div>
                <p className="text-sm text-brand-primary leading-relaxed mb-1.5">
                  {n.message}
                </p>
                <span className="text-xs text-brand-primary/70 flex items-center gap-1">
                  🕒 {n.time}
                </span>
              </div>

              {/* Actions */}
              <div className="absolute right-4 top-4 sm:top-5 flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                {!n.read && (
                  <button
                    onClick={() => markAsRead(n.id)}
                    className="p-1.5 text-brand-primary/70 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors"
                    title="Mark as Read"
                  >
                    <Check size={18} />
                  </button>
                )}
                <button
                  onClick={() => deleteNotification(n.id)}
                  className="p-1.5 text-brand-primary/70 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                  title="Dismiss Alert"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </li>
          ))}

          {notifications.length === 0 && (
            <div className="text-center py-16 px-4">
              <Frown className="w-16 h-16 text-brand-secondary/50 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-brand-primary/70 mb-1">
                Alert Feed is Empty
              </h3>
              <p className="text-sm text-brand-primary/70">
                Hooray! No pending system notifications or warnings remain.
              </p>
            </div>
          )}
        </ul>

        {hasMore && (
          <div className="p-4 sm:p-5 border-t border-brand-secondary bg-brand-light/50 flex justify-center">
            <button
              onClick={loadMore}
              className="px-6 py-2.5 bg-purple-500 hover:bg-purple-600 text-white text-sm font-bold rounded-lg transition-colors shadow-sm"
            >
              Load Older Notifications
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
