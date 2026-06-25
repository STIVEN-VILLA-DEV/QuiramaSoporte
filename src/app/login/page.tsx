"use client";

import { useActionState, useState } from "react";
import { motion } from "framer-motion";
import { loginAction } from "@/actions/auth";
import type { ApiResponse } from "@/types";

const initialState: ApiResponse = { success: false };

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.2 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
};

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);
  const [emailFocus, setEmailFocus] = useState(false);
  const [passFocus, setPassFocus] = useState(false);

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* ── Left: Form Panel ──────────────────────────────── */}
      <div className="w-full lg:w-1/2 min-h-screen flex flex-col justify-center px-8 sm:px-16 py-12">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="w-full max-w-sm mx-auto"
        >
          {/* Brand */}
          <motion.div variants={fadeUp} className="mb-12">
            <img
              src="/logoQuirama.png"
              alt="Quirama"
              className="w-[150px] sm:w-[180px] h-auto"
            />
            <p className="text-gray-400 text-sm mt-2">Gestión de Activos Tecnológicos</p>
          </motion.div>

          {/* Heading */}
          <motion.div variants={fadeUp} className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">
              Iniciar sesión
            </h2>
            <p className="text-gray-400 text-sm mt-1.5">
              Ingresá tus credenciales para continuar
            </p>
          </motion.div>

          {/* Error */}
          {state.error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs flex items-center gap-2.5"
            >
              <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
              </svg>
              {state.error}
            </motion.div>
          )}

          {/* Form */}
          <motion.form variants={fadeUp} action={formAction} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                Correo electrónico
              </label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="admin@empresa.com"
                  onFocus={() => setEmailFocus(true)}
                  onBlur={() => setEmailFocus(false)}
                  className="input w-full pl-9"
                />
                <motion.div
                  animate={{ scaleX: emailFocus ? 1 : 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute bottom-0 left-3 right-3 h-0.5 bg-accent origin-left rounded-full"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  onFocus={() => setPassFocus(true)}
                  onBlur={() => setPassFocus(false)}
                  className="input w-full pl-9"
                />
                <motion.div
                  animate={{ scaleX: passFocus ? 1 : 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute bottom-0 left-3 right-3 h-0.5 bg-accent origin-left rounded-full"
                />
              </div>
            </div>

            {/* Submit */}
            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className="pt-2">
              <button
                type="submit"
                disabled={isPending}
                className="w-full bg-accent hover:bg-accent-dark active:bg-accent-darker disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg py-2.5 text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
              >
                {isPending ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Verificando...
                  </>
                ) : (
                  <>
                    <span>Ingresar</span>
                    <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </>
                )}
              </button>
            </motion.div>
          </motion.form>

          {/* Footer */}
          <motion.p
            variants={fadeUp}
            className="text-center text-gray-300 text-xs mt-12"
          >
            Acceso restringido al personal autorizado
          </motion.p>
        </motion.div>
      </div>

      {/* ── Right: Image Panel ────────────────────────────── */}
      <div className="hidden lg:block w-1/2 min-h-screen relative overflow-hidden bg-gray-100">
        {/* Edge transition gradient */}
        <div className="absolute inset-y-0 left-0 w-32 bg-linear-to-r from-gray-50 to-transparent z-10" />

        {/* Image */}
        <motion.div
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url(/cristales.jpg)" }}
        />

        {/* Subtle overlay */}
        <div className="absolute inset-0 bg-white/10" />


      </div>
    </div>
  );
}
