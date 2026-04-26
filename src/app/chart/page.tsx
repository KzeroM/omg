import { Chart } from "@/components/Chart";

export const metadata = {
  title: "차트 | OMG",
  description: "일간/주간/월간 인기 차트",
};

export default function ChartPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8 lg:px-6">
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">차트</h1>

      {/* 인기 차트 — 기간 + 태그 필터 */}
      <Chart />
    </div>
  );
}
