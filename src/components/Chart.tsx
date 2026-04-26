"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Filter, X, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { TOP_CHART } from "@/data/chart";
import { getAllTagsByCategory } from "@/utils/supabase/tags";
import { createClient } from "@/utils/supabase/client";
import { usePlayer } from "@/context/PlayerContext";
import { useQueryClient } from "@tanstack/react-query";
import { useChartTracks, type ChartPeriod } from "@/hooks/useChartTracks";
import { FoundingMemberBadge } from "./FoundingMemberBadge";
import { TierBadge } from "./TierBadge";
import { ShareButton } from "./ShareButton";
import { ReportButton } from "./ReportButton";
import { AddToPlaylistButton } from "./AddToPlaylistButton";
import { TrackRow } from "./TrackRow";
import { formatKoreanNumber } from "@/utils/formatNumber";
import type { PlaylistTrack } from "@/types/player";
import type { TagsByCategory } from "@/types/tag";

const PERIOD_OPTIONS: { value: ChartPeriod; label: string }[] = [
  { value: 'daily',   label: '일간' },
  { value: 'weekly',  label: '주간' },
  { value: 'monthly', label: '월간' },
];

const CATEGORY_KO: Record<string, string> = {
  genre: '장르', mood: '무드', bpm: 'BPM', instrument: '악기',
};

const SHOW_INITIAL = 5;

