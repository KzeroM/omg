import { createClient as createServerClient } from "./server";
import type { TagWithCount } from "@/types/tag";

/** 서버 컴포넌트 전용 — track_tags에서 태그별 트랙 수 집계 (TOP 12) */
export async function getDiscoveryTagsServer(): Promise<TagWithCount[]> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("track_tags")
    .select("tag_id, tags(id, name, category)");

  if (!data) return [];

  const countMap = new Map<string, TagWithCount>();
  for (const row of data) {
    const tag = row.tags as { id?: string; name?: string; category?: string } | null;
    if (!tag?.id || !tag.name) continue;
    const existing = countMap.get(tag.id);
    if (existing) existing.track_count += 1;
    else countMap.set(tag.id, { id: tag.id, name: tag.name, category: tag.category ?? "", track_count: 1 });
  }

  return [...countMap.values()]
    .sort((a, b) => b.track_count - a.track_count)
    .slice(0, 12);
}
