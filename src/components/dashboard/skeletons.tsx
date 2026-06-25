export function AlertBannerSkeleton() {
  return <div className="shimmer h-20 rounded-xl bg-gray-100" />;
}

export function StatsGridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="shimmer h-32 rounded-xl bg-gray-100" />
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return <div className="shimmer card p-5 h-[400px]" />;
}

export function RecentMaintenanceSkeleton() {
  return <div className="shimmer card p-5 h-[300px]" />;
}
