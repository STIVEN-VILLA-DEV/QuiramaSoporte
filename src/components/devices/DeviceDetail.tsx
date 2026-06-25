"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

import type { Device, MaintenanceRecord } from "@/types";

const statusConfig: Record<string, { label: string; class: string }> = {
  active: { label: "Activo", class: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  inactive: { label: "Inactivo", class: "bg-gray-100 text-gray-500 border-gray-200" },
  maintenance: { label: "En Mantenimiento", class: "bg-amber-100 text-amber-700 border-amber-200" },
  retired: { label: "Retirado", class: "bg-gray-100 text-gray-500 border-gray-200" },
  damaged: { label: "Dañado", class: "bg-red-100 text-red-700 border-red-200" },
};

const priorityConfig: Record<string, { label: string; class: string }> = {
  low: { label: "Baja", class: "text-gray-500" },
  medium: { label: "Media", class: "text-amber-700" },
  high: { label: "Alta", class: "text-orange-700" },
  critical: { label: "Crítica", class: "text-accent" },
};

const mStatusConfig: Record<string, { label: string; class: string }> = {
  scheduled: { label: "Programado", class: "bg-red-100 text-red-700" },
  in_progress: { label: "En Progreso", class: "bg-amber-100 text-amber-700" },
  completed: { label: "Completado", class: "bg-emerald-100 text-emerald-700" },
  cancelled: { label: "Cancelado", class: "bg-gray-100 text-gray-500" },
};

const categoryLabels: Record<string, string> = {
  computer: "🖥️ Computador", laptop: "💻 Laptop", printer: "🖨️ Impresora",
  camera: "📷 Cámara", payment_terminal: "💳 Datáfono", server: "🗄️ Servidor",
  network: "🔌 Red", phone: "📱 Teléfono", tablet: "📱 Tablet",
  scanner: "📠 Scanner", ups: "🔋 UPS", other: "📦 Otro",
};

interface Props {
  device: Device;
  maintenanceRecords: MaintenanceRecord[];
  canWrite: boolean;
}

const Row = ({ label, value }: { label: string; value?: string | number | null }) => (
  <div className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0">
    <span className="text-xs text-gray-500 w-36 shrink-0 pt-0.5">{label}</span>
    <span className="text-sm text-gray-800 break-all">{value ?? <span className="text-gray-400">—</span>}</span>
  </div>
);

export default function DeviceDetail({ device, maintenanceRecords, canWrite }: Props) {
  const status = statusConfig[device.status];
  const [showCredentials, setShowCredentials] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  return (
    <div className="space-y-6">
      {/* Alerta de software pirata */}
      {device.has_pirated_software && (
        <motion.div
          initial={{ opacity: 0, y: -12, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="p-6 bg-red-50 border-2 border-red-400 rounded-xl shadow-lg shadow-red-200/50"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-black text-red-700 tracking-wide uppercase">⚠️ FORMATEAR URGENTE</p>
              <p className="text-sm text-red-600 mt-1">
                Este equipo tiene software no licenciado / pirata. Debe ser formateado cuanto antes.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Status + Category Banner */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-5 flex flex-wrap items-center gap-4"
      >
        <div className="flex-1 flex flex-wrap items-center gap-3">
          <span className={`text-xs font-medium px-3 py-1.5 rounded-full border ${status.class}`}>
            {status.label}
          </span>
          <span className="text-sm text-gray-500">{categoryLabels[device.category] ?? device.category}</span>
          {device.branch?.name && (
            <span className="text-xs font-medium px-3 py-1.5 rounded-full border bg-blue-50 text-blue-700 border-blue-200">
              {device.branch.name}
            </span>
          )}
          {device.department && <span className="text-sm text-gray-500">· {device.department}</span>}
          {device.location && <span className="text-sm text-gray-500">· {device.location}</span>}
        </div>
        {canWrite && (
          <Link
            href={`/dashboard/maintenance?device_id=${device.id}`}
            className="text-xs px-3 py-1.5 bg-amber-100 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-200 transition-colors"
          >
            + Registrar Mantenimiento
          </Link>
        )}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Identification */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="card p-5"
        >
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Identificación</h3>
          <Row label="Marca / Modelo" value={`${device.brand} ${device.model}`} />
          <Row label="Número de serie" value={device.serial_number} />
          <Row label="Código de activo" value={device.asset_tag} />
          <Row label="Asignado a" value={device.assigned_to} />
          <Row label="Fecha de compra" value={device.purchase_date ? new Date(device.purchase_date).toLocaleDateString("es-CO") : undefined} />
          <Row label="Garantía hasta" value={device.warranty_expiry ? new Date(device.warranty_expiry).toLocaleDateString("es-CO") : undefined} />
        </motion.div>

        {/* Network */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-5"
        >
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Red y Sistema</h3>
          <Row label="Dirección IP" value={device.ip_address} />
          <Row label="Dirección MAC" value={device.mac_address} />
          <Row label="Sistema Operativo" value={device.os} />
          <Row label="Versión SO" value={device.os_version} />
          <Row label="Procesador" value={device.processor} />
          <Row label="RAM" value={device.ram_gb ? `${device.ram_gb} GB` : undefined} />
          <Row label="Almacenamiento" value={device.storage_gb ? `${device.storage_gb} GB` : undefined} />
        </motion.div>

        {/* Licencias */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.13 }}
          className="card p-5"
        >
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Licencias de Software</h3>
          <Row label="Licencia Windows" value={device.windows_license_type ? { kms: "KMS (Volumen)", original: "Original / OEM", none: "Sin licencia" }[device.windows_license_type] ?? device.windows_license_type : undefined} />
          <Row label="Versión Windows" value={device.windows_version} />
          <Row label="Licencia Office" value={device.office_license_type ? { kms: "KMS (Volumen)", original: "Original", none: "Sin licencia" }[device.office_license_type] ?? device.office_license_type : undefined} />
          <Row label="Versión Office" value={device.office_version} />
        </motion.div>

        {/* Antivirus */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="card p-5"
        >
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Antivirus y Seguridad</h3>
          <Row label="Antivirus" value={device.antivirus} />
          <Row label="Última actualización" value={device.antivirus_updated ? new Date(device.antivirus_updated).toLocaleDateString("es-CO") : undefined} />
          <Row
            label="Vence licencia"
            value={device.antivirus_expiry ? new Date(device.antivirus_expiry).toLocaleDateString("es-CO") : undefined}
          />
          <Row label="Último mantenimiento" value={device.last_maintenance ? new Date(device.last_maintenance).toLocaleDateString("es-CO") : undefined} />
          <Row label="Próximo mantenimiento" value={device.next_maintenance ? new Date(device.next_maintenance).toLocaleDateString("es-CO") : undefined} />
        </motion.div>

        {/* Problemas y Seguridad */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-5"
        >
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Problemas y Seguridad</h3>

          <Row label="Problemas HW" value={device.hardware_problems} />
          <Row label="Problemas SW" value={device.software_problems} />
          <Row label="Piezas cambiadas" value={device.changed_parts} />

          {/* Credentials — custom row with show/hide toggle */}
          <div className="flex items-start gap-3 py-2 border-b border-gray-100">
            <span className="text-xs text-gray-500 w-36 shrink-0 pt-0.5">Credenciales</span>
            <span className="text-sm text-gray-800 break-all">
              {device.credentials ? (
                <span className="flex items-center gap-2">
                  <code className="text-xs bg-gray-50 px-2 py-1 rounded border border-gray-200 font-mono select-all">
                    {showCredentials ? device.credentials : "••••••••••••••••"}
                  </code>
                  <button
                    type="button"
                    onClick={() => setShowCredentials((prev) => !prev)}
                    className="text-[rgb(var(--accent))] hover:text-[rgb(var(--accent-dark))] text-xs font-medium transition-colors shrink-0"
                  >
                    {showCredentials ? "Ocultar" : "Mostrar"}
                  </button>
                </span>
              ) : (
                <span className="text-gray-400">—</span>
              )}
            </span>
          </div>

          {/* Malware detected badge */}
          <div className="flex items-start gap-3 py-2 border-b border-gray-100">
            <span className="text-xs text-gray-500 w-36 shrink-0 pt-0.5">Malware detectado</span>
            <span className="text-sm">
              {device.malware_detected ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                  Sí
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75" />
                  </svg>
                  No
                </span>
              )}
            </span>
          </div>

          <Row
            label="Últ. escaneo AV"
            value={device.last_antivirus_scan ? new Date(device.last_antivirus_scan).toLocaleDateString("es-CO") : undefined}
          />
        </motion.div>

        {/* Notes */}
        {device.notes && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="card p-5"
          >
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Notas</h3>
            <p className="text-sm text-gray-500 leading-relaxed whitespace-pre-wrap">{device.notes}</p>
          </motion.div>
        )}
      </div>

      {/* Maintenance History */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="card"
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Historial de Mantenimiento</h3>
          <span className="text-xs text-gray-500">{maintenanceRecords.length} registro{maintenanceRecords.length !== 1 ? "s" : ""}</span>
        </div>

        {maintenanceRecords.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            Sin registros de mantenimiento
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {maintenanceRecords.map((r) => {
              const p = priorityConfig[r.priority];
              const s = mStatusConfig[r.status];
              return (
                <div key={r.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-gray-800">{r.title}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.class}`}>{s.label}</span>
                      <span className={`text-xs font-medium ${p.class}`}>{p.label}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {r.type === "preventive" ? "Preventivo" : r.type === "corrective" ? "Correctivo" : r.type === "upgrade" ? "Actualización" : "Inspección"}
                      {r.technician_name && ` · ${r.technician_name}`}
                      {r.scheduled_date && ` · ${new Date(r.scheduled_date).toLocaleDateString("es-CO")}`}
                    </p>
                    {r.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{r.description}</p>}
                  </div>
                  {r.cost != null && (
                    <div className="text-sm font-medium text-emerald-700 shrink-0">
                      ${Number(r.cost).toLocaleString("es-CO")}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
