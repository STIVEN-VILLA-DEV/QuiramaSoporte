"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteMaintenanceAction } from "@/actions/maintenance";
import type { MaintenanceRecord } from "@/types";

const priorityConfig: Record<string, { label: string; class: string; dot: string }> = {
  low: { label: "Baja", class: "bg-gray-50 text-gray-600 border-gray-200", dot: "bg-gray-400" },
  medium: { label: "Media", class: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" },
  high: { label: "Alta", class: "bg-orange-50 text-orange-700 border-orange-200", dot: "bg-orange-500" },
  critical: { label: "Crítica", class: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-500" },
};

const statusConfig: Record<string, { label: string; class: string; dot: string }> = {
  scheduled: { label: "Programado", class: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-500" },
  in_progress: { label: "En Progreso", class: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" },
  completed: { label: "Completado", class: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  cancelled: { label: "Cancelado", class: "bg-gray-50 text-gray-500 border-gray-200", dot: "bg-gray-400" },
};

const typeLabels: Record<string, string> = {
  preventive: "Preventivo",
  corrective: "Correctivo",
  upgrade: "Actualización",
  inspection: "Inspección",
};

interface Props {
  records: MaintenanceRecord[];
  total: number;
  page: number;
  totalPages: number;
  canWrite: boolean;
  isAdmin: boolean;
}

export default function MaintenanceTable({ records, total, page, totalPages, canWrite, isAdmin }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = (id: string) => {
    if (!confirm("¿Eliminar este registro de mantenimiento?")) return;
    setDeletingId(id);
    startTransition(async () => {
      await deleteMaintenanceAction(id);
      setDeletingId(null);
    });
  };

  const goToPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`/dashboard/maintenance?${params.toString()}`);
  };

  if (records.length === 0) {
    return (
      <div className="card p-16 text-center">
        <div className="text-4xl mb-3">🔧</div>
        <p className="text-gray-500 font-medium">No hay registros de mantenimiento</p>
        <p className="text-gray-400 text-sm mt-1">Crea un nuevo registro para comenzar el seguimiento</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="table-header">
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider">Título / Equipo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider hidden md:table-cell">Tipo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider hidden md:table-cell">Técnico</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider">Prioridad</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider">Estado</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider hidden md:table-cell">Fecha</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider hidden xl:table-cell">Costo</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {records.map((r, i) => {
                const priority = priorityConfig[r.priority];
                const status = statusConfig[r.status];
                const isDeleting = deletingId === r.id;
                return (
                  <motion.tr
                    key={r.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className={`table-row transition-all duration-150 hover:shadow-sm hover:bg-gray-50 ${
                      isDeleting ? "opacity-40" : ""
                    }`}
                  >
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-gray-800">{r.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{r.device_name ?? "Equipo no especificado"}</p>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <span className="text-xs text-gray-500">{typeLabels[r.type]}</span>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <span className="text-xs text-gray-600">{r.technician_name ?? "—"}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${priority.class}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${priority.dot}`} />
                        {priority.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${status.class}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <span className="text-xs text-gray-500">
                        {r.scheduled_date
                          ? new Date(r.scheduled_date).toLocaleDateString("es-CO")
                          : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 hidden xl:table-cell">
                      <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                        {r.cost != null ? `$${Number(r.cost).toLocaleString("es-CO")}` : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        {canWrite && (
                          <Link
                            href={`/dashboard/maintenance/${r.id}/edit`}
                            className="text-xs text-gray-500 hover:text-amber-600 transition-colors px-2 py-1 rounded hover:bg-amber-50"
                          >
                            Editar
                          </Link>
                        )}
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(r.id)}
                            disabled={isPending}
                            className="text-xs text-gray-500 hover:text-accent transition-colors px-2 py-1 rounded hover:bg-accent/10 disabled:opacity-50"
                          >
                            Eliminar
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-gray-500">Mostrando {records.length} de {total.toLocaleString()}</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              ← Anterior
            </button>
            <span className="text-gray-500">{page} / {totalPages}</span>
            <button
              onClick={() => goToPage(page + 1)}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
