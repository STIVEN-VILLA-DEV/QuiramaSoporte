import { notFound, redirect } from "next/navigation";
import { getSession, canWrite } from "@/lib/auth";
import { prisma, serialize } from "@/lib/prisma";
import MaintenanceForm from "@/components/maintenance/MaintenanceForm";
import type { MaintenanceRecord } from "@/types";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditMaintenancePage({ params }: Props) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!canWrite(session.role)) redirect("/dashboard/maintenance");

  const { id } = await params;

  const [record, devices, technicians] = await Promise.all([
    prisma.maintenanceRecord.findUnique({ where: { id } }),
    prisma.device.findMany({
      where: { status: { not: "retired" } },
      select: { id: true, name: true, category: true },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: {
        role: { in: ["admin", "technician"] },
        is_active: true,
      },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!record) notFound();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Editar Mantenimiento</h1>
        <p className="text-gray-500 text-sm mt-0.5">{record.title}</p>
      </div>
      <MaintenanceForm
        record={serialize(record) as unknown as MaintenanceRecord}
        isEdit
        devices={serialize(devices) as { id: string; name: string; category: string }[]}
        technicians={serialize(technicians) as { id: string; name: string; email: string }[]}
      />
    </div>
  );
}
