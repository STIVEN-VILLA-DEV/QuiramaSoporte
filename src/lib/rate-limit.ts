import { prisma } from "@/lib/prisma";

// ============================================================
// DB-backed rate limiter — works across instances/serverless
// Uses Prisma upsert so every container/serverless function shares
// the same rate limit state via PostgreSQL.
// ============================================================

const CLEANUP_INTERVAL = 60_000; // 1 min
let lastCleanup = 0;

/**
 * Run periodic cleanup of expired rows (fire-and-forget).
 * Keeps the rate_limits table from growing unbounded.
 */
function scheduleCleanup(): void {
  const now = Date.now();
  if (now - lastCleanup > CLEANUP_INTERVAL) {
    lastCleanup = now;
    prisma.rateLimit
      .deleteMany({ where: { expiresAt: { lt: new Date() } } })
      .catch(() => {
        /* non-critical — cleanup may fail if DB is busy */
      });
  }
}

/**
 * Low-level DB rate limit check.
 * Upserts a row by key, increments count within the window.
 *
 * @returns `{ allowed, remaining, resetAt }`
 */
async function dbCheck(
  key: string,
  max: number,
  windowMs: number,
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const now = new Date();
  scheduleCleanup();

  const existing = await prisma.rateLimit.findUnique({ where: { key } });

  if (!existing || existing.expiresAt < now) {
    const expiresAt = new Date(now.getTime() + windowMs);
    await prisma.rateLimit.upsert({
      where: { key },
      update: { count: 1, expiresAt, updatedAt: now },
      create: { key, count: 1, expiresAt },
    });
    return { allowed: true, remaining: max - 1, resetAt: expiresAt };
  }

  if (existing.count >= max) {
    return { allowed: false, remaining: 0, resetAt: existing.expiresAt };
  }

  const updated = await prisma.rateLimit.update({
    where: { key },
    data: { count: { increment: 1 } },
  });

  return {
    allowed: updated.count <= max,
    remaining: Math.max(0, max - updated.count),
    resetAt: updated.expiresAt,
  };
}

// ============================================================
// HIGH-LEVEL HELPERS — backward-compatible with old call sites
//
// All return `{ allowed: boolean; message?: string }` as before,
// but now backed by the database instead of in-memory maps.
// ============================================================

const MINUTE = 60_000;
const HOUR = 3_600_000;

// --- General action rate limit: 30/min per IP ---
export async function checkRateLimit(
  ip: string,
  _email?: string,
): Promise<{ allowed: boolean; message?: string }> {
  const key = `action:${ip}`;
  const { allowed, resetAt } = await dbCheck(key, 30, MINUTE);
  return {
    allowed,
    message: allowed
      ? undefined
      : `Demasiadas solicitudes. Intenta de nuevo después de ${secondsUntil(resetAt)}s.`,
  };
}

// --- Ticket submission: 3/h per IP ---
export async function checkTicketRateLimit(
  ip: string,
): Promise<{ allowed: boolean; message?: string }> {
  const key = `ticket:${ip}`;
  const { allowed, resetAt } = await dbCheck(key, 3, HOUR);
  return {
    allowed,
    message: allowed
      ? undefined
      : `Has alcanzado el límite de reportes (3/h). Intenta de nuevo después de ${secondsUntil(resetAt)}s.`,
  };
}

// ============================================================
// FAILED LOGIN TRACKING — per-email, separate window
// Uses a dedicated prefix to avoid collision with other limits.
// ============================================================

// TTL for failed attempt markers (beyond which they auto-expire)
const FAIL_TTL = 15 * MINUTE;
const MAX_FAILS = 5;

export function registerFailedAttempt(email: string): void {
  // Fire-and-forget: create/update a row per email
  const key = `fail:${email}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + FAIL_TTL);

  prisma.rateLimit
    .upsert({
      where: { key },
      update: { count: { increment: 1 }, expiresAt, updatedAt: now },
      create: { key, count: 1, expiresAt },
    })
    .catch(() => {
      /* non-critical */
    });
}

export function clearFailedAttempts(email: string): void {
  const key = `fail:${email}`;
  prisma.rateLimit
    .deleteMany({ where: { key } })
    .catch(() => {
      /* non-critical */
    });
}

// ============================================================
// CHECK FAILED ATTEMPTS FOR LOGIN — used inline in loginAction
// ============================================================

export async function checkLoginRateLimit(
  email: string,
): Promise<{ allowed: boolean; message?: string }> {
  const key = `fail:${email}`;
  const { allowed, resetAt } = await dbCheck(key, MAX_FAILS, FAIL_TTL);
  if (allowed) return { allowed: true };
  return {
    allowed: false,
    message: `Demasiados intentos fallidos. Intenta de nuevo después de ${secondsUntil(resetAt)}s.`,
  };
}

// ============================================================
// UTILITIES
// ============================================================

const IP_HEADERS = [
  "x-forwarded-for",
  "x-real-ip",
  "cf-connecting-ip",
  "true-client-ip",
];

export function getClientIp(headersList: Headers): string {
  for (const header of IP_HEADERS) {
    const value = headersList.get(header);
    if (value) {
      return value.split(",")[0]?.trim() ?? "unknown";
    }
  }
  return "unknown";
}

function secondsUntil(date: Date): number {
  return Math.max(1, Math.round((date.getTime() - Date.now()) / 1000));
}
