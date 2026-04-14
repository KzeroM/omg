"use client";

import { useEffect, useState } from "react";
import { Play, Pause, Heart } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { usePlayer } from "@/context/PlayerContext";
import type { PlaylistTrack } from "@/types/player";
import { Toast } from "@/components/Toast";
import { getLikedTracks } from "@/utils/supabase/tracks";
import Link from "next/link";

export default function MyPage() {
  const [likedTracks, setLikedTracks] = useState<PlaylistTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const { currentTrack, isPlaying, addTrack, playTrack, newReleases } = usePlayer();

  const fetchLikedTracks = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLikedTracks([]);
      setLoading(false);
      return;
    }
    try {
      const tracks = await getLikedTracks();
      setLikedTracks(tracks);
    } catch (error) {
      console.error(error);
      setToast("좋아요한 곡을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchLikedTracks();
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      void fetchLikedTracks();
    });
    return () => subscription.unsubscribe();
  }, []);

  const handlePlay = (track: PlaylistTrack) => {
    const existingIndex = newReleases.findIndex((t) => t.id === track.id);
    if (existingIndex !== -1) {
      playTrack(existingIndex);
    } else {
      addTrack(track);
    }
  };

  return (
    <>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      <div className="mx-auto max-w-5xl space-y-8 px-6 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">내가 좋아요한 곡</h1>
          <Link href="/" className="text-sm text-zinc-400 transition hover:text-[#A855F7]">
            홈으로
          </Link>
        </div>

        {loading ? (
          <p className="text-zinc-500">불러오는 중…</p>
        ) : likedTracks.length === 0 ? (
          <div className="rounded-2xl bg-[#141414] p-8 text-center ring-1 ring-[#1f1f1f]">
            <p className="text-zinc-500">아직 좋아요한 곡이 없습니다.</p>
          </div>
        ) : (
          <>
            <div className="rounded-2xl bg-[#141414] p-5 ring-1 ring-[#1f1f1f] flex flex-col gap-1">
              <p className="text-xs text-zinc-500 uppercase tracking-wide">좋아요한 곡</p>
              <p className="text-xl sm:text-2xl font-bold text-[#A855F7]">{likedTracks.length}</p>
              <p className="text-xs text-zinc-600">곡</p>
            </div>
            <section className="rounded-2xl bg-[#141414] p-6 ring-1 ring-[#1f1f1f]">
              <ul className="grid grid-cols-1 gap-2">
                {likedTracks.map((track) => {
                  const isCurrentTrack = currentTrack?.id === track.id;
                  return (
                    <li
                      key={track.id}
                      className={`flex items-center gap-4 rounded-xl py-3 px-4 transition hover:bg-white/5 ${
                        isCurrentTrack ? "bg-white/5 ring-1 ring-[#A855F7]/30" : ""
                      }`}
                    >
                      <div
                        className={`h-12 w-12 shrink-0 rounded-lg bg-gradient-to-br ${track.coverColor}`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-white">
                          {track.title ?? "제목 없음"}
                        </p>
                        <p className="text-sm text-zinc-500">{track.artist ?? "Unknown Artist"}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 text-xs text-zinc-500">
                        <span className="flex items-center gap-1">
                          <Play className="h-3 w-3" strokeWidth={1.5} />
                          {(track.play_count ?? 0).toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1 text-[#A855F7]">
                          <Heart className="h-3 w-3" strokeWidth={1.5} fill="currentColor" />
                          {(track.like_count ?? 0).toLocaleString()}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handlePlay(track)}
                        className="rounded-lg p-2 text-zinc-400 transition hover:bg-[#A855F7]/10 hover:text-[#A855F7]"
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
        )}
      </div>
    </>
  );
}
