import Link from "next/link";

export const metadata = {
  title: "Reporte enviado",
  description: "Tu reporte técnico fue enviado con éxito",
};

export default async function ReportarSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* ── Checkmark icon ────────────────────── */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 mb-6">
          <svg
            className="w-10 h-10 text-emerald-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        {/* ── Title ─────────────────────────────── */}
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-3">
          ¡Reporte enviado con éxito!
        </h1>

        {/* ── Ticket ID (reference) ─────────────── */}
        {id && (
          <p className="text-sm text-gray-500 mb-2">
            Número de radicado:{" "}
            <span className="font-mono font-medium text-gray-700">
              {id.slice(0, 8)}
            </span>
          </p>
        )}

        {/* ── Message ───────────────────────────── */}
        <p className="text-gray-500 text-sm leading-relaxed mb-8">
          Gracias por reportar el problema. El equipo de TI recibió tu solicitud
          y te va a dar una respuesta pronto. Te recomendamos estar atento a tu
          correo electrónico para recibir novedades.
        </p>

        {/* ── Back link ─────────────────────────── */}
        <Link
          href="/reportar"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-[rgb(var(--accent))] hover:bg-[rgb(var(--accent-dark))] text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"
            />
          </svg>
          Reportar otro problema
        </Link>
      </div>
    </div>
  );
}
