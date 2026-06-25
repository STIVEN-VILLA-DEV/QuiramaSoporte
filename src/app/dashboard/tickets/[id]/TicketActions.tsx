"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { updateTicketStatusAction, assignTicketAction, deleteTicketAction } from "@/actions/tickets";

const statusTransitions: Record<string, { label: string; next: string; color: string; icon: string }> = {
  open: {
    label: "Tomar ticket",
    next: "in_progress",
    color: "bg-blue-600 hover:bg-blue-700",
    icon: "M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zm-7.518-.267A8.25 8.25 0 1120.25 10.5M8.288 14.212A5.25 5.25 0 1117.25 10.5",
  },
  in_progress: {
    label: "Marcar como resuelto",
    next: "resolved",
    color: "bg-green-600 hover:bg-green-700",
    icon: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  resolved: {
    label: "Cerrar ticket",
    next: "closed",
    color: "bg-gray-600 hover:bg-gray-700",
    icon: "M6 18L18 6M6 6l12 12",
  },
};

interface Props {
  ticketId: string;
  currentStatus: string;
  assignedTo: string | null;
  technicians: { id: string; name: string }[];
  isAdmin: boolean;
}

export default function TicketActions({ ticketId, currentStatus, assignedTo, technicians, isAdmin }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  async function handleUpdateStatus(status: string) {
    setLoading(status);
    setError("");
    const result = await updateTicketStatusAction(ticketId, status);
    if (result.success) {
      router.refresh();
    } else {
      setError(result.error ?? "Error al actualizar");
    }
    setLoading(null);
  }

  async function handleAssign(userId: string) {
    setLoading("assign");
    setError("");
    const result = await assignTicketAction(ticketId, userId);
    if (result.success) {
      router.refresh();
    } else {
      setError(result.error ?? "Error al asignar");
    }
    setLoading(null);
  }

  async function handleDelete() {
    setLoading("delete");
    setError("");
    const result = await deleteTicketAction(ticketId);
    if (result.success) {
      router.push("/dashboard/tickets");
    } else {
      setError(result.error ?? "Error al eliminar");
      setShowDeleteConfirm(false);
    }
    setLoading(null);
  }

  const transition = statusTransitions[currentStatus];

  return (
    <div className="card p-6">
      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
        Gestión del Ticket
      </h2>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-wrap gap-3">
        {/* Status transition button */}
        {transition && (
          <button
            onClick={() => handleUpdateStatus(transition.next)}
            disabled={loading !== null}
            className={`inline-flex items-center gap-2 px-4 py-2 text-white text-sm font-medium rounded-lg transition-all ${
              transition.color
            } disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md`}
          >
            {loading === transition.next ? (
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d={transition.icon} />
              </svg>
            )}
            {transition.label}
          </button>
        )}

        {/* Re-open button for closed/resolved */}
        {(currentStatus === "closed" || currentStatus === "resolved") && (
          <button
            onClick={() => handleUpdateStatus("open")}
            disabled={loading !== null}
            className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium rounded-lg transition-all disabled:opacity-50 shadow-sm hover:shadow-md"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672z" />
            </svg>
            Reabrir ticket
          </button>
        )}
      </div>

      {/* Assignment */}
      {technicians.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <label className="block text-xs font-medium text-gray-500 mb-2">
            {assignedTo ? "Reasignar a:" : "Asignar a un técnico:"}
          </label>
          <div className="flex flex-wrap gap-2">
            {technicians.map((tech) => {
              const isAssigned = assignedTo === tech.id;
              return (
                <button
                  key={tech.id}
                  onClick={() => handleAssign(isAssigned ? "" : tech.id)}
                  disabled={loading !== null}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    isAssigned
                      ? "bg-[rgb(var(--accent))] text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  } disabled:opacity-50`}
                >
                  {loading === "assign" && assignedTo !== tech.id ? (
                    <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : isAssigned ? (
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : null}
                  {tech.name}
                  {isAssigned && " ✓"}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Delete — admin only */}
      {isAdmin && (
        <div className="mt-6 pt-4 border-t border-gray-100">
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center gap-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
              Eliminar ticket
            </button>
          ) : (
            <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700 flex-1">
                ¿Eliminar este ticket permanentemente?
              </p>
              <button
                onClick={handleDelete}
                disabled={loading === "delete"}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {loading === "delete" ? "Eliminando..." : "Sí, eliminar"}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={loading !== null}
                className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
