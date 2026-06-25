import TicketForm from "@/components/tickets/TicketForm";

export const metadata = {
  title: "Reportar problema técnico",
  description: "Formulario para reportar problemas técnicos al departamento de TI",
};

export default function ReportarPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* ── Header ──────────────────────────── */}
        <div className="text-center mb-10">
          {/* Logo */}
          <img
            src="/logoQuirama.png"
            alt="Quirama"
            className="w-[130px] h-auto mx-auto mb-6"
          />

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Reportar un problema técnico
          </h1>
          <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto">
            Completá el formulario con los detalles del problema y el equipo de TI
            te va a ayudar lo antes posible.
          </p>
        </div>

        {/* ── Form ────────────────────────────── */}
        <div className="card p-6 md:p-8">
          <TicketForm />
        </div>

        {/* ── Footer ──────────────────────────── */}
        <p className="text-center text-gray-400 text-xs mt-8">
          Acceso restringido al personal autorizado de Quirama
        </p>
      </div>
    </div>
  );
}
