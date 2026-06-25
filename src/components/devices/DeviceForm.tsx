"use client";

import { useActionState, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { createDeviceAction, updateDeviceAction } from "@/actions/devices";
import { getBranchesAction } from "@/actions/branches";
import type { Device, ApiResponse, Branch } from "@/types";

const initialState: ApiResponse = { success: false };

interface Props {
  device?: Device;
  isEdit?: boolean;
}

const categories = [
  { value: "computer", label: "🖥️ Computador de escritorio" },
  { value: "laptop", label: "💻 Laptop / Portátil" },
  { value: "printer", label: "🖨️ Impresora" },
  { value: "camera", label: "📷 Cámara de seguridad" },
  { value: "payment_terminal", label: "💳 Datáfono / Terminal de pago" },
  { value: "server", label: "🗄️ Servidor" },
  { value: "network", label: "🔌 Equipo de red (router, switch, AP)" },
  { value: "phone", label: "📱 Teléfono IP / Celular" },
  { value: "tablet", label: "📱 Tablet" },
  { value: "scanner", label: "📠 Scanner" },
  { value: "ups", label: "🔋 UPS / Regulador" },
  { value: "other", label: "📦 Otro dispositivo" },
];

const statuses = [
  { value: "active", label: "✅ Activo" },
  { value: "inactive", label: "⚪ Inactivo" },
  { value: "maintenance", label: "🔧 En mantenimiento" },
  { value: "retired", label: "📦 Retirado / Dado de baja" },
  { value: "damaged", label: "❌ Dañado" },
];

// ─── Section header icons ───────────────────────────────────────

const IconId = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
  </svg>
);

const IconBranch = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
  </svg>
);

const IconStatus = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5c0-2.485 2.495-4.5 5.5-4.5s5.5 2.015 5.5 4.5c0 1.743-1.24 3.255-3.05 3.95a.75.75 0 00-.45.8v.948A2.262 2.262 0 0012 18a2.25 2.25 0 01-2.25 2.25" />
  </svg>
);

const IconNetwork = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" />
  </svg>
);

const IconHardware = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a3 3 0 00-3 3" />
  </svg>
);

const IconShield = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
  </svg>
);

const IconWrench = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-7.59 7.59a2.25 2.25 0 01-3.18-3.18l7.59-7.59a6.75 6.75 0 013.18 3.18z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 3.75a6 6 0 015.4 8.84l-3.13 3.13a1.5 1.5 0 01-2.12 0l-4.02-4.02a1.5 1.5 0 010-2.12l3.13-3.13A6 6 0 0116.5 3.75z" />
  </svg>
);

const IconNotes = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
);

// ─── Shared sub-components ──────────────────────────────────────

