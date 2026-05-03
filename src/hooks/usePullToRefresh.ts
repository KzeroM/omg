"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const PULL_THRESHOLD = 64;

export function usePullToRefresh(onRefresh: () => Promise<void> | void) {
  const [pullY, setPullY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startYRef = useRef<number | null>(null);
  const callbackRef = useRef(onRefresh);

  useEffect(() => { callbackRef.current = onRefresh; });

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (window.scrollY > 0) return;
    startYRef.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (startYRef.current === null || window.scrollY > 0) return;
    const dy = e.touches[0].clientY - startYRef.current;
    if (dy > 0) setPullY(Math.min(dy, PULL_THRESHOLD * 1.5));
  }, []);

  const handleTouchEnd = useCallback(async () => {
    const dy = pullY;
    setPullY(0);
    startYRef.current = null;
    if (dy >= PULL_THRESHOLD) {
      setRefreshing(true);
      try { await callbackRef.current(); } finally { setRefreshing(false); }
    }
  }, [pullY]);

  useEffect(() => {
    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchmove", handleTouchMove, { passive: true });
    document.addEventListener("touchend", handleTouchEnd);
    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    pulling: pullY > 8,
    pullProgress: Math.min(pullY / PULL_THRESHOLD, 1),
    refreshing,
  };
}
