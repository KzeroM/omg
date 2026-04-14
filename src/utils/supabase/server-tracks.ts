import { createClient } from "./server";
import type { PopularArtist } from "@/data/chart";
import { pickCoverColor } from "@/utils/coverColor";

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
