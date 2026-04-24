export function AlbumGridSkeleton() {
  return (
    <div className="rounded-2xl bg-[var(--color-bg-surface)] p-6 ring-1 ring-[var(--color-border)]">
      <div className="mb-6 h-6 w-24 animate-pulse rounded bg-[var(--color-bg-elevated)]" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-xl bg-[var(--color-bg-elevated)] aspect-square" />
        ))}
      </div>
    </div>
  );
}
