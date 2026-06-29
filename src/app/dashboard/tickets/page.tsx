import { Suspense } from "react";
import Link from "next/link";
import { getTicketsAction } from "@/actions/tickets";

export const metadata = { title: "Tickets de Soporte - IT Manager" };

const statusLabels: Record<string, string> = {
  open: "Abierto",
  in_progress: "En Progreso",
  resolved: "Resuelto",
  closed: "Cerrado",
};

const statusColors: Record<string, string> = {
  open: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-blue-100 text-blue-800",
  resolved: "bg-green-100 text-green-800",
  closed: "bg-gray-100 text-gray-600",
};

interface Props {
  searchParams: Promise<{ status?: string; page?: string }>;
}

export default async function TicketsPage({ searchParams }: Props) {
  const { status, page } = await searchParams;
  const result = await getTicketsAction({
    status: status || "all",
    page: Number(page) || 1,
    perPage: 20,
  });

  const tickets = result.success ? result.data : [];
  const pageNum = Number(page) || 1;
  const perPage = 20;
  const totalPages = Math.ceil(result.total / perPage);
  const currentStatus = status || "all";

  const statusHref = (s: string) => {
    const params = new URLSearchParams();
    if (s !== "all") params.set("status", s);
    if (pageNum > 1) params.set("page", "1");
    const qs = params.toString();
    return `/dashboard/tickets${qs ? `?${qs}` : ""}`;
  };

  const pageHref = (p: number) => {
    const params = new URLSearchParams();
    if (currentStatus !== "all") params.set("status", currentStatus);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return `/dashboard/tickets${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tickets de Soporte</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Gestioná los reportes enviados por empleados
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            {result.total} ticket{result.total !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Status Filters */}
      <div className="flex flex-wrap gap-2">
        {["all", "open", "in_progress", "resolved", "closed"].map((s) => {
          const active = currentStatus === s;
          return (
            <Link
              key={s}
              href={statusHref(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                active
                  ? "bg-[rgb(var(--accent))] text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {s === "all" ? "Todos" : statusLabels[s] ?? s}
            </Link>
          );
        })}
      </div>

      {/* Tickets Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Radicado</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Empleado</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Asunto</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Sede</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Bloquea</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Estado</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Fecha</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Asignado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {tickets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                    No hay tickets{currentStatus !== "all" ? ` con estado "${statusLabels[currentStatus]}"` : ""}
                  </td>
                </tr>
              ) : (
                tickets.map((ticket: Record<string, unknown>) => (
                  <tr
                    key={ticket.id as string}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/tickets/${ticket.id}`}
                        className="font-mono text-xs text-[rgb(var(--accent))] hover:underline"
                      >
                        #{(ticket.id as string).slice(0, 8)}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-800 text-sm">
                          {ticket.employee_name as string}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700 max-w-[200px] truncate">
                      {ticket.subject as string}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {ticket.branch_name as string}
                    </td>
                    <td className="px-4 py-3">
                      {ticket.is_blocking ? (
                        <span className="inline-flex text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
                          ⛔ Sí
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">No</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
                          statusColors[ticket.status as string] ?? "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {statusLabels[ticket.status as string] ?? (ticket.status as string)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {new Date(ticket.created_at as string).toLocaleDateString("es-CO", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {(ticket.assigned_user as Record<string, string>)?.name ?? "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-gray-400 hidden sm:block">
            Mostrando {tickets.length} de {result.total.toLocaleString()} tickets
          </p>
          <div className="flex items-center gap-1 mx-auto sm:mx-0">
            <Link
              href={pageHref(pageNum - 1)}
              className={`px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-all text-xs ${
                pageNum <= 1 ? "pointer-events-none opacity-30" : ""
              }`}
            >
              ←
            </Link>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let p: number;
              if (totalPages <= 7) {
                p = i + 1;
              } else if (pageNum <= 4) {
                p = i + 1;
              } else if (pageNum >= totalPages - 3) {
                p = totalPages - 6 + i;
              } else {
                p = pageNum - 3 + i;
              }
              return (
                <Link
                  key={p}
                  href={pageHref(p)}
                  className={`min-w-[32px] h-8 rounded-lg text-xs font-medium flex items-center justify-center transition-all ${
                    p === pageNum
                      ? "bg-[rgb(var(--accent))] text-white shadow-sm"
                      : "text-gray-500 hover:bg-gray-100 border border-transparent"
                  }`}
                >
                  {p}
                </Link>
              );
            })}
            <Link
              href={pageHref(pageNum + 1)}
              className={`px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-all text-xs ${
                pageNum >= totalPages ? "pointer-events-none opacity-30" : ""
              }`}
            >
              →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
