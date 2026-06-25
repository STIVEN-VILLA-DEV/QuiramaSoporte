import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <p className="text-8xl font-bold text-gray-800 mb-4">404</p>
        <h2 className="text-xl font-semibold text-gray-500 mb-2">Página no encontrada</h2>
        <p className="text-gray-400 mb-6">El recurso que buscas no existe</p>
        <Link href="/dashboard" className="px-4 py-2 bg-accent hover:bg-accent-dark text-white rounded-lg transition-colors shadow-sm">
          Ir al Dashboard
        </Link>
      </div>
    </div>
  );
}
