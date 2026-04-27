"use client";

import { useCallback } from "react";
import { incrementPlayCount, addPlayHistory } from "@/utils/supabase/tracks";

/**
 * Records a play event: increments play_count and appends to play_history.
 * Call recordPlay(trackId) when audio starts playing.
 */
export function usePlayHistory() {
  const recordPlay = useCallback((trackId: string) => {
    void incrementPlayCount(trackId);
    void addPlayHistory(trackId);
  }, []);

  return { recordPlay };
}
