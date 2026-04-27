"use client";

import { useCallback, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { toggleTrackLike } from "@/utils/supabase/tracks";

/**
 * Manages like state and toggleLike logic.
 * Call initializeLikes() after loading tracks from DB to seed state.
 */
export function useLikeTrack() {
  const [likedTrackIds, setLikedTrackIds] = useState<Set<string>>(new Set());
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [pendingLikeId, setPendingLikeId] = useState<string | null>(null);

  const initializeLikes = useCallback(
    (likedIds: Set<string>, counts: Record<string, number>) => {
      setLikedTrackIds(likedIds);
      setLikeCounts(counts);
    },
    []
  );

  const toggleLike = useCallback(
    async (trackId: string) => {
      if (trackId.startsWith("upload-")) return;
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const prevLiked = likedTrackIds.has(trackId);
      const prevCount = likeCounts[trackId] ?? 0;

      // 낙관적 업데이트
      setLikedTrackIds((prev) => {
        const next = new Set(prev);
        if (prevLiked) next.delete(trackId);
        else next.add(trackId);
        return next;
      });
      setLikeCounts((prev) => ({
        ...prev,
        [trackId]: prevLiked ? Math.max(prevCount - 1, 0) : prevCount + 1,
      }));
      setPendingLikeId(trackId);

      try {
        const result = await toggleTrackLike(trackId);
        if (result) {
          // RPC 결과로 상태 교정
          setLikedTrackIds((prev) => {
            const next = new Set(prev);
            if (result.liked) next.add(trackId);
            else next.delete(trackId);
            return next;
          });
          setLikeCounts((prev) => ({ ...prev, [trackId]: result.like_count }));
        } else {
          // RPC 실패 시 롤백
          setLikedTrackIds((prev) => {
            const next = new Set(prev);
            if (prevLiked) next.add(trackId);
            else next.delete(trackId);
            return next;
          });
          setLikeCounts((prev) => ({ ...prev, [trackId]: prevCount }));
        }
      } catch {
        // 예외 시 롤백
        setLikedTrackIds((prev) => {
          const next = new Set(prev);
          if (prevLiked) next.add(trackId);
          else next.delete(trackId);
          return next;
        });
        setLikeCounts((prev) => ({ ...prev, [trackId]: prevCount }));
      } finally {
        setPendingLikeId(null);
      }
    },
    [likedTrackIds, likeCounts]
  );

  return { likedTrackIds, likeCounts, pendingLikeId, initializeLikes, toggleLike };
}
