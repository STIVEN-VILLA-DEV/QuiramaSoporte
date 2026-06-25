import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getDashboardAlertCounts } from "@/lib/dashboard-queries";
import AlertBanner from "../AlertBanner";

export default async function AlertBannerWrapper() {
  const session = await getSession();
  if (!session) redirect("/login");

  const alerts = await getDashboardAlertCounts();

  return (
    <AlertBanner
      expiringWarranties={alerts.expiringWarranties}
      expiringAntivirus={alerts.expiringAntivirus}
      pendingMaintenance={alerts.pendingMaintenance}
      overdueMaintenance={alerts.overdueMaintenance}
    />
  );
}
