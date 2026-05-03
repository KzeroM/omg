"use client";

import { useEffect, useState, use } from "react";
import { ArrowLeft, Play, Trash2, Globe, Lock, ListMusic } from "lucide-react";
import Link from "next/link";
import { usePlayer } from "@/context/PlayerContext";
import { pickCoverColor } from "@/utils/coverColor";
import { TrackRow } from "@/components/TrackRow";
import { TrackListSkeleton } from "@/components/skeletons/SkeletonRow";
import type { PlaylistTrack } from "@/types/player";
import type { ArtistTier } from "@/types/tier";

interface PlaylistInfo {
  id: string;
  title: string;
  description: string | null;
  is_public: boolean;
  user_id: string;
  created_at: string;
}

interface PlaylistTrackRow {
  position: number;
  tracks: {
    id: string;
    title: string;
    artist: string;
    file_path: string;
    play_count: number | null;
    like_count: number | null;
    artist_tier: string | null;
    cover_url: string | null;
  } | null;
}

export default function PlaylistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [playlist, setPlaylist] = useState<PlaylistInfo | null>(null);
  const [tracks, setTracks] = useState<PlaylistTrackRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { playSingleTrack, currentTrack, addTrack, playTrack, newReleases } = usePlayer();

  useEffect(() => {
    import("@/utils/supabase/client").then(({ createClient }) => {
      createClient().auth.getUser().then(({ data: { user } }) => {
        setCurrentUserId(user?.id ?? null);
      });
    });

    fetch(`/api/playlists/${id}`)
      .then((r) => r.ok ? r.json() as Promise<{ playlist?: PlaylistInfo; tracks?: PlaylistTrackRow[]; error?: string }> : Promise.reject(new Error(`${r.status}`)))
      .then((d) => {
        if (d.error) { setError(d.error); }
        else { setPlaylist(d.playlist ?? null); setTracks(d.tracks ?? []); }
      })
      .catch(() => setError("플레이리스트를 불러올 수 없습니다."))
      .finally(() => setLoading(false));
  }, [id]);

  const playAll = () => {
    const playable = tracks
      .filter((pt) => pt.tracks)
      .map((pt): PlaylistTrack => ({
        id: pt.tracks!.id,
        rank: pt.position,
        title: pt.tracks!.title,
        artist: pt.tracks!.artist,
        coverColor: pickCoverColor(pt.tracks!.id),
        isFoundingMember: false,
        file_path: pt.tracks!.file_path,
        artist_tier: (pt.tracks!.artist_tier ?? undefined) as ArtistTier | undefined,
      }));
    if (playable.length === 0) return;
    // find first track in newReleases or add
    const idx = newReleases.findIndex((t) => t.id === playable[0].id);
    if (idx !== -1) { playTrack(idx); }
    else { void playSingleTrack(playable[0]); }
  };

  const handleRemoveTrack = async (trackId: string) => {
    await fetch(`/api/playlists/${id}/tracks`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ track_id: trackId }),
    });
    setTracks((prev) => prev.filter((pt) => pt.tracks?.id !== trackId));
  };

  const togglePublic = async () => {
    if (!playlist) return;
    const newVal = !playlist.is_public;
    await fetch(`/api/playlists/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_public: newVal }),
    });
    setPlaylist((p) => p ? { ...p, is_public: newVal } : p);
  };

  const handleDelete = async () => {
    if (!window.confirm(`"${playlist?.title}" 플레이리스트를 삭제하시겠습니까?`)) return;
    await fetch(`/api/playlists/${id}`, { method: "DELETE" });
    window.location.href = "/my";
  };

  if (loading) return <div className="mx-auto max-w-2xl space-y-4 px-6 py-8"><TrackListSkeleton rows={6} /></div>;
  if (error || !playlist) return (
    <div className="mx-auto max-w-2xl px-6 py-16 text-center">
      <p className="text-[var(--color-text-muted)]">{error ?? "플레이리스트를 찾을 수 없습니다."}</p>
      <Link href="/" className="mt-4 inline-block text-sm text-[var(--color-accent)] hover:underline">홈으로</Link>
    </div>
  );

  const isOwner = currentUserId === playlist.user_id;
  const playableTracks = tracks.filter((pt) => pt.tracks);

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <Link href="/my" className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] transition hover:text-[var(--color-accent)]">
        <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
        내 보관함
      </Link>

      {/* Header */}
      <div className="rounded-2xl bg-[var(--color-bg-surface)] p-6 ring-1 ring-[var(--color-border)]">
        <div className="flex items-start gap-5">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-[var(--color-accent-subtle)]">
            <ListMusic className="h-9 w-9 text-[var(--color-accent)]" strokeWidth={1.5} />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">{playlist.title}</h1>
            {playlist.description && (
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">{playlist.description}</p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[var(--color-text-muted)]">
              <span>{playableTracks.length}곡</span>
              <span className="flex items-center gap-1">
                {playlist.is_public ? <Globe className="h-3 w-3" strokeWidth={1.5} /> : <Lock className="h-3 w-3" strokeWidth={1.5} />}
                {playlist.is_public ? "공개" : "비공개"}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          {playableTracks.length > 0 && (
            <button
              type="button"
              onClick={playAll}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-accent)] px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
            >
              <Play className="h-4 w-4" strokeWidth={2} />
              전체 재생
            </button>
          )}
          {isOwner && (
            <>
              <button
                type="button"
                onClick={() => void togglePublic()}
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-bg-elevated)] px-4 py-2.5 text-sm text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)] transition hover:bg-[var(--color-bg-hover)]"
              >
                {playlist.is_public ? <Lock className="h-4 w-4" strokeWidth={1.5} /> : <Globe className="h-4 w-4" strokeWidth={1.5} />}
                {playlist.is_public ? "비공개로 변경" : "공개로 변경"}
              </button>
              <button
                type="button"
                onClick={() => void handleDelete()}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm text-red-400 ring-1 ring-red-400/30 transition hover:bg-red-500/10"
              >
                <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                삭제
              </button>
            </>
          )}
        </div>
      </div>

      {/* Track list */}
      {playableTracks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--color-border)] py-14 text-center">
          <ListMusic className="mx-auto mb-3 h-8 w-8 text-[var(--color-text-muted)]" strokeWidth={1} />
          <p className="text-sm text-[var(--color-text-muted)]">아직 곡이 없습니다.</p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">곡 목록에서 + 버튼으로 추가해 보세요.</p>
        </div>
      ) : (
        <section className="rounded-2xl bg-[var(--color-bg-surface)] p-4 ring-1 ring-[var(--color-border)]">
          <ul className="grid grid-cols-1 gap-1">
            {playableTracks.map((pt, i) => {
              const t = pt.tracks!;
              const isActive = currentTrack?.id === t.id;
              const playlistTrack: PlaylistTrack = {
                id: t.id, rank: i, title: t.title, artist: t.artist,
                coverColor: pickCoverColor(t.id), isFoundingMember: false,
                file_path: t.file_path,
                artist_tier: (t.artist_tier ?? undefined) as ArtistTier | undefined,
              };
              return (
                <TrackRow
                  key={t.id}
                  coverColor={pickCoverColor(t.id)}
                  coverUrl={t.cover_url ?? undefined}
                  title={t.title}
                  artist={t.artist}
                  isActive={isActive}
                  onClick={() => void playSingleTrack(playlistTrack)}
                  leading={
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-subtle)] text-xs font-bold text-[var(--color-accent)]">
                      {i + 1}
                    </span>
                  }
                  trailing={
                    isOwner ? (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); void handleRemoveTrack(t.id); }}
                        className="rounded-lg p-1.5 text-[var(--color-text-muted)] transition hover:bg-red-500/10 hover:text-red-400"
                        aria-label="제거"
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                      </button>
                    ) : undefined
                  }
                />
              );
            })}
          </ul>
        </section>
      )}

    </div>
  );
}
