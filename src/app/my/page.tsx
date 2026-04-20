"use client";

import { useEffect, useState } from "react";
import { Play, Pause, Heart, History, Users, Settings, Sparkles, ListMusic } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { usePlayer } from "@/context/PlayerContext";
import type { PlaylistTrack, HistoryTrack } from "@/types/player";
import { Toast } from "@/components/Toast";
import { LoadingState } from "@/components/ui/LoadingState";
import {
  getLikedTracks,
  getPlayHistory,
  getFollowedArtists,
  type FollowedArtist,
} from "@/utils/supabase/tracks";
import TasteAnalysisSection from "@/components/TasteAnalysis";

interface UserInfo {
  nickname: string | null;
  bio: string | null;
  artist_tier: string | null;
}

export default function MyPage() {
  const [userInfo, setUserInfo] = useState<UserInfo>({ nickname: null, bio: null, artist_tier: null });
  const [likedTracks, setLikedTracks] = useState<PlaylistTrack[]>([]);
  const [recentHistory, setRecentHistory] = useState<HistoryTrack[]>([]);
  const [followedArtists, setFollowedArtists] = useState<FollowedArtist[]>([]);
  const [recommendations, setRecommendations] = useState<PlaylistTrack[]>([]);
  const [playlists, setPlaylists] = useState<{ id: string; title: string; is_public: boolean }[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const { currentTrack, isPlaying, addTrack, playTrack, newReleases } = usePlayer();

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const [{ data: profile }, liked, history, followed, recsRes, playlistsRes] = await Promise.all([
        supabase.from("users").select("nickname, bio, artist_tier").eq("user_id", user.id).single(),
        getLikedTracks().catch(() => [] as PlaylistTrack[]),
        getPlayHistory(5).catch(() => [] as HistoryTrack[]),
        getFollowedArtists().catch(() => [] as FollowedArtist[]),
        fetch("/api/user/recommendations").then((r) => r.json() as Promise<{ tracks?: PlaylistTrack[] }>).catch(() => ({ tracks: [] })),
        fetch("/api/playlists").then((r) => r.json() as Promise<{ playlists?: { id: string; title: string; is_public: boolean }[] }>).catch(() => ({ playlists: [] })),
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
      setLoading(false);
    };

    void load();

    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => { void load(); });
    return () => subscription.unsubscribe();
  }, []);

  const handlePlay = (track: PlaylistTrack | HistoryTrack) => {
    const pt = track as PlaylistTrack;
    const existingIndex = newReleases.findIndex((t) => t.id === pt.id);
    if (existingIndex !== -1) playTrack(existingIndex);
    else addTrack(pt);
  };

  const avatarLetter = userInfo.nickname?.charAt(0).toUpperCase() ?? "?";

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-8">
        <LoadingState />
      </div>
    );
  }

  return (
    <>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      <div className="mx-auto max-w-5xl space-y-8 px-6 py-8">

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
              <p className="text-lg font-bold text-[var(--color-accent)]">{recentHistory.length}</p>
              <p className="text-xs text-[var(--color-text-muted)]">최근 재생</p>
            </div>
            <div className="rounded-xl bg-[var(--color-bg-base)] p-3 text-center">
              <p className="text-lg font-bold text-[var(--color-accent)]">{followedArtists.length}</p>
              <p className="text-xs text-[var(--color-text-muted)]">팔로잉</p>
            </div>
          </div>
        </section>

        {/* 내 플레이리스트 */}
        <section className="rounded-2xl bg-[var(--color-bg-surface)] p-6 ring-1 ring-[var(--color-border)]">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ListMusic className="h-4 w-4 text-[var(--color-text-muted)]" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">내 플레이리스트</h2>
            </div>
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

        {/* 팔로우한 아티스트 */}
        {followedArtists.length > 0 && (
          <section className="rounded-2xl bg-[var(--color-bg-surface)] p-6 ring-1 ring-[var(--color-border)]">
            <div className="mb-4 flex items-center gap-2">
              <Users className="h-4 w-4 text-[var(--color-text-muted)]" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                팔로잉 아티스트
              </h2>
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
                    <p className="text-sm font-medium text-[var(--color-text-primary)] truncate max-w-[7rem]">
                      {artist.nickname}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      팔로워 {artist.follower_count.toLocaleString()}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 최근 재생 */}
        {recentHistory.length > 0 && (
          <section className="rounded-2xl bg-[var(--color-bg-surface)] p-6 ring-1 ring-[var(--color-border)]">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-[var(--color-text-muted)]" />
                <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                  최근 재생
                </h2>
              </div>
              <Link
                href="/history"
                className="text-xs text-[var(--color-text-muted)] transition hover:text-[var(--color-accent)]"
              >
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
                      <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">
                        {track.title}
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)]">{track.artist}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handlePlay(track)}
                      className="rounded-lg p-2 text-[var(--color-text-secondary)] transition hover:bg-[var(--color-accent-subtle)] hover:text-[var(--color-accent)]"
                      aria-label="재생"
                    >
                      {isCurrentTrack && isPlaying ? (
                        <Pause className="h-4 w-4" strokeWidth={1.5} />
                      ) : (
                        <Play className="h-4 w-4" strokeWidth={1.5} />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* 이런 곡 어때요? — 태그 기반 추천 */}
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
                      <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">
                        {track.title}
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)]">{track.artist}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handlePlay(track)}
                      className="rounded-lg p-2 text-[var(--color-text-secondary)] transition hover:bg-[var(--color-accent-subtle)] hover:text-[var(--color-accent)]"
                      aria-label="재생"
                    >
                      {isCurrentTrack && isPlaying ? (
                        <Pause className="h-4 w-4" strokeWidth={1.5} />
                      ) : (
                        <Play className="h-4 w-4" strokeWidth={1.5} />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* 취향 분석 + 좋아요한 곡 */}
        {likedTracks.length > 0 ? (
          <>
            <TasteAnalysisSection />
            <section className="rounded-2xl bg-[var(--color-bg-surface)] p-6 ring-1 ring-[var(--color-border)]">
              <div className="mb-4 flex items-center gap-2">
                <Heart className="h-4 w-4 text-[var(--color-accent)]" />
                <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                  좋아요한 곡
                </h2>
              </div>
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
                        <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">
                          {track.title ?? "제목 없음"}
                        </p>
                        <p className="text-xs text-[var(--color-text-muted)]">{track.artist ?? "Unknown Artist"}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3 text-xs text-[var(--color-text-muted)]">
                        <span className="flex items-center gap-1">
                          <Play className="h-3 w-3" strokeWidth={1.5} />
                          {(track.play_count ?? 0).toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1 text-[var(--color-accent)]">
                          <Heart className="h-3 w-3" strokeWidth={1.5} fill="currentColor" />
                          {(track.like_count ?? 0).toLocaleString()}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handlePlay(track)}
                        className="rounded-lg p-2 text-[var(--color-text-secondary)] transition hover:bg-[var(--color-accent-subtle)] hover:text-[var(--color-accent)]"
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
            </section>
          </>
        ) : (
          <div className="rounded-2xl bg-[var(--color-bg-surface)] p-8 text-center ring-1 ring-[var(--color-border)]">
            <Heart className="mx-auto mb-3 h-8 w-8 text-[var(--color-text-muted)]" />
            <p className="text-[var(--color-text-muted)]">아직 좋아요한 곡이 없습니다.</p>
          </div>
        )}
      </div>
    </>
  );
}
