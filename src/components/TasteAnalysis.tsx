"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { getTasteAnalysis, type TasteAnalysis } from "@/utils/supabase/tracks";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import TopArtistsChart from "./TopArtistsChart";
import Last7DaysChart from "./Last7DaysChart";

export default function TasteAnalysisSection() {
  const [analysis, setAnalysis] = useState<TasteAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tasteDescription, setTasteDescription] = useState<string | null>(null);
  const [descLoading, setDescLoading] = useState(false);

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

  const fetchTasteDescription = async () => {
    setDescLoading(true);
    try {
      const res = await fetch("/api/user/taste-description", { method: "POST" });
      const data = (await res.json()) as { description?: string; error?: string };
      if (data.description) setTasteDescription(data.description);
    } catch (err) {
      console.error("[TasteDescription]", err);
    } finally {
      setDescLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="rounded-2xl bg-[var(--color-bg-surface)] p-6 ring-1 ring-[var(--color-border)]">
        <LoadingState />
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-2xl bg-[var(--color-bg-surface)] p-6 ring-1 ring-[var(--color-border)]">
        <ErrorState message={error} />
      </section>
    );
  }

  if (!analysis) {
    return (
      <section className="rounded-2xl bg-[var(--color-bg-surface)] p-6 ring-1 ring-[var(--color-border)]">
        <EmptyState
          title="아직 재생 기록이 없습니다."
          description="곡을 재생하면 여기에 표시됩니다."
        />
      </section>
    );
  }

  return (
    <section className="rounded-2xl bg-[var(--color-bg-surface)] p-6 ring-1 ring-[var(--color-border)] space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-[var(--color-text-primary)]">취향 분석</h2>
        <button
          type="button"
          onClick={fetchTasteDescription}
          disabled={descLoading}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)] transition hover:text-[var(--color-accent)] hover:ring-[var(--color-accent)] disabled:opacity-50"
        >
          <Sparkles className="h-3.5 w-3.5" />
          {descLoading ? "분석 중…" : "AI 취향 분석"}
        </button>
      </div>

      {tasteDescription && (
        <div className="rounded-xl bg-gradient-to-r from-[var(--color-accent)]/10 to-purple-900/10 p-4 ring-1 ring-[var(--color-accent)]/20">
          <div className="flex items-start gap-2">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-accent)]" />
            <p className="text-sm text-[var(--color-text-primary)] leading-relaxed">
              {tasteDescription}
            </p>
          </div>
        </div>
      )}

      <TopArtistsChart artists={analysis.topArtists} />
      <Last7DaysChart days={analysis.last7Days} />
    </section>
  );
}
