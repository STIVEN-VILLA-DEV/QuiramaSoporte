import { cookies } from "next/headers";
import crypto from "crypto";

// ============================================================
// CSRF Protection — Double-Submit Cookie Pattern
//
// For PUBLIC forms (no auth session), we generate a random token
// and return it. The Page (server component) passes it as a prop
// to the form. The form (client component) sets it as a cookie
// via document.cookie on mount. The hidden input carries the same
// token. On submission, the server action compares both.
//
// The cookie is NOT set in the server component because
// cookies().set() is not available in Server Components — only
// in Server Actions, Route Handlers, and Middleware.
//
// An attacker's site cannot read the cookie (sameSite: strict),
// cannot set a cookie for our domain from a cross-origin request,
// and the form-action CSP prevents exfiltration.
// ============================================================

const CSRF_COOKIE = "csrf-token";
const TOKEN_BYTES = 32;

/**
 * Generate a CSRF token (no cookie — that's done client-side).
 * Call from any server component or action.
 */
export async function generateCsrfToken(): Promise<string> {
  return crypto.randomBytes(TOKEN_BYTES).toString("hex");
}

/**
 * Validate that a submitted CSRF token matches the cookie.
 * Call from the server action BEFORE processing the form data.
 * Returns true if valid, false if mismatch.
 */
export async function validateCsrfToken(submittedToken: string | null): Promise<boolean> {
  if (!submittedToken) return false;

  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(CSRF_COOKIE)?.value;
  if (!cookieToken) return false;

  // Constant-time comparison to prevent timing attacks
  if (cookieToken.length !== submittedToken.length) return false;

  return crypto.timingSafeEqual(Buffer.from(cookieToken), Buffer.from(submittedToken));
}

/**
 * Clear the CSRF cookie after a successful submission.
 */
export async function clearCsrfToken(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(CSRF_COOKIE);
}
