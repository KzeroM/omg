"use client";

import { Play, ExternalLink, Share2, X } from "lucide-react";
import Link from "next/link";

interface Props {
  trackId: string;
  title: string;
  artist?: string;
  onPlay?: () => void;
  onClose: () => void;
}

export function TrackActionsSheet({ trackId, title, artist, onPlay, onClose }: Props) {
  const handleShare = async () => {
    const url = `${window.location.origin}/track/${trackId}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // clipboard not available — silently skip
    }
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-[90] bg-black/50" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-[91] rounded-t-2xl bg-[var(--color-bg-surface)] pb-safe animate-in slide-in-from-bottom duration-200">
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-[var(--color-border)]" />
        </div>
        <div className="border-b border-[var(--color-border)] px-5 py-3">
          <p className="truncate font-semibold text-[var(--color-text-primary)]">{title}</p>
          {artist && <p className="truncate text-sm text-[var(--color-text-secondary)]">{artist}</p>}
        </div>
        <div className="py-2">
          {onPlay && (
            <button
              type="button"
              onClick={() => { onPlay(); onClose(); }}
              className="flex w-full items-center gap-4 px-5 py-3.5 text-left hover:bg-[var(--color-bg-hover)]"
            >
              <Play className="h-5 w-5 text-[var(--color-accent)]" strokeWidth={1.5} />
              <span className="text-sm text-[var(--color-text-primary)]">재생</span>
            </button>
          )}
          <Link
            href={`/track/${trackId}`}
            onClick={onClose}
            className="flex w-full items-center gap-4 px-5 py-3.5 hover:bg-[var(--color-bg-hover)]"
          >
            <ExternalLink className="h-5 w-5 text-[var(--color-text-secondary)]" strokeWidth={1.5} />
            <span className="text-sm text-[var(--color-text-primary)]">트랙 페이지</span>
          </Link>
          <button
            type="button"
            onClick={() => void handleShare()}
            className="flex w-full items-center gap-4 px-5 py-3.5 text-left hover:bg-[var(--color-bg-hover)]"
          >
            <Share2 className="h-5 w-5 text-[var(--color-text-secondary)]" strokeWidth={1.5} />
            <span className="text-sm text-[var(--color-text-primary)]">링크 복사</span>
          </button>
        </div>
        <div className="border-t border-[var(--color-border)] py-2">
          <button
            type="button"
            onClick={onClose}
            className="flex w-full items-center justify-center gap-2 py-3 text-sm text-[var(--color-text-muted)]"
          >
            <X className="h-4 w-4" strokeWidth={2} />
            닫기
          </button>
        </div>
      </div>
    </>
  );
}
