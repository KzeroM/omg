"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { DbTrack } from "@/types/player";
import { TagSelector } from "./TagSelector";
import { getTagsByTrackId, setTrackTags } from "@/utils/supabase/tags";

interface EditTrackModalProps {
  track: DbTrack;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (title: string, artist: string) => Promise<void>;
}

export function EditTrackModal({
  track,
  isOpen,
  onClose,
  onSaved,
}: EditTrackModalProps) {
  const [title, setTitle] = useState(track.title ?? "");
  const [artist, setArtist] = useState(track.artist ?? "");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 모달 열릴 때 기존 태그 로드
  useEffect(() => {
    if (!isOpen) return;
    setTitle(track.title ?? "");
    setArtist(track.artist ?? "");
    getTagsByTrackId(track.id)
      .then((tags) => setSelectedTagIds(tags.map((t) => t.id)))
      .catch(console.error);
  }, [isOpen, track]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!title.trim()) {
      setError("제목을 입력해주세요.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onSaved(title, artist);
      await setTrackTags(track.id, selectedTagIds);
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "저장 실패";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-[var(--color-bg-surface)] p-6 ring-1 ring-[var(--color-border)] max-h-[90vh] overflow-y-auto">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-[var(--color-text-primary)]">곡 정보 수정</h3>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <label className="mb-1 block text-xs text-[var(--color-text-muted)]">곡 제목</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !loading && handleSave()}
          placeholder="곡 제목을 입력하세요"
          disabled={loading}
          className="mb-3 w-full rounded-xl bg-[var(--color-bg-elevated)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] outline-none ring-1 ring-[var(--color-border)] focus:ring-[var(--color-accent)] disabled:opacity-60 disabled:cursor-not-allowed"
          autoFocus
        />

        <label className="mb-1 block text-xs text-[var(--color-text-muted)]">아티스트명</label>
        <input
          type="text"
          value={artist}
          onChange={(e) => setArtist(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !loading && handleSave()}
          placeholder="아티스트명을 입력하세요"
          disabled={loading}
          className="mb-4 w-full rounded-xl bg-[var(--color-bg-elevated)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] outline-none ring-1 ring-[var(--color-border)] focus:ring-[var(--color-accent)] disabled:opacity-60 disabled:cursor-not-allowed"
        />

        <label className="mb-2 block text-xs text-[var(--color-text-muted)]">태그</label>
        <div className="mb-4 rounded-xl bg-[var(--color-bg-elevated)] p-4 ring-1 ring-[var(--color-border)]">
          <TagSelector
            selectedTagIds={selectedTagIds}
            onChange={setSelectedTagIds}
            disabled={loading}
          />
        </div>

        {error && (
          <p className="mb-3 text-sm text-red-400">{error}</p>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-xl bg-[var(--color-bg-elevated)] py-2.5 text-sm text-[var(--color-text-secondary)] transition hover:text-[var(--color-text-primary)] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading || !title.trim()}
            className="flex-1 rounded-xl bg-[var(--color-accent)] py-2.5 text-sm font-medium text-[var(--color-text-primary)] transition hover:bg-[var(--color-accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "저장 중…" : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
}
