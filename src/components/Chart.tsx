"use client";

import { useEffect, useRef } from "react";
import { Play } from "lucide-react";
import Link from "next/link";
import { TOP_CHART } from "@/data/chart";
import { getTopChartTracks } from "@/utils/supabase/tracks";
import { createClient } from "@/utils/supabase/client";
import { usePlayer } from "@/context/PlayerContext";
import { FoundingMemberBadge } from "./FoundingMemberBadge";
import { TierBadge } from "./TierBadge";
import { ShareButton } from "./ShareButton";
import { ReportButton } from "./ReportButton";
import { AddToPlaylistButton } from "./AddToPlaylistButton";
import { TrackRow } from "./TrackRow";
import { useChartTracks } from "@/hooks/useChartTracks";
import { useQueryClient } from "@tanstack/react-query";
import type { PlaylistTrack } from "@/types/player";

/** 실시간 차트 - play_count 기반 (React Query 캐시, Supabase 실시간 연동) */
export function Chart({ limit = 5 }: { limit?: number }) {
  const { data, isSuccess } = useChartTracks(limit);
  const tracks = isSuccess && data && data.length > 0 ? data : TOP_CHART;
  const live = isSuccess && !!data && data.length > 0;
  const queryClient = useQueryClient();
  const { playSingleTrack, currentTrack } = usePlayer();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("chart-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tracks" },
        () => {
          if (debounceRef.current) clearTimeout(debounceRef.current);
          debounceRef.current = setTimeout(() => {
            void queryClient.invalidateQueries({ queryKey: ["tracks", "chart", limit] });
          }, 300);
        }
      )
      .subscribe();

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      void supabase.removeChannel(channel);
    };
  }, [limit, queryClient]);

  return (
    <section id="chart" className="rounded-2xl bg-[var(--color-bg-surface)] p-6 ring-1 ring-[var(--color-border)]">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-[var(--color-text-primary)]">실시간 TOP {limit} 차트</h2>
        {live && (
          <span className="flex items-center gap-1.5 rounded-full bg-[var(--color-accent-subtle)] px-3 py-1 text-xs font-medium text-[var(--color-accent)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)] animate-pulse" />
            LIVE
          </span>
        )}
      </div>
      {tracks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--color-border)] py-12 text-center">
          <p className="text-sm text-[var(--color-text-muted)]">아직 재생 기록이 없어요.</p>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">곡을 재생하면 차트에 반영됩니다.</p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-2">
          {tracks.map((track) => {
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
                  track.rank === 1 ? "bg-yellow-400/20 text-yellow-400" :
                  track.rank === 2 ? "bg-slate-400/20 text-slate-300" :
                  track.rank === 3 ? "bg-amber-600/20 text-amber-500" :
                  "bg-[var(--color-accent-subtle)] text-[var(--color-accent)]"
                }`}>
                  {isActive ? (
                    <span className="flex items-end gap-[2px] h-4">
                      <span className={`w-[3px] rounded-sm equalizer-bar-1 ${track.rank <= 3 ? "bg-current" : "bg-[var(--color-accent)]"}`} style={{ height: 4 }} />
                      <span className={`w-[3px] rounded-sm equalizer-bar-2 ${track.rank <= 3 ? "bg-current" : "bg-[var(--color-accent)]"}`} style={{ height: 10 }} />
                      <span className={`w-[3px] rounded-sm equalizer-bar-3 ${track.rank <= 3 ? "bg-current" : "bg-[var(--color-accent)]"}`} style={{ height: 7 }} />
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
                  <TierBadge tier={track.artist_tier ?? "basic"} size="sm" />
                </p>
              }
              trailing={
                <span className="hidden sm:contents">
                  {track.play_count != null && (
                    <span className="flex shrink-0 items-center gap-1 text-xs text-[var(--color-text-muted)]">
                      <Play className="h-3 w-3" strokeWidth={1.5} />
                      {track.play_count.toLocaleString()}
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
      )}
    </section>
  );
}