import { Suspense } from "react";
import AlertBannerWrapper from "@/components/dashboard/sections/AlertBannerWrapper";
import StatsGridWrapper from "@/components/dashboard/sections/StatsGridWrapper";
import CategoryChartWrapper from "@/components/dashboard/sections/CategoryChartWrapper";
import BranchChartWrapper from "@/components/dashboard/sections/BranchChartWrapper";
import RecentMaintenanceWrapper from "@/components/dashboard/sections/RecentMaintenanceWrapper";
import {
  AlertBannerSkeleton,
  StatsGridSkeleton,
  ChartSkeleton,
  RecentMaintenanceSkeleton,
} from "@/components/dashboard/skeletons";

export const metadata = { title: "Dashboard - IT Manager" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Panel de Control</h1>
        <p className="text-gray-400 text-sm mt-0.5">
          Resumen del estado de los activos tecnológicos
        </p>
      </div>

      {/* Alerts */}
      <Suspense fallback={<AlertBannerSkeleton />}>
        <AlertBannerWrapper />
      </Suspense>

      {/* Stats Cards Grid */}
      <Suspense fallback={<StatsGridSkeleton />}>
        <StatsGridWrapper />
      </Suspense>

      {/* Charts — side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Suspense fallback={<ChartSkeleton />}>
          <CategoryChartWrapper />
        </Suspense>
        <Suspense fallback={<ChartSkeleton />}>
          <BranchChartWrapper />
        </Suspense>
      </div>

      {/* Recent Maintenance */}
      <Suspense fallback={<RecentMaintenanceSkeleton />}>
        <RecentMaintenanceWrapper />
      </Suspense>
    </div>
  );
}
