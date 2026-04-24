export function DiscoverySkeleton() {
  return (
    <div>
      <div className="mb-4 h-6 w-16 animate-pulse rounded bg-[var(--color-bg-elevated)]" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="animate-pulse h-20 rounded-xl bg-[var(--color-bg-elevated)]" />
        ))}
      </div>
    </div>
  );
}
