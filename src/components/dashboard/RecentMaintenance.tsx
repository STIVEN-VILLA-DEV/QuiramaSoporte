"use client";

import Link from "next/link";
import type { MaintenanceRecord } from "@/types";

const priorityConfig = {
  low: { label: "Baja", class: "bg-gray-100 text-gray-500" },
  medium: { label: "Media", class: "bg-amber-100 text-amber-700" },
  high: { label: "Alta", class: "bg-orange-100 text-orange-700" },
  critical: { label: "Crítica", class: "bg-red-100 text-red-700" },
};

const statusConfig = {
  scheduled: { label: "Programado", class: "text-accent" },
  in_progress: { label: "En Progreso", class: "text-amber-700" },
  completed: { label: "Completado", class: "text-emerald-700" },
  cancelled: { label: "Cancelado", class: "text-gray-500" },
};

interface Props {
  records: MaintenanceRecord[];
}

export default function RecentMaintenance({ records }: Props) {
  return (
    <div
      className="card animate-fade-in-up"
      style={{ animationDelay: "300ms" }}
    >
      <div className="flex items-center justify-between p-5 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900">Mantenimientos Recientes</h3>
        <Link
          href="/dashboard/maintenance"
          className="text-xs text-accent hover:text-accent transition-colors"
        >
          Ver todos →
        </Link>
      </div>

      {records.length === 0 ? (
        <div className="p-8 text-center text-gray-500 text-sm">
          No hay registros de mantenimiento
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {records.map((record, i) => {
            const priority = priorityConfig[record.priority];
            const status = statusConfig[record.status];
            return (
              <div
                key={record.id}
                className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors animate-fade-in"
                style={{ animationDelay: `${350 + i * 50}ms` }}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {record.title}
                  </p>
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {record.device_name ?? "Equipo desconocido"}
                    {record.branch_name && (
                      <span className="inline-flex items-center gap-1 ml-2 text-gray-400">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {record.branch_name}
                      </span>
                    )}
                    {record.technician_name && (
                      <span className="text-gray-400 ml-2">· {record.technician_name}</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${priority.class}`}
                  >
                    {priority.label}
                  </span>
                  <span className={`text-xs font-medium ${status.class}`}>
                    {status.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
