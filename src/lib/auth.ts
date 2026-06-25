import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { UserSession } from "@/types";

// OWASP: JWT_SECRET must be set in env. Fail at module load if missing/insecure.
const jwtSecretStr = process.env.JWT_SECRET;
if (!jwtSecretStr || jwtSecretStr === "fallback-secret-change-in-production-min-32" || jwtSecretStr.length < 32) {
  throw new Error(
    "❌ JWT_SECRET no configurado o inseguro. " +
    "Definí JWT_SECRET en .env con mínimo 32 caracteres. " +
    "Podés generarlo con: openssl rand -base64 48"
  );
}
const JWT_SECRET = new TextEncoder().encode(jwtSecretStr);

const COOKIE_NAME = "it_manager_session";
const TOKEN_EXPIRY = "4h"; // OWASP: reduced from 8h to minimize window

// ============================================================
// TOKEN CREATION
// ============================================================

export async function createToken(payload: UserSession): Promise<string> {
  return new SignJWT({
    id: payload.id,
    email: payload.email,
    name: payload.name,
    role: payload.role,
    branch_id: payload.branch_id,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .setIssuer("it-manager")
    .setAudience("it-manager-client")
    .sign(JWT_SECRET);
}

// ============================================================
// TOKEN VERIFICATION
// ============================================================

export async function verifyToken(token: string): Promise<UserSession | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer: "it-manager",
      audience: "it-manager-client",
    });
    return {
      id: payload.id as string,
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role as UserSession["role"],
      branch_id: payload.branch_id as string | undefined,
    };
  } catch {
    return null;
  }
}

// ============================================================
// SESSION MANAGEMENT
// ============================================================

export async function getSession(): Promise<UserSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,             // OWASP: prevent XSS access to cookie
    secure: process.env.NODE_ENV === "production", // OWASP: HTTPS only in prod
    sameSite: "strict",         // OWASP: CSRF protection (was "lax")
    maxAge: 60 * 60 * 4,        // 4 hours (was 8h)
    path: "/",
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

// ============================================================
// ROLE HELPERS
// ============================================================

export function canWrite(role: UserSession["role"]): boolean {
  return role === "admin" || role === "technician";
}

export function isAdmin(role: UserSession["role"]): boolean {
  return role === "admin";
}
