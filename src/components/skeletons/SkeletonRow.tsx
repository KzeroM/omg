/** 트랙 한 행 스켈레톤 */
export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 rounded-xl px-4 py-3">
      <div className="h-10 w-10 shrink-0 animate-pulse rounded-lg bg-[var(--color-bg-hover)]" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-2/3 animate-pulse rounded bg-[var(--color-bg-hover)]" />
        <div className="h-3 w-1/3 animate-pulse rounded bg-[var(--color-bg-hover)]" />
      </div>
      <div className="h-8 w-8 animate-pulse rounded-lg bg-[var(--color-bg-hover)]" />
    </div>
  );
}

interface TrackListSkeletonProps {
  rows?: number;
}

/** 트랙 목록 스켈레톤 */
export function TrackListSkeleton({ rows = 5 }: TrackListSkeletonProps) {
  return (
    <div className="rounded-2xl bg-[var(--color-bg-surface)] p-6 ring-1 ring-[var(--color-border)]">
      <div className="mb-4 h-4 w-24 animate-pulse rounded bg-[var(--color-bg-hover)]" />
      <div className="flex flex-col gap-1">
        {Array.from({ length: rows }).map((_, i) => (
          // eslint-disable-next-line react/no-array-index-key
          <SkeletonRow key={i} />
        ))}
      </div>
    </div>
  );
}

/** 프로필 헤더 스켈레톤 */
export function ProfileHeaderSkeleton() {
  return (
    <div className="rounded-2xl bg-[var(--color-bg-surface)] p-6 ring-1 ring-[var(--color-border)]">
      <div className="flex items-start gap-5">
        <div className="h-16 w-16 shrink-0 animate-pulse rounded-full bg-[var(--color-bg-hover)]" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-5 w-36 animate-pulse rounded bg-[var(--color-bg-hover)]" />
          <div className="h-3.5 w-48 animate-pulse rounded bg-[var(--color-bg-hover)]" />
        </div>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl bg-[var(--color-bg-hover)]" />
        ))}
      </div>
    </div>
  );
}

/** 페이지 전체 스켈레톤 (헤더 + 트랙 목록) */
export function PageSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-8">
      <ProfileHeaderSkeleton />
      <TrackListSkeleton rows={rows} />
    </div>
  );
}
