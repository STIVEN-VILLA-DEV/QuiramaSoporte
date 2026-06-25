import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { updateTicketStatusAction, assignTicketAction } from "@/actions/tickets";
import TicketActions from "./TicketActions";

export const metadata = { title: "Detalle del Ticket - IT Manager" };

const statusLabels: Record<string, string> = {
  open: "Abierto",
  in_progress: "En Progreso",
  resolved: "Resuelto",
  closed: "Cerrado",
};

const statusColors: Record<string, string> = {
  open: "bg-yellow-100 text-yellow-800 border-yellow-200",
  in_progress: "bg-blue-100 text-blue-800 border-blue-200",
  resolved: "bg-green-100 text-green-800 border-green-200",
  closed: "bg-gray-100 text-gray-600 border-gray-200",
};

const categoryLabels: Record<string, string> = {
  desktop: "Computador de escritorio",
  laptop: "Laptop / Portátil",
  printer: "Impresora",
  network: "Red / Conectividad",
  peripheral: "Periférico",
  other: "Otro",
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function TicketDetailPage({ params }: Props) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;

  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: {
      assigned_user: { select: { id: true, name: true, email: true } },
    },
  });

  if (!ticket) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <h1 className="text-xl font-bold text-gray-900 mb-2">Ticket no encontrado</h1>
        <p className="text-gray-500 mb-6">El ticket que buscás no existe o fue eliminado.</p>
        <Link
          href="/dashboard/tickets"
          className="text-sm text-[rgb(var(--accent))] hover:underline"
        >
          ← Volver a tickets
        </Link>
      </div>
    );
  }

  const canManage = session.role === "admin" || session.role === "technician";

  // Get available technicians for assignment
  const technicians = canManage
    ? await prisma.user.findMany({
        where: { role: { in: ["admin", "technician"] }, is_active: true },
        select: { id: true, name: true },
      })
    : [];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back link */}
      <Link
        href="/dashboard/tickets"
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Volver a tickets
      </Link>

      {/* Header Card */}
      <div className="card p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="font-mono text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                #{id.slice(0, 8)}
              </span>
              <span
                className={`inline-block px-2.5 py-0.5 text-xs font-medium rounded-full border ${
                  statusColors[ticket.status] ?? ""
                }`}
              >
                {statusLabels[ticket.status] ?? ticket.status}
              </span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">{ticket.subject}</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Empleado</p>
            <p className="font-medium text-gray-800">{ticket.employee_name}</p>
            <p className="text-gray-500">{ticket.employee_email}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Sede / Departamento</p>
            <p className="font-medium text-gray-800">{ticket.branch_name}</p>
            <p className="text-gray-500">{ticket.department}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Categoría</p>
            <p className="text-gray-800">{categoryLabels[ticket.category] ?? ticket.category}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Fecha del reporte</p>
            <p className="text-gray-800">
              {new Date(ticket.created_at).toLocaleDateString("es-CO", {
                day: "2-digit",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
          {ticket.assigned_user && (
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Asignado a</p>
              <p className="font-medium text-gray-800">{ticket.assigned_user.name}</p>
            </div>
          )}
        </div>
      </div>

      {/* Description Card */}
      <div className="card p-6">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Descripción del problema
        </h2>
        <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
          {ticket.description}
        </p>
      </div>

      {/* Management Actions (admin/technician only) */}
      {canManage && (
        <TicketActions
          ticketId={id}
          currentStatus={ticket.status}
          assignedTo={ticket.assigned_to}
          technicians={technicians}
          isAdmin={session.role === "admin"}
        />
      )}
    </div>
  );
}
