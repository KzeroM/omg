"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Play, Pause, Heart, History, Users, Settings,
  Sparkles, ListMusic, LogIn, Music2, BarChart2, Upload, Plus, X, Disc3,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { usePlayer } from "@/context/PlayerContext";
import type { PlaylistTrack, HistoryTrack } from "@/types/player";
import { Toast } from "@/components/Toast";
import { formatKoreanNumber } from "@/utils/formatNumber";
import { ProfileHeaderSkeleton, TrackListSkeleton } from "@/components/skeletons/SkeletonRow";
import {
  getLikedTracks,
  getPlayHistory,
  getFollowedArtists,
  type FollowedArtist,
} from "@/utils/supabase/tracks";
import TasteAnalysisSection from "@/components/TasteAnalysis";
import { UploadButton } from "@/components/UploadButton";
import { getAlbumsByUserId, createAlbum } from "@/utils/supabase/albums";
import type { DbAlbum } from "@/types/album";

type Tab = "listener" | "artist";

interface UserInfo {
  nickname: string | null;
  bio: string | null;
  artist_tier: string | null;
}

interface MyTrack {
  id: string;
  title: string;
  artist: string;
  play_count: number;
  like_count: number;
  cover_color: string | null;
  created_at: string;
}

export default function MyPage() {
  const [tab, setTab] = useState<Tab>("listener");
  const [userInfo, setUserInfo] = useState<UserInfo>({ nickname: null, bio: null, artist_tier: null });
  const [likedTracks, setLikedTracks] = useState<PlaylistTrack[]>([]);
  const [recentHistory, setRecentHistory] = useState<HistoryTrack[]>([]);
  const [followedArtists, setFollowedArtists] = useState<FollowedArtist[]>([]);
  const [recommendations, setRecommendations] = useState<PlaylistTrack[]>([]);
  const [playlists, setPlaylists] = useState<{ id: string; title: string; is_public: boolean }[]>([]);
  const [myTracks, setMyTracks] = useState<MyTrack[]>([]);
  const [myAlbums, setMyAlbums] = useState<DbAlbum[]>([]);
  const [showCreateAlbum, setShowCreateAlbum] = useState(false);
  const [newAlbumTitle, setNewAlbumTitle] = useState("");
  const [creatingAlbum, setCreatingAlbum] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const { currentTrack, isPlaying, addTrack, playTrack, newReleases } = usePlayer();

  const loadData = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setIsLoggedIn(false);
      setLoading(false);
      return;
    }
    setIsLoggedIn(true);

    const [{ data: profile }, liked, history, followed, recsRes, playlistsRes, { data: tracks }, albums] =
      await Promise.all([
        supabase.from("users").select("nickname, bio, artist_tier").eq("user_id", user.id).single(),
        getLikedTracks().catch(() => [] as PlaylistTrack[]),
        getPlayHistory(5).catch(() => [] as HistoryTrack[]),
        getFollowedArtists().catch(() => [] as FollowedArtist[]),
        fetch("/api/user/recommendations").then((r) => r.json() as Promise<{ tracks?: PlaylistTrack[] }>).catch(() => ({ tracks: [] })),
        fetch("/api/playlists").then((r) => r.json() as Promise<{ playlists?: { id: string; title: string; is_public: boolean }[] }>).catch(() => ({ playlists: [] })),
        supabase
          .from("tracks")
          .select("id, title, artist, play_count, like_count, cover_color, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        getAlbumsByUserId(user.id).catch(() => [] as DbAlbum[]),
      ]);

    if (profile) {
      setUserInfo({
        nickname: profile.nickname as string | null,
        bio: profile.bio as string | null,
        artist_tier: profile.artist_tier as string | null,
      });
    }
    setLikedTracks(liked);
    setRecentHistory(history);
    setFollowedArtists(followed);
    setRecommendations(recsRes.tracks ?? []);
    setPlaylists(playlistsRes.playlists ?? []);
    setMyTracks((tracks ?? []) as MyTrack[]);
    setMyAlbums(albums);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadData();
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => { void loadData(); });
    return () => subscription.unsubscribe();
  }, [loadData]);

  const handlePlay = (track: PlaylistTrack | HistoryTrack) => {
    const pt = track as PlaylistTrack;
    const existingIndex = newReleases.findIndex((t) => t.id === pt.id);
    if (existingIndex !== -1) playTrack(existingIndex);
    else addTrack(pt);
  };

  const handleCreateAlbum = async () => {
    if (!newAlbumTitle.trim()) return;
    setCreatingAlbum(true);
    try {
      const album = await createAlbum({ title: newAlbumTitle.trim() });
      setMyAlbums((prev) => [album, ...prev]);
      setNewAlbumTitle("");
      setShowCreateAlbum(false);
    } catch {
      setToast("앨범 생성에 실패했습니다.");
    } finally {
      setCreatingAlbum(false);
    }
  };

  const avatarLetter = userInfo.nickname?.charAt(0).toUpperCase() ?? "?";

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-6 px-6 py-8">
        <ProfileHeaderSkeleton />
        <div className="h-12 animate-pulse rounded-xl bg-[var(--color-bg-surface)] ring-1 ring-[var(--color-border)]" />
        <TrackListSkeleton rows={5} />
      </div>
    );
  }

  if (isLoggedIn === false) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="flex flex-col items-center justify-center gap-6 rounded-2xl bg-[var(--color-bg-surface)] px-8 py-20 text-center ring-1 ring-[var(--color-border)]">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-accent-subtle)]">
            <LogIn className="h-8 w-8 text-[var(--color-accent)]" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-lg font-bold text-[var(--color-text-primary)]">로그인이 필요해요</p>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              마이페이지는 로그인 후 이용할 수 있어요.
            </p>
          </div>
          <Link
            href="/"
            className="rounded-xl bg-[var(--color-accent)] px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            로그인하러 가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      <div className="mx-auto max-w-5xl space-y-6 px-6 py-8">

        {/* 프로필 헤더 */}
        <section className="rounded-2xl bg-[var(--color-bg-surface)] p-6 ring-1 ring-[var(--color-border)]">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-accent)] to-purple-900 text-2xl font-bold text-white">
                {avatarLetter}
              </div>
              <div>
                <p className="text-xl font-bold text-[var(--color-text-primary)]">
                  {userInfo.nickname ?? "닉네임 없음"}
                </p>
                {userInfo.bio && (
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)] max-w-md">
                    {userInfo.bio}
                  </p>
                )}
              </div>
            </div>
            <Link
              href="/settings"
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)] transition hover:text-[var(--color-accent)] hover:ring-[var(--color-accent)]"
            >
              <Settings className="h-4 w-4" />
              설정
            </Link>
          </div>

          {/* 통계 */}
          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-[var(--color-bg-base)] p-3 text-center">
              <p className="text-lg font-bold text-[var(--color-accent)]">{likedTracks.length}</p>
              <p className="text-xs text-[var(--color-text-muted)]">좋아요한 곡</p>
            </div>
            <div className="rounded-xl bg-[var(--color-bg-base)] p-3 text-center">
              <p className="text-lg font-bold text-[var(--color-accent)]">{myTracks.length}</p>
              <p className="text-xs text-[var(--color-text-muted)]">올린 곡</p>
            </div>
            <div className="rounded-xl bg-[var(--color-bg-base)] p-3 text-center">
              <p className="text-lg font-bold text-[var(--color-accent)]">{followedArtists.length}</p>
              <p className="text-xs text-[var(--color-text-muted)]">팔로잉</p>
            </div>
          </div>
        </section>

        {/* 탭 선택 */}
        <div className="flex gap-2 rounded-xl bg-[var(--color-bg-surface)] p-1 ring-1 ring-[var(--color-border)]">
          <button
            type="button"
            onClick={() => setTab("listener")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition ${
              tab === "listener"
                ? "bg-[var(--color-accent)] text-white"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            <Heart className="h-4 w-4" strokeWidth={1.5} />
            리스너
          </button>
          <button
            type="button"
            onClick={() => setTab("artist")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition ${
              tab === "artist"
                ? "bg-[var(--color-accent)] text-white"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            <Music2 className="h-4 w-4" strokeWidth={1.5} />
            아티스트
          </button>
        </div>

        {/* ── 리스너 탭 ── */}
        {tab === "listener" && (
          <div className="space-y-6">

            {/* 취향 분석 */}
            <TasteAnalysisSection />

            {/* 이런 곡 어때요? */}
            {recommendations.length > 0 && (
              <section className="rounded-2xl bg-[var(--color-bg-surface)] p-6 ring-1 ring-[var(--color-border)]">
                <div className="mb-4 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[var(--color-accent)]" />
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                    이런 곡 어때요?
                  </h2>
                </div>
                <ul className="flex flex-col gap-1">
                  {recommendations.slice(0, 6).map((track) => {
                    const isCurrentTrack = currentTrack?.id === track.id;
                    return (
                      <li
                        key={track.id}
                        className={`flex items-center gap-4 rounded-xl px-4 py-3 transition hover:bg-[var(--color-bg-hover)] ${
                          isCurrentTrack ? "bg-white/5 ring-1 ring-[var(--color-accent)]/30" : ""
                        }`}
                      >
                        <div className={`h-10 w-10 shrink-0 rounded-lg bg-gradient-to-br ${track.coverColor}`} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">{track.title}</p>
                          <p className="text-xs text-[var(--color-text-muted)]">{track.artist}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handlePlay(track)}
                          className="rounded-lg p-2 text-[var(--color-text-secondary)] transition hover:bg-[var(--color-accent-subtle)] hover:text-[var(--color-accent)]"
                          aria-label="재생"
                        >
                          {isCurrentTrack && isPlaying ? <Pause className="h-4 w-4" strokeWidth={1.5} /> : <Play className="h-4 w-4" strokeWidth={1.5} />}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            {/* 좋아요한 곡 */}
            <section className="rounded-2xl bg-[var(--color-bg-surface)] p-6 ring-1 ring-[var(--color-border)]">
              <div className="mb-4 flex items-center gap-2">
                <Heart className="h-4 w-4 text-[var(--color-accent)]" />
                <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">좋아요한 곡</h2>
              </div>
              {likedTracks.length === 0 ? (
                <p className="text-sm text-[var(--color-text-muted)]">아직 좋아요한 곡이 없습니다.</p>
              ) : (
                <ul className="flex flex-col gap-1">
                  {likedTracks.map((track) => {
                    const isCurrentTrack = currentTrack?.id === track.id;
                    return (
                      <li
                        key={track.id}
                        className={`flex items-center gap-4 rounded-xl px-4 py-3 transition hover:bg-[var(--color-bg-hover)] ${
                          isCurrentTrack ? "bg-white/5 ring-1 ring-[var(--color-accent)]/30" : ""
                        }`}
                      >
                        <div className={`h-10 w-10 shrink-0 rounded-lg bg-gradient-to-br ${track.coverColor}`} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">{track.title ?? "제목 없음"}</p>
                          <p className="text-xs text-[var(--color-text-muted)]">{track.artist ?? "Unknown Artist"}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-3 text-xs text-[var(--color-text-muted)]">
                          <span className="flex items-center gap-1">
                            <Play className="h-3 w-3" strokeWidth={1.5} />
                            {formatKoreanNumber(track.play_count ?? 0)}
                          </span>
                          <span className="flex items-center gap-1 text-[var(--color-accent)]">
                            <Heart className="h-3 w-3" strokeWidth={1.5} fill="currentColor" />
                            {formatKoreanNumber(track.like_count ?? 0)}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handlePlay(track)}
                          className="rounded-lg p-2 text-[var(--color-text-secondary)] transition hover:bg-[var(--color-accent-subtle)] hover:text-[var(--color-accent)]"
                          aria-label="재생"
                        >
                          {isCurrentTrack && isPlaying ? <Pause className="h-5 w-5" strokeWidth={1.5} /> : <Play className="h-5 w-5" strokeWidth={1.5} />}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            {/* 최근 재생 */}
            {recentHistory.length > 0 && (
              <section className="rounded-2xl bg-[var(--color-bg-surface)] p-6 ring-1 ring-[var(--color-border)]">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <History className="h-4 w-4 text-[var(--color-text-muted)]" />
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">최근 재생</h2>
                  </div>
                  <Link href="/history" className="text-xs text-[var(--color-text-muted)] transition hover:text-[var(--color-accent)]">
                    전체 보기
                  </Link>
                </div>
                <ul className="flex flex-col gap-1">
                  {recentHistory.map((track) => {
                    const isCurrentTrack = currentTrack?.id === track.id;
                    return (
                      <li
                        key={`${track.id}-${track.played_at}`}
                        className={`flex items-center gap-4 rounded-xl px-4 py-3 transition hover:bg-[var(--color-bg-hover)] ${
                          isCurrentTrack ? "bg-white/5 ring-1 ring-[var(--color-accent)]/30" : ""
                        }`}
                      >
                        <div className={`h-10 w-10 shrink-0 rounded-lg bg-gradient-to-br ${track.coverColor}`} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">{track.title}</p>
                          <p className="text-xs text-[var(--color-text-muted)]">{track.artist}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handlePlay(track)}
                          className="rounded-lg p-2 text-[var(--color-text-secondary)] transition hover:bg-[var(--color-accent-subtle)] hover:text-[var(--color-accent)]"
                          aria-label="재생"
                        >
                          {isCurrentTrack && isPlaying ? <Pause className="h-4 w-4" strokeWidth={1.5} /> : <Play className="h-4 w-4" strokeWidth={1.5} />}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            {/* 내 플레이리스트 */}
            <section className="rounded-2xl bg-[var(--color-bg-surface)] p-6 ring-1 ring-[var(--color-border)]">
              <div className="mb-4 flex items-center gap-2">
                <ListMusic className="h-4 w-4 text-[var(--color-text-muted)]" />
                <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">내 플레이리스트</h2>
              </div>
              {playlists.length === 0 ? (
                <p className="text-sm text-[var(--color-text-muted)]">아직 플레이리스트가 없습니다. 곡 목록에서 + 버튼으로 만들어 보세요.</p>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {playlists.map((pl) => (
                    <Link
                      key={pl.id}
                      href={`/playlist/${pl.id}`}
                      className="flex items-center gap-3 rounded-xl bg-[var(--color-bg-base)] px-4 py-3 transition hover:bg-[var(--color-bg-hover)]"
                    >
                      <ListMusic className="h-8 w-8 shrink-0 text-[var(--color-accent)]" strokeWidth={1.5} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">{pl.title}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">{pl.is_public ? "공개" : "비공개"}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {/* 팔로잉 아티스트 */}
            {followedArtists.length > 0 && (
              <section className="rounded-2xl bg-[var(--color-bg-surface)] p-6 ring-1 ring-[var(--color-border)]">
                <div className="mb-4 flex items-center gap-2">
                  <Users className="h-4 w-4 text-[var(--color-text-muted)]" />
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">팔로잉 아티스트</h2>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {followedArtists.map((artist) => (
                    <Link
                      key={artist.user_id}
                      href={`/artist/${encodeURIComponent(artist.nickname)}`}
                      className="flex flex-col items-center gap-2 rounded-xl p-3 text-center transition hover:bg-[var(--color-bg-hover)]"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-700 to-purple-900 text-lg font-bold text-white">
                        {artist.nickname.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="truncate max-w-[7rem] text-sm font-medium text-[var(--color-text-primary)]">{artist.nickname}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">팔로워 {formatKoreanNumber(artist.follower_count)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* ── 아티스트 탭 ── */}
        {tab === "artist" && (
          <div className="space-y-6">

            {myTracks.length === 0 ? (
              /* 업로드 없음 — CTA */
              <section className="rounded-2xl bg-[var(--color-bg-surface)] p-10 text-center ring-1 ring-[var(--color-border)]">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-accent-subtle)]">
                  <Upload className="h-7 w-7 text-[var(--color-accent)]" strokeWidth={1.5} />
                </div>
                <p className="text-base font-bold text-[var(--color-text-primary)]">아직 올린 곡이 없어요</p>
                <p className="mt-1 mb-5 text-sm text-[var(--color-text-secondary)]">
                  첫 번째 곡을 올리고 아티스트로 활동을 시작해 보세요.
                </p>
                <div className="flex justify-center">
                  <UploadButton onUploadSuccess={() => void loadData()} />
                </div>
              </section>
            ) : (
              <>
                {/* 내 앨범 */}
                <section className="rounded-2xl bg-[var(--color-bg-surface)] p-6 ring-1 ring-[var(--color-border)]">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Disc3 className="h-4 w-4 text-[var(--color-text-muted)]" />
                      <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                        내 앨범 ({myAlbums.length})
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowCreateAlbum(true)}
                      className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)] transition hover:text-[var(--color-accent)] hover:ring-[var(--color-accent)]"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      앨범 만들기
                    </button>
                  </div>

                  {/* 앨범 생성 인라인 폼 */}
                  {showCreateAlbum && (
                    <div className="mb-4 flex items-center gap-2 rounded-xl bg-[var(--color-bg-base)] p-3 ring-1 ring-[var(--color-accent)]">
                      <input
                        type="text"
                        value={newAlbumTitle}
                        onChange={(e) => setNewAlbumTitle(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && void handleCreateAlbum()}
                        placeholder="앨범 제목"
                        autoFocus
                        className="flex-1 bg-transparent text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => void handleCreateAlbum()}
                        disabled={!newAlbumTitle.trim() || creatingAlbum}
                        className="rounded-lg bg-[var(--color-accent)] px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
                      >
                        {creatingAlbum ? "저장 중…" : "만들기"}
                      </button>
                      <button type="button" onClick={() => { setShowCreateAlbum(false); setNewAlbumTitle(""); }}>
                        <X className="h-4 w-4 text-[var(--color-text-muted)]" />
                      </button>
                    </div>
                  )}

                  {myAlbums.length === 0 ? (
                    <p className="text-sm text-[var(--color-text-muted)]">아직 앨범이 없습니다.</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {myAlbums.map((album) => (
                        <Link
                          key={album.id}
                          href={`/album/${album.id}`}
                          className="flex items-center gap-3 rounded-xl bg-[var(--color-bg-base)] px-4 py-3 transition hover:bg-[var(--color-bg-hover)]"
                        >
                          <Disc3 className="h-8 w-8 shrink-0 text-[var(--color-accent)]" strokeWidth={1.5} />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">{album.title}</p>
                            <p className="text-xs text-[var(--color-text-muted)]">앨범</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </section>

                {/* 내 트랙 목록 */}
                <section className="rounded-2xl bg-[var(--color-bg-surface)] p-6 ring-1 ring-[var(--color-border)]">
                  <div className="mb-4 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Music2 className="h-4 w-4 text-[var(--color-text-muted)]" />
                      <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                        내 트랙 ({myTracks.length})
                      </h2>
                    </div>
                    <UploadButton onUploadSuccess={() => void loadData()} />
                  </div>
                  <ul className="flex flex-col gap-1">
                    {myTracks.map((track) => {
                      const isCurrentTrack = currentTrack?.id === track.id;
                      const coverColor = track.cover_color ?? "from-purple-700 to-purple-900";
                      return (
                        <li
                          key={track.id}
                          className={`flex items-center gap-4 rounded-xl px-4 py-3 transition hover:bg-[var(--color-bg-hover)] ${
                            isCurrentTrack ? "bg-white/5 ring-1 ring-[var(--color-accent)]/30" : ""
                          }`}
                        >
                          <div className={`h-10 w-10 shrink-0 rounded-lg bg-gradient-to-br ${coverColor}`} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">{track.title}</p>
                            <p className="text-xs text-[var(--color-text-muted)]">{track.artist}</p>
                          </div>
                          <div className="flex shrink-0 items-center gap-3 text-xs text-[var(--color-text-muted)]">
                            <span className="flex items-center gap-1">
                              <Play className="h-3 w-3" strokeWidth={1.5} />
                              {formatKoreanNumber(track.play_count ?? 0)}
                            </span>
                            <span className="flex items-center gap-1 text-[var(--color-accent)]">
                              <Heart className="h-3 w-3" strokeWidth={1.5} fill="currentColor" />
                              {formatKoreanNumber(track.like_count ?? 0)}
                            </span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </section>

                {/* 아티스트 분석 바로가기 */}
                {userInfo.nickname && (
                  <Link
                    href={`/artist/${encodeURIComponent(userInfo.nickname)}`}
                    className="flex items-center justify-between rounded-2xl bg-[var(--color-bg-surface)] p-6 ring-1 ring-[var(--color-border)] transition hover:ring-[var(--color-accent)]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-accent-subtle)]">
                        <BarChart2 className="h-5 w-5 text-[var(--color-accent)]" strokeWidth={1.5} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[var(--color-text-primary)]">아티스트 분석 대시보드</p>
                        <p className="text-xs text-[var(--color-text-secondary)]">재생수 · 좋아요 · 팔로워 통계 확인</p>
                      </div>
                    </div>
                    <span className="text-[var(--color-text-muted)]">→</span>
                  </Link>
                )}
              </>
            )}
          </div>
        )}

      </div>
    </>
  );
}
