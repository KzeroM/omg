"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import { copyTrackUrl } from "@/utils/share";
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
      await copyTrackUrl(artistName, trackId);
      setToast("링크가 복사되었습니다!");
    } catch (error) {
      console.error(error);
      setToast("링크 복사에 실패했습니다.");
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="rounded-lg p-2 text-zinc-400 transition hover:bg-[#A855F7]/10 hover:text-[#A855F7]"
        aria-label="공유"
      >
        <Share2 className="h-5 w-5" strokeWidth={1.5} />
      </button>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </>
  );
}
