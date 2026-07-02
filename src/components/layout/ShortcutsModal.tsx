"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";

const shortcuts = [
  { key: "N", desc: "Nuevo equipo" },
  { key: "T", desc: "Ir a Tickets" },
  { key: "M", desc: "Ir a Mantenimiento" },
  { key: "D", desc: "Ir al Dashboard" },
  { key: "/", desc: "Buscar equipos" },
  { key: "?", desc: "Mostrar atajos" },
  { key: "Esc", desc: "Cerrar modales" },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ShortcutsModal({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-white/10 bg-[#0f0f13] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-1 text-lg font-semibold text-white">
          Atajos de teclado
        </h2>
        <p className="mb-4 text-sm text-gray-400">
          Presioná una tecla para navegar rápido
        </p>

        <div className="space-y-1.5">
          {shortcuts.map((s) => (
            <div
              key={s.key}
              className="flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-white/5"
            >
              <span className="text-gray-300">{s.desc}</span>
              <kbd
                className={cn(
                  "rounded-md border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-xs",
                  s.key === "?"
                    ? "text-cyan-400"
                    : "text-gray-200",
                )}
              >
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <p className="mt-4 text-xs text-gray-500">
          Los atajos no funcionan cuando estás escribiendo en un campo de texto.
        </p>
      </div>
    </div>
  );
}
