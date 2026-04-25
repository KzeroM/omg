"use client";

import { useEffect, useState, use } from "react";
import { ArrowLeft, Play, MessageCircle, Send, Clock, Trash2 } from "lucide-react";
import Link from "next/link";
import { formatKoreanNumber } from "@/utils/formatNumber";
import { createClient } from "@/utils/supabase/client";
import { usePlayer } from "@/context/PlayerContext";
import { LikeButton } from "@/components/LikeButton";
import { ShareButton } from "@/components/ShareButton";
import { ReportButton } from "@/components/ReportButton";
import { TierBadge } from "@/components/TierBadge";
import { pickCoverColor } from "@/utils/coverColor";
import type { PlaylistTrack } from "@/types/player";
import type { ArtistTier } from "@/types/tier";

interface Comment {
  id: string;
  user_id: string;
  content: string;
  timestamp_sec: number | null;
  created_at: string;
  users: { nickname: string } | null;
}

interface TrackDetail {
  id: string;
  title: string;
  artist: string;
  file_path: string;
  play_count: number | null;
  like_count: number | null;
  artist_tier: string | null;
  uploader_nickname: string | null;
  user_id: string;
}

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "방금";
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  return `${Math.floor(diff / 86400)}일 전`;
}

export default function TrackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [track, setTrack] = useState<TrackDetail | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { playSingleTrack, currentTrack } = usePlayer();

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id ?? null);
    });

    supabase
      .from("tracks")
      .select("id, title, artist, file_path, play_count, like_count, artist_tier, user_id, users!tracks_user_id_fkey(nickname)")
      .eq("id", id)
      .single()
      .then(({ data }) => {
        if (data) {
          const row = data as unknown as TrackDetail & { users: { nickname: string } | null };
          setTrack({ ...row, uploader_nickname: row.users?.nickname ?? null });
        }
        setLoading(false);
      });

    fetch(`/api/tracks/${id}/comments`)
      .then((r) => r.json())
      .then((d: { comments: Comment[] }) => setComments(d.comments ?? []));
  }, [id]);

  const handlePlay = () => {
    if (!track) return;
    const pt: PlaylistTrack = {
      id: track.id,
      rank: 0,
      title: track.title,
      artist: track.artist,
      coverColor: pickCoverColor(track.id),
      isFoundingMember: false,
      file_path: track.file_path,
      artist_tier: (track.artist_tier ?? undefined) as ArtistTier | undefined,
    };
    void playSingleTrack(pt);
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = newComment.trim();
    if (!content || submitting) return;
    setSubmitting(true);
    const res = await fetch(`/api/tracks/${id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    const data = await res.json() as { comment?: Comment; error?: string };
    if (data.comment) {
      setComments((prev) => [...prev, data.comment!]);
      setNewComment("");
    }
    setSubmitting(false);
  };

  const handleDeleteComment = async (commentId: string) => {
    await fetch(`/api/tracks/${id}/comments?commentId=${commentId}`, { method: "DELETE" });
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <p className="text-[var(--color-text-muted)]">불러오는 중…</p>
      </div>
    );
  }

  if (!track) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <p className="text-[var(--color-text-muted)]">트랙을 찾을 수 없습니다.</p>
        <Link href="/" className="mt-4 inline-block text-sm text-[var(--color-accent)] hover:underline">
          홈으로 돌아가기
        </Link>
      </div>
    );
  }

  const coverColor = pickCoverColor(track.id);
  const isActive = currentTrack?.id === track.id;

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      {/* Back */}
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] transition hover:text-[var(--color-accent)]">
        <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
        홈으로
      </Link>

      {/* Track card */}
      <div className="rounded-2xl bg-[var(--color-bg-surface)] p-6 ring-1 ring-[var(--color-border)]">
        <div className="flex items-start gap-5">
          <div className={`h-24 w-24 shrink-0 rounded-xl bg-gradient-to-br ${coverColor}`} />
          <div className="min-w-0 flex-1">
            <h1 className={`text-2xl font-bold ${isActive ? "text-[var(--color-accent)]" : "text-[var(--color-text-primary)]"}`}>
              {track.title}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Link
                href={`/artist/${encodeURIComponent(track.uploader_nickname ?? track.artist)}`}
                className="text-[var(--color-text-secondary)] transition hover:text-[var(--color-accent)]"
              >
                {track.artist}
              </Link>
              <TierBadge tier={(track.artist_tier ?? "basic") as ArtistTier} size="sm" />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1 text-xs text-[var(--color-text-muted)]">
              <Play className="h-3 w-3" strokeWidth={1.5} />
              <span>{formatKoreanNumber(track.play_count ?? 0)} plays</span>
              <span className="mx-1">·</span>
              <MessageCircle className="h-3 w-3" strokeWidth={1.5} />
              <span>{comments.length} comments</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-5 flex items-center gap-2">
          <button
            type="button"
            onClick={handlePlay}
            className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition ${
              isActive
                ? "bg-[var(--color-accent)] text-white"
                : "bg-[var(--color-accent-subtle)] text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-white"
            }`}
          >
            <Play className="h-4 w-4" strokeWidth={2} />
            {isActive ? "재생 중" : "재생"}
          </button>
          <LikeButton trackId={track.id} initialLikeCount={track.like_count ?? 0} />
          <ShareButton trackId={track.id} artistName={track.artist} />
          {currentUserId !== track.user_id && <ReportButton trackId={track.id} />}
        </div>
      </div>

      {/* Comments */}
      <section className="rounded-2xl bg-[var(--color-bg-surface)] p-6 ring-1 ring-[var(--color-border)]">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-[var(--color-text-primary)]">
          <MessageCircle className="h-5 w-5" strokeWidth={1.5} />
          댓글 <span className="text-sm font-normal text-[var(--color-text-muted)]">({comments.length})</span>
        </h2>

        {/* Comment form */}
        {currentUserId ? (
          <form onSubmit={(e) => void handleSubmitComment(e)} className="mb-6 flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="댓글을 입력하세요 (최대 500자)"
              maxLength={500}
              className="flex-1 rounded-xl bg-[var(--color-bg-elevated)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] ring-1 ring-[var(--color-border)] focus:outline-none focus:ring-[var(--color-accent)]"
            />
            <button
              type="submit"
              disabled={!newComment.trim() || submitting}
              className="rounded-xl bg-[var(--color-accent)] px-4 py-2.5 text-white transition hover:opacity-90 disabled:opacity-50"
              aria-label="댓글 등록"
            >
              <Send className="h-4 w-4" strokeWidth={2} />
            </button>
          </form>
        ) : (
          <p className="mb-6 rounded-xl bg-[var(--color-bg-elevated)] px-4 py-3 text-sm text-[var(--color-text-muted)]">
            댓글을 남기려면 <span className="text-[var(--color-accent)]">로그인</span>이 필요합니다.
          </p>
        )}

        {/* Comment list */}
        {comments.length === 0 ? (
          <div className="py-10 text-center">
            <MessageCircle className="mx-auto mb-2 h-8 w-8 text-[var(--color-text-muted)]" strokeWidth={1} />
            <p className="text-sm text-[var(--color-text-muted)]">첫 댓글을 남겨보세요!</p>
          </div>
        ) : (
          <ul className="space-y-4">
            {comments.map((c) => (
              <li key={c.id} className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-subtle)] text-xs font-bold text-[var(--color-accent)]">
                  {(c.users?.nickname ?? "?")[0].toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-[var(--color-text-primary)]">
                      {c.users?.nickname ?? "탈퇴한 사용자"}
                    </span>
                    {c.timestamp_sec != null && (
                      <span className="flex items-center gap-1 rounded-full bg-[var(--color-accent-subtle)] px-2 py-0.5 text-xs text-[var(--color-accent)]">
                        <Clock className="h-3 w-3" strokeWidth={1.5} />
                        {formatTime(c.timestamp_sec)}
                      </span>
                    )}
                    <span className="text-xs text-[var(--color-text-muted)]">{timeAgo(c.created_at)}</span>
                    {currentUserId === c.user_id && (
                      <button
                        type="button"
                        onClick={() => void handleDeleteComment(c.id)}
                        className="ml-auto rounded p-1 text-[var(--color-text-muted)] transition hover:text-red-400"
                        aria-label="댓글 삭제"
                      >
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                      </button>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{c.content}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

    </div>
  );
}
