import { useQuery } from "@tanstack/react-query";
import { getTopChartTracks } from "@/utils/supabase/tracks";
import type { ChartTrack } from "@/data/chart";

export function useChartTracks(limit = 5) {
  return useQuery<ChartTrack[]>({
    queryKey: ["tracks", "chart", limit],
    queryFn: () => getTopChartTracks(limit),
    staleTime: 60_000,
  });
}