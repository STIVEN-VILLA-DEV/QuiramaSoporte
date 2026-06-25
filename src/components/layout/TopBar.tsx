"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { getBranchesAction } from "@/actions/branches";
import NotificationBell from "@/components/notifications/NotificationBell";
import type { UserSession, Branch } from "@/types";

// ─── Props ───────────────────────────────────────────────────

interface Props {
  session: UserSession;
  onToggle: () => void;
}

// ─── Constants ───────────────────────────────────────────────

const breadcrumbMap: Record<string, string> = {
  dashboard: "Dashboard",
  devices: "Equipos",
  maintenance: "Mantenimiento",
  users: "Usuarios",
  new: "Nuevo",
  edit: "Editar",
};

const roleLabels: Record<string, string> = {
  admin: "Administrador",
  technician: "Técnico",
  viewer: "Consultor",
};

const roleBadgeColors: Record<string, string> = {
  admin: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  technician: "bg-accent/10 text-accent border-accent/20",
  viewer: "bg-gray-100 text-gray-500 border-gray-200",
};

// ─── Component ───────────────────────────────────────────────

export default function TopBar({ session, onToggle }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchOpen, setBranchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch branches for selector (admin/tech only)
  useEffect(() => {
    if (session.role === "admin" || session.role === "technician") {
      getBranchesAction()
        .then(setBranches)
        .catch(() => {});
    }
  }, [session.role]);

  // Close branch dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setBranchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // ── Breadcrumbs ─────────────────────────────────────────

  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs = segments
    .filter((s) => !/^[0-9a-f-]{36}$/.test(s))
    .map((s) => breadcrumbMap[s] ?? s);

  // ── Current branch name ─────────────────────────────────

  const currentBranch = branches.find((b) => b.id === session.branch_id);

  // ── Handlers ────────────────────────────────────────────

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      router.push(`/dashboard/devices?search=${encodeURIComponent(searchValue.trim())}`);
    }
  };

  const handleBranchSelect = (branchId: string) => {
    setBranchOpen(false);
    if (branchId) {
      router.push(`/dashboard/devices?branch_id=${branchId}`);
    } else {
      router.push("/dashboard/devices");
    }
  };

  const canManageBranches = session.role === "admin" || session.role === "technician";

  // ── Render ──────────────────────────────────────────────

  return (
    <header className="h-14 bg-white/70 backdrop-blur-md border-b border-gray-200/50 flex items-center justify-between px-4 md:px-6 shrink-0 relative z-20">
      {/* ── Left: Hamburger + Breadcrumbs ──────────────────── */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Hamburger — mobile only */}
        <button
          onClick={onToggle}
          className="lg:hidden w-9 h-9 rounded-lg bg-gray-100/80 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-all"
          aria-label="Abrir menú"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Breadcrumbs */}
        <nav className="hidden sm:flex items-center gap-1 text-sm min-w-0">
          <span className="text-gray-400 shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </span>
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && (
                <svg className="w-3.5 h-3.5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
              <span
                className={`whitespace-nowrap ${
                  i === breadcrumbs.length - 1
                    ? "text-gray-900 font-semibold"
                    : "text-gray-400"
                }`}
              >
                {crumb}
              </span>
            </span>
          ))}
        </nav>
      </div>

      {/* ── Right: Branch Selector · Search · Notifications · Role ── */}
      <div className="flex items-center gap-2.5">
        {/* Branch Selector (admin/tech only) */}
        {canManageBranches && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setBranchOpen(!branchOpen)}
              className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100/80 border border-transparent hover:border-gray-200 transition-all duration-150"
            >
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="max-w-24 truncate">{currentBranch?.name || "Todas las sedes"}</span>
              <svg className={`w-3 h-3 shrink-0 transition-transform duration-150 ${branchOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <AnimateBranchDropdown open={branchOpen} branches={branches} currentBranch={currentBranch} onSelect={handleBranchSelect} />
          </div>
        )}

        {/* Mini Search */}
        <form onSubmit={handleSearch} className="hidden md:flex items-center">
          <div className="relative">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Buscar equipos..."
              className="w-40 lg:w-52 pl-8 pr-3 py-1.5 text-xs rounded-lg bg-gray-100/80 border border-transparent focus:border-accent/30 focus:bg-white text-gray-700 placeholder-gray-400 transition-all duration-150 outline-none"
            />
          </div>
        </form>

        {/* Notification Bell */}
        <NotificationBell />

        {/* Role Badge */}
        <span className={`hidden sm:inline-flex text-xs font-medium px-2.5 py-1 rounded-full border ${roleBadgeColors[session.role]}`}>
          {roleLabels[session.role]}
        </span>
      </div>
    </header>
  );
}

// ─── Animated Branch Dropdown ─────────────────────────────────

function AnimateBranchDropdown({
  open,
  branches,
  currentBranch,
  onSelect,
}: {
  open: boolean;
  branches: Branch[];
  currentBranch: Branch | undefined;
  onSelect: (branchId: string) => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -4, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.96 }}
          transition={{ duration: 0.12, ease: "easeOut" }}
          className="absolute right-0 top-full mt-1.5 w-48 py-1 bg-white rounded-xl border border-gray-200/80 shadow-lg shadow-black/5 z-50 overflow-hidden"
        >
          <button
            onClick={() => onSelect("")}
            className={`w-full text-left px-3.5 py-2 text-xs font-medium transition-colors ${
              !currentBranch ? "text-accent bg-accent/5" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            Todas las sedes
          </button>
          {branches.map((b) => (
            <button
              key={b.id}
              onClick={() => onSelect(b.id)}
              className={`w-full text-left px-3.5 py-2 text-xs font-medium transition-colors ${
                currentBranch?.id === b.id ? "text-accent bg-accent/5" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              {b.name}
            </button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
