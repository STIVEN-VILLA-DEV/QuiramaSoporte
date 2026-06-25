"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { seedAdminAction } from "@/actions/auth";
import { seedBranchesAction } from "@/actions/branches";

export default function SetupPage() {
  const [dbStatus, setDbStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [adminStatus, setAdminStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [branchesStatus, setBranchesStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const [dbError, setDbError] = useState("");

  const handleVerifyDB = async () => {
    setDbStatus("loading");
    setDbError("");
    try {
      const res = await fetch("/api/setup/init-db", { method: "POST" });
      const data = await res.json();
      if (data.success) setDbStatus("done");
      else {
        setDbError(data.error ?? "Error al verificar la base de datos");
        setDbStatus("error");
      }
    } catch {
      setDbError("Error de conexión con el servidor.");
      setDbStatus("error");
    }
  };

  const handleSeedAdmin = async () => {
    setAdminStatus("loading");
    const result = await seedAdminAction();
    if (result.success) {
      setAdminStatus("done");
      setMessage(result.message ?? "");
    } else {
      setAdminStatus("error");
      setMessage(result.error ?? "");
    }
  };

  return (
    <div className="min-h-screen grid-bg flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent mb-4 shadow-sm">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Configuración Inicial</h1>
          <p className="text-gray-500 text-sm mt-1">Quirama — Configuración Inicial</p>
        </div>

        <div className="card rounded-2xl p-6 space-y-4">
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-500">
            <p className="font-medium text-gray-900 mb-1">📋 Antes de empezar</p>
            <p>
              Ejecutá este comando para crear las tablas en la base de datos:
            </p>
            <code className="block mt-2 p-2 bg-gray-100 rounded-lg text-emerald-600 text-xs font-mono">
              npx prisma db push
            </code>
            <p className="mt-2 text-xs text-gray-400">
              Solo necesitás hacerlo una vez. Después verificá la conexión abajo.
            </p>
          </div>

          {/* Paso 1: Verificar DB */}
          <div className="border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-full bg-accent text-white text-xs flex items-center justify-center font-bold">1</span>
              <span className="font-medium text-gray-900 text-sm">Verificar Base de Datos</span>
              {dbStatus === "done" && <span className="ml-auto text-emerald-500 text-xs">✅ Conectada</span>}
            </div>
            <p className="text-xs text-gray-500 mb-3">Verifica que las tablas estén creadas y la conexión funcione</p>
            <button onClick={handleVerifyDB} disabled={dbStatus === "loading" || dbStatus === "done"}
              className="w-full py-2 bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 text-gray-800 text-sm rounded-lg transition-all">
              {dbStatus === "loading" ? "Verificando..." : dbStatus === "done" ? "✅ Conectada" : "Verificar Conexión"}
            </button>
            {dbError && (
              <div className="mt-2 p-3 rounded-lg text-sm bg-red-50 border border-red-200 text-red-600">
                {dbError}
              </div>
            )}
          </div>

          {/* Paso 2: Crear Admin */}
          <div className="border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-full bg-accent text-white text-xs flex items-center justify-center font-bold">2</span>
              <span className="font-medium text-gray-900 text-sm">Crear Administrador</span>
              {adminStatus === "done" && <span className="ml-auto text-emerald-500 text-xs">✅ Listo</span>}
            </div>
            <p className="text-xs text-gray-500 mb-3">Crea el usuario admin inicial</p>
            <button onClick={handleSeedAdmin} disabled={adminStatus === "loading" || adminStatus === "done" || dbStatus !== "done"}
              className="w-full py-2 bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 text-gray-800 text-sm rounded-lg transition-all">
              {adminStatus === "loading" ? "Creando..." : adminStatus === "done" ? "✅ Creado" : "Crear Admin"}
            </button>
          </div>

          {/* Paso 3: Crear Sedes */}
          <div className="border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-full bg-accent text-white text-xs flex items-center justify-center font-bold">3</span>
              <span className="font-medium text-gray-900 text-sm">Crear Sedes</span>
              {branchesStatus === "done" && <span className="ml-auto text-emerald-500 text-xs">✅ Listo</span>}
            </div>
            <p className="text-xs text-gray-500 mb-3">Crea las sedes: CEDROS, CRISTALES, QUIRAMA</p>
            <button onClick={async () => {
              setBranchesStatus("loading");
              const result = await seedBranchesAction();
              if (result.success) {
                setBranchesStatus("done");
                setMessage(result.message ?? "");
              } else {
                setBranchesStatus("error");
                setMessage(result.error ?? "");
              }
            }} disabled={branchesStatus === "loading" || branchesStatus === "done"}
              className="w-full py-2 bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 text-gray-800 text-sm rounded-lg transition-all">
              {branchesStatus === "loading" ? "Creando..." : branchesStatus === "done" ? "✅ Creadas" : "Crear Sedes"}
            </button>
          </div>

          {message && (
            <div className={`p-3 rounded-lg text-sm ${branchesStatus === "done" || adminStatus === "done" ? "bg-emerald-50 border border-emerald-200 text-emerald-600" : "bg-red-50 border border-red-200 text-red-600"}`}>
              {message}
            </div>
          )}

          {(adminStatus === "done" && branchesStatus === "done") && (
              <a href="/login" className="block w-full py-2.5 bg-accent hover:bg-accent-dark text-white text-sm font-medium rounded-lg transition-all text-center shadow-sm">
              Ir al Login →
            </a>
          )}
          {adminStatus === "done" && branchesStatus !== "done" && (
            <p className="text-center text-xs text-gray-400 mt-2">Seguí con el paso 3 para crear las sedes</p>
          )}
        </div>
        <p className="text-center text-gray-400 text-xs mt-4">⚠️ Desactiva o elimina esta ruta en producción</p>
      </motion.div>
    </div>
  );
}
