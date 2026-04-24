import { Chart } from "@/components/Chart";

export const metadata = {
  title: "차트 | OMG",
  description: "실시간 TOP 차트",
};

export default function ChartPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 lg:px-6">
      <h1 className="mb-6 text-2xl font-bold text-[var(--color-text-primary)]">
        실시간 차트
      </h1>
      <Chart />
    </div>
  );
}
