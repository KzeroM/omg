"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Play, Users } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { usePlayer } from "@/context/PlayerContext";
import { pickCoverColor } from "@/utils/coverColor";
import { formatKoreanNumber } from "@/utils/formatNumber";
import type { PlaylistTrack } from "@/types/player";
import type { ArtistTier } from "@/types/tier";

interface FeedTrack {
  id: string;
  title: string | null;
  artist: string | null;
  file_path: string;
  play_count: number;
  like_count: number;
  created_at: string;
  user_id: string;
  users: { nickname: string; artist_tier: string } | null;
}

export function FollowedArtistsFeed() {
  const [tracks, setTracks] = useState<FeedTrack[]>([]);
  const [mounted, setMounted] = useState(false);
  const { playSingleTrack, currentTrack, isPlaying } = usePlayer();

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setMounted(true);
      if (!user) return;

      // 팔로우 중인 아티스트 IDs
      const { data: follows } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id);

      if (!follows || follows.length === 0) return;

      const artistIds = follows.map((f) => f.following_id as string);

      // 해당 아티스트들의 최신 트랙 10개
      const { data } = await supabase
        .from("tracks")
        .select("id, title, artist, file_path, play_count, like_count, created_at, user_id, users!tracks_user_id_fkey(nickname, artist_tier)")
        .in("user_id", artistIds)
        .neq("visibility", "private")
        .order("created_at", { ascending: false })
        .limit(10);

      if (data) setTracks(data as unknown as FeedTrack[]);
    });
  }, []);

  // 로그인 확인 전 or 팔로우 없음
  if (!mounted || tracks.length === 0) return null;

  const handlePlay = (track: FeedTrack) => {
    const pt: PlaylistTrack = {
      id: track.id,
      rank: 0,
      title: track.title ?? "제목 없음",
      artist: track.artist ?? "Unknown Artist",
      coverColor: pickCoverColor(track.id),
      isFoundingMember: false,
      file_path: track.file_path,
      artist_tier: (track.users?.artist_tier ?? "basic") as ArtistTier,
      uploader_nickname: track.users?.nickname,
    };
    void playSingleTrack(pt);
  };

  return (
    <section>
      <div className="mb-4 flex items-center gap-2">
        <Users className="h-4 w-4 text-[var(--color-accent)]" strokeWidth={1.5} />
        <h2 className="text-base font-semibold text-[var(--color-text-primary)]">팔로우 아티스트 신곡</h2>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {tracks.map((track) => {
          const isActive = currentTrack?.id === track.id;
          const coverColor = pickCoverColor(track.id);

          return (
            <div
              key={track.id}
              className={`group flex items-center gap-3 rounded-xl p-3 ring-1 transition ${
                isActive
                  ? "bg-[var(--color-accent)]/10 ring-[var(--color-accent)]/30"
                  : "bg-[var(--color-bg-surface)] ring-[var(--color-border)] hover:ring-[var(--color-accent)]/30"
              }`}
            >
              {/* 커버 + 재생 버튼 */}
              <button
                type="button"
                onClick={() => handlePlay(track)}
                className={`relative h-12 w-12 shrink-0 rounded-lg bg-gradient-to-br ${coverColor} flex items-center justify-center`}
                aria-label="재생"
              >
                {isActive && isPlaying ? (
                  <span className="flex gap-px items-end h-4">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="w-1 rounded-full bg-white animate-pulse"
                        style={{ height: `${60 + i * 20}%`, animationDelay: `${i * 150}ms` }}
                      />
                    ))}
                  </span>
                ) : (
                  <Play className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition" strokeWidth={2} />
                )}
              </button>

              {/* 트랙 정보 */}
              <div className="min-w-0 flex-1">
                <p className={`truncate text-sm font-medium ${isActive ? "text-[var(--color-accent)]" : "text-[var(--color-text-primary)]"}`}>
                  {track.title ?? "제목 없음"}
                </p>
                <Link
                  href={`/artist/${encodeURIComponent(track.users?.nickname ?? track.artist ?? "")}`}
                  className="truncate text-xs text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition"
                >
                  {track.artist ?? "Unknown"}
                </Link>
              </div>

              {/* 재생수 */}
              <span className="shrink-0 text-xs text-[var(--color-text-muted)]">
                {formatKoreanNumber(track.play_count)}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
