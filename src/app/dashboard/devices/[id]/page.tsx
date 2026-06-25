import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getDeviceAction } from "@/actions/devices";
import { getSession, canWrite } from "@/lib/auth";
import { getMaintenanceAction } from "@/actions/maintenance";
import DeviceDetail from "@/components/devices/DeviceDetail";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function DeviceDetailPage({ params }: Props) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const [device, maintenanceResult] = await Promise.all([
    getDeviceAction(id),
    getMaintenanceAction({ device_id: id, per_page: 10 }),
  ]);

  if (!device) notFound();

  const write = canWrite(session.role);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard/devices" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
            ← Equipos
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">{device.name}</h1>
          <p className="text-gray-500 text-sm">{device.brand} {device.model}</p>
        </div>
        {write && (
          <Link
            href={`/dashboard/devices/${id}/edit`}
            className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-dark text-white text-sm font-medium rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Editar
          </Link>
        )}
      </div>

      <DeviceDetail device={device} maintenanceRecords={maintenanceResult.data} canWrite={write} />
    </div>
  );
}
