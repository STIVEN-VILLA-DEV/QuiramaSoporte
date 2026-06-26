"use client";

import { useState } from "react";
import type { DeviceCategory } from "@/types";

const options: { value: DeviceCategory; label: string }[] = [
  { value: "computer", label: "Computador de escritorio" },
  { value: "laptop", label: "Laptop / Portátil" },
  { value: "printer", label: "Impresora" },
  { value: "camera", label: "Cámara de seguridad" },
  { value: "payment_terminal", label: "Datáfono / Terminal de pago" },
  { value: "server", label: "Servidor" },
  { value: "network", label: "Equipo de red (router, switch, AP)" },
  { value: "phone", label: "Teléfono IP / Celular" },
  { value: "tablet", label: "Tablet" },
  { value: "scanner", label: "Scanner" },
  { value: "ups", label: "UPS / Regulador" },
  { value: "other", label: "Otro dispositivo" },
];

interface Props {
  defaultValue?: DeviceCategory;
  onConfirm: (category: DeviceCategory) => void;
  onCancel: () => void;
}

export default function DeviceCategoryPicker({ defaultValue, onConfirm, onCancel }: Props) {
  const [selected, setSelected] = useState<DeviceCategory>(defaultValue ?? "computer");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="w-full max-w-sm bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
        {/* Title bar */}
        <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200">
          <svg className="w-4 h-4 text-gray-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span className="text-sm font-semibold text-gray-800">Nuevo equipo</span>
        </div>

        {/* Body */}
        <div className="px-4 py-3">
          <p className="text-xs text-gray-500 mb-3">
            Seleccioná el tipo de dispositivo:
          </p>

          <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
            {options.map((opt) => (
              <label
                key={opt.value}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-colors text-sm ${
                  selected === opt.value
                    ? "bg-[rgba(var(--accent),0.08)] text-[rgb(var(--accent))] font-medium"
                    : "hover:bg-gray-50 text-gray-700"
                }`}
              >
                <input
                  type="radio"
                  name="device-category"
                  value={opt.value}
                  checked={selected === opt.value}
                  onChange={() => setSelected(opt.value)}
                  className="accent-[rgb(var(--accent))] shrink-0"
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 bg-gray-50 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onConfirm(selected)}
            className="px-4 py-1.5 text-xs font-medium text-white bg-[rgb(var(--accent))] rounded-md hover:bg-[rgb(var(--accent-dark))] transition-colors"
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
}
