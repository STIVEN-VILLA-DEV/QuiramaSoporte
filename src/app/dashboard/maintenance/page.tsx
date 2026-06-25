import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession, canWrite } from "@/lib/auth";
import { prisma, serialize } from "@/lib/prisma";
import MaintenanceTable from "@/components/maintenance/MaintenanceTable";
import type { Prisma } from "@prisma/client";
import type { MaintenanceRecord, MaintenanceStatus, MaintenanceType, Priority } from "@/types";

export const metadata = { title: "Mantenimiento" };
export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    status?: string;
    type?: string;
    priority?: string;
    device_id?: string;
    page?: string;
  }>;
}

export default async function MaintenancePage({ searchParams }: PageProps) {
  const session = await getSession();
  if (!session) redirect("/login");

  const params = await searchParams;
  const pageNum = Number(params.page) || 1;
  const perPage = 20;
  const skip = (pageNum - 1) * perPage;

  const where: Prisma.MaintenanceRecordWhereInput = {};

  if (params.status) where.status = params.status as Prisma.EnumMaintenanceStatusFilter["equals"];
  if (params.type) where.type = params.type as Prisma.EnumMaintenanceTypeFilter["equals"];
  if (params.priority) where.priority = params.priority as Prisma.EnumPriorityFilter["equals"];
  if (params.device_id) where.device_id = params.device_id;

  const [rows, total] = await Promise.all([
    prisma.maintenanceRecord.findMany({
      where,
      orderBy: { created_at: "desc" },
      skip,
      take: perPage,
      include: {
        device: { select: { name: true } },
        technician: { select: { name: true } },
      },
    }),
    prisma.maintenanceRecord.count({ where }),
  ]);

  const records = rows.map((r) => ({
    ...r,
    device_name: r.device?.name,
    technician_name: r.technician?.name,
  })) as unknown as MaintenanceRecord[];

  const write = canWrite(session.role);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mantenimiento</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {total.toLocaleString()} registro{total !== 1 ? "s" : ""}
          </p>
        </div>
        {write && (
          <Link
            href="/dashboard/maintenance/new"
            className="flex items-center gap-2 bg-accent hover:bg-accent-dark text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Registro
          </Link>
        )}
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: "Todos", href: "/dashboard/maintenance" },
          { label: "⏳ Programados", href: "/dashboard/maintenance?status=scheduled" },
          { label: "🔧 En progreso", href: "/dashboard/maintenance?status=in_progress" },
          { label: "✅ Completados", href: "/dashboard/maintenance?status=completed" },
          { label: "🚨 Críticos", href: "/dashboard/maintenance?priority=critical" },
        ].map((f) => (
          <Link
            key={f.href}
            href={f.href}
            className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-all"
          >
            {f.label}
          </Link>
        ))}
      </div>

      <MaintenanceTable
        records={serialize(records) as unknown as MaintenanceRecord[]}
        total={total}
        page={pageNum}
        totalPages={Math.ceil(total / perPage)}
        canWrite={write}
        isAdmin={session.role === "admin"}
      />
    </div>
  );
}
