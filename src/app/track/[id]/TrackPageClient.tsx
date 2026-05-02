"use client";

import { useEffect, useState, use } from "react";
import {
  ArrowLeft, Play, MessageCircle, Send, Clock, Trash2,
  ChevronDown, ChevronUp, Music2, Tag,
} from "lucide-react";
import Link from "next/link";
import { formatKoreanNumber } from "@/utils/formatNumber";
import { createClient } from "@/utils/supabase/client";
import { usePlayer } from "@/context/PlayerContext";
import { LikeButton } from "@/components/LikeButton";
import { ShareButton } from "@/components/ShareButton";
import { ReportButton } from "@/components/ReportButton";
import { TierBadge } from "@/components/TierBadge";
import { TrackListSkeleton } from "@/components/skeletons/SkeletonRow";
import { EmojiReactions } from "@/components/EmojiReactions";
import { pickCoverColor } from "@/utils/coverColor";
import { getTagsByTrackId } from "@/utils/supabase/tags";
import type { PlaylistTrack } from "@/types/player";
import type { ArtistTier } from "@/types/tier";
import type { Tag as TrackTag } from "@/types/tag";

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
  cover_url: string | null;
  lyrics: string | null;
  credits: string | null;
  liner_notes: string | null;
}

const TAG_CATEGORY_COLORS: Record<string, string> = {
  genre: "bg-purple-500/15 text-purple-400",
  mood: "bg-blue-500/15 text-blue-400",
  bpm: "bg-orange-500/15 text-orange-400",
  instrument: "bg-green-500/15 text-green-400",
};

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

