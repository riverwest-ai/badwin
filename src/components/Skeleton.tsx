export function CardSkeleton() {
  return (
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="h-3 bg-gray-800 rounded w-20" />
        <div className="h-5 bg-gray-800 rounded-full w-12" />
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-800 rounded w-32" />
          <div className="h-3 bg-gray-800 rounded w-24" />
        </div>
        <div className="h-8 bg-gray-800 rounded w-16" />
      </div>
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800 animate-pulse space-y-4">
      <div className="h-3 bg-gray-800 rounded w-16" />
      <div className="h-16 bg-gray-800 rounded w-36" />
      <div className="flex gap-4">
        <div className="h-8 bg-gray-800 rounded w-16" />
        <div className="h-8 bg-gray-800 rounded w-16" />
      </div>
      <div className="h-2 bg-gray-800 rounded-full" />
    </div>
  );
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
