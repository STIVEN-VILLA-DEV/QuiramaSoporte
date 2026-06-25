"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

interface Props {
  expiringWarranties: number;
  expiringAntivirus: number;
  pendingMaintenance: number;
  overdueMaintenance: number;
}

interface Alert {
  id: string;
  title: string;
  message: string;
  type: "warning" | "danger" | "info" | "critical";
  icon: React.ReactNode;
}

const icons = {
  warning: (
    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M12 9v2m0 4h.01M10.29 3.86l-8.57 14.86A1 1 0 002.57 20h18.86a1 1 0 00.86-1.28l-8.57-14.86a1 1 0 00-1.72 0z" />
    </svg>
  ),
  danger: (
    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  critical: (
    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
};

const typeConfig = {
  warning: {
    container: "bg-amber-50 border-l-4 border-amber-400 text-amber-800",
    badge: "bg-amber-200 text-amber-800",
  },
  danger: {
    container: "bg-red-50 border-l-4 border-red-400 text-red-800",
    badge: "bg-red-200 text-red-800",
  },
  info: {
    container: "bg-red-50 border-l-4 border-red-400 text-red-800",
    badge: "bg-red-200 text-red-800",
  },
  critical: {
    container: "bg-red-50 border-l-4 border-red-600 text-red-900",
    badge: "bg-red-200 text-red-800",
  },
};

export default function AlertBanner({
  expiringWarranties,
  expiringAntivirus,
  pendingMaintenance,
  overdueMaintenance,
}: Props) {
  const [dismissed, setDismissed] = useState<string[]>([]);

  const alerts: Alert[] = [
    overdueMaintenance > 0 && {
      id: "overdue-maintenance",
      title: "Mantenimiento Vencido",
      message: `${overdueMaintenance} equipo${overdueMaintenance !== 1 ? "s" : ""} con mantenimiento vencido — requiere atención urgente`,
      type: "critical" as const,
      icon: icons.critical,
    },
    expiringWarranties > 0 && {
      id: "warranty",
      title: "Garantías por Vencer",
      message: `${expiringWarranties} equipo${expiringWarranties !== 1 ? "s" : ""} con garantía por vencer en 30 días`,
      type: "warning" as const,
      icon: icons.warning,
    },
    expiringAntivirus > 0 && {
      id: "antivirus",
      title: "Antivirus por Vencer",
      message: `${expiringAntivirus} licencia${expiringAntivirus !== 1 ? "s" : ""} de antivirus por vencer en 30 días`,
      type: "danger" as const,
      icon: icons.danger,
    },
    pendingMaintenance > 0 && {
      id: "maintenance",
      title: "Mantenimientos Pendientes",
      message: `${pendingMaintenance} mantenimiento${pendingMaintenance !== 1 ? "s" : ""} programado${pendingMaintenance !== 1 ? "s" : ""} pendiente${pendingMaintenance !== 1 ? "s" : ""} de ejecutar`,
      type: "info" as const,
      icon: icons.info,
    },
  ].filter(Boolean) as Alert[];

  const visibleAlerts = alerts.filter((a) => !dismissed.includes(a.id));

  if (visibleAlerts.length === 0) return null;

  return (
    <div className="space-y-2.5">
      <AnimatePresence>
        {visibleAlerts.map((alert) => {
          const cfg = typeConfig[alert.type];
          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: "auto", marginBottom: 10 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className={`flex items-start gap-3 px-4 py-3 rounded-r-lg shadow-sm ${cfg.container}`}
            >
              <div className="mt-0.5">{alert.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.badge}`}>
                    {alert.title}
                  </span>
                </div>
                <p className="text-sm">{alert.message}</p>
              </div>
              <button
                onClick={() =>
                  setDismissed((d) => [...d, alert.id])
                }
                className="text-current opacity-50 hover:opacity-100 transition-opacity ml-2 shrink-0 mt-0.5"
                aria-label="Descartar alerta"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
