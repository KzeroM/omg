"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "omg_streak_date";

/** 로그인 상태일 때 하루 1회 streak API를 호출하고 현재 스트릭 수를 반환 */
export function useLoginStreak(isLoggedIn: boolean | null): number {
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    if (!isLoggedIn) return;

    const today = new Date().toISOString().slice(0, 10);
    if (localStorage.getItem(STORAGE_KEY) === today) return;

    fetch("/api/user/streak", { method: "POST" })
      .then((res) => res.json())
      .then((data: { streak?: number }) => {
        if (data.streak) {
          setStreak(data.streak);
          localStorage.setItem(STORAGE_KEY, today);
        }
      })
      .catch(() => {});
  }, [isLoggedIn]);

  return streak;
}
