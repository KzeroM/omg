"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { AuthModal } from "./AuthModal";

type FollowButtonProps = {
  artistId: string;
  initialFollowing: boolean;
  initialFollowerCount: number;
};

export function FollowButton({
  artistId,
  initialFollowing,
  initialFollowerCount,
}: FollowButtonProps) {
  const [following, setFollowing] = useState(initialFollowing);
  const [followerCount, setFollowerCount] = useState(initialFollowerCount);
  const [isPending, setIsPending] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPending) return;

    // 비로그인 체크
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setShowAuth(true);
      return;
    }

    // 팔로우 토글
    setIsPending(true);
    try {
      const response = await fetch(`/api/follow/${artistId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const { error: msg } = (await response.json()) as { error?: string };
        setError(msg ?? "팔로우 처리 중 오류가 발생했습니다.");
        setTimeout(() => setError(null), 3000);
        return;
      }

      const { following: newFollowing, follower_count } =
        (await response.json()) as {
          following: boolean;
          follower_count: number;
        };
      setFollowing(newFollowing);
      setFollowerCount(follower_count);
    } catch (err) {
      console.error("[FollowButton] Network error:", err);
      setError("네트워크 오류가 발생했습니다.");
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <>
      <div className="flex flex-col items-start gap-1">
        <button
          onClick={handleClick}
          disabled={isPending}
          className={`
            inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium
            transition-colors duration-150 disabled:opacity-60
            ${
              following
                ? "bg-[var(--color-accent-subtle)] text-[var(--color-accent)] hover:bg-[var(--color-accent-subtle)]/75"
                : "bg-[var(--color-accent)] text-[var(--color-text-primary)] hover:bg-[var(--color-accent-hover)]"
            }
          `}
        >
          {following ? "팔로잉" : "팔로우"}
        </button>
        {error && (
          <p className="text-xs text-red-400">{error}</p>
        )}
      </div>
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
