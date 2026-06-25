"use client";

import { useState, useActionState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { registerUserAction } from "@/actions/auth";
import type { ApiResponse } from "@/types";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  department?: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
}

const roleConfig: Record<string, { label: string; class: string }> = {
  admin: { label: "Administrador", class: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  technician: { label: "Técnico", class: "bg-accent/10 text-accent border-accent/20" },
  viewer: { label: "Consultor", class: "bg-gray-100 text-gray-500 border-gray-200" },
};

const initialState: ApiResponse = { success: false };

const inputClass = "input w-full";

export default function UsersPageClient({ users }: { users: User[] }) {
  const [showModal, setShowModal] = useState(false);
  const [state, formAction, isPending] = useActionState(registerUserAction, initialState);

  return (
    <>
      <div className="flex justify-end">
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-accent hover:bg-accent-dark text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Usuario
        </button>
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="table-header">
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider">Usuario</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider hidden md:table-cell">Departamento</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider">Rol</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider hidden lg:table-cell">Último acceso</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user, i) => {
                const role = roleConfig[user.role] ?? roleConfig.viewer;
                return (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.04 }}
                    className="table-row"
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <span className="text-sm text-gray-500">{user.department ?? "—"}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex text-xs font-medium px-2.5 py-0.5 rounded-full border ${role.class}`}>
                        {role.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      <span className="text-xs text-gray-500">
                        {user.last_login
                          ? new Date(user.last_login).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" })
                          : "Nunca"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex text-xs font-medium px-2.5 py-0.5 rounded-full ${
                        user.is_active ? "text-emerald-600 bg-emerald-50" : "text-gray-500 bg-gray-100"
                      }`}>
                        {user.is_active ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="fixed inset-0 bg-black/70 z-40 "
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="card-elevated p-6 w-full max-w-md">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-semibold text-gray-900">Nuevo Usuario</h3>
                  <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {state.success && (
                  <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-600 text-sm">
                    ✅ {state.message}
                  </div>
                )}
                {state.error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                    {state.error}
                  </div>
                )}

                <form action={formAction} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1.5">Nombre completo *</label>
                    <input name="name" type="text" required className={inputClass} placeholder="Juan Pérez" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1.5">Email *</label>
                    <input name="email" type="email" required className={inputClass} placeholder="juan@empresa.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1.5">Contraseña *</label>
                    <input name="password" type="password" required className={inputClass} placeholder="Mínimo 8 caracteres, 1 mayúscula, 1 número" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1.5">Rol *</label>
                      <select name="role" className={inputClass}>
                        <option value="viewer">Consultor</option>
                        <option value="technician">Técnico</option>
                        <option value="admin">Administrador</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1.5">Departamento</label>
                      <input name="department" type="text" className={inputClass} placeholder="TI" />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowModal(false)}
                      className="flex-1 py-2.5 text-sm text-gray-500 border border-gray-200 rounded-lg hover:border-gray-300 transition-all">
                      Cancelar
                    </button>
                    <button type="submit" disabled={isPending}
                      className="flex-1 py-2.5 bg-accent hover:bg-accent-dark disabled:bg-accent-darker text-white text-sm font-medium rounded-lg transition-all shadow-sm">
                      {isPending ? "Creando..." : "Crear Usuario"}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
