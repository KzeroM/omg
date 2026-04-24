"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Trash2, Search, AlertTriangle } from "lucide-react";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatKoreanNumber } from "@/utils/formatNumber";

interface AdminTrack {
  id: string;
  title: string | null;
  artist: string | null;
  file_path: string;
  play_count: number | null;
  like_count: number | null;
  created_at: string;
  user_id: string;
  nickname?: string;
}

const MUSIC_BUCKET = "omg-tracks";

export default function AdminTracksPage() {
  const [tracks, setTracks] = useState<AdminTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("tracks")
        .select("id, title, artist, file_path, play_count, like_count, created_at, user_id, users!user_id(nickname)")
        .order("created_at", { ascending: false })
        .limit(200);

      setTracks(
        (data ?? []).map((t) => ({
          ...t,
          nickname: (t.users as { nickname?: string } | null)?.nickname,
        }))
      );
      setLoading(false);
    };
    void load();
  }, []);

  const handleDelete = async (track: AdminTrack) => {
    if (!window.confirm(`"${track.title ?? track.id}" 트랙을 강제 삭제하시겠습니까?`)) return;
    setDeletingId(track.id);
    try {
      const res = await fetch(`/api/admin/tracks/${track.id}`, { method: "DELETE" });
      if (res.ok) setTracks((prev) => prev.filter((t) => t.id !== track.id));
      else alert("삭제 실패");
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = query.trim()
    ? tracks.filter(
        (t) =>
          t.title?.toLowerCase().includes(query.toLowerCase()) ||
          t.artist?.toLowerCase().includes(query.toLowerCase()) ||
          t.nickname?.toLowerCase().includes(query.toLowerCase())
      )
    : tracks;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">트랙 관리</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">전체 {tracks.length}개 트랙</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="제목 / 아티스트 / 업로더 검색"
          className="w-full rounded-xl bg-[var(--color-bg-surface)] py-2.5 pl-9 pr-4 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] outline-none ring-1 ring-[var(--color-border)] focus:ring-[var(--color-accent)]"
        />
      </div>

      {loading ? (
        <LoadingState />
      ) : filtered.length === 0 ? (
        <EmptyState title="검색 결과가 없습니다." />
      ) : (
        <div className="rounded-2xl bg-[var(--color-bg-surface)] ring-1 ring-[var(--color-border)] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-left">
                <th className="px-4 py-3 font-medium text-[var(--color-text-muted)]">트랙</th>
                <th className="px-4 py-3 font-medium text-[var(--color-text-muted)]">업로더</th>
                <th className="px-4 py-3 font-medium text-[var(--color-text-muted)] text-right">재생</th>
                <th className="px-4 py-3 font-medium text-[var(--color-text-muted)] text-right">좋아요</th>
                <th className="px-4 py-3 font-medium text-[var(--color-text-muted)]">업로드</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((track) => (
                <tr key={track.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-bg-hover)]">
                  <td className="px-4 py-3">
                    <p className="font-medium text-[var(--color-text-primary)] truncate max-w-[200px]">
                      {track.title ?? "제목 없음"}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">{track.artist ?? "—"}</p>
                  </td>
                  <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                    {track.nickname ?? track.user_id.slice(0, 8)}
                  </td>
                  <td className="px-4 py-3 text-right text-[var(--color-text-secondary)]">
                    {formatKoreanNumber(track.play_count ?? 0)}
                  </td>
                  <td className="px-4 py-3 text-right text-[var(--color-text-secondary)]">
                    {formatKoreanNumber(track.like_count ?? 0)}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-text-muted)] text-xs">
                    {new Date(track.created_at).toLocaleDateString("ko-KR")}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => void handleDelete(track)}
                      disabled={deletingId === track.id}
                      className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
                    >
                      {deletingId === track.id ? (
                        <AlertTriangle className="h-3.5 w-3.5 animate-pulse" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
