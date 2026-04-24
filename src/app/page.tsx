import { Suspense } from "react";
import { HeroBanner } from "@/components/HeroBanner";
import { AlbumGrid } from "@/components/AlbumGrid";
import { NewReleases } from "@/components/NewReleases";
import { DiscoverySection } from "@/components/DiscoverySection";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 lg:px-6">
      {/* 공지사항 배너 */}
      <AnnouncementBanner />

      {/* 히어로 배너 — 전체 너비 */}
      <Suspense fallback={null}>
        <HeroBanner />
      </Suspense>

      {/* 메인 콘텐츠 */}
      <div className="mt-8 space-y-8">
        <NewReleases />
        <DiscoverySection />
        <AlbumGrid />
      </div>
    </div>
  );
}
