"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteDeviceAction } from "@/actions/devices";
import type { Device } from "@/types";

const statusConfig: Record<string, { label: string; class: string }> = {
  active: { label: "Activo", class: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  inactive: { label: "Inactivo", class: "bg-gray-100 text-gray-500 border-gray-200" },
  maintenance: { label: "Mantenimiento", class: "bg-amber-100 text-amber-700 border-amber-200" },
  retired: { label: "Retirado", class: "bg-gray-100 text-gray-500 border-gray-200" },
  damaged: { label: "Dañado", class: "bg-red-100 text-red-700 border-red-200" },
};

const branchColors = [
  "bg-emerald-100 text-emerald-700 border-emerald-200",
  "bg-sky-100 text-sky-700 border-sky-200",
  "bg-amber-100 text-amber-700 border-amber-200",
  "bg-violet-100 text-violet-700 border-violet-200",
  "bg-rose-100 text-rose-700 border-rose-200",
  "bg-cyan-100 text-cyan-700 border-cyan-200",
  "bg-lime-100 text-lime-700 border-lime-200",
  "bg-indigo-100 text-indigo-700 border-indigo-200",
];

const getBranchStyle = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash) + name.charCodeAt(i);
    hash |= 0;
  }
  return branchColors[Math.abs(hash) % branchColors.length];
};

const categoryEmoji: Record<string, string> = {
  computer: "🖥️", laptop: "💻", printer: "🖨️", camera: "📷",
  payment_terminal: "💳", server: "🗄️", network: "🔌", phone: "📱",
  tablet: "📱", scanner: "📠", ups: "🔋", other: "📦",
};

interface Props {
  devices: Device[];
  total: number;
  page: number;
  totalPages: number;
  canWrite: boolean;
  isAdmin: boolean;
}

export default function DevicesTable({ devices, total, page, totalPages, canWrite, isAdmin }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`¿Eliminar "${name}"? Esta acción no se puede deshacer.`)) return;
    setDeletingId(id);
    startTransition(async () => {
      await deleteDeviceAction(id);
      setDeletingId(null);
    });
  };

  const goToPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`/dashboard/devices?${params.toString()}`);
  };

  const getPageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("...");
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (page < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  if (devices.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
        <div className="text-4xl mb-3">📭</div>
        <p className="text-gray-500 font-medium">No se encontraron equipos</p>
        <p className="text-gray-400 text-sm mt-1">Intenta con otros filtros o registra un nuevo equipo</p>
        {canWrite && (
          <Link
            href="/dashboard/devices/new"
            className="inline-flex mt-4 px-4 py-2 bg-accent hover:bg-accent-dark text-white text-sm rounded-lg transition-colors"
          >
            Registrar Equipo
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Equipo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">Ubicación</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden lg:table-cell">S/N</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden lg:table-cell">Sede</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Estado</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden xl:table-cell">Antivirus</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-center">SW Pirata</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {devices.map((device, i) => {
                const status = statusConfig[device.status];
                const branch = device.branch ? device.branch.name : null;
                const isDeleting = deletingId === device.id;
                return (
                  <tr
                    key={device.id}
                    className={`hover:bg-gray-50 transition-colors animate-fade-in ${isDeleting ? "opacity-40" : ""}`}
                    style={{ animationDelay: `${i * 30}ms` }}
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="text-xl shrink-0">{categoryEmoji[device.category] ?? "📦"}</span>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-800 truncate">{device.name}</p>
                          <p className="text-xs text-gray-400 truncate">{device.brand} {device.model}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <p className="text-gray-600">{device.location}</p>
                      <p className="text-xs text-gray-400">{device.department}</p>
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      <code className="text-xs text-gray-400 font-mono">{device.serial_number}</code>
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      {branch ? (
                        <span className={`inline-flex text-xs font-medium px-2.5 py-0.5 rounded-full border ${getBranchStyle(branch)}`}>
                          {branch}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex text-xs font-medium px-2.5 py-0.5 rounded-full border ${status.class}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 hidden xl:table-cell">
                      {device.antivirus ? (
                        <div>
                          <p className="text-xs text-gray-600">{device.antivirus}</p>
                          {device.antivirus_expiry && (
                            <p className={`text-xs mt-0.5 ${
                              new Date(device.antivirus_expiry) < new Date()
                                ? "text-accent"
                                : "text-gray-400"
                            }`}>
                              Vence: {new Date(device.antivirus_expiry).toLocaleDateString("es-CO")}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {device.has_pirated_software ? (
                        <span
                          title="¡Software pirata detectado! FORMATEAR URGENTE"
                          className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-700 border border-red-300 animate-pulse"
                        >
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                          </svg>
                          URGENTE
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/dashboard/devices/${device.id}`}
                          className="text-xs text-gray-400 hover:text-accent transition-colors px-2 py-1 rounded hover:bg-gray-100"
                        >
                          Ver
                        </Link>
                        {canWrite && (
                          <Link
                            href={`/dashboard/devices/${device.id}/edit`}
                            className="text-xs text-gray-400 hover:text-amber-500 transition-colors px-2 py-1 rounded hover:bg-amber-50"
                          >
                            Editar
                          </Link>
                        )}
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(device.id, device.name)}
                            disabled={isPending}
                            className="text-xs text-gray-400 hover:text-accent transition-colors px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-50"
                          >
                            Eliminar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-gray-400 hidden sm:block">
            Mostrando {devices.length} de {total.toLocaleString()} equipos
          </p>
          <div className="flex items-center gap-1 mx-auto sm:mx-0">
            <button
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-xs"
            >
              ←
            </button>

            {getPageNumbers().map((p, idx) =>
              typeof p === "string" ? (
                <span key={`e-${idx}`} className="px-1 text-gray-300 select-none">…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => goToPage(p)}
                  className={`min-w-[32px] h-8 rounded-lg text-xs font-medium transition-all ${
                    p === page
                      ? "bg-accent text-white shadow-sm shadow-accent/30"
                      : "text-gray-500 hover:bg-gray-100 hover:border-gray-200 border border-transparent"
                  }`}
                >
                  {p}
                </button>
              )
            )}

            <button
              onClick={() => goToPage(page + 1)}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-xs"
            >
              →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
