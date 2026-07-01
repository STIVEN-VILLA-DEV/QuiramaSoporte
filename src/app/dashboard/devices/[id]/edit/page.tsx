import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import dynamicImport from "next/dynamic";
import { getDeviceAction } from "@/actions/devices";
import { getSession, canWrite } from "@/lib/auth";

const DeviceForm = dynamicImport(() => import("@/components/devices/DeviceForm"), {
  loading: () => (
    <div className="animate-pulse space-y-4">
      <div className="h-10 bg-gray-200 rounded-lg w-1/3" />
      <div className="h-64 bg-gray-200 rounded-lg" />
      <div className="h-10 bg-gray-200 rounded-lg w-1/4 ml-auto" />
    </div>
  ),
});

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditDevicePage({ params }: Props) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!canWrite(session.role)) redirect("/dashboard/devices");

  const { id } = await params;
  const device = await getDeviceAction(id);
  if (!device) notFound();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Link href={`/dashboard/devices/${id}`} className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
          ← {device.name}
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-1">Editar Equipo</h1>
        <p className="text-gray-500 text-sm mt-0.5">Actualiza la información de {device.name}</p>
      </div>
      <DeviceForm device={device} isEdit />
    </div>
  );
}
