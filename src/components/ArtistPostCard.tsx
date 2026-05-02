"use client";

import { Trash2 } from "lucide-react";

interface ArtistPost {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  users: { nickname: string | null } | null;
}

interface Props {
  post: ArtistPost;
  currentUserId: string | null;
  onDelete: (id: string) => void;
}

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "방금";
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}일 전`;
  return new Date(iso).toLocaleDateString("ko-KR");
}

export function ArtistPostCard({ post, currentUserId, onDelete }: Props) {
  const nickname = post.users?.nickname ?? "아티스트";
  const initial = nickname[0].toUpperCase();

  return (
    <div className="flex gap-3 py-4 border-b border-[var(--color-border)] last:border-0">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-subtle)] text-sm font-bold text-[var(--color-accent)]">
        {initial}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[var(--color-text-primary)]">{nickname}</span>
            <span className="text-xs text-[var(--color-text-muted)]">{timeAgo(post.created_at)}</span>
          </div>
          {currentUserId === post.user_id && (
            <button
              type="button"
              onClick={() => onDelete(post.id)}
              className="rounded p-1 text-[var(--color-text-muted)] transition hover:text-red-400"
              aria-label="포스트 삭제"
            >
              <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
            </button>
          )}
        </div>
        <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-secondary)] whitespace-pre-wrap">
          {post.content}
        </p>
      </div>
    </div>
  );
}
