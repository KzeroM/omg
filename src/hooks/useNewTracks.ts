import { useQuery } from "@tanstack/react-query";
import { loadPublicTracks } from "@/utils/supabase/tracks";
import type { PlaylistTrack } from "@/types/player";

export function useNewTracks(limit = 50) {
  return useQuery<PlaylistTrack[]>({
    queryKey: ["tracks", "new", limit],
    queryFn: () => loadPublicTracks(limit),
    staleTime: 60_000,
  });
}