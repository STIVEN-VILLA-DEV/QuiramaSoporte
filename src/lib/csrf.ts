import { cookies } from "next/headers";
import crypto from "crypto";

// ============================================================
// CSRF Protection — Double-Submit Cookie Pattern
//
// For PUBLIC forms (no auth session), we generate a random token
// and set it as a cookie. The same token is embedded as a hidden
// field in the form. On submission, we compare both.
//
// An attacker's site cannot read the cookie (httpOnly is NOT set
// here on purpose — we need the JS to read it), but it also cannot
// set a cookie for our domain from a cross-origin request.
// The form-action CSP also prevents exfiltration.
// ============================================================

const CSRF_COOKIE = "__Host-csrf-token"; // __Host- prefix locks it to the origin
const TOKEN_BYTES = 32;

/**
 * Generate a CSRF token, set it as a cookie, and return it.
 * Call from the page/layout that renders the form.
 */
export async function generateCsrfToken(): Promise<string> {
  const token = crypto.randomBytes(TOKEN_BYTES).toString("hex");
  const cookieStore = await cookies();

  cookieStore.set(CSRF_COOKIE, token, {
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 30, // 30 min — same as a typical form session
  });

  return token;
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
