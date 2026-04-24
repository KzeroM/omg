"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { Search, Play, Pause, X } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { formatKoreanNumber } from "@/utils/formatNumber";
import { usePlayer } from "@/context/PlayerContext";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import type { PlaylistTrack } from "@/types/player";

interface Tag {
  id: string;
  name: string;
  category: string;
}

interface SearchTrack {
  id: string;
  title: string;
  artist: string;
  file_path?: string;
  play_count: number;
  like_count: number;
  coverColor: string;
  uploader_nickname?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  genre: "장르",
  mood: "무드",
  tempo: "템포",
  instrument: "악기",
  vocal: "보컬",
  era: "시대",
};

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sort, setSort] = useState<"popular" | "newest">("popular");
  const [tags, setTags] = useState<Tag[]>([]);
  const [results, setResults] = useState<SearchTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const { playSingleTrack, currentTrack, isPlaying, togglePlay } = usePlayer();

  // 태그 목록 로드
  useEffect(() => {
    const supabase = createClient();
    void supabase
      .from("tags")
      .select("id, name, category")
      .order("category")
      .order("name")
      .then(({ data }) => {
        setTags((data ?? []) as Tag[]);
      });
  }, []);

  // 검색어 디바운스 (300ms)
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  // 검색 실행
  const runSearch = useCallback(async () => {
    if (!debouncedQuery && selectedTags.length === 0) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const params = new URLSearchParams();
      if (debouncedQuery) params.set("q", debouncedQuery);
      if (selectedTags.length > 0) params.set("tags", selectedTags.join(","));
      params.set("sort", sort);

      const res = await fetch(`/api/search?${params.toString()}`);
      const json = await res.json() as { tracks?: SearchTrack[] };
      setResults(json.tracks ?? []);
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, selectedTags, sort]);

  useEffect(() => {
    void runSearch();
  }, [runSearch]);

  const toggleTag = (id: string) => {
    setSelectedTags((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  // 카테고리별 태그 그룹화
  const tagsByCategory = useMemo(() => {
    const map = new Map<string, Tag[]>();
    for (const tag of tags) {
      const existing = map.get(tag.category);
      if (existing) existing.push(tag);
      else map.set(tag.category, [tag]);
    }
    return map;
  }, [tags]);

  const hasFilters = debouncedQuery || selectedTags.length > 0;

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 lg:px-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">검색</h1>
      </div>

      {/* 검색 입력 */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="곡 제목, 아티스트 검색"
          className="w-full rounded-xl bg-[var(--color-bg-surface)] py-3 pl-10 pr-10 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] outline-none ring-1 ring-[var(--color-border)] focus:ring-[var(--color-accent)]"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* 태그 필터 */}
      {tagsByCategory.size > 0 && (
        <div className="space-y-3">
          {[...tagsByCategory.entries()].map(([category, categoryTags]) => (
            <div key={category}>
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                {CATEGORY_LABELS[category] ?? category}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {categoryTags.map((tag) => {
                  const active = selectedTags.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                        active
                          ? "bg-[var(--color-accent)] text-white"
                          : "bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)] hover:ring-[var(--color-accent)] hover:text-[var(--color-accent)]"
                      }`}
                    >
                      {tag.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 활성 필터 + 정렬 */}
      {hasFilters && (
        <div className="flex items-center justify-between gap-4">
          {selectedTags.length > 0 && (
            <button
              type="button"
              onClick={() => setSelectedTags([])}
              className="flex items-center gap-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
            >
              <X className="h-3 w-3" />
              태그 초기화
            </button>
          )}
          <div className="ml-auto flex items-center gap-1 rounded-lg bg-[var(--color-bg-surface)] p-0.5 ring-1 ring-[var(--color-border)]">
            <button
              type="button"
              onClick={() => setSort("popular")}
              className={`rounded-md px-3 py-1 text-xs transition ${sort === "popular" ? "bg-[var(--color-accent)] text-white" : "text-[var(--color-text-secondary)]"}`}
            >
              인기순
            </button>
            <button
              type="button"
              onClick={() => setSort("newest")}
              className={`rounded-md px-3 py-1 text-xs transition ${sort === "newest" ? "bg-[var(--color-accent)] text-white" : "text-[var(--color-text-secondary)]"}`}
            >
              최신순
            </button>
          </div>
        </div>
      )}

      {/* 결과 */}
      {loading ? (
        <LoadingState message="검색 중…" />
      ) : searched && results.length === 0 ? (
        <EmptyState title="검색 결과가 없습니다." description="다른 키워드나 태그를 시도해보세요." />
      ) : results.length > 0 ? (
        <div className="space-y-1">
          <p className="text-xs text-[var(--color-text-muted)]">{results.length}개 결과</p>
          <ul className="divide-y divide-[var(--color-border)] rounded-2xl bg-[var(--color-bg-surface)] ring-1 ring-[var(--color-border)] overflow-hidden">
            {results.map((track) => {
              const isActive = currentTrack?.id === track.id;
              return (
                <li
                  key={track.id}
                  className={`flex items-center gap-3 px-4 py-3 transition hover:bg-[var(--color-bg-hover)] ${isActive ? "bg-white/5" : ""}`}
                >
                  {/* 커버 */}
                  <div
                    className={`h-10 w-10 shrink-0 rounded-lg bg-gradient-to-br ${track.coverColor}`}
                  />
                  {/* 정보 */}
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-sm font-medium ${isActive ? "text-[var(--color-accent)]" : "text-[var(--color-text-primary)]"}`}>
                      {track.title}
                    </p>
                    <p className="truncate text-xs text-[var(--color-text-secondary)]">
                      {track.artist}
                      {track.uploader_nickname && (
                        <span className="ml-1 text-[var(--color-text-muted)]">· {track.uploader_nickname}</span>
                      )}
                    </p>
                  </div>
                  {/* 재생수 */}
                  <span className="shrink-0 text-xs text-[var(--color-text-muted)]">
                    {formatKoreanNumber(track.play_count)}회
                  </span>
                  {/* 재생 버튼 */}
                  <button
                    type="button"
                    onClick={() => {
                      if (isActive) {
                        togglePlay();
                      } else {
                        playSingleTrack(track as unknown as PlaylistTrack);
                      }
                    }}
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition ${
                      isActive
                        ? "bg-[var(--color-accent)] text-white"
                        : "bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] hover:bg-[var(--color-accent)] hover:text-white"
                    }`}
                    aria-label={isActive && isPlaying ? "일시 정지" : "재생"}
                  >
                    {isActive && isPlaying ? (
                      <Pause className="h-3.5 w-3.5" strokeWidth={2} />
                    ) : (
                      <Play className="ml-0.5 h-3.5 w-3.5" strokeWidth={2} />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        /* 초기 상태 — 인기 태그 힌트 */
        <div className="py-8 text-center">
          <p className="text-sm text-[var(--color-text-muted)]">태그를 선택하거나 검색어를 입력하세요.</p>
        </div>
      )}
    </div>
  );
}
