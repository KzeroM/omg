import { createClient as createServerClient } from "./server";
import type { AlbumWithTracks, AlbumCoverType } from "@/types/album";

/** 서버 컴포넌트 전용 — SSR 스트리밍에서 사용 */
export async function getPublicAlbumsServer(limit = 20): Promise<AlbumWithTracks[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("albums")
    .select(`
      id, user_id, title, description, cover_type, cover_image_path, created_at, updated_at,
      album_tracks(track_id, position, tracks(id, title, artist, file_path, like_count, play_count))
    `)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return (data as Record<string, unknown>[]).map((album) => {
    const albumTracks = (album.album_tracks as Record<string, unknown>[]) ?? [];
    return {
      id: album.id as string,
      user_id: album.user_id as string,
      title: album.title as string,
      description: (album.description as string | null) ?? null,
      cover_type: album.cover_type as AlbumCoverType,
      cover_image_path: (album.cover_image_path as string | null) ?? null,
      created_at: album.created_at as string,
      updated_at: album.updated_at as string,
      tracks: albumTracks.map((at) => {
        const track = Array.isArray(at.tracks)
          ? (at.tracks[0] as Record<string, unknown> | undefined)
          : (at.tracks as Record<string, unknown> | undefined);
        return {
          track_id: at.track_id as string,
          position: at.position as number,
          added_at: "",
          title: (track?.title as string | null) ?? null,
          artist: (track?.artist as string | null) ?? null,
          file_path: (track?.file_path as string) ?? "",
        };
      }),
    };
  });
}
