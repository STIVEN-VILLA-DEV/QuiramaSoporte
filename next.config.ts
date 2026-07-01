import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // ── Transport security ──────────────────────────
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },

          // ── Anti-XSS / MIME ─────────────────────────────
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },

          // ── Referrer ────────────────────────────────────
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },

          // ── Permissions (limit API access) ──────────────
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), clipboard-write=(self)" },

          // ── Content Security Policy ─────────────────────
          // Block by default, only allow what's needed.
          // 'unsafe-inline' + 'unsafe-eval' required for Next.js dev server
          { key: "Content-Security-Policy", value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: blob:",
            "font-src 'self'",
            "connect-src 'self'",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'",
          ].join("; ") },
        ],
      },
    ];
  },
};

export default nextConfig;
