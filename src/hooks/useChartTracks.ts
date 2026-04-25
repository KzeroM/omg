import { useQuery } from "@tanstack/react-query";
import { getChartByPeriod, getLatestTracks } from "@/utils/supabase/tracks";
import type { ChartTrack } from "@/data/chart";

export type ChartPeriod = 'daily' | 'weekly' | 'monthly';

export function useChartTracks(
  period: ChartPeriod = 'weekly',
  tagIds: string[] = [],
  limit = 50
) {
  const tagKey = [...tagIds].sort().join(',');
  return useQuery<ChartTrack[]>({
    queryKey: ["tracks", "chart", period, tagKey, limit],
    queryFn: () => getChartByPeriod(period, tagIds, limit),
    staleTime: 60_000,
  });
}

export function useLatestTracks(limit = 20) {
  return useQuery<ChartTrack[]>({
    queryKey: ["tracks", "latest", limit],
    queryFn: () => getLatestTracks(limit),
    staleTime: 30_000,
  });
}
