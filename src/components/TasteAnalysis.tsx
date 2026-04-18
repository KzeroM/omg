"use client";

import { useEffect, useState } from "react";
import { getTasteAnalysis, type TasteAnalysis } from "@/utils/supabase/tracks";
import TopArtistsChart from "./TopArtistsChart";
import Last7DaysChart from "./Last7DaysChart";

export default function TasteAnalysisSection() {
  const [analysis, setAnalysis] = useState<TasteAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const result = await getTasteAnalysis();
        setAnalysis(result);
      } catch (err) {
        console.error("[TasteAnalysis]", err);
        setError("취향 분석을 불러올 수 없습니다.");
      } finally {
        setLoading(false);
      }
    };

    void fetchAnalysis();
  }, []);

  if (loading) {
    return (
      <section className="rounded-2xl bg-[var(--color-bg-surface)] p-6 ring-1 ring-[var(--color-border)]">
        <p className="text-[var(--color-text-muted)]">불러오는 중…</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-2xl bg-[var(--color-bg-surface)] p-6 ring-1 ring-[var(--color-border)]">
        <p className="text-red-400">{error}</p>
      </section>
    );
  }

  if (!analysis) {
    return (
      <section className="rounded-2xl bg-[var(--color-bg-surface)] p-8 ring-1 ring-[var(--color-border)] text-center">
        <p className="text-[var(--color-text-muted)]">아직 재생 기록이 없습니다.</p>
        <p className="text-sm text-[var(--color-text-muted)] mt-2">곡을 재생하면 여기에 표시됩니다.</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl bg-[var(--color-bg-surface)] p-6 ring-1 ring-[var(--color-border)] space-y-6">
      <h2 className="text-lg font-bold text-[var(--color-text-primary)]">취향 분석</h2>
      <TopArtistsChart artists={analysis.topArtists} />
      <Last7DaysChart days={analysis.last7Days} />
    </section>
  );
}
