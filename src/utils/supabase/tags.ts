import { createClient } from "./client";
import type { Tag, TagsByCategory, TagCategory } from "@/types/tag";

/** 전체 태그 목록을 카테고리별로 반환합니다. */
export async function getAllTagsByCategory(): Promise<TagsByCategory> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("tags")
    .select("id, name, category")
    .order("name");

  const empty: TagsByCategory = { genre: [], mood: [], bpm: [], instrument: [] };
  if (error || !data) return empty;

  return data.reduce((acc, row) => {
    const cat = row.category as TagCategory;
    if (acc[cat]) acc[cat].push({ id: row.id as string, name: row.name as string, category: cat });
    return acc;
  }, empty);
}

/** 특정 트랙에 붙은 태그 목록을 반환합니다. */
export async function getTagsByTrackId(trackId: string): Promise<Tag[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("track_tags")
    .select("tag_id, tags(id, name, category)")
    .eq("track_id", trackId);

  if (error || !data) return [];

  return data
    .map((row) => {
      const t = row.tags as { id?: string; name?: string; category?: string } | null;
      if (!t?.id) return undefined;
      return { id: t.id, name: t.name ?? "", category: t.category as TagCategory };
    })
    .filter((t): t is Tag => t !== undefined);
}

/** 로그인 사용자(아티스트)의 태그 목록을 반환합니다. */
export async function getMyArtistTags(): Promise<Tag[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("artist_tags")
    .select("tag_id, tags(id, name, category)")
    .eq("user_id", user.id);

  if (error || !data) return [];

  return data
    .map((row) => {
      const t = row.tags as { id?: string; name?: string; category?: string } | null;
      if (!t?.id) return undefined;
      return { id: t.id, name: t.name ?? "", category: t.category as TagCategory };
    })
    .filter((t): t is Tag => t !== undefined);
}

/** 트랙에 태그를 설정합니다. 기존 태그를 모두 교체합니다. */
export async function setTrackTags(trackId: string, tagIds: string[]): Promise<void> {
  const supabase = createClient();

  // 기존 태그 삭제
  const { error: delError } = await supabase
    .from("track_tags")
    .delete()
    .eq("track_id", trackId);
  if (delError) throw new Error(`태그 삭제 실패: ${delError.message}`);

  if (tagIds.length === 0) return;

  // 새 태그 삽입
  const { error: insError } = await supabase
    .from("track_tags")
    .insert(tagIds.map((tag_id) => ({ track_id: trackId, tag_id })));
  if (insError) throw new Error(`태그 추가 실패: ${insError.message}`);
}

/** 아티스트 자신의 태그를 설정합니다. 기존 태그를 모두 교체합니다. */
export async function setMyArtistTags(tagIds: string[]): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("로그인이 필요합니다.");

  const { error: delError } = await supabase
    .from("artist_tags")
    .delete()
    .eq("user_id", user.id);
  if (delError) throw new Error(`태그 삭제 실패: ${delError.message}`);

  if (tagIds.length === 0) return;

  const { error: insError } = await supabase
    .from("artist_tags")
    .insert(tagIds.map((tag_id) => ({ user_id: user.id, tag_id })));
  if (insError) throw new Error(`태그 추가 실패: ${insError.message}`);
}

/** 주어진 태그 ID들을 보유한 트랙 ID 목록을 반환합니다 (추천에 사용). */
export async function getTrackIdsByTagIds(tagIds: string[], limit = 20): Promise<string[]> {
  if (tagIds.length === 0) return [];
  const supabase = createClient();

  const { data, error } = await supabase
    .from("track_tags")
    .select("track_id")
    .in("tag_id", tagIds)
    .limit(limit * 3); // 중복 제거 후 limit 맞추기 위해 여유분 조회

  if (error || !data) return [];

  // 중복 제거 후 limit
  const unique = [...new Set(data.map((r) => r.track_id as string))];
  return unique.slice(0, limit);
}
