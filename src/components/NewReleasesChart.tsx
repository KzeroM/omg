"use client";

import { Play, Clock } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useLatestTracks } from "@/hooks/useChartTracks";
import { usePlayer } from "@/context/PlayerContext";
import { TierBadge } from "./TierBadge";
import { ShareButton } from "./ShareButton";
import { AddToPlaylistButton } from "./AddToPlaylistButton";
import { TrackRow } from "./TrackRow";
import { formatKoreanNumber } from "@/utils/formatNumber";
import type { PlaylistTrack } from "@/types/player";

const SHOW_INITIAL = 5;

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "방금";
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  return `${Math.floor(diff / 86400)}일 전`;
}

export function NewReleasesChart() {
  const [showAll, setShowAll] = useState(false);
  const { data, isSuccess } = useLatestTracks(20);
  const { playSingleTrack, currentTrack } = usePlayer();

  if (!isSuccess || !data || data.length === 0) return null;

  const visible = showAll ? data : data.slice(0, SHOW_INITIAL);

  return (
    <section className="rounded-2xl bg-[var(--color-bg-surface)] p-6 ring-1 ring-[var(--color-border)]">
      <div className="mb-4 flex items-center gap-2">
        <Clock className="h-4 w-4 text-[var(--color-accent)]" strokeWidth={1.5} />
        <h2 className="text-lg font-bold text-[var(--color-text-primary)]">최신 등록곡</h2>
      </div>

      <ul className="grid grid-cols-1 gap-2">
        {visible.map((track, i) => {
          const isActive = currentTrack?.id === track.id;
          return (
            <TrackRow
              key={track.id}
              coverColor={track.coverColor}
              title={track.title}
              isActive={isActive}
              onClick={() => void playSingleTrack(track as PlaylistTrack)}
              leading={
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-bg-elevated)] text-xs font-bold text-[var(--color-text-muted)]">
                  {i + 1}
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
                </span>
              }
            />
          );
        })}
      </ul>

      {data.length > SHOW_INITIAL && (
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="rounded-xl px-6 py-2 text-sm font-medium text-[var(--color-accent)] ring-1 ring-[var(--color-accent)]/30 transition hover:bg-[var(--color-accent-subtle)]"
          >
            {showAll ? '접기' : `더보기 (${data.length - SHOW_INITIAL}곡 더)`}
          </button>
        </div>
      )}
    </section>
  );
}