export function Chart() {
  const searchParams = useSearchParams();
  const [period, setPeriod]           = useState<ChartPeriod>('weekly');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(() => {
    const tags = searchParams.get("tags");
    return tags ? tags.split(",").filter(Boolean) : [];
  });
  const [showAll, setShowAll]         = useState(false);
  const [filterOpen, setFilterOpen]   = useState(false);
  const [tagsByCategory, setTagsByCategory] = useState<TagsByCategory>({ genre: [], mood: [], bpm: [], instrument: [] });

  const queryClient = useQueryClient();
  const { playSingleTrack, currentTrack } = usePlayer();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data, isSuccess } = useChartTracks(period, selectedTagIds, 50);
  const allTracks = isSuccess && data && data.length > 0 ? data : TOP_CHART;
  const visible   = showAll ? allTracks : allTracks.slice(0, SHOW_INITIAL);
  const live      = isSuccess && !!data && data.length > 0;

  // 태그 목록 로드
  useEffect(() => {
    getAllTagsByCategory().then(setTagsByCategory).catch(() => {});
  }, []);

  // 리얼타임 구독 — tracks 변경 시 현재 period/tags 쿼리 무효화
  useEffect(() => {
    const supabase = createClient();
    const tagKey = [...selectedTagIds].sort().join(',');

    const channel = supabase
      .channel(`chart-${period}-${tagKey}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tracks' }, () => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
          void queryClient.invalidateQueries({ queryKey: ['tracks', 'chart', period, tagKey, 50] });
        }, 300);
      })
      .subscribe();

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      void supabase.removeChannel(channel);
    };
  }, [period, selectedTagIds, queryClient]);

  const toggleTag = (id: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
    setShowAll(false);
  };

  const clearTags = () => { setSelectedTagIds([]); setShowAll(false); };

  const allTags = Object.values(tagsByCategory).flat();

  return (
    <section className="rounded-2xl bg-[var(--color-bg-surface)] p-6 ring-1 ring-[var(--color-border)]">
      {/* 헤더 */}
      <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-[var(--color-text-primary)]">인기 차트</h2>
          {live && (
            <span className="flex items-center gap-1.5 rounded-full bg-[var(--color-accent-subtle)] px-3 py-1 text-xs font-medium text-[var(--color-accent)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)] animate-pulse" />
              LIVE
            </span>
          )}
        </div>

        {/* 기간 탭 */}
        <div className="flex gap-1 rounded-xl bg-[var(--color-bg-elevated)] p-1">
          {PERIOD_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => { setPeriod(value); setShowAll(false); }}
              className={`rounded-lg px-3 py-1 text-sm font-medium transition ${
                period === value
                  ? 'bg-[var(--color-accent)] text-white'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 취향 필터 토글 버튼 */}
      <div className="mb-4">
        <button
          type="button"
          onClick={() => setFilterOpen((o) => !o)}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium ring-1 transition ${
            selectedTagIds.length > 0
              ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)] ring-[var(--color-accent)]/30'
              : 'text-[var(--color-text-muted)] ring-[var(--color-border)] hover:text-[var(--color-text-primary)]'
          }`}
        >
          <Filter className="h-3.5 w-3.5" strokeWidth={2} />
          취향 필터
          {selectedTagIds.length > 0 && (
            <span className="ml-0.5 rounded-full bg-[var(--color-accent)] px-1.5 py-0.5 text-[10px] text-white">
              {selectedTagIds.length}
            </span>
          )}
          {filterOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>

        {/* 선택된 태그 칩 */}
        {selectedTagIds.length > 0 && !filterOpen && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {selectedTagIds.map((id) => {
              const tag = allTags.find((t) => t.id === id);
              if (!tag) return null;
              return (
                <span
                  key={id}
                  className="flex items-center gap-1 rounded-full bg-[var(--color-accent-subtle)] px-2.5 py-1 text-xs text-[var(--color-accent)]"
                >
                  {tag.name}
                  <button type="button" onClick={() => toggleTag(id)} aria-label="태그 제거">
                    <X className="h-3 w-3" strokeWidth={2} />
                  </button>
                </span>
              );
            })}
            <button
              type="button"
              onClick={clearTags}
              className="rounded-full px-2.5 py-1 text-xs text-[var(--color-text-muted)] ring-1 ring-[var(--color-border)] hover:text-red-400 hover:ring-red-800 transition"
            >
              전체 해제
            </button>
          </div>
        )}
      </div>

      {/* 태그 필터 패널 */}
      {filterOpen && (
        <div className="mb-5 rounded-xl bg-[var(--color-bg-elevated)] p-4 ring-1 ring-[var(--color-border)]">
          {(Object.entries(tagsByCategory) as [string, typeof tagsByCategory.genre][]).map(([cat, tags]) => {
            if (tags.length === 0) return null;
            return (
              <div key={cat} className="mb-3 last:mb-0">
                <p className="mb-2 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">
                  {CATEGORY_KO[cat] ?? cat}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                        selectedTagIds.includes(tag.id)
                          ? 'bg-[var(--color-accent)] text-white'
                          : 'bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)] hover:ring-[var(--color-accent)]/50'
                      }`}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
          {selectedTagIds.length > 0 && (
            <button
              type="button"
              onClick={clearTags}
              className="mt-2 text-xs text-[var(--color-text-muted)] hover:text-red-400 transition"
            >
              전체 해제
            </button>
          )}
        </div>
      )}

      {/* 트랙 목록 */}
      {allTracks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--color-border)] py-12 text-center">
          <p className="text-sm text-[var(--color-text-muted)]">해당 조건의 곡이 없습니다.</p>
          {selectedTagIds.length > 0 && (
            <button type="button" onClick={clearTags} className="mt-2 text-sm text-[var(--color-accent)] hover:underline">
              필터 초기화
            </button>
          )}
        </div>
      ) : (
        <>
          <ul className="grid grid-cols-1 gap-2">
            {visible.map((track) => {
              const isActive = currentTrack?.id === track.id;
              return (
                <TrackRow
                  key={track.id}
                  coverColor={track.coverColor}
                  title={track.title}
                  isActive={isActive}
                  onClick={() => void playSingleTrack(track as PlaylistTrack)}
                  leading={
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                      track.rank === 1 ? 'bg-yellow-400/20 text-yellow-400' :
                      track.rank === 2 ? 'bg-slate-400/20 text-slate-300' :
                      track.rank === 3 ? 'bg-amber-600/20 text-amber-500' :
                      'bg-[var(--color-accent-subtle)] text-[var(--color-accent)]'
                    }`}>
                      {isActive ? (
                        <span className="flex items-end gap-[2px] h-4">
                          {[4, 10, 7].map((h, i) => (
                            <span
                              key={i}
                              className={`w-[3px] rounded-sm animate-pulse ${track.rank <= 3 ? 'bg-current' : 'bg-[var(--color-accent)]'}`}
                              style={{ height: h, animationDelay: `${i * 150}ms` }}
                            />
                          ))}
                        </span>
                      ) : track.rank}
                    </span>
                  }
                  subtitle={
                    <p className="flex flex-wrap items-center gap-2 truncate text-sm text-[var(--color-text-secondary)]">
                      <Link
                        href={`/artist/${encodeURIComponent(track.uploader_nickname ?? track.artist)}`}
                        onClick={(e) => e.stopPropagation()}
                        className="hover:text-[var(--color-accent)] transition"
                      >
                        {track.artist}
                      </Link>
                      {track.isFoundingMember && <FoundingMemberBadge />}
                      <TierBadge tier={track.artist_tier ?? 'basic'} size="sm" />
                    </p>
                  }
                  trailing={
                    <span className="hidden sm:contents">
                      {track.play_count != null && (
                        <span className="flex shrink-0 items-center gap-1 text-xs text-[var(--color-text-muted)]">
                          <Play className="h-3 w-3" strokeWidth={1.5} />
                          {formatKoreanNumber(track.play_count)}
                        </span>
                      )}
                      <AddToPlaylistButton trackId={track.id} />
                      <ShareButton trackId={track.id} artistName={track.artist} />
                      <ReportButton trackId={track.id} />
                    </span>
                  }
                />
              );
            })}
          </ul>

          {allTracks.length > SHOW_INITIAL && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setShowAll((v) => !v)}
                className="rounded-xl px-6 py-2 text-sm font-medium text-[var(--color-accent)] ring-1 ring-[var(--color-accent)]/30 transition hover:bg-[var(--color-accent-subtle)]"
              >
                {showAll ? `접기` : `더보기 (${allTracks.length - SHOW_INITIAL}곡 더)`}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
