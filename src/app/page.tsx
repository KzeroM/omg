import { Suspense } from "react";
import { HeroBanner } from "@/components/HeroBanner";
import { NewReleases } from "@/components/NewReleases";
import { NewReleasesChart } from "@/components/NewReleasesChart";
import { AlbumGridServer } from "@/components/AlbumGridServer";
import { DiscoverySectionServer } from "@/components/DiscoverySectionServer";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import { FollowedArtistsFeed } from "@/components/FollowedArtistsFeed";
import { HeroBannerSkeleton } from "@/components/skeletons/HeroBannerSkeleton";
import { DiscoverySkeleton } from "@/components/skeletons/DiscoverySkeleton";
import { AlbumGridSkeleton } from "@/components/skeletons/AlbumGridSkeleton";

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 lg:px-6">
      {/* 공지사항 배너 */}
      <AnnouncementBanner />

      {/* 히어로 배너 */}
      <Suspense fallback={<HeroBannerSkeleton />}>
        <HeroBanner />
      </Suspense>

      {/* 메인 콘텐츠 — 각 섹션 독립 스트리밍 */}
      <div className="mt-8 space-y-8">
        <NewReleases />
        <NewReleasesChart />
        <FollowedArtistsFeed />
        <Suspense fallback={<DiscoverySkeleton />}>
          <DiscoverySectionServer />
        </Suspense>
        <Suspense fallback={<AlbumGridSkeleton />}>
          <AlbumGridServer />
        </Suspense>
      </div>
    </div>
  );
}
