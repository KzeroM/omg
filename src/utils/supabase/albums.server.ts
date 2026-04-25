import { createClient as createServerClient } from "./server";
import type { AlbumWithTracks } from "@/types/album";

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
  return data as unknown as AlbumWithTracks[];
}
