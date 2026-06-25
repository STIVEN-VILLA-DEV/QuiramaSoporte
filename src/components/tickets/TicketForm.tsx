"use client";

import { useActionState, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { submitPublicTicketAction } from "@/actions/tickets";

const initialState: { success: boolean; message?: string; error?: string; ticketId?: string } = { success: false };

// ─── Categories for the public form ──────────────────────────────

const categories = [
  { value: "desktop", label: "🖥️ Computador de escritorio" },
  { value: "laptop", label: "💻 Laptop / Portátil" },
  { value: "printer", label: "🖨️ Impresora" },
  { value: "network", label: "🔌 Red / Conectividad" },
  { value: "peripheral", label: "⌨️ Periférico (mouse, teclado, monitor)" },
  { value: "other", label: "📦 Otro" },
];

// ─── Section component ──────────────────────────────────────────

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

// ─── Field component ────────────────────────────────────────────

const Field = ({ label, children, required, error }: { label: string; children: React.ReactNode; required?: boolean; error?: string }) => (
  <div>
    <label className="block text-sm font-medium text-gray-500 mb-1.5">
      {label} {required && <span className="text-[rgb(var(--accent))]">*</span>}
    </label>
    {children}
    {error && (
      <p className="mt-1 text-xs text-[rgb(var(--accent))] flex items-center gap-1">
        <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
        {error}
      </p>
    )}
  </div>
);

const inputClass = "input w-full";

// ─── Icon components ────────────────────────────────────────────

const IconUser = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
);

const IconCategory = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
  </svg>
);

const IconDescription = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
  </svg>
);

// ─── Error icon ─────────────────────────────────────────────────

const ErrorIcon = () => (
  <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
  </svg>
);

// ─── Main component ────────────────────────────────────────────

export default function TicketForm() {
  const router = useRouter();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [state, formAction, isPending] = useActionState(submitPublicTicketAction, initialState);

  // ── Handle success redirect ──────────────────────────────────
  // We use a simple effect approach via state change detection
  const [prevSuccess, setPrevSuccess] = useState(false);

  if (state.success && !prevSuccess) {
    setPrevSuccess(true);
    // Use setTimeout to avoid React state update during render
    setTimeout(() => {
      const params = new URLSearchParams();
      if (state.ticketId) params.set("id", state.ticketId);
      router.push(`/reportar/success${params.toString() ? `?${params.toString()}` : ""}`);
    }, 0);
  }

  // ── Client-side validation ──────────────────────────────────

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const form = e.currentTarget;
    const requiredInputs = form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("[required]");
    let firstError = "";
    const errors: Record<string, string> = {};

    for (const input of requiredInputs) {
      if (!input.value.trim()) {
        const label = input.closest("div")?.querySelector("label")?.textContent?.replace(" *", "") ?? input.name;
        errors[input.name] = `El campo "${label}" es obligatorio`;
        if (!firstError) {
          firstError = errors[input.name];
          input.focus();
        }
      }
    }

    // Description minimum length
    const description = form.querySelector<HTMLTextAreaElement>("[name='description']");
    if (description && description.value.trim().length > 0 && description.value.trim().length < 10) {
      errors.description = "La descripción debe tener al menos 10 caracteres";
      if (!firstError) {
        firstError = errors.description;
        description.focus();
      }
    }

    if (firstError) {
      e.preventDefault();
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
  };

  return (
    <form action={formAction} onSubmit={handleSubmit} className="space-y-6">
      {/* ── Error banner ──────────────────────────── */}
      {state.error && (
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          className="p-4 bg-[rgba(var(--accent),0.10)] border border-[rgba(var(--accent),0.20)] rounded-xl text-[rgb(var(--accent))] text-sm flex items-center gap-2"
        >
          <ErrorIcon />
          {state.error}
        </motion.div>
      )}

      {/* ── Honeypot ──────────────────────────────── */}
      <div aria-hidden="true" className="absolute left-[-9999px] top-[-9999px] opacity-0 pointer-events-none" tabIndex={-1}>
        <label htmlFor="_gotcha">No llenar</label>
        <input id="_gotcha" name="_gotcha" type="text" autoComplete="off" tabIndex={-1} />
      </div>

      {/* ── Employee info ─────────────────────────── */}
      <Section title="Tus datos" icon={<IconUser />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Nombre completo" required error={fieldErrors.employee_name}>
            <input
              name="employee_name"
              type="text"
              placeholder="Tu nombre completo"
              className={inputClass}
              required
            />
          </Field>
          <Field label="Correo electrónico" required error={fieldErrors.employee_email}>
            <input
              name="employee_email"
              type="email"
              placeholder="tucorreo@empresa.com"
              className={inputClass}
              required
            />
          </Field>
          <Field label="Sede" required error={fieldErrors.branch_name}>
            <input
              name="branch_name"
              type="text"
              placeholder="Ej: CEDROS, CRISTALES, QUIRAMA"
              className={inputClass}
              required
            />
          </Field>
          <Field label="Departamento" required error={fieldErrors.department}>
            <input
              name="department"
              type="text"
              placeholder="Ej: Contabilidad, TI, Ventas"
              className={inputClass}
              required
            />
          </Field>
        </div>
      </Section>

      {/* ── Ticket details ────────────────────────── */}
      <Section title="Detalle del reporte" icon={<IconCategory />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Categoría" required error={fieldErrors.category}>
            <select name="category" className={inputClass} required defaultValue="">
              <option value="" disabled>— Seleccioná una categoría —</option>
              {categories.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Asunto" required error={fieldErrors.subject}>
            <input
              name="subject"
              type="text"
              placeholder="Ej: No enciende el computador"
              className={inputClass}
              required
            />
          </Field>
        </div>
        <Field label="Descripción del problema" required error={fieldErrors.description}>
          <textarea
            name="description"
            rows={5}
            placeholder="Describí el problema con el mayor detalle posible. Incluí qué estaba haciendo cuando ocurrió, desde cuándo sucede, y cualquier detalle que ayude a diagnosticar..."
            className={`${inputClass} resize-none`}
            required
          />
          <p className="mt-1.5 text-xs text-gray-400 flex items-center gap-1">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            Mínimo 10 caracteres. Sé lo más específico posible para agilizar la solución.
          </p>
        </Field>
      </Section>

      {/* ── Actions ───────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex items-center gap-4 justify-end pt-2"
      >
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
              Enviando reporte...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Enviar reporte
            </>
          )}
        </button>
      </motion.div>
    </form>
  );
}
