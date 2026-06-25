import { describe, it, expect, vi, beforeEach } from "vitest";

// ============================================================
// We import the module after mocking console methods
// ============================================================

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("logger", () => {
  it("logs error messages", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    // Dynamic import to pick up mocks
    const { logger } = await import("@/lib/logger");

    logger.error("Something broke", { error: "ECONNREFUSED" });

    expect(spy).toHaveBeenCalledTimes(1);
    const callArg = spy.mock.calls[0]?.[0];
    const parsed = JSON.parse(callArg);
    expect(parsed.level).toBe("error");
    expect(parsed.message).toBe("Something broke");
    expect(parsed.meta?.error).toBe("ECONNREFUSED");
  });

  it("logs info messages", async () => {
    const spy = vi.spyOn(console, "info").mockImplementation(() => {});

    const { logger } = await import("@/lib/logger");

    logger.info("User logged in", { userId: "abc" }, { action: "login" });

    expect(spy).toHaveBeenCalledTimes(1);
    const parsed = JSON.parse(spy.mock.calls[0]?.[0]);
    expect(parsed.level).toBe("info");
    expect(parsed.action).toBe("login");
  });

  it("logs warn messages", async () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const { logger } = await import("@/lib/logger");

    logger.warn("Rate limit approaching", { remaining: 2 });

    expect(spy).toHaveBeenCalledTimes(1);
    const parsed = JSON.parse(spy.mock.calls[0]?.[0]);
    expect(parsed.level).toBe("warn");
  });

  it("outputs valid JSON for log shippers", async () => {
    const spy = vi.spyOn(console, "info").mockImplementation(() => {});

    const { logger } = await import("@/lib/logger");

    logger.info("Test", { key: "value" }, { action: "test" });

    const parsed = JSON.parse(spy.mock.calls[0]?.[0]);
    expect(parsed).toHaveProperty("level");
    expect(parsed).toHaveProperty("message");
    expect(parsed).toHaveProperty("timestamp");
    // ISO date check
    expect(new Date(parsed.timestamp).toISOString()).toBe(parsed.timestamp);
  });
});

describe("withErrorLog", () => {
  it("returns successful result and logs debug", async () => {
    const spy = vi.spyOn(console, "debug").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});

    const { withErrorLog } = await import("@/lib/logger");

    const result = await withErrorLog("testAction", "user1", async () => {
      return "success";
    });

    expect(result).toBe("success");
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("re-throws error and logs error", async () => {
    vi.spyOn(console, "debug").mockImplementation(() => {});
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { withErrorLog } = await import("@/lib/logger");

    await expect(
      withErrorLog("failAction", "user1", async () => {
        throw new Error("Boom!");
      }),
    ).rejects.toThrow("Boom!");

    expect(spy).toHaveBeenCalledTimes(1);
    const parsed = JSON.parse(spy.mock.calls[0]?.[0]);
    expect(parsed.level).toBe("error");
    expect(parsed.meta?.error).toBe("Boom!");
  });
});