const Section = ({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    className="card p-6 hover:border-gray-300 transition-all duration-200"
  >
    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3 mb-5 border-b border-gray-100 flex items-center gap-2">
      {icon && <span className="text-[rgb(var(--accent))]">{icon}</span>}
      {title}
    </h3>
    <div className="space-y-4">{children}</div>
  </motion.div>
);

const Field = ({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) => (
  <div>
    <label className="block text-sm font-medium text-gray-500 mb-1.5">
      {label} {required && <span className="text-[rgb(var(--accent))]">*</span>}
    </label>
    {children}
  </div>
);

const inputClass = "input w-full";

// ─── Toggle switch for malware_detected ─────────────────────────

const ToggleSwitch = ({ name, defaultChecked = false }: { name: string; defaultChecked?: boolean }) => (
  <label className="relative inline-flex items-center cursor-pointer">
    <input
      type="checkbox"
      name={name}
      defaultChecked={defaultChecked}
      className="sr-only peer"
    />
    <div className="w-10 h-5 bg-gray-300 peer-checked:bg-[rgb(var(--accent))] rounded-full transition-colors duration-200 after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all after:duration-200 peer-checked:after:translate-x-5" />
  </label>
);

// ─── Main component ────────────────────────────────────────────

export default function DeviceForm({ device, isEdit }: Props) {
  const router = useRouter();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [validationError, setValidationError] = useState("");

  const action = isEdit && device
    ? updateDeviceAction.bind(null, device.id)
    : createDeviceAction;

  const [state, formAction, isPending] = useActionState(action, initialState);

  useEffect(() => {
    getBranchesAction().then(setBranches).catch(() => {});
  }, []);

  useEffect(() => {
    if (state.success) {
      router.push("/dashboard/devices");
    }
  }, [state.success, router]);

  const d = device;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    // Client-side validation — check all required fields
    const form = e.currentTarget;
    const requiredInputs = form.querySelectorAll<HTMLInputElement | HTMLSelectElement>("[required]");
    let firstError = "";

    for (const input of requiredInputs) {
      if (!input.value.trim()) {
        const label = input.closest("div")?.querySelector("label")?.textContent?.replace(" *", "") ?? input.name;
        firstError = `El campo "${label}" es obligatorio`;
        input.focus();
        break;
      }
    }

    if (firstError) {
      e.preventDefault();
      setValidationError(firstError);
      return;
    }

    setValidationError("");
  };

  return (
    <form action={formAction} onSubmit={handleSubmit} className="space-y-6">
      {(state.error || validationError) && (
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          className="p-4 bg-[rgba(var(--accent),0.10)] border border-[rgba(var(--accent),0.20)] rounded-xl text-[rgb(var(--accent))] text-sm flex items-center gap-2"
        >
          <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
          </svg>
          {validationError || state.error}
        </motion.div>
      )}

      {/* ── Identification ─────────────────────── */}
      <Section title="Identificación del Equipo" icon={<IconId />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Nombre del equipo" required>
            <input name="name" type="text" defaultValue={d?.name} placeholder="PC-CONTABILIDAD-01" className={inputClass} required />
          </Field>
          <Field label="Categoría" required>
            <select name="category" defaultValue={d?.category ?? "computer"} className={inputClass} required>
              {categories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </Field>
          <Field label="Marca" required>
            <input name="brand" type="text" defaultValue={d?.brand} placeholder="Dell, HP, Epson..." className={inputClass} required />
          </Field>
          <Field label="Modelo" required>
            <input name="model" type="text" defaultValue={d?.model} placeholder="Latitude 5520" className={inputClass} required />
          </Field>
          <Field label="Número de serie" required>
            <input name="serial_number" type="text" defaultValue={d?.serial_number} placeholder="SN123456789" className={inputClass} required />
          </Field>
          <Field label="Código de activo (asset tag)">
            <input name="asset_tag" type="text" defaultValue={d?.asset_tag ?? ""} placeholder="ACT-001" className={inputClass} />
          </Field>
        </div>
      </Section>

      {/* ── Sede / Branch ───────────────────────── */}
      <Section title="Sede" icon={<IconBranch />}>
        <Field label="Sede">
          <select name="branch_id" defaultValue={d?.branch_id ?? ""} className={inputClass}>
            <option value="">— Sin sede —</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </Field>
      </Section>

      {/* ── Location & Status ──────────────────── */}
      <Section title="Ubicación y Estado" icon={<IconStatus />}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Field label="Estado" required>
            <select name="status" defaultValue={d?.status ?? "active"} className={inputClass} required>
              {statuses.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </Field>
          <Field label="Ubicación física" required>
            <input name="location" type="text" defaultValue={d?.location} placeholder="Oficina 3B, Piso 2" className={inputClass} required />
          </Field>
          <Field label="Departamento" required>
            <input name="department" type="text" defaultValue={d?.department} placeholder="Contabilidad" className={inputClass} required />
          </Field>
          <Field label="Asignado a">
            <input name="assigned_to" type="text" defaultValue={d?.assigned_to ?? ""} placeholder="Nombre del usuario" className={inputClass} />
          </Field>
          <Field label="Fecha de compra">
            <input name="purchase_date" type="date" defaultValue={d?.purchase_date?.toString().split("T")[0] ?? ""} className={inputClass} />
          </Field>
          <Field label="Vencimiento garantía">
            <input name="warranty_expiry" type="date" defaultValue={d?.warranty_expiry?.toString().split("T")[0] ?? ""} className={inputClass} />
          </Field>
        </div>
      </Section>

      {/* ── Network ─────────────────────────────── */}
      <Section title="Red y Conectividad" icon={<IconNetwork />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Dirección IP">
            <input name="ip_address" type="text" defaultValue={d?.ip_address ?? ""} placeholder="192.168.1.100" className={inputClass} />
          </Field>
          <Field label="Dirección MAC">
            <input name="mac_address" type="text" defaultValue={d?.mac_address ?? ""} placeholder="AA:BB:CC:DD:EE:FF" className={inputClass} />
          </Field>
          <Field label="Sistema Operativo">
            <input name="os" type="text" defaultValue={d?.os ?? ""} placeholder="Windows 11 Pro" className={inputClass} />
          </Field>
          <Field label="Versión del SO">
            <input name="os_version" type="text" defaultValue={d?.os_version ?? ""} placeholder="22H2" className={inputClass} />
          </Field>
        </div>
      </Section>

      {/* ── Hardware ────────────────────────────── */}
      <Section title="Especificaciones de Hardware" icon={<IconHardware />}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Procesador">
            <input name="processor" type="text" defaultValue={d?.processor ?? ""} placeholder="Intel Core i5-12400" className={inputClass} />
          </Field>
          <Field label="RAM (GB)">
            <input name="ram_gb" type="number" min={0} defaultValue={d?.ram_gb ?? ""} placeholder="16" className={inputClass} />
          </Field>
          <Field label="Almacenamiento (GB)">
            <input name="storage_gb" type="number" min={0} defaultValue={d?.storage_gb ?? ""} placeholder="512" className={inputClass} />
          </Field>
        </div>
      </Section>

      {/* ── Antivirus ───────────────────────────── */}
      <Section title="Antivirus y Seguridad" icon={<IconShield />}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Antivirus">
            <input name="antivirus" type="text" defaultValue={d?.antivirus ?? ""} placeholder="Kaspersky, Bitdefender..." className={inputClass} />
          </Field>
          <Field label="Última actualización">
            <input name="antivirus_updated" type="date" defaultValue={d?.antivirus_updated?.toString().split("T")[0] ?? ""} className={inputClass} />
          </Field>
          <Field label="Vencimiento licencia">
            <input name="antivirus_expiry" type="date" defaultValue={d?.antivirus_expiry?.toString().split("T")[0] ?? ""} className={inputClass} />
          </Field>
        </div>
      </Section>

      {/* ── Licencias de Software ──────────────── */}
      <Section title="Licencias de Software" icon={<IconShield />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Licencia de Windows">
            <select name="windows_license_type" defaultValue={d?.windows_license_type ?? ""} className={inputClass}>
              <option value="">— Sin especificar —</option>
              <option value="kms">KMS (Volumen)</option>
              <option value="original">Original / OEM</option>
              <option value="none">Sin licencia</option>
            </select>
          </Field>
          <Field label="Versión de Windows">
            <input name="windows_version" type="text" defaultValue={d?.windows_version ?? ""} placeholder="Windows 11 Pro, 10 Home..." className={inputClass} />
          </Field>
          <Field label="Licencia de Microsoft Office">
            <select name="office_license_type" defaultValue={d?.office_license_type ?? ""} className={inputClass}>
              <option value="">— Sin especificar —</option>
              <option value="kms">KMS (Volumen)</option>
              <option value="original">Original</option>
              <option value="none">Sin licencia</option>
            </select>
          </Field>
          <Field label="Versión de Office">
            <input name="office_version" type="text" defaultValue={d?.office_version ?? ""} placeholder="Office 2021, 365, 2019..." className={inputClass} />
          </Field>
        </div>
      </Section>

      {/* ── Apps Piratas ────────────────────────── */}
      <Section title="Software No Autorizado" icon={<IconShield />}>
        <Field label="¿Tiene aplicaciones piratas / no licenciadas?">
          <select name="has_pirated_software" defaultValue={d?.has_pirated_software ? "1" : "0"} className={inputClass}>
            <option value="0">No</option>
            <option value="1">Sí</option>
          </select>
          <p className="mt-1.5 text-xs text-gray-400 flex items-center gap-1">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            Si marca "Sí", el equipo mostrará una alerta de FORMATEO URGENTE
          </p>
        </Field>
      </Section>

      {/* ── Problemas y Credenciales ────────────── */}
      <Section title="Problemas y Credenciales" icon={<IconWrench />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Problemas de hardware">
            <textarea
              name="hardware_problems"
              rows={3}
              defaultValue={d?.hardware_problems ?? ""}
              placeholder="Describe problemas físicos del equipo..."
              className={`${inputClass} resize-none`}
            />
          </Field>
          <Field label="Problemas de software">
            <textarea
              name="software_problems"
              rows={3}
              defaultValue={d?.software_problems ?? ""}
              placeholder="Describe problemas de software..."
              className={`${inputClass} resize-none`}
            />
          </Field>
          <Field label="Partes / piezas cambiadas">
            <textarea
              name="changed_parts"
              rows={3}
              defaultValue={d?.changed_parts ?? ""}
              placeholder="Ej: Se cambió teclado, pantalla, disco duro..."
              className={`${inputClass} resize-none`}
            />
          </Field>
          <Field label="Credenciales del equipo">
            <textarea
              name="credentials"
              rows={3}
              defaultValue={d?.credentials ?? ""}
              placeholder="Usuario / contraseña local del equipo..."
              className={`${inputClass} resize-none`}
            />
            <p className="mt-1.5 text-xs text-amber-600 flex items-center gap-1">
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              ⚠️ Almacenar solo credenciales de equipos, no personales
            </p>
          </Field>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <Field label="Malware detectado">
            <div className="flex items-center gap-3">
              <ToggleSwitch name="malware_detected" defaultChecked={d?.malware_detected ?? false} />
              <span className="text-sm text-gray-500">
                {d?.malware_detected ? "Sí, se detectó malware" : "No se ha detectado"}
              </span>
            </div>
          </Field>
          <Field label="Último escaneo antivirus">
            <input
              name="last_antivirus_scan"
              type="date"
              defaultValue={d?.last_antivirus_scan?.toString().split("T")[0] ?? ""}
              className={inputClass}
            />
          </Field>
        </div>
      </Section>

      {/* ── Notes ──────────────────────────────── */}
      <Section title="Notas y Observaciones" icon={<IconNotes />}>
        <textarea
          name="notes"
          rows={3}
          defaultValue={d?.notes ?? ""}
          placeholder="Observaciones adicionales sobre el equipo..."
          className={`${inputClass} resize-none`}
        />
      </Section>

      {/* ── Actions ─────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex items-center gap-4 justify-end pt-2"
      >
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2.5 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 hover:border-gray-300 rounded-lg transition-all duration-200"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2.5 bg-[rgb(var(--accent))] hover:bg-[rgb(var(--accent-dark))] disabled:bg-[rgb(var(--accent-darker))] text-white text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md"
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
            isEdit ? "Actualizar Equipo" : "Registrar Equipo"
          )}
        </button>
      </motion.div>
    </form>
  );
}
