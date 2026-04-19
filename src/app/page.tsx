import { Suspense } from "react";
import { HeroBanner } from "@/components/HeroBanner";
import { Chart } from "@/components/Chart";
import { AlbumGrid } from "@/components/AlbumGrid";
import { NewReleases } from "@/components/NewReleases";
import { DiscoverySection } from "@/components/DiscoverySection";

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 lg:px-6">
      {/* 히어로 배너 — 전체 너비 */}
      <Suspense fallback={null}>
        <HeroBanner />
      </Suspense>

      {/* 데스크톱 2컬럼: 메인 콘텐츠 + 차트 사이드바 */}
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* 메인 (좌측) */}
        <div className="min-w-0 space-y-8">
          <NewReleases />
          <DiscoverySection />
          <AlbumGrid />
        </div>

        {/* 차트 사이드바 (우측, sticky) */}
        <div className="lg:sticky lg:top-4 lg:self-start">
          <Chart />
        </div>
      </div>
    </div>
  );
}
