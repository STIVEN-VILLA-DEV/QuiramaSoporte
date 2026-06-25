import Link from "next/link";
import { getDevicesAction } from "@/actions/devices";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import DevicesTable from "@/components/devices/DevicesTable";
import DeviceFilters from "@/components/devices/DeviceFilters";
import type { DeviceCategory, DeviceStatus } from "@/types";

export const metadata = { title: "Equipos" };
export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    category?: string;
    status?: string;
    search?: string;
    branch_id?: string;
    page?: string;
  }>;
}

export default async function DevicesPage({ searchParams }: PageProps) {
  const session = await getSession();
  if (!session) redirect("/login");

  const params = await searchParams;
  const page = Number(params.page) || 1;

  const result = await getDevicesAction({
    category: params.category as DeviceCategory,
    status: params.status as DeviceStatus,
    search: params.search,
    branch_id: params.branch_id,
    page,
    per_page: 20,
  });

  const canWrite = session.role === "admin" || session.role === "technician";

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Equipos</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {result.total.toLocaleString()} equipo{result.total !== 1 ? "s" : ""} registrado{result.total !== 1 ? "s" : ""}
          </p>
        </div>
        {canWrite && (
          <Link
            href="/dashboard/devices/new"
            className="flex items-center gap-2 bg-accent hover:bg-accent-dark text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Equipo
          </Link>
        )}
      </div>

      <DeviceFilters
        currentCategory={params.category}
        currentStatus={params.status}
        currentBranch={params.branch_id}
        currentSearch={params.search}
      />

      <DevicesTable
        devices={result.data}
        total={result.total}
        page={result.page}
        totalPages={result.total_pages}
        canWrite={canWrite}
        isAdmin={session.role === "admin"}
      />
    </div>
  );
}
