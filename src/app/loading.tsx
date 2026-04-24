import { HeroBannerSkeleton } from "@/components/skeletons/HeroBannerSkeleton";
import { DiscoverySkeleton } from "@/components/skeletons/DiscoverySkeleton";
import { AlbumGridSkeleton } from "@/components/skeletons/AlbumGridSkeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 lg:px-6">
      <HeroBannerSkeleton />
      <div className="mt-8 space-y-8">
        {/* NewReleases 스켈레톤 */}
        <div className="space-y-3">
          <div className="h-6 w-32 rounded-lg bg-[var(--color-bg-elevated)] animate-pulse" />
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl p-3">
              <div className="h-10 w-10 shrink-0 rounded-lg bg-[var(--color-bg-elevated)] animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-2/3 rounded bg-[var(--color-bg-elevated)] animate-pulse" />
                <div className="h-3 w-1/3 rounded bg-[var(--color-bg-elevated)] animate-pulse" />
              </div>
            </div>
          ))}
        </div>
        <DiscoverySkeleton />
        <AlbumGridSkeleton />
      </div>
    </div>
  );
}
