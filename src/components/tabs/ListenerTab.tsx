"use client";

import { Play, Pause, Heart, History, Users, Sparkles, ListMusic } from "lucide-react";
import Link from "next/link";
import type { PlaylistTrack, HistoryTrack } from "@/types/player";
import { formatKoreanNumber } from "@/utils/formatNumber";
import TasteAnalysisSection from "@/components/TasteAnalysis";
import type { FollowedArtist } from "@/utils/supabase/tracks";

interface ListenerTabProps {
  recommendations: PlaylistTrack[];
  likedTracks: PlaylistTrack[];
  recentHistory: HistoryTrack[];
  playlists: { id: string; title: string; is_public: boolean }[];
  followedArtists: FollowedArtist[];
  currentTrack: { id: string } | null;
  isPlaying: boolean;
  handlePlay: (track: PlaylistTrack | HistoryTrack) => void;
}

export function ListenerTab({
  recommendations,
  likedTracks,
  recentHistory,
  playlists,
  followedArtists,
  currentTrack,
  isPlaying,
  handlePlay,
}: ListenerTabProps) {
  return (
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
  );
}
