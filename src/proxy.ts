import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// OWASP: Validate JWT_SECRET at cold start — fail fast if misconfigured
const jwtSecretStr = process.env.JWT_SECRET;
if (!jwtSecretStr || jwtSecretStr === "fallback-secret-change-in-production-min-32" || jwtSecretStr.length < 32) {
  console.error("❌ JWT_SECRET no configurado o inseguro. Asigná una variable de entorno JWT_SECRET con mínimo 32 caracteres.");
}

const JWT_SECRET = new TextEncoder().encode(jwtSecretStr ?? crypto.randomUUID());

const PUBLIC_PATHS = ["/login", "/setup", "/api/setup", "/_next", "/favicon.ico", "/logoQuirama.png", "/cristales.jpg", "/icons", "/qr", "/reportar"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // OWASP A05: CSP — strict in prod, eval allowed in dev (React needs it for stack traces)
  // Note: 'unsafe-inline' for scripts is required by Next.js's own bootstrap inline scripts.
  // For a fully strict CSP (nonce/hash-based), a custom server or webpack plugin is needed.
  const isDev = process.env.NODE_ENV === "development";
  const csp = [
    `default-src 'self'`,
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    `font-src 'self' https://fonts.gstatic.com`,
    `img-src 'self' data: blob:`,
    `connect-src 'self' https://*.neon.tech`,
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
  ].join("; ");

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    const response = NextResponse.next();
    response.headers.set("Content-Security-Policy", csp);
    return addSecurityHeaders(response);
  }

  // Verify session
  const token = request.cookies.get("it_manager_session")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    await jwtVerify(token, JWT_SECRET, {
      issuer: "it-manager",
      audience: "it-manager-client",
    });

    const response = NextResponse.next();
    response.headers.set("Content-Security-Policy", csp);
    return addSecurityHeaders(response);
  } catch {
    // Token expired or invalid
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("it_manager_session");
    return addSecurityHeaders(response);
  }
}

// ============================================================
// OWASP SECURITY HEADERS
// ============================================================

function addSecurityHeaders(response: NextResponse): NextResponse {
  // Prevent clickjacking
  response.headers.set("X-Frame-Options", "DENY");

  // Prevent MIME sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");

  // XSS Protection (legacy browsers)
  response.headers.set("X-XSS-Protection", "1; mode=block");

  // HSTS — OWASP: enforce HTTPS
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload"
  );

  // Referrer Policy
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Permissions Policy — OWASP: restrict device APIs
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=()"
  );

  // OWASP: Prevent cache of sensitive pages
  if (response.headers.get("content-type")?.includes("text/html")) {
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
