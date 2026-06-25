import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getDashboardRecentMaintenance } from "@/lib/dashboard-queries";
import RecentMaintenance from "../RecentMaintenance";

export default async function RecentMaintenanceWrapper() {
  const session = await getSession();
  if (!session) redirect("/login");

  const data = await getDashboardRecentMaintenance();

  return <RecentMaintenance records={data.records} />;
}