export default function TrackPageClient({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [track, setTrack] = useState<TrackDetail | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [tags, setTags] = useState<TrackTag[]>([]);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLyrics, setShowLyrics] = useState(false);
  const { playSingleTrack, currentTrack } = usePlayer();

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id ?? null);
    });

    supabase
      .from("tracks")
      .select(
        "id, title, artist, file_path, play_count, like_count, artist_tier, user_id, cover_url, lyrics, credits, liner_notes, users!tracks_user_id_public_users_fkey(nickname)"
      )
      .eq("id", id)
      .single()
      .then(({ data }) => {
        if (data) {
          const row = data as unknown as TrackDetail & {
            users: { nickname: string } | null;
          };
          setTrack({ ...row, uploader_nickname: row.users?.nickname ?? null });
        }
        setLoading(false);
      });

    fetch(`/api/tracks/${id}/comments`)
      .then((r) => r.json())
      .then((d: { comments: Comment[] }) => setComments(d.comments ?? []));

    getTagsByTrackId(id).then(setTags).catch(() => {});
  }, [id]);

  const handlePlay = () => {
    if (!track) return;
    const pt: PlaylistTrack = {
      id: track.id,
      rank: 0,
      title: track.title,
      artist: track.artist,
      coverColor: pickCoverColor(track.id),
      cover_url: track.cover_url ?? undefined,
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
    const data = (await res.json()) as { comment?: Comment; error?: string };
    if (data.comment) {
      setComments((prev) => [...prev, data.comment!]);
      setNewComment("");
    }
    setSubmitting(false);
  };

  const handleDeleteComment = async (commentId: string) => {
    await fetch(`/api/tracks/${id}/comments?commentId=${commentId}`, {
      method: "DELETE",
    });
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 px-6 py-8">
        <div className="h-8 w-24 animate-pulse rounded bg-[var(--color-bg-surface)]" />
        <div className="rounded-2xl bg-[var(--color-bg-surface)] p-6 ring-1 ring-[var(--color-border)]">
          <div className="flex gap-5">
            <div className="h-28 w-28 shrink-0 animate-pulse rounded-xl bg-[var(--color-bg-hover)]" />
            <div className="flex-1 space-y-3 pt-1">
              <div className="h-5 w-3/4 animate-pulse rounded bg-[var(--color-bg-hover)]" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-[var(--color-bg-hover)]" />
              <div className="h-3 w-1/3 animate-pulse rounded bg-[var(--color-bg-hover)]" />
            </div>
          </div>
        </div>
        <TrackListSkeleton rows={3} />
      </div>
    );
  }

  if (!track) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <p className="text-[var(--color-text-muted)]">트랙을 찾을 수 없습니다.</p>
        <Link
          href="/"
          className="mt-4 inline-block text-sm text-[var(--color-accent)] hover:underline"
        >
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
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] transition hover:text-[var(--color-accent)]"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
        홈으로
      </Link>

      {/* Track card */}
      <div className="rounded-2xl bg-[var(--color-bg-surface)] p-6 ring-1 ring-[var(--color-border)]">
        <div className="flex items-start gap-5">
          {/* Cover art */}
          {track.cover_url ? (
            <img
              src={track.cover_url}
              alt={`${track.title} cover`}
              className="h-28 w-28 shrink-0 rounded-xl object-cover ring-1 ring-[var(--color-border)]"
            />
          ) : (
            <div
              className={`h-28 w-28 shrink-0 rounded-xl bg-gradient-to-br ${coverColor} flex items-center justify-center`}
            >
              <Music2 className="h-8 w-8 text-white/60" strokeWidth={1.5} />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <h1
              className={`text-2xl font-bold leading-tight ${
                isActive
                  ? "text-[var(--color-accent)]"
                  : "text-[var(--color-text-primary)]"
              }`}
            >
              {track.title}
            </h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <Link
                href={`/artist/${encodeURIComponent(
                  track.uploader_nickname ?? track.artist
                )}`}
                className="text-[var(--color-text-secondary)] transition hover:text-[var(--color-accent)]"
              >
                {track.artist}
              </Link>
              <TierBadge
                tier={(track.artist_tier ?? "basic") as ArtistTier}
                size="sm"
              />
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

        {/* Tags */}
        {tags.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            <Tag className="h-3 w-3 shrink-0 text-[var(--color-text-muted)]" strokeWidth={1.5} />
            {tags.map((tag) => (
              <span
                key={tag.id}
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  TAG_CATEGORY_COLORS[tag.category] ??
                  "bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)]"
                }`}
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="mt-5 flex flex-wrap items-center gap-2">
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
          {currentUserId !== track.user_id && (
            <ReportButton trackId={track.id} />
          )}
        </div>

        {/* Emoji reactions */}
        <div className="mt-4">
          <EmojiReactions trackId={track.id} />
        </div>
      </div>

      {/* Lyrics */}
      {track.lyrics && (
        <section className="rounded-2xl bg-[var(--color-bg-surface)] ring-1 ring-[var(--color-border)] overflow-hidden">
          <button
            type="button"
            onClick={() => setShowLyrics((v) => !v)}
            className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-[var(--color-bg-hover)] transition"
          >
            <h2 className="text-base font-semibold text-[var(--color-text-primary)]">가사</h2>
            {showLyrics ? (
              <ChevronUp className="h-4 w-4 text-[var(--color-text-muted)]" strokeWidth={1.5} />
            ) : (
              <ChevronDown className="h-4 w-4 text-[var(--color-text-muted)]" strokeWidth={1.5} />
            )}
          </button>
          {showLyrics && (
            <div className="border-t border-[var(--color-border)] px-6 py-4">
              <pre className="whitespace-pre-wrap text-sm leading-7 text-[var(--color-text-secondary)] font-sans">
                {track.lyrics}
              </pre>
            </div>
          )}
        </section>
      )}

      {/* Credits */}
      {track.credits && (
        <section className="rounded-2xl bg-[var(--color-bg-surface)] p-6 ring-1 ring-[var(--color-border)]">
          <h2 className="mb-3 text-base font-semibold text-[var(--color-text-primary)]">크레딧</h2>
          <pre className="whitespace-pre-wrap text-sm leading-6 text-[var(--color-text-secondary)] font-sans">
            {track.credits}
          </pre>
        </section>
      )}

      {/* Liner Notes */}
      {track.liner_notes && (
        <section className="rounded-2xl bg-[var(--color-bg-surface)] p-6 ring-1 ring-[var(--color-border)]">
          <h2 className="mb-3 text-base font-semibold text-[var(--color-text-primary)]">라이너 노트</h2>
          <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--color-text-secondary)]">
            {track.liner_notes}
          </p>
        </section>
      )}

      {/* Comments */}
      <section className="rounded-2xl bg-[var(--color-bg-surface)] p-6 ring-1 ring-[var(--color-border)]">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-[var(--color-text-primary)]">
          <MessageCircle className="h-5 w-5" strokeWidth={1.5} />
          댓글{" "}
          <span className="text-sm font-normal text-[var(--color-text-muted)]">
            ({comments.length})
          </span>
        </h2>

        {currentUserId ? (
          <form
            onSubmit={(e) => void handleSubmitComment(e)}
            className="mb-6 flex gap-2"
          >
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
            댓글을 남기려면{" "}
            <span className="text-[var(--color-accent)]">로그인</span>이
            필요합니다.
          </p>
        )}

        {comments.length === 0 ? (
          <div className="py-10 text-center">
            <MessageCircle
              className="mx-auto mb-2 h-8 w-8 text-[var(--color-text-muted)]"
              strokeWidth={1}
            />
            <p className="text-sm text-[var(--color-text-muted)]">
              첫 댓글을 남겨보세요!
            </p>
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
                    <span className="text-xs text-[var(--color-text-muted)]">
                      {timeAgo(c.created_at)}
                    </span>
                    {(currentUserId === c.user_id || currentUserId === track.user_id) && (
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
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                    {c.content}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
