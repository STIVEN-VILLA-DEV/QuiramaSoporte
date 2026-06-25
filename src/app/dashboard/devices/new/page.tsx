import { redirect } from "next/navigation";
import { getSession, canWrite } from "@/lib/auth";
import DeviceForm from "@/components/devices/DeviceForm";

export const metadata = { title: "Nuevo Equipo" };

export default async function NewDevicePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!canWrite(session.role)) redirect("/dashboard/devices");

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Registrar Nuevo Equipo</h1>
        <p className="text-gray-500 text-sm mt-0.5">Complete la información técnica del dispositivo</p>
      </div>
      <DeviceForm />
    </div>
  );
}
