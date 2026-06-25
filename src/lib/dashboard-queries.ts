import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma, serialize } from "@/lib/prisma";
import { cache } from "react";
import type { MaintenanceRecord } from "@/types";

// ============================================================
// RETURN TYPES — camelCase, matching client component props
// ============================================================

export interface DashboardTotals {
  totalDevices: number;
  activeDevices: number;
  maintenanceDevices: number;
  damagedDevices: number;
  retiredDevices: number;
}

export interface DashboardSecurityStats {
  noAntivirus: number;
  malwareDetected: number;
}

export interface DashboardAlertCounts {
  expiringWarranties: number;
  expiringAntivirus: number;
  pendingMaintenance: number;
  overdueMaintenance: number;
}

export interface DashboardCategoryStats {
  byCategory: Record<string, number>;
  total: number;
}

export interface DashboardBranchStats {
  byBranch: Record<string, number>;
  branchNames: Record<string, string>;
}

// ============================================================
// TOTAL STATS — total, active, maintenance, damaged, retired
// ============================================================

const getDeviceCountByStatus = cache(async (status?: string) => {
  const where = status ? { status: status as never } : {};
  return prisma.device.count({ where });
});

export const getDashboardTotalStats = cache(async (): Promise<DashboardTotals> => {
  const session = await getSession();
  if (!session) redirect("/login");

  const [totalDevices, activeDevices, maintenanceDevices, damagedDevices, retiredDevices] =
    await Promise.all([
      getDeviceCountByStatus(),
      getDeviceCountByStatus("active"),
      getDeviceCountByStatus("maintenance"),
      getDeviceCountByStatus("damaged"),
      getDeviceCountByStatus("retired"),
    ]);

  return serialize({
    totalDevices,
    activeDevices,
    maintenanceDevices,
    damagedDevices,
    retiredDevices,
  });
});

// ============================================================
// SECURITY STATS — no antivirus + malware detected
// ============================================================

export const getDashboardSecurityStats = cache(async (): Promise<DashboardSecurityStats> => {
  const session = await getSession();
  if (!session) redirect("/login");

  const [noAntivirus, malwareDetected] = await Promise.all([
    prisma.device.count({ where: { antivirus: null } }),
    prisma.device.count({ where: { malware_detected: true } }),
  ]);

  return serialize({ noAntivirus, malwareDetected });
});

// ============================================================
// ALERTS — expiring warranties, antivirus, pending/overdue maintenance
// ============================================================

export const getDashboardAlertCounts = cache(async (): Promise<DashboardAlertCounts> => {
  const session = await getSession();
  if (!session) redirect("/login");

  const now = new Date();
  const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const [expiringWarranties, expiringAntivirus, pendingMaintenance, overdueMaintenance] =
    await Promise.all([
      prisma.device.count({
        where: {
          warranty_expiry: { gte: now, lte: thirtyDays },
        },
      }),
      prisma.device.count({
        where: {
          antivirus_expiry: { gte: now, lte: thirtyDays },
        },
      }),
      prisma.maintenanceRecord.count({ where: { status: "scheduled" } }),
      prisma.device.count({
        where: {
          next_maintenance: { lt: now },
          status: { not: "retired" },
        },
      }),
    ]);

  return serialize({
    expiringWarranties,
    expiringAntivirus,
    pendingMaintenance,
    overdueMaintenance,
  });
});

// ============================================================
// CATEGORY STATS — devices grouped by category + total count
// ============================================================

export const getDashboardCategoryStats = cache(async (): Promise<DashboardCategoryStats> => {
  const session = await getSession();
  if (!session) redirect("/login");

  const [byCategory, total] = await Promise.all([
    prisma.device.groupBy({
      by: ["category"],
      _count: { category: true },
      orderBy: { _count: { category: "desc" } },
    }),
    getDeviceCountByStatus(),
  ]);

  return serialize({
    byCategory: Object.fromEntries(
      byCategory.map((r) => [r.category, r._count.category])
    ),
    total,
  });
});

// ============================================================
// BRANCH STATS — devices grouped by branch + branch names lookup
// ============================================================

const getAllBranches = cache(async () => {
  return prisma.branch.findMany();
});

export const getDashboardBranchStats = cache(async (): Promise<DashboardBranchStats> => {
  const session = await getSession();
  if (!session) redirect("/login");

  const [byBranch, allBranches] = await Promise.all([
    prisma.device.groupBy({
      by: ["branch_id"],
      _count: { branch_id: true },
      orderBy: { _count: { branch_id: "desc" } },
    }),
    getAllBranches(),
  ]);

  return serialize({
    byBranch: Object.fromEntries(
      byBranch.map((r) => [r.branch_id ?? "", r._count.branch_id])
    ),
    branchNames: Object.fromEntries(
      allBranches.map((b) => [b.id, b.name])
    ),
  });
});

// ============================================================
// RECENT MAINTENANCE — last 5 records with device/tech names
// ============================================================

export const getDashboardRecentMaintenance = cache(async (): Promise<{
  records: MaintenanceRecord[];
}> => {
  const session = await getSession();
  if (!session) redirect("/login");

  const records = await prisma.maintenanceRecord.findMany({
    take: 5,
    orderBy: { created_at: "desc" },
    include: {
      device: {
        select: {
          name: true,
          branch: { select: { name: true } },
        },
      },
      technician: { select: { name: true } },
    },
  });

  return serialize({
    records: records.map((m) => {
      const record = m as unknown as {
        device: { name: string; branch: { name: string } | null };
        technician: { name: string } | null;
      };
      return {
        ...m,
        device_name: record.device?.name,
        technician_name: record.technician?.name,
        branch_name: record.device?.branch?.name,
      };
    }) as unknown as MaintenanceRecord[],
  });
});
