"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import Link from "next/link";
import { usePlayer } from "@/context/PlayerContext";
import { LikeButton } from "./LikeButton";
import { ShareButton } from "./ShareButton";
import { TierBadge } from "./TierBadge";
import { pickCoverColor } from "@/utils/coverColor";
import type { PlaylistTrack } from "@/types/player";

/** 최신 등록 곡 (New Releases) — 전체 공개 트랙 표시, 클릭 시 개인 재생목록에 추가 */
export function NewReleases() {
  const { publicTracks, newReleases, currentTrack, playTrack, addTrack } = usePlayer();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const filtered = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return publicTracks;
    return publicTracks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q),
    );
  }, [publicTracks, debouncedQuery]);

  const handleTrackClick = useCallback(
    (track: PlaylistTrack) => {
      const existingIndex = newReleases.findIndex((t) => t.id === track.id);
      if (existingIndex !== -1) {
        playTrack(existingIndex);
      } else {
        addTrack(track);
      }
    },
    [newReleases, playTrack, addTrack],
  );

  return (
    <section
      id="new-releases"
      className="rounded-2xl bg-[var(--color-bg-surface)] p-6 ring-1 ring-[var(--color-border)]"
    >
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-[var(--color-text-primary)]">최신 등록 곡</h2>
          <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">New Releases</p>
        </div>
      </div>

      {/* 검색 바 */}
      {publicTracks.length > 0 && (
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="제목 또는 아티스트로 검색"
            className="w-full rounded-xl bg-[var(--color-bg-elevated)] py-2.5 pl-9 pr-4 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] outline-none ring-1 ring-[var(--color-border)] focus:ring-[var(--color-accent)]"
          />
        </div>
      )}

      {publicTracks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--color-border)] py-12 text-center">
          <p className="text-sm text-[var(--color-text-muted)]">아직 등록된 곡이 없어요.</p>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">위의 &quot;곡 올리기&quot;로 MP3를 추가해 보세요.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--color-border)] py-8 text-center">
          <p className="text-sm text-[var(--color-text-muted)]">&quot;{query}&quot; 검색 결과가 없습니다.</p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-2">
          {filtered.map((track) => {
            const isActive = currentTrack?.id === track.id;
            const trackNumber = publicTracks.indexOf(track) + 1;
            return (
              <li
                key={track.id}
                role="button"
                tabIndex={0}
                onClick={() => handleTrackClick(track)}
                onKeyDown={(e) => e.key === "Enter" && handleTrackClick(track)}
                className={`flex cursor-pointer items-center gap-4 rounded-xl py-3 px-4 transition hover:bg-[var(--color-bg-hover)] ${
                  isActive ? "bg-white/5 ring-1 ring-[var(--color-accent)]/30" : ""
                }`}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-subtle)] text-sm font-bold text-[var(--color-accent)]">
                  {isActive ? (
                    <span className="flex items-end gap-[2px] h-4">
                      <span className="w-[3px] rounded-sm bg-[var(--color-accent)] equalizer-bar-1" style={{ height: 4 }} />
                      <span className="w-[3px] rounded-sm bg-[var(--color-accent)] equalizer-bar-2" style={{ height: 10 }} />
                      <span className="w-[3px] rounded-sm bg-[var(--color-accent)] equalizer-bar-3" style={{ height: 7 }} />
                    </span>
                  ) : trackNumber}
                </span>
                <div
                  className={`h-12 w-12 shrink-0 rounded-lg bg-gradient-to-br ${pickCoverColor(track.id)}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-[var(--color-text-primary)]">{track.title}</p>
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
                </div>
                <LikeButton trackId={track.id} initialLikeCount={track.like_count ?? 0} />
                <ShareButton trackId={track.id} artistName={track.artist} />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
