import { createClient } from "./server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import type { PopularArtist } from "@/data/chart";
import { pickCoverColor } from "@/utils/coverColor";

/** 어드민이 수동 지정한 Featured Artists. 없으면 자동 TOP 아티스트로 폴백 */
export async function getFeaturedArtists(): Promise<PopularArtist[]> {
  try {
    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data } = await adminClient
      .from("featured_artists")
      .select("id, artist_name, display_order")
      .order("display_order", { ascending: true })
      .limit(8);

    if (data && data.length > 0) {
      return data.map((row: { id: string; artist_name: string }) => ({
        id: row.id,
        name: row.artist_name,
        tagline: "Featured Artist",
        color: pickCoverColor(row.artist_name),
      }));
    }
  } catch { /* 테이블 미존재 시 폴백 */ }

  return getTopArtists();
}

export async function getTopArtists(limit = 5): Promise<PopularArtist[]> {
  try {
    const client = await createClient();
    const { data, error } = await client.rpc("get_top_artists", {
      limit_count: limit,
    });

    if (error) {
      console.error("Failed to fetch top artists:", error);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.artist_name,
      name: row.artist_name,
      tagline: `${row.total_plays.toLocaleString()} plays`,
      color: pickCoverColor(row.artist_name),
    }));
  } catch (error) {
    console.error("Error fetching top artists:", error);
    return [];
  }
}
