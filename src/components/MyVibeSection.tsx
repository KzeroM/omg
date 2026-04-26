"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, BarChart2 } from "lucide-react";
import type { TasteTag } from "@/app/api/user/taste-tags/route";

const CATEGORY_KO: Record<string, string> = {
  genre: "장르",
  mood: "무드",
  bpm: "템포",
  instrument: "악기",
};

const CATEGORY_COLORS: Record<string, string> = {
  genre:      "bg-purple-500",
  mood:       "bg-sky-500",
  bpm:        "bg-amber-500",
  instrument: "bg-emerald-500",
};

export function MyVibeSection() {
  const [tags, setTags] = useState<TasteTag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/user/taste-tags")
      .then((r) => r.json() as Promise<{ tags: TasteTag[] }>)
      .then((d) => setTags(d.tags ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-2">
        {[80, 55, 40, 30, 20].map((w, i) => (
          // eslint-disable-next-line react/no-array-index-key
          <div key={i} className="flex items-center gap-3">
            <div className="h-3 w-16 animate-pulse rounded bg-[var(--color-bg-hover)]" />
            <div className={`h-3 animate-pulse rounded bg-[var(--color-bg-hover)]`} style={{ width: `${w}%` }} />
          </div>
        ))}
      </div>
    );
  }

  if (tags.length === 0) {
    return (
      <p className="text-sm text-[var(--color-text-muted)]">
        곡을 재생하거나 좋아요를 누르면 취향이 분석돼요.
      </p>
    );
  }

  // 차트 링크: 상위 3개 태그 ID
  const topTagIds = tags.slice(0, 3).map((t) => t.id).join(",");
  const chartHref = `/chart?tags=${topTagIds}`;

  return (
    <div className="space-y-4">
      {/* 태그 바 차트 */}
      <ul className="space-y-2.5">
        {tags.map((tag) => (
          <li key={tag.id} className="flex items-center gap-3">
            <span className="w-20 shrink-0 truncate text-xs text-[var(--color-text-secondary)]">
              {tag.name}
              <span className="ml-1 text-[10px] text-[var(--color-text-muted)]">
                ({CATEGORY_KO[tag.category] ?? tag.category})
              </span>
            </span>
            <div className="flex flex-1 items-center gap-2">
              <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-[var(--color-bg-hover)]">
                <div
                  className={`absolute inset-y-0 left-0 rounded-full transition-all ${
                    CATEGORY_COLORS[tag.category] ?? "bg-[var(--color-accent)]"
                  }`}
                  style={{ width: `${tag.pct}%` }}
                />
              </div>
              <span className="w-8 text-right text-xs tabular-nums text-[var(--color-text-muted)]">
                {tag.pct}%
              </span>
            </div>
          </li>
        ))}
      </ul>

      {/* 개인화 차트 CTA */}
      <Link
        href={chartHref}
        className="flex items-center justify-between rounded-xl bg-[var(--color-accent-subtle)] px-4 py-3 transition hover:bg-[var(--color-accent)]/20"
      >
        <div className="flex items-center gap-2">
          <BarChart2 className="h-4 w-4 text-[var(--color-accent)]" strokeWidth={1.5} />
          <span className="text-sm font-semibold text-[var(--color-accent)]">
            내 취향으로 차트 보기
          </span>
        </div>
        <Sparkles className="h-4 w-4 text-[var(--color-accent)]" strokeWidth={1.5} />
      </Link>
    </div>
  );
}
