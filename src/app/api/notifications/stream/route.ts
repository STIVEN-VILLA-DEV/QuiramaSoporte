import { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

// ── Alert counts (same logic as /api/notifications, separate cache) ──

interface AlertCacheEntry {
  data: AlertCounts;
  expiresAt: number;
}

interface AlertCounts {
  expiring_warranties: number;
  expiring_antivirus: number;
  pending_maintenance: number;
  overdue_maintenance: number;
}

let alertCache: AlertCacheEntry | null = null;
const ALERT_CACHE_TTL = 30_000;

async function getAlertCounts(): Promise<AlertCounts> {
  const now = Date.now();
  if (alertCache && alertCache.expiresAt > now) {
    return alertCache.data;
  }

  const dbNow = new Date();
  const thirtyDays = new Date(dbNow.getTime() + 30 * 24 * 60 * 60 * 1000);

  const [expiringWarranties, expiringAntivirus, pendingMaintenance, overdueMaintenance] =
    await Promise.all([
      prisma.device.count({
        where: { warranty_expiry: { gte: dbNow, lte: thirtyDays } },
      }),
      prisma.device.count({
        where: { antivirus_expiry: { gte: dbNow, lte: thirtyDays } },
      }),
      prisma.maintenanceRecord.count({ where: { status: "scheduled" } }),
      prisma.device.count({
        where: { next_maintenance: { lt: dbNow }, status: { not: "retired" } },
      }),
    ]);

  const data = {
    expiring_warranties: expiringWarranties,
    expiring_antivirus: expiringAntivirus,
    pending_maintenance: pendingMaintenance,
    overdue_maintenance: overdueMaintenance,
  };
  alertCache = { data, expiresAt: now + ALERT_CACHE_TTL };
  return data;
}

// ── SSE Endpoint ──

const HEARTBEAT_INTERVAL = 15_000;   // 15s
const POLL_INTERVAL = 10_000;        // 10s
const MAX_LIFETIME = 5 * 60 * 1000;  // 5 min, then EventSource reconnects

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // 1. Auth
  const token = request.cookies.get("it_manager_session")?.value;
  if (!token) {
    return new Response("No autenticado", { status: 401 });
  }

  let userId: string;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer: "it-manager",
      audience: "it-manager-client",
    });
    userId = payload.id as string;
  } catch {
    return new Response("Sesión inválida", { status: 401 });
  }

  // 2. Helpers
  const encoder = new TextEncoder();

  async function fetchData() {
    const [totalUnread, notifications, alerts] = await Promise.all([
      prisma.notification.count({
        where: { user_id: userId, read_at: null },
      }),
      prisma.notification.findMany({
        where: { user_id: userId },
        orderBy: { created_at: "desc" },
        take: 20,
        select: {
          id: true,
          type: true,
          title: true,
          message: true,
          link: true,
          read_at: true,
          created_at: true,
        },
      }),
      getAlertCounts(),
    ]);

    return {
      unread_count: totalUnread,
      notifications: notifications.map((n) => ({
        ...n,
        read_at: n.read_at?.toISOString() ?? null,
        created_at: n.created_at.toISOString(),
      })),
      alerts,
    };
  }

  // 3. Stream
  let pollTimer: ReturnType<typeof setInterval> | null = null;
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  let lifetimeTimer: ReturnType<typeof setTimeout> | null = null;

  function cleanup() {
    if (pollTimer) clearInterval(pollTimer);
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    if (lifetimeTimer) clearTimeout(lifetimeTimer);
    pollTimer = null;
    heartbeatTimer = null;
    lifetimeTimer = null;
  }

  const stream = new ReadableStream({
    async start(controller) {
      // Client already gone?
      if (request.signal.aborted) {
        cleanup();
        return;
      }

      // Send initial snapshot
      try {
        const data = await fetchData();
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      } catch (err) {
        console.error("SSE initial fetch error:", err);
      }

      // Poll every POLL_INTERVAL
      pollTimer = setInterval(async () => {
        try {
          const data = await fetchData();
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch (err) {
          console.error("SSE poll error:", err);
        }
      }, POLL_INTERVAL);

      // Heartbeat to keep connection alive
      heartbeatTimer = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch {
          // controller might be closed — clean up
          cleanup();
        }
      }, HEARTBEAT_INTERVAL);

      // Max lifetime — after this, EventSource reconnects fresh
      lifetimeTimer = setTimeout(() => {
        cleanup();
        try {
          controller.close();
        } catch {
          // already closed
        }
      }, MAX_LIFETIME);

      // Cleanup on client disconnect
      request.signal.addEventListener("abort", cleanup, { once: true });
    },
    cancel() {
      // Called when the consumer (EventSource) disconnects
      cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
