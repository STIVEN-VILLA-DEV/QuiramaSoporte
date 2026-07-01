"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createMaintenanceAction, updateMaintenanceAction } from "@/actions/maintenance";
import type { MaintenanceRecord, ApiResponse } from "@/types";

interface Technician {
  id: string;
  name: string;
  email: string;
}

interface Props {
  record?: MaintenanceRecord;
  isEdit?: boolean;
  devices: { id: string; name: string; category: string }[];
  technicians: Technician[];
  defaultDeviceId?: string;
}

const inputClass = "input w-full";

const Field = ({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) => (
  <div>
    <label className="block text-sm font-medium text-gray-500 mb-1.5">
      {label}{required && <span className="text-accent ml-1">*</span>}
    </label>
    {children}
  </div>
);

export default function MaintenanceForm({ record, isEdit, devices, technicians, defaultDeviceId }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsPending(true);

    const formData = new FormData(e.currentTarget);

    try {
      const action = isEdit && record
        ? updateMaintenanceAction.bind(null, record.id)
        : createMaintenanceAction;

      const result: ApiResponse = await action(null as unknown as ApiResponse, formData);

      if (result.success) {
        router.push("/dashboard/maintenance");
      } else {
        setError(result.error ?? "Error al guardar");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setIsPending(false);
    }
  }

  const r = record;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="animate-slide-in-right p-4 bg-accent/10 border border-accent/20 rounded-xl text-accent text-sm flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      <div className="card p-6 space-y-5">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3 border-b border-gray-100">
          Información del Mantenimiento
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Equipo" required>
            <select
              name="device_id"
              defaultValue={r?.device_id ?? defaultDeviceId ?? ""}
              className={inputClass}
              required
            >
              <option value="">— Seleccionar equipo —</option>
              {devices.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </Field>

          <Field label="Técnico asignado">
            <select name="technician_id" defaultValue={r?.technician_id ?? ""} className={inputClass}>
              <option value="">— Sin asignar —</option>
              {technicians.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </Field>

          <Field label="Tipo" required>
            <select name="type" defaultValue={r?.type ?? "preventive"} className={inputClass} required>
              <option value="preventive">Preventivo</option>
              <option value="corrective">Correctivo</option>
              <option value="upgrade">Actualización / Upgrade</option>
              <option value="inspection">Inspección</option>
            </select>
          </Field>

          <Field label="Prioridad" required>
            <select name="priority" defaultValue={r?.priority ?? "medium"} className={inputClass} required>
              <option value="low">Baja</option>
              <option value="medium">Media</option>
              <option value="high">Alta</option>
              <option value="critical">🚨 Crítica</option>
            </select>
          </Field>

          <Field label="Estado" required>
            <select name="status" defaultValue={r?.status ?? "scheduled"} className={inputClass} required>
              <option value="scheduled">Programado</option>
              <option value="in_progress">En Progreso</option>
              <option value="completed">Completado</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </Field>

          <Field label="Fecha programada">
            <input
              name="scheduled_date"
              type="datetime-local"
              defaultValue={r?.scheduled_date ? new Date(r.scheduled_date).toISOString().slice(0, 16) : ""}
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="Título" required>
          <input
            name="title"
            type="text"
            defaultValue={r?.title ?? ""}
            placeholder="Mantenimiento preventivo trimestral"
            className={inputClass}
            required
          />
        </Field>

        <Field label="Descripción" required>
          <textarea
            name="description"
            rows={3}
            defaultValue={r?.description ?? ""}
            placeholder="Describe el trabajo a realizar o realizado..."
            className={`${inputClass} resize-none`}
            required
          />
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Costo (COP)">
            <input
              name="cost"
              type="number"
              min={0}
              step="0.01"
              defaultValue={r?.cost ?? ""}
              placeholder="0"
              className={inputClass}
            />
          </Field>

          <Field label="Próximo mantenimiento">
            <input
              name="next_maintenance"
              type="date"
              defaultValue={r?.next_maintenance?.toString().split("T")[0] ?? ""}
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="Repuestos / Partes utilizadas">
          <textarea
            name="parts_used"
            rows={2}
            defaultValue={r?.parts_used ?? ""}
            placeholder="Listar repuestos o materiales usados..."
            className={`${inputClass} resize-none`}
          />
        </Field>

        <Field label="Hallazgos / Resultados">
          <textarea
            name="findings"
            rows={2}
            defaultValue={r?.findings ?? ""}
            placeholder="Observaciones y resultados del mantenimiento..."
            className={`${inputClass} resize-none`}
          />
        </Field>
      </div>

      <div className="flex items-center gap-4 justify-end">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2.5 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 hover:border-gray-300 rounded-lg transition-all"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2.5 bg-accent hover:bg-accent-dark disabled:bg-accent-darker text-white text-sm font-medium rounded-lg transition-all flex items-center gap-2 shadow-sm"
        >
          {isPending ? (
            <>
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Guardando...
            </>
          ) : (
            isEdit ? "Actualizar Registro" : "Crear Registro"
          )}
        </button>
      </div>
    </form>
  );
}
