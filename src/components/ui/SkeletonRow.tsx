interface SkeletonRowProps {
  count?: number;
  variant?: "track" | "chart" | "compact";
}

export function SkeletonRow({ count = 1, variant = "track" }: SkeletonRowProps) {
  const height = variant === "compact" ? "h-10" : "h-14";
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`flex items-center gap-3 px-3 py-2 animate-pulse`}>
          <div className="h-10 w-10 shrink-0 rounded-lg bg-[var(--color-bg-elevated)]" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-2/3 rounded bg-[var(--color-bg-elevated)]" />
            <div className="h-2.5 w-1/2 rounded bg-[var(--color-bg-elevated)]" />
          </div>
          <div className="h-3 w-12 rounded bg-[var(--color-bg-elevated)]" />
        </div>
      ))}
    </>
  );
}
