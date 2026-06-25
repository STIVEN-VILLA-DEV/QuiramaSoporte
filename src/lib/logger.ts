// ============================================================
// STRUCTURED LOGGING UTILITY
// Levels: error, warn, info, debug
// In production, this could write to stdout JSON for log shippers
// (e.g., Datadog, CloudWatch, Grafana Loki).
// ============================================================

type LogLevel = "error" | "warn" | "info" | "debug";

interface LogEntry {
  level: LogLevel;
  message: string;
  /** ISO timestamp */
  timestamp: string;
  /** Request or correlation ID (optional) */
  requestId?: string;
  /** Action or operation name */
  action?: string;
  /** User identifier (optional) */
  userId?: string;
  /** IP address (optional) */
  ip?: string;
  /** Duration in ms (optional) */
  durationMs?: number;
  /** Structured metadata — put error details, context here */
  meta?: Record<string, unknown>;
}

function formatLog(entry: LogEntry): string {
  // JSON line — compatible with log shippers
  return JSON.stringify(entry);
}

function writeLog(entry: LogEntry): void {
  const line = formatLog(entry);

  switch (entry.level) {
    case "error":
      console.error(line);
      break;
    case "warn":
      console.warn(line);
      break;
    case "info":
      console.info(line);
      break;
    case "debug":
      console.debug(line);
      break;
  }
}

// ============================================================
// PUBLIC API
// ============================================================

export const logger = {
  error(
    message: string,
    meta?: Record<string, unknown>,
    context?: { action?: string; userId?: string; ip?: string },
  ): void {
    writeLog({
      level: "error",
      message,
      timestamp: new Date().toISOString(),
      ...context,
      meta,
    });
  },

  warn(
    message: string,
    meta?: Record<string, unknown>,
    context?: { action?: string; userId?: string; ip?: string },
  ): void {
    writeLog({
      level: "warn",
      message,
      timestamp: new Date().toISOString(),
      ...context,
      meta,
    });
  },

  info(
    message: string,
    meta?: Record<string, unknown>,
    context?: { action?: string; userId?: string; ip?: string },
  ): void {
    writeLog({
      level: "info",
      message,
      timestamp: new Date().toISOString(),
      ...context,
      meta,
    });
  },

  debug(
    message: string,
    meta?: Record<string, unknown>,
    context?: { action?: string; userId?: string; ip?: string },
  ): void {
    if (process.env.NODE_ENV !== "production" || process.env.LOG_DEBUG) {
      writeLog({
        level: "debug",
        message,
        timestamp: new Date().toISOString(),
        ...context,
        meta,
      });
    }
  },
};

// ============================================================
// Server Action error wrapper — catches + logs + returns safe error
// ============================================================

/**
 * Wraps a server action callback with structured logging + safe error.
 * Ensures every action logs errors consistently.
 *
 * @example
 * export async function myAction() {
 *   return withErrorLog("myAction", session?.id, async () => {
 *     // ... do work
 *   });
 * }
 */
export async function withErrorLog<T>(
  action: string,
  userId: string | undefined,
  fn: () => Promise<T>,
): Promise<T> {
  const start = performance.now();
  try {
    const result = await fn();
    const durationMs = Math.round(performance.now() - start);
    logger.debug(`${action} completed`, { durationMs }, { action, userId });
    return result;
  } catch (err) {
    const durationMs = Math.round(performance.now() - start);
    const errorMessage =
      err instanceof Error ? err.message : "Unknown error";
    logger.error(`${action} failed`, { error: errorMessage, durationMs }, { action, userId });
    throw err; // Re-throw — caller handles the response
  }
}
