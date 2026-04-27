import type { TrackVisibility } from "@/utils/upload";

/** Korean labels for track tag categories (chart/filter context). */
export const CATEGORY_KO: Record<string, string> = {
  genre: "장르",
  mood: "무드",
  bpm: "BPM",
  instrument: "악기",
};

/** Display labels for track visibility options. */
export const VISIBILITY_LABELS: Record<TrackVisibility, { label: string; desc: string }> = {
  public:         { label: "전체 공개",   desc: "누구나 들을 수 있습니다" },
  followers_only: { label: "팔로워 공개", desc: "팔로워만 들을 수 있습니다" },
  private:        { label: "비공개",       desc: "나만 볼 수 있습니다" },
};

/** Period display labels for analytics. */
export const PERIOD_LABELS: Record<string, string> = {
  "7d":  "7일",
  "30d": "30일",
  "90d": "90일",
};
