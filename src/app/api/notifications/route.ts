import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

// ============================================================
// In-memory cache for alert counts (30s TTL)
// Dashboard loads the same data; no need to hit DB every 30s.
// ============================================================

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
const ALERT_CACHE_TTL = 30_000; // 30 seconds

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

  const data = { expiring_warranties: expiringWarranties, expiring_antivirus: expiringAntivirus, pending_maintenance: pendingMaintenance, overdue_maintenance: overdueMaintenance };
  alertCache = { data, expiresAt: now + ALERT_CACHE_TTL };
  return data;
}

export async function GET(request: NextRequest) {
  try {
    // 1. Auth via cookie
    const token = request.cookies.get("it_manager_session")?.value;
    if (!token) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    let userId: string;
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET, {
        issuer: "it-manager",
        audience: "it-manager-client",
      });
      userId = payload.id as string;
    } catch {
      return NextResponse.json({ error: "Sesión inválida" }, { status: 401 });
    }

    // 2. Query notifications
    const [totalUnread, notifications] = await Promise.all([
      prisma.notification.count({ where: { user_id: userId, read_at: null } }),
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
    ]);

    // 3. Compute alerts on-the-fly (cached 30s)
    const alerts = await getAlertCounts();

    // 4. Format response
    const response = {
      unread_count: totalUnread,
      notifications: notifications.map((n) => ({
        ...n,
        read_at: n.read_at?.toISOString() ?? null,
        created_at: n.created_at.toISOString(),
      })),
      alerts,
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error("Notifications API error:", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
