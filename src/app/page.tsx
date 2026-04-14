import { Suspense } from "react";
import { HeroBanner } from "@/components/HeroBanner";
import { Chart } from "@/components/Chart";
import { NewReleases } from "@/components/NewReleases";

export default function Home() {
  return (
    <div className="mx-auto max-w-5xl space-y-8 px-6 py-8">
      <Suspense fallback={null}>
        <HeroBanner />
      </Suspense>
      <Chart />
      <NewReleases />
    </div>
  );
}
