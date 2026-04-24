"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { usePlayer } from "@/context/PlayerContext";
import { formatKoreanNumber } from "@/utils/formatNumber";
import { AuthModal } from "./AuthModal";

type LikeButtonProps = {
  trackId: string;
  initialLikeCount: number;
};

export function LikeButton({ trackId, initialLikeCount }: LikeButtonProps) {
  const { likedTrackIds, likeCounts, toggleLike, pendingLikeId } = usePlayer();
  const [showAuth, setShowAuth] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const liked = likedTrackIds.has(trackId);
  const likeCount = likeCounts[trackId] ?? initialLikeCount;
  const isPending = pendingLikeId === trackId;
  const isDisabled = trackId.startsWith("upload-");

  useEffect(() => {
    if (!isAnimating) return;

    const timer = setTimeout(() => {
      setIsAnimating(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [isAnimating]);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDisabled || isPending) return;
    // 비로그인 체크: toggleLike 내부에서도 동일 검증을 하므로
    // 여기서는 AuthModal 표시 여부만 결정한다 (getUser는 1회만 호출).
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setShowAuth(true);
      return;
    }
    // 인증 확인 완료 후 toggleLike 위임
    // (toggleLike 내부 getUser 호출은 캐시를 활용하므로 추가 네트워크 비용 없음)
    setIsAnimating(true);
    await toggleLike(trackId);
  };

  return (
    <>
      <button
        className="flex shrink-0 items-center gap-1.5 rounded-lg p-2 transition-colors duration-150 hover:bg-[var(--color-bg-hover)] disabled:cursor-not-allowed disabled:opacity-40"
        onClick={handleClick}
        disabled={isDisabled || isPending}
      >
        <Heart
          className={`h-4 w-4 transition-all duration-150 active:scale-110 ${
            liked
              ? "fill-[var(--color-accent)] text-[var(--color-accent)]"
              : "fill-none text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
          } ${isPending ? "opacity-70" : ""} ${
            isAnimating ? "animate-like-heart-pulse" : ""
          }`}
          strokeWidth={2}
        />
        {!isDisabled && (
          <span
            className={`min-w-[1.5ch] text-xs tabular-nums ${
              liked ? "text-[var(--color-accent)]" : "text-[var(--color-text-muted)]"
            }`}
          >
            {formatKoreanNumber(likeCount)}
          </span>
        )}
      </button>
      {showAuth && (
        <AuthModal
          initialMode="login"
          onClose={() => setShowAuth(false)}
          onSuccess={() => setShowAuth(false)}
        />
      )}
    </>
  );
}
