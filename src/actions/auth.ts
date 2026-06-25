"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createToken, setSessionCookie, clearSessionCookie, getSession } from "@/lib/auth";
import { loginSchema, registerSchema, getFirstError } from "@/lib/validation";
import { checkRateLimit, checkLoginRateLimit, registerFailedAttempt, clearFailedAttempts, getClientIp } from "@/lib/rate-limit";
import { logAudit } from "@/lib/db";
import type { ApiResponse, User } from "@/types";

// ============================================================
// LOGIN
// ============================================================

export async function loginAction(
  _prev: ApiResponse,
  formData: FormData
): Promise<ApiResponse> {
  const raw = {
    email: formData.get("email")?.toString() ?? "",
    password: formData.get("password")?.toString() ?? "",
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: getFirstError(parsed.error) };
  }

  const { email, password } = parsed.data;
  const headersList = await headers();
  const ip = getClientIp(headersList);

  // OWASP: Rate limiting — prevent brute force
  const limit = await checkRateLimit(ip);
  if (!limit.allowed) {
    return { success: false, error: limit.message ?? "Demasiadas solicitudes" };
  }

  // OWASP: Per-email failed login tracking (5 fails / 15 min)
  const loginLimit = await checkLoginRateLimit(email);
  if (!loginLimit.allowed) {
    return { success: false, error: loginLimit.message ?? "Demasiados intentos. Intenta de nuevo más tarde." };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, role: true, password_hash: true, is_active: true, branch_id: true },
    });

    // OWASP: Same error message for invalid email or password (no user enumeration)
    if (!user || !user.is_active) {
      registerFailedAttempt(email);
      return { success: false, error: "Credenciales inválidas" };
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      registerFailedAttempt(email);
      return { success: false, error: "Credenciales inválidas" };
    }

    // Clear failed attempts on success
    clearFailedAttempts(email);

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { last_login: new Date() },
    });

    const token = await createToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as User["role"],
      branch_id: (user as { branch_id?: string }).branch_id,
    });

    await setSessionCookie(token);
  } catch (err) {
    console.error("Login error:", err);
    return { success: false, error: "Error interno del servidor" };
  }

  redirect("/dashboard");
}

// ============================================================
// LOGOUT
// ============================================================

export async function logoutAction(): Promise<void> {
  await clearSessionCookie();
  redirect("/login");
}

// ============================================================
// REGISTER (Admin only)
// ============================================================

export async function registerUserAction(
  _prev: ApiResponse,
  formData: FormData
): Promise<ApiResponse> {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { success: false, error: "No autorizado" };
  }

  const headersList = await headers();
  const ip = getClientIp(headersList);

  // OWASP: Rate limiting
  const limit = await checkRateLimit(ip);
  if (!limit.allowed) {
    return { success: false, error: limit.message ?? "Demasiadas solicitudes" };
  }

  const raw = {
    email: formData.get("email")?.toString() ?? "",
    password: formData.get("password")?.toString() ?? "",
    name: formData.get("name")?.toString() ?? "",
    role: formData.get("role")?.toString() ?? "viewer",
    branch_id: formData.get("branch_id")?.toString() ?? "",
    department: formData.get("department")?.toString() ?? "",
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: getFirstError(parsed.error) };
  }

  const { email, password, name, role, branch_id, department } = parsed.data;

  try {
    // OWASP: Hash with bcrypt cost 12
    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.user.create({
      data: {
        email,
        password_hash: passwordHash,
        name,
        role: role as "admin" | "technician" | "viewer",
        branch_id: branch_id || null,
        department: department || null,
      },
    });

    await logAudit(session.id, "CREATE_USER", "user", email, { role }, ip);
    return { success: true, message: "Usuario creado exitosamente" };
  } catch (err: unknown) {
    if (err instanceof Error && "code" in err && (err as { code: string }).code === "P2002") {
      return { success: false, error: "El email ya está registrado" };
    }
    console.error("Register error:", err);
    return { success: false, error: "Error al crear usuario" };
  }
}

// ============================================================
// SEED ADMIN (one-time setup)
// ============================================================

export async function seedAdminAction(): Promise<ApiResponse> {
  const headersList = await headers();
  const ip = getClientIp(headersList);

  // OWASP: Rate limiting on setup endpoint
  const limit = await checkRateLimit(ip);
  if (!limit.allowed) {
    return { success: false, error: "Demasiadas solicitudes" };
  }

  try {
    const existing = await prisma.user.findFirst({
      where: { role: "admin" },
      select: { id: true },
    });

    if (existing) {
      return { success: false, error: "Ya existe un administrador" };
    }

    const passwordHash = await bcrypt.hash("Admin@1234", 12);
    const admin = await prisma.user.create({
      data: {
        email: "admin@empresa.com",
        password_hash: passwordHash,
        name: "Administrador",
        role: "admin",
        department: "TI",
      },
    });

    await logAudit(admin.id, "SEED_ADMIN", "user", admin.id, {}, ip);
    return {
      success: true,
      message: "Admin creado: admin@empresa.com / Admin@1234 — cámbialo inmediatamente",
    };
  } catch (err) {
    console.error("Seed admin error:", err);
    return { success: false, error: "Error al crear admin" };
  }
}
