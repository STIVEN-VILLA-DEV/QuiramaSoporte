export default function NewMaintenanceLoading() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-8 w-64 bg-gray-200 rounded-lg" />
        <div className="h-4 w-96 bg-gray-200 rounded" />
      </div>

      <div className="card p-6 space-y-5">
        <div className="h-4 w-48 bg-gray-200 rounded" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-20 bg-gray-200 rounded" />
              <div className="h-10 bg-gray-100 rounded-lg" />
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <div className="h-3 w-12 bg-gray-200 rounded" />
          <div className="h-10 bg-gray-100 rounded-lg" />
        </div>

        <div className="space-y-2">
          <div className="h-3 w-16 bg-gray-200 rounded" />
          <div className="h-20 bg-gray-100 rounded-lg" />
        </div>

        <div className="flex justify-end gap-4 pt-2">
          <div className="h-10 w-24 bg-gray-200 rounded-lg" />
          <div className="h-10 w-32 bg-gray-200 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
