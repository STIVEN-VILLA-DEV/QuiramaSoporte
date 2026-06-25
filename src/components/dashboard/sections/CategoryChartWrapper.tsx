import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getDashboardCategoryStats } from "@/lib/dashboard-queries";
import CategoryChart from "../CategoryChart";

export default async function CategoryChartWrapper() {
  const session = await getSession();
  if (!session) redirect("/login");

  const data = await getDashboardCategoryStats();

  return <CategoryChart byCategory={data.byCategory} total={data.total} />;
}
