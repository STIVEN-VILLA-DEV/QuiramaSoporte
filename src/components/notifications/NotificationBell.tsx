"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import type { NotificationsResponse } from "@/types";
import { markNotificationReadAction, markAllNotificationsReadAction, deleteNotificationAction, clearAllNotificationsAction } from "@/actions/notifications";

export default function NotificationBell() {
  const [data, setData] = useState<NotificationsResponse | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // ── SSE with polling fallback ──
  const [useSSE, setUseSSE] = useState(true);
  const hasReceivedData = useRef(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const json = await res.json();
      setData(json);
    } catch {
      // Silently fail — retry on next interval
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!useSSE) {
      // Fallback: polling every 30s
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }

    // Try SSE via EventSource
    hasReceivedData.current = false;
    const es = new EventSource("/api/notifications/stream");

    es.onmessage = (event) => {
      hasReceivedData.current = true;
      try {
        const json = JSON.parse(event.data);
        setData(json);
      } catch {
        // ignore malformed data
      }
      setLoading(false);
    };

    es.onerror = () => {
      if (!hasReceivedData.current) {
        // Initial connection failed → fallback to polling
        es.close();
        setUseSSE(false);
      }
      // If we've received data before, EventSource auto-reconnects
    };

    return () => es.close();
  }, [useSSE, fetchNotifications]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const unreadCount = data?.unread_count ?? 0;
  const notifications = data?.notifications ?? [];
  const alerts = data?.alerts;

  async function handleMarkAsRead(notificationId: string) {
    const result = await markNotificationReadAction(notificationId);
    if (result.success) {
      // Optimistic update
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          unread_count: Math.max(0, prev.unread_count - 1),
          notifications: prev.notifications.map((n) =>
            n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n
          ),
        };
      });
    }
  }

  async function handleMarkAllRead() {
    const result = await markAllNotificationsReadAction();
    if (result.success) {
      // Optimistic update
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          unread_count: 0,
          notifications: prev.notifications.map((n) => ({
            ...n,
            read_at: n.read_at ?? new Date().toISOString(),
          })),
        };
      });
    }
  }

  async function handleDismiss(notificationId: string) {
    const result = await deleteNotificationAction(notificationId);
    if (result.success) {
      setData((prev) => {
        if (!prev) return prev;
        const updated = prev.notifications.filter((n) => n.id !== notificationId);
        const wasUnread = prev.notifications.find((n) => n.id === notificationId && !n.read_at);
        return {
          ...prev,
          unread_count: wasUnread ? Math.max(0, prev.unread_count - 1) : prev.unread_count,
          notifications: updated,
        };
      });
    }
  }

  async function handleClearAll() {
    const result = await clearAllNotificationsAction();
    if (result.success) {
      setData((prev) => {
        if (!prev) return prev;
        return { ...prev, unread_count: 0, notifications: [] };
      });
    }
  }

  // Time ago helper
  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "ahora";
    if (mins < 60) return `hace ${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `hace ${hrs}h`;
    const days = Math.floor(hrs / 24);
    return `hace ${days}d`;
  }

  const hasAlerts = alerts && (
    alerts.expiring_warranties > 0 ||
    alerts.expiring_antivirus > 0 ||
    alerts.pending_maintenance > 0 ||
    alerts.overdue_maintenance > 0
  );

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Notificaciones"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 text-sm">
                Notificaciones
                {unreadCount > 0 && (
                  <span className="ml-1.5 text-xs text-gray-500 font-normal">
                    ({unreadCount} sin leer)
                  </span>
                )}
              </h3>
              <div className="flex items-center gap-2">
                {notifications.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
                  >
                    Limpiar todo
                  </button>
                )}
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                  >
                    Leer todas
                  </button>
                )}
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-64 overflow-y-auto">
              {loading ? (
                <div className="px-4 py-8 text-center text-gray-400 text-sm">
                  Cargando...
                </div>
              ) : notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-400 text-sm">
                  No hay notificaciones
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`px-4 py-3 border-b border-gray-50 transition-colors ${
                      !n.read_at ? "bg-indigo-50/50" : ""
                    } ${n.link ? "cursor-pointer hover:bg-gray-100" : "hover:bg-gray-50"}`}
                    onClick={n.link ? () => router.push(n.link!) : undefined}
                    role={n.link ? "button" : undefined}
                    tabIndex={n.link ? 0 : undefined}
                    onKeyDown={n.link ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); router.push(n.link!); } } : undefined}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {n.title}
                        </p>
                        {n.message && (
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                            {n.message}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {timeAgo(n.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {!n.read_at && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleMarkAsRead(n.id); }}
                            className="p-1 text-gray-400 hover:text-indigo-600 transition-colors"
                            title="Marcar como leída"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDismiss(n.id); }}
                          className="p-1 text-gray-300 hover:text-red-500 transition-colors"
                          title="Descartar notificación"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Alerts Section */}
            {hasAlerts && (
              <div className="px-4 py-3 bg-amber-50 border-t border-amber-100">
                <h4 className="text-xs font-semibold text-amber-800 uppercase tracking-wider mb-2">
                  Alertas
                </h4>
                <div className="space-y-1">
                  {alerts!.expiring_warranties > 0 && (
                    <p className="text-xs text-amber-700">
                      {alerts!.expiring_warranties} garantía(s) por vencer
                    </p>
                  )}
                  {alerts!.expiring_antivirus > 0 && (
                    <p className="text-xs text-amber-700">
                      {alerts!.expiring_antivirus} antivirus por vencer
                    </p>
                  )}
                  {alerts!.pending_maintenance > 0 && (
                    <p className="text-xs text-amber-700">
                      {alerts!.pending_maintenance} mantenimiento(s) pendiente(s)
                    </p>
                  )}
                  {alerts!.overdue_maintenance > 0 && (
                    <p className="text-xs text-red-600 font-medium">
                      {alerts!.overdue_maintenance} mantenimiento(s) vencido(s)
                    </p>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
