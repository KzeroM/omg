"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import { copyTrackUrl, type ShareResult } from "@/utils/share";
import { Toast } from "./Toast";

type ShareButtonProps = {
  trackId: string;
  artistName: string;
};

export function ShareButton({ trackId, artistName }: ShareButtonProps) {
  const [toast, setToast] = useState<string | null>(null);

  if (trackId.startsWith("upload-")) {
    return null;
  }

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const result: ShareResult = await copyTrackUrl(artistName, trackId);
      if (result === "copied") setToast("링크가 복사되었습니다!");
      // "shared": 네이티브 시트가 열리므로 별도 토스트 불필요
      // "cancelled": 사용자 취소이므로 조용히 무시
    } catch (error) {
      console.error(error);
      setToast("공유에 실패했습니다.");
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="rounded-lg p-2 text-[var(--color-text-secondary)] transition hover:bg-[var(--color-accent-subtle)] hover:text-[var(--color-accent)]"
        aria-label="공유"
      >
        <Share2 className="h-5 w-5" strokeWidth={1.5} />
      </button>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </>
  );
}
