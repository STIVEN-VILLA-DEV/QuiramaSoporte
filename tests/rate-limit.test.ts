import { describe, it, expect } from "vitest";
import { getClientIp } from "@/lib/rate-limit";

// ============================================================
// GET CLIENT IP
// ============================================================

describe("getClientIp", () => {
  it("extracts from x-forwarded-for", () => {
    const headers = new Headers({ "x-forwarded-for": "203.0.113.42, 10.0.0.1" });
    expect(getClientIp(headers)).toBe("203.0.113.42");
  });

  it("falls back to x-real-ip", () => {
    const headers = new Headers({ "x-real-ip": "198.51.100.7" });
    expect(getClientIp(headers)).toBe("198.51.100.7");
  });

  it("prefers x-forwarded-for over cf-connecting-ip", () => {
    const headers = new Headers({
      "x-forwarded-for": "192.0.2.1",
      "cf-connecting-ip": "198.51.100.1",
    });
    expect(getClientIp(headers)).toBe("192.0.2.1");
  });

  it("returns 'unknown' when no headers present", () => {
    const headers = new Headers({});
    expect(getClientIp(headers)).toBe("unknown");
  });

  it("trims whitespace from IP", () => {
    const headers = new Headers({ "x-forwarded-for": "  10.0.0.5  " });
    expect(getClientIp(headers)).toBe("10.0.0.5");
  });
});

// ============================================================
// NOTE: Full rate limit tests require a database connection.
// The dbCheck, checkRateLimit, checkTicketRateLimit, and
// checkLoginRateLimit functions are tested via integration tests.
// ============================================================
