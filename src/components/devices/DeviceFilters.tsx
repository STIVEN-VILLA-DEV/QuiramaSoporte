"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useEffect } from "react";
import { getBranchesAction } from "@/actions/branches";
import type { Branch } from "@/types";

interface Props {
  currentCategory?: string;
  currentStatus?: string;
  currentBranch?: string;
  currentSearch?: string;
}

const categories = [
  { value: "", label: "Todas las categorías" },
  { value: "computer", label: "🖥️ Computadores" },
  { value: "laptop", label: "💻 Laptops" },
  { value: "printer", label: "🖨️ Impresoras" },
  { value: "camera", label: "📷 Cámaras" },
  { value: "payment_terminal", label: "💳 Datafonos" },
  { value: "server", label: "🗄️ Servidores" },
  { value: "network", label: "🔌 Red" },
  { value: "phone", label: "📱 Teléfonos" },
  { value: "tablet", label: "📱 Tablets" },
  { value: "scanner", label: "📠 Scanners" },
  { value: "ups", label: "🔋 UPS" },
  { value: "other", label: "📦 Otros" },
];

const statuses = [
  { value: "", label: "Todos los estados" },
  { value: "active", label: "✅ Activo" },
  { value: "inactive", label: "⚪ Inactivo" },
  { value: "maintenance", label: "🔧 Mantenimiento" },
  { value: "retired", label: "📦 Retirado" },
  { value: "damaged", label: "❌ Dañado" },
];

export default function DeviceFilters({ currentCategory, currentStatus, currentBranch, currentSearch }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [branches, setBranches] = useState<Branch[]>([]);

  useEffect(() => {
    getBranchesAction().then(setBranches).catch(() => {});
  }, []);

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      router.push(`/dashboard/devices?${params.toString()}`);
    },
    [router, searchParams]
  );

  const handleSearch = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      updateFilter("search", fd.get("search")?.toString() ?? "");
    },
    [updateFilter]
  );

  const clearAll = () => router.push("/dashboard/devices");

  const hasFilters = currentCategory || currentStatus || currentBranch || currentSearch;

  return (
    <div className="card p-4">
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              name="search"
              type="text"
              defaultValue={currentSearch}
              placeholder="Buscar por nombre, serial, marca..."
              className="input w-full pl-9"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-2 bg-[rgb(var(--accent))] hover:bg-[rgb(var(--accent-dark))] text-white rounded-lg text-sm transition-colors"
          >
            Buscar
          </button>
        </form>

        {/* Category Filter */}
        <select
          value={currentCategory ?? ""}
          onChange={(e) => updateFilter("category", e.target.value)}
          className="input"
        >
          {categories.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>

        {/* Branch Filter */}
        <select
          value={currentBranch ?? ""}
          onChange={(e) => updateFilter("branch_id", e.target.value)}
          className="input"
        >
          <option value="">Todas las sedes</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={currentStatus ?? ""}
          onChange={(e) => updateFilter("status", e.target.value)}
          className="input"
        >
          {statuses.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>

        {/* Clear */}
        {hasFilters && (
          <button
            onClick={clearAll}
            className="px-3 py-2 text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg text-sm transition-colors"
          >
            Limpiar
          </button>
        )}
      </div>
    </div>
  );
}
