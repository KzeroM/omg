"use client";

import { useEffect, useState } from "react";
import { X, Music2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

interface Props {
  trackId: string | undefined;
  trackTitle?: string;
  onClose: () => void;
}

export function LyricsDrawer({ trackId, trackTitle, onClose }: Props) {
  const [lyrics, setLyrics] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!trackId) return;
    setLoading(true);
    void createClient()
      .from("tracks")
      .select("lyrics")
      .eq("id", trackId)
      .single()
      .then(({ data }) => {
        setLyrics((data?.lyrics as string | null) ?? null);
        setLoading(false);
      });
  }, [trackId]);

  return (
    <div
      className="fixed inset-0 z-[110] flex items-end lg:items-center lg:justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="가사"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative z-10 flex w-full flex-col rounded-t-2xl bg-[var(--color-bg-surface)] lg:max-w-lg lg:rounded-2xl lg:mx-4 max-h-[85dvh] lg:max-h-[70vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4 shrink-0">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">가사</p>
            {trackTitle && (
              <p className="mt-0.5 text-sm font-medium text-[var(--color-text-primary)] truncate max-w-[240px]">
                {trackTitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition"
            aria-label="닫기"
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-5 py-4 flex-1 overscroll-contain">
          {loading ? (
            <div className="space-y-3 py-4">
              {[70, 55, 80, 60, 75].map((w, i) => (
                <div
                  key={i}
                  className="h-4 animate-pulse rounded bg-[var(--color-bg-elevated)]"
                  style={{ width: `${w}%` }}
                />
              ))}
            </div>
          ) : lyrics ? (
            <pre className="whitespace-pre-wrap font-sans text-sm leading-8 text-[var(--color-text-secondary)]">
              {lyrics}
            </pre>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Music2
                className="mb-3 h-10 w-10 text-[var(--color-text-muted)]"
                strokeWidth={1}
              />
              <p className="text-sm text-[var(--color-text-muted)]">
                가사가 등록되지 않았습니다.
              </p>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                아티스트가 곡 편집에서 가사를 추가할 수 있습니다.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
