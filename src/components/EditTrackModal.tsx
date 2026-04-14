"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { DbTrack } from "@/types/player";

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "저장 실패";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-[#141414] p-6 ring-1 ring-[#1f1f1f]">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-white">곡 정보 수정</h3>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-1 text-zinc-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <label className="mb-1 block text-xs text-zinc-500">곡 제목</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !loading && handleSave()}
          placeholder="곡 제목을 입력하세요"
          disabled={loading}
          className="mb-3 w-full rounded-xl bg-[#1f1f1f] px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none ring-1 ring-[#2a2a2a] focus:ring-[#A855F7] disabled:opacity-60 disabled:cursor-not-allowed"
          autoFocus
        />

        <label className="mb-1 block text-xs text-zinc-500">아티스트명</label>
        <input
          type="text"
          value={artist}
          onChange={(e) => setArtist(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !loading && handleSave()}
          placeholder="아티스트명을 입력하세요"
          disabled={loading}
          className="mb-3 w-full rounded-xl bg-[#1f1f1f] px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none ring-1 ring-[#2a2a2a] focus:ring-[#A855F7] disabled:opacity-60 disabled:cursor-not-allowed"
        />

        {error && (
          <p className="mb-3 text-sm text-red-400">{error}</p>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-xl bg-[#1f1f1f] py-2.5 text-sm text-zinc-400 transition hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading || !title.trim()}
            className="flex-1 rounded-xl bg-[#A855F7] py-2.5 text-sm font-medium text-white transition hover:bg-[#9333ea] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "저장 중…" : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
}
