"use client";

import { useEffect, useState } from "react";
import { Trash2, Play, Pause, Heart, Pencil } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { usePlayer } from "@/context/PlayerContext";
import type { DbTrack, PlaylistTrack, HistoryTrack } from "@/types/player";
import { Toast } from "@/components/Toast";
import { EditTrackModal } from "@/components/EditTrackModal";
import { UploadButton } from "@/components/UploadButton";
import Link from "next/link";
import { pickCoverColor } from "@/utils/coverColor";
import { getPlayHistory } from "@/utils/supabase/tracks";
import { loadLocalHistory } from "@/utils/localStorage";

const MUSIC_BUCKET = "omg-tracks";

function formatRelativeTime(played_at: string): string {
  const now = new Date();
  const played = new Date(played_at);
  const diffMs = now.getTime() - played.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);
  const diffWeek = Math.floor(diffMs / 604800000);
  const diffMonth = Math.floor(diffMs / 2592000000);

  if (diffMin < 1) return "방금 전";
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  if (diffDay < 7) return `${diffDay}일 전`;
  if (diffWeek < 4) return `${diffWeek}주 전`;
  return `${diffMonth}개월 전`;
}

function toPlaylistTrack(t: DbTrack): PlaylistTrack {
  return {
    id: t.id,
    rank: 0,
    title: t.title ?? "제목 없음",
    artist: t.artist ?? "Unknown Artist",
    coverColor: pickCoverColor(t.id),
    isFoundingMember: false,
    file_path: t.file_path,
  };
}

