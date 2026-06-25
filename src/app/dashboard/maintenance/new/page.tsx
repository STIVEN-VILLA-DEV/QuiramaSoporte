import { redirect } from "next/navigation";
import { getSession, canWrite } from "@/lib/auth";
import { prisma, serialize } from "@/lib/prisma";
import MaintenanceForm from "@/components/maintenance/MaintenanceForm";

export const metadata = { title: "Nuevo Mantenimiento" };
export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ device_id?: string }>;
}

export default async function NewMaintenancePage({ searchParams }: Props) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!canWrite(session.role)) redirect("/dashboard/maintenance");

  const params = await searchParams;
  const [devices, technicians] = await Promise.all([
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

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Registrar Mantenimiento</h1>
        <p className="text-gray-500 text-sm mt-0.5">Crea un nuevo registro de mantenimiento o intervención técnica</p>
      </div>
      <MaintenanceForm
        devices={serialize(devices) as { id: string; name: string; category: string }[]}
        technicians={serialize(technicians) as { id: string; name: string; email: string }[]}
        defaultDeviceId={params.device_id}
      />
    </div>
  );
}
