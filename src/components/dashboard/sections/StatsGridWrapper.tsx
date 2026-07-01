import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import {
  getDashboardTotalStats,
  getDashboardSecurityStats,
  getDashboardAlertCounts,
} from "@/lib/dashboard-queries";
import type { DashboardStats } from "@/types";
import StatsGrid from "../StatsGrid";

export default async function StatsGridWrapper() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [totals, security, alerts] = await Promise.all([
    getDashboardTotalStats(),
    getDashboardSecurityStats(),
    getDashboardAlertCounts(),
  ]);

  const stats: DashboardStats = {
    total_devices: totals.totalDevices,
    active_devices: totals.activeDevices,
    maintenance_devices: totals.maintenanceDevices,
    damaged_devices: totals.damagedDevices,
    retired_devices: totals.retiredDevices,
    no_antivirus: security.noAntivirus,
    total_computer_like: security.totalComputerLike,
    malware_detected: security.malwareDetected,
    overdue_maintenance: alerts.overdueMaintenance,
    pending_maintenance: alerts.pendingMaintenance,
    completed_maintenance_month: 0,
    expiring_warranties: alerts.expiringWarranties,
    expiring_antivirus: alerts.expiringAntivirus,
    by_category: {},
    by_branch: {},
    branch_names: {},
    by_department: {},
    recent_maintenance: [],
    critical_devices: [],
  };

  return <StatsGrid stats={stats} />;
}
