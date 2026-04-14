import { createClient } from "./client";
import type { ArtistTier } from "@/types/tier";

/** 특정 아티스트 유저 ID로 현재 tier 조회. 오류 시 'basic' 반환. */
export async function getArtistTierByUserId(userId: string): Promise<ArtistTier> {
  if (!userId) return 'basic';
  const supabase = createClient();
  const { data, error } = await supabase
    .from("users")
    .select("artist_tier")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return 'basic';
  return (data.artist_tier as ArtistTier) ?? 'basic';
}

/** artist name으로 user_id 조회 후 tier 반환 (아티스트 페이지용). */
export async function getArtistTierByName(artistName: string): Promise<ArtistTier> {
  if (!artistName) return 'basic';
  const supabase = createClient();
  const { data, error } = await supabase
    .from("users")
    .select("artist_tier")
    .ilike("nickname", artistName)
    .maybeSingle();

  if (error || !data) return 'basic';
  return (data.artist_tier as ArtistTier) ?? 'basic';
}

/** 관리자용: 전체 아티스트 tier 갱신 RPC 호출 */
export async function refreshAllArtistTiers(): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.rpc("refresh_artist_tiers");
  if (error) {
    console.error("[refreshAllArtistTiers]", error);
    throw error;
  }
}