export default function LibraryPage() {
  const [tracks, setTracks] = useState<DbTrack[]>([]);
  const [recentHistory, setRecentHistory] = useState<HistoryTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [editingTrack, setEditingTrack] = useState<DbTrack | null>(null);
  const { currentTrack, isPlaying, addTrack, playTrack, newReleases, updateTrackMeta } = usePlayer();

  const fetchMyTracks = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setTracks([]); setLoading(false); return; }
    const { data, error } = await supabase
      .from("tracks")
      .select("id, user_id, artist_id, file_path, title, artist, created_at, play_count, like_count")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) {
      console.error(error);
      setTracks([]);
      setToast("트랙 목록을 불러오지 못했습니다.");
    } else {
      setTracks(data ?? []);
    }
    setLoading(false);
  };

  const fetchRecentHistory = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const history = await getPlayHistory(20);
      setRecentHistory(history);
    } else {
      const localHistory = loadLocalHistory();
      setRecentHistory(localHistory as HistoryTrack[]);
    }
  };

  useEffect(() => {
    void fetchMyTracks();
    void fetchRecentHistory();
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      void fetchMyTracks();
      void fetchRecentHistory();
    });
    return () => subscription.unsubscribe();
  }, []);

  const handlePlay = (track: DbTrack) => {
    const pt = toPlaylistTrack(track);
    const existingIndex = newReleases.findIndex((t) => t.id === track.id);
    if (existingIndex !== -1) {
      playTrack(existingIndex);
    } else {
      addTrack(pt);
    }
  };

  const playSingleTrack = (track: HistoryTrack) => {
    const pt: PlaylistTrack = {
      id: track.id,
      rank: 0,
      title: track.title,
      artist: track.artist,
      coverColor: track.coverColor,
      isFoundingMember: track.isFoundingMember,
      file_path: track.file_path,
      like_count: track.like_count,
      play_count: track.play_count,
    };
    const existingIndex = newReleases.findIndex((t) => t.id === track.id);
    if (existingIndex !== -1) {
      playTrack(existingIndex);
    } else {
      addTrack(pt);
    }
  };

  const handleDelete = async (track: DbTrack) => {
    if (!window.confirm(`"${track.title ?? "이 곡"}"을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) return;
    setDeletingId(track.id);
    try {
      const supabase = createClient();
      await supabase.storage.from(MUSIC_BUCKET).remove([track.file_path]);
      const { error } = await supabase.from("tracks").delete().eq("id", track.id);
      if (error) throw error;
      setTracks((prev) => prev.filter((t) => t.id !== track.id));
    } catch (e) {
      console.error(e);
      setToast("삭제에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditSaved = async (title: string, artist: string) => {
    if (!editingTrack) return;
    try {
      await updateTrackMeta(editingTrack.id, title, artist);
      setTracks((prev) =>
        prev.map((t) =>
          t.id === editingTrack.id ? { ...t, title, artist } : t
        )
      );
      setToast("곡 정보가 업데이트되었습니다.");
    } catch (error) {
      console.error(error);
      setToast("곡 정보 업데이트에 실패했습니다.");
    }
  };

  return (
    <>
    {editingTrack && (
      <EditTrackModal
        track={editingTrack}
        isOpen={true}
        onClose={() => setEditingTrack(null)}
        onSaved={handleEditSaved}
      />
    )}
    {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    <div className="mx-auto max-w-5xl space-y-8 px-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">내 보관함</h1>
        <div className="flex items-center gap-3">
          <UploadButton onUploadSuccess={fetchMyTracks} />
          <Link href="/" className="text-sm text-zinc-400 transition hover:text-[#A855F7]">
            홈으로
          </Link>
        </div>
      </div>

      {recentHistory.length > 0 && (
        <section className="rounded-2xl bg-[#141414] p-6 ring-1 ring-[#1f1f1f]">
          <h3 className="text-lg font-bold text-white mb-4">최근 재생</h3>
          <ul className="grid grid-cols-1 gap-2">
            {recentHistory.map((track) => {
              const isCurrentTrack = currentTrack?.id === track.id;
              return (
                <li
                  key={track.id}
                  className={`flex items-center gap-4 rounded-xl py-3 px-4 transition ${
                    isCurrentTrack ? "bg-white/5 ring-1 ring-[#A855F7]/30" : "hover:bg-white/5"
                  }`}
                >
                  <div
                    className={`h-12 w-12 shrink-0 rounded-lg bg-gradient-to-br ${track.coverColor}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-white">{track.title}</p>
                    <p className="text-sm text-zinc-500">{track.artist}</p>
                  </div>
                  <span className="shrink-0 text-xs text-zinc-500">
                    {formatRelativeTime(track.played_at)}
                  </span>
                  <button
                    type="button"
                    onClick={() => playSingleTrack(track)}
                    className="rounded-lg p-2 text-zinc-400 transition hover:bg-[#A855F7]/10 hover:text-[#A855F7]"
                    aria-label="재생"
                  >
                    <Play className="h-5 w-5" strokeWidth={1.5} />
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {loading ? (
        <p className="text-zinc-500">불러오는 중…</p>
      ) : tracks.length === 0 ? (
        <div className="rounded-2xl bg-[#141414] p-8 text-center ring-1 ring-[#1f1f1f]">
          <p className="text-zinc-500">아직 업로드한 곡이 없습니다.</p>
        </div>
      ) : (
        <>
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-2xl bg-[#141414] p-5 ring-1 ring-[#1f1f1f] flex flex-col gap-1">
            <p className="text-xs text-zinc-500 uppercase tracking-wide">트랙</p>
            <p className="text-xl sm:text-2xl font-bold text-white">{tracks.length}</p>
            <p className="text-xs text-zinc-600">곡</p>
          </div>
          <div className="rounded-2xl bg-[#141414] p-5 ring-1 ring-[#1f1f1f] flex flex-col gap-1">
            <p className="text-xs text-zinc-500 uppercase tracking-wide">총 재생</p>
            <p className="text-xl sm:text-2xl font-bold text-white">{tracks.reduce((s, t) => s + (t.play_count ?? 0), 0).toLocaleString()}</p>
            <p className="text-xs text-zinc-600">회</p>
          </div>
          <div className="rounded-2xl bg-[#141414] p-5 ring-1 ring-[#1f1f1f] flex flex-col gap-1">
            <p className="text-xs text-zinc-500 uppercase tracking-wide">총 좋아요</p>
            <p className="text-xl sm:text-2xl font-bold text-[#A855F7]">{tracks.reduce((s, t) => s + (t.like_count ?? 0), 0).toLocaleString()}</p>
            <p className="text-xs text-zinc-600">개</p>
          </div>
        </div>
        <section className="rounded-2xl bg-[#141414] p-6 ring-1 ring-[#1f1f1f]">
          <ul className="grid grid-cols-1 gap-2">
            {tracks.map((track) => {
              const isCurrentTrack = currentTrack?.id === track.id;
              return (
                <li
                  key={track.id}
                  className={`flex items-center gap-4 rounded-xl py-3 px-4 transition hover:bg-white/5 ${
                    isCurrentTrack ? "bg-white/5 ring-1 ring-[#A855F7]/30" : ""
                  }`}
                >
                  <div
                    className={`h-12 w-12 shrink-0 rounded-lg bg-gradient-to-br ${pickCoverColor(track.id)}`}
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
                    <span className="flex items-center gap-1 text-zinc-500">
                      <Heart className="h-3 w-3" strokeWidth={1.5} />
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
                  <button
                    type="button"
                    onClick={() => setEditingTrack(track)}
                    className="rounded-lg p-2 text-zinc-400 transition hover:bg-[#A855F7]/10 hover:text-[#A855F7]"
                    aria-label="편집"
                  >
                    <Pencil className="h-5 w-5" strokeWidth={1.5} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(track)}
                    disabled={deletingId === track.id}
                    className="rounded-lg p-2 text-zinc-400 transition hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                    aria-label="삭제"
                  >
                    <Trash2 className="h-5 w-5" strokeWidth={1.5} />
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
