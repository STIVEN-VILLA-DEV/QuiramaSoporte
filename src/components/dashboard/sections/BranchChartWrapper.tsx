import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getDashboardBranchStats } from "@/lib/dashboard-queries";
import BranchChart from "../BranchChart";

export default async function BranchChartWrapper() {
  const session = await getSession();
  if (!session) redirect("/login");

  const data = await getDashboardBranchStats();

  return <BranchChart byBranch={data.byBranch} branchNames={data.branchNames} />;
}
