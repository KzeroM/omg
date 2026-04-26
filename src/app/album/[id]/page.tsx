"use client";

import { use, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Play, Pause } from "lucide-react";
import { getAlbumWithTracks } from "@/utils/supabase/albums";
import { usePlayer } from "@/context/PlayerContext";
import { pickCoverColor } from "@/utils/coverColor";
import { TrackListSkeleton } from "@/components/skeletons/SkeletonRow";
import type { AlbumWithTracks, AlbumTrackItem } from "@/types/album";
import type { PlaylistTrack } from "@/types/player";

function toPlaylistTrack(item: AlbumTrackItem): PlaylistTrack {
  return {
    id: item.track_id,
    rank: 0,
    title: item.title ?? "제목 없음",
    artist: item.artist ?? "Unknown Artist",
    coverColor: pickCoverColor(item.track_id),
    isFoundingMember: false,
    file_path: item.file_path,
    artist_tier: "basic",
  };
}

export default function AlbumPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: albumId } = use(params);
  const [album, setAlbum] = useState<AlbumWithTracks | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const { currentTrack, isPlaying, addTrack, newReleases, playTrack } = usePlayer();

  const fetchAlbum = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAlbumWithTracks(albumId);
      if (!data) {
        setNotFound(true);
        setAlbum(null);
      } else {
        setAlbum(data);
        setNotFound(false);
      }
    } catch (err) {
      console.error("Failed to fetch album:", err);
      setNotFound(true);
      setAlbum(null);
    } finally {
      setLoading(false);
    }
  }, [albumId]);

  useEffect(() => {
    void fetchAlbum();
  }, [fetchAlbum]);

  const handlePlayAll = useCallback(() => {
    if (!album || album.tracks.length === 0) return;
    const track = album.tracks[0];
    const pt = toPlaylistTrack(track);
    addTrack(pt);
  }, [album, addTrack]);

  const handleTrackClick = useCallback(
    (track: AlbumTrackItem) => {
      const pt = toPlaylistTrack(track);
      const existingIndex = newReleases.findIndex((t) => t.id === track.track_id);
      if (existingIndex !== -1) {
        playTrack(existingIndex);
      } else {
        addTrack(pt);
      }
    },
    [newReleases, playTrack, addTrack]
  );

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-6 px-6 py-8">
        <div className="h-48 w-full animate-pulse rounded-2xl bg-[var(--color-bg-surface)]" />
        <TrackListSkeleton rows={5} />
      </div>
    );
  }

  if (notFound || !album) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)] transition hover:text-[var(--color-accent)]"
        >
          <ArrowLeft className="h-4 w-4" />
          돌아가기
        </Link>
        <div className="mt-8 rounded-xl border border-dashed border-[var(--color-border)] py-12 text-center">
          <p className="text-sm text-[var(--color-text-muted)]">앨범을 찾을 수 없습니다.</p>
          <Link
            href="/"
            className="mt-4 inline-block text-sm text-[var(--color-accent)] hover:underline"
          >
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const trackCount = album.tracks.length;

  return (
    <div className="mx-auto max-w-5xl px-6 py-8 space-y-8">
      {/* 뒤로가기 */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)] transition hover:text-[var(--color-accent)]"
      >
        <ArrowLeft className="h-4 w-4" />
        돌아가기
      </Link>

      {/* 앨범 헤더 */}
      <header className="flex flex-col md:flex-row gap-6">
        {/* 커버 이미지 */}
        <div className="w-full md:w-48 aspect-square rounded-2xl overflow-hidden flex-shrink-0">
          {album.cover_type === "gradient" ? (
            <div
              className={`w-full h-full bg-gradient-to-br ${pickCoverColor(album.id)}`}
            />
          ) : (
            <img
              src={album.cover_image_path || ""}
              alt={album.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                const img = e.currentTarget;
                img.style.display = "none";
              }}
            />
          )}
        </div>

        {/* 메타데이터 */}
        <div className="flex-1">
          <p className="text-sm text-[var(--color-text-muted)] uppercase tracking-wide">Album</p>
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)] mt-2">
            {album.title}
          </h1>
          {album.description && (
            <p className="text-[var(--color-text-secondary)] mt-2 line-clamp-2">
              {album.description}
            </p>
          )}
          <p className="text-sm text-[var(--color-text-muted)] mt-4">{trackCount} Tracks</p>

          {/* 액션 버튼 */}
          <div className="mt-6 flex gap-3">
            <button
              onClick={handlePlayAll}
              disabled={trackCount === 0}
              className="px-6 py-2.5 rounded-xl bg-[var(--color-accent)] text-white font-medium text-sm transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Play All
            </button>
          </div>
        </div>
      </header>

      {/* 트랙 목록 */}
      <section>
        <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-4">Tracks</h2>
        {trackCount === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--color-border)] py-12 text-center">
            <p className="text-sm text-[var(--color-text-muted)]">아직 트랙이 없습니다.</p>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">트랙을 추가해 보세요.</p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-2">
            {album.tracks.map((track, idx) => {
              const isCurrentTrack = currentTrack?.id === track.track_id;
              return (
                <li
                  key={track.track_id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleTrackClick(track)}
                  onKeyDown={(e) => e.key === "Enter" && handleTrackClick(track)}
                  className={`flex items-center gap-4 rounded-xl p-4 transition cursor-pointer hover:bg-[var(--color-bg-hover)] ${
                    isCurrentTrack
                      ? "bg-white/5 ring-1 ring-[var(--color-accent)]/30"
                      : ""
                  }`}
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-accent-subtle)] text-sm font-bold text-[var(--color-accent)] flex-shrink-0">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[var(--color-text-primary)] truncate">
                      {track.title || "제목 없음"}
                    </p>
                    <p className="text-sm text-[var(--color-text-secondary)] truncate">
                      {track.artist || "Unknown Artist"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTrackClick(track);
                    }}
                    className="rounded-lg p-2 text-[var(--color-text-muted)] transition hover:bg-[var(--color-accent)]/10 hover:text-[var(--color-accent)] flex-shrink-0"
                    aria-label="재생"
                  >
                    {isCurrentTrack && isPlaying ? (
                      <Pause className="h-5 w-5" strokeWidth={1.5} />
                    ) : (
                      <Play className="h-5 w-5" strokeWidth={1.5} />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
