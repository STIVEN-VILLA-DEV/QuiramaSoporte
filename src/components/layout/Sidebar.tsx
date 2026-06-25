"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { logoutAction } from "@/actions/auth";
import type { UserSession } from "@/types";

// ─── Types ───────────────────────────────────────────────────

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
  adminOnly?: boolean;
}

// ─── Navigation Items ────────────────────────────────────────

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    label: "Equipos",
    href: "/dashboard/devices",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    label: "Tickets",
    href: "/dashboard/tickets",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M11.35 3.836c-.765.66-1.695 1.026-2.75 1.027a4.5 4.5 0 01-4.054-2.53 4.5 4.5 0 01-.125-.82 3.75 3.75 0 00-1.059 3.047 4.5 4.5 0 002.748 3.153 4.5 4.5 0 01-1.591.118 3.75 3.75 0 002.81 2.21 4.5 4.5 0 01-2.085.065 3.75 3.75 0 003.023 1.519 9.005 9.005 0 01-5.342 1.84A8.25 8.25 0 0021 9.75 17.25 17.25 0 0011.35 3.84z" />
      </svg>
    ),
  },
  {
    label: "Mantenimiento",
    href: "/dashboard/maintenance",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    label: "Usuarios",
    href: "/dashboard/users",
    adminOnly: true,
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
];

// ─── Framer Motion Variants ──────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const navItemVariants: any = {
  hidden: { opacity: 0, x: -8 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.035, duration: 0.25, ease: "easeOut" },
  }),
};

// ─── Props ───────────────────────────────────────────────────

interface Props {
  session: UserSession;
  mobileOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

// ─── Main Sidebar Component ──────────────────────────────────

export default function Sidebar({ session, mobileOpen, onToggle, onClose }: Props) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href.split("?")[0]);
  };

  // ── Shared sidebar content ──────────────────────────────
  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className={`flex items-center px-4 pt-5 pb-4 ${collapsed ? "justify-center px-3" : ""}`}>
        <img
          src="/logoQuirama.png"
          alt="Quirama"
          className={collapsed ? "w-8 h-auto" : "h-[38px] w-auto"}
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 space-y-0.5">
        {navItems.map((item, i) => {
          if (item.adminOnly && session.role !== "admin") return null;
          const active = isActive(item.href);
          return (
            <motion.div
              key={item.href}
              custom={i}
              variants={navItemVariants}
              initial="hidden"
              animate="visible"
            >
              <Link
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                  active
                    ? "bg-accent/10 text-accent shadow-sm"
                    : "text-gray-400 hover:text-gray-700 hover:bg-gray-50/80"
                } ${collapsed ? "justify-center px-2" : ""}`}
              >
                {/* Active indicator bar */}
                {active && (
                  <motion.span
                    layoutId="activeNav"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-accent"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <span className={`shrink-0 ${active ? "text-accent" : "text-gray-400 group-hover:text-gray-600"}`}>
                  {item.icon}
                </span>
                {!collapsed && <span className="truncate">{item.label}</span>}
                {item.badge && (
                  <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    active ? "bg-accent/15 text-accent" : "bg-gray-100 text-gray-500"
                  }`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            </motion.div>
          );
        })}

      </nav>

      {/* User Profile & Logout */}
      <div className="border-t border-gray-100/80 mx-3 pt-2 pb-3 mt-2">
        <div className={`flex items-center gap-3 px-2 py-2 rounded-xl transition-colors hover:bg-accent/5 ${
          collapsed ? "justify-center" : ""
        }`}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center shrink-0 text-white text-xs font-bold shadow-sm">
            {session.name.charAt(0).toUpperCase()}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-800 truncate">{session.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${
                  session.role === "admin" ? "bg-purple-400" :
                  session.role === "technician" ? "bg-accent" : "bg-gray-400"
                }`} />
                <p className="text-[11px] text-gray-400 truncate capitalize">
                  {session.role === "admin" ? "Administrador" :
                   session.role === "technician" ? "Técnico" : "Consultor"}
                </p>
              </div>
            </div>
          )}
        </div>

        <form action={logoutAction} className="mt-1.5">
          <button
            type="submit"
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs text-gray-400 hover:text-accent hover:bg-accent/5 rounded-lg transition-all duration-150 group ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <svg className="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {!collapsed && "Cerrar Sesión"}
          </button>
        </form>
      </div>
    </div>
  );

  // ── Render ──────────────────────────────────────────────
  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 256 }}
        transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
        className="hidden lg:flex flex-col bg-white/80 backdrop-blur-xl border-r border-gray-200/50 overflow-hidden shrink-0 relative z-30"
      >
        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-8 z-20 w-6 h-6 rounded-full bg-white border border-gray-200/80 shadow-md flex items-center justify-center text-gray-400 hover:text-accent hover:border-accent/30 transition-all duration-200 hover:shadow-accent/10"
          aria-label={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
        >
          <svg
            className={`w-3 h-3 transition-transform duration-200 ${collapsed ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <SidebarContent />
      </motion.aside>

      {/* Mobile Drawer — slide up from bottom */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="sidebar-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onClose}
              className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />
            <motion.aside
              key="sidebar-drawer"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 280 }}
              className="lg:hidden fixed inset-x-0 bottom-0 max-h-[85vh] bg-white/95 backdrop-blur-xl rounded-t-2xl border-t border-gray-200/50 z-50 overflow-y-auto shadow-2xl"
            >
              {/* Drag handle */}
              <div className="sticky top-0 pt-2 pb-1 flex justify-center bg-white/80 backdrop-blur-sm z-10">
                <div className="w-10 h-1 rounded-full bg-gray-300" />
              </div>
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-3 right-4 w-7 h-7 rounded-lg bg-gray-100/80 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-all z-10"
                aria-label="Cerrar menú"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
