import { NextResponse } from "next/server";
import { requireAuth } from "@/utils/api/auth";

export interface TasteTag {
  id: string;
  name: string;
  category: string;
  count: number;
  pct: number; // 0~100, 최다 태그 대비 비율
}

/** 사용자 취향 태그 Top 10 반환 (재생 + 좋아요 기반) */
export async function GET() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { user, supabase } = auth;

  // 재생 이력 + 좋아요 트랙 ID 수집
  const [{ data: history }, { data: likes }] = await Promise.all([
    supabase
      .from("play_history")
      .select("track_id")
      .eq("user_id", user.id)
      .order("played_at", { ascending: false })
      .limit(200),
    supabase
      .from("track_likes")
      .select("track_id")
      .eq("user_id", user.id)
      .limit(200),
  ]);

  const playIds = new Set(history?.map((r) => r.track_id as string) ?? []);
  const likeIds = new Set(likes?.map((r) => r.track_id as string) ?? []);
  const allIds = [...new Set([...playIds, ...likeIds])];

  // 히스토리 없을 때 온보딩 preferred_tag_ids 폴백
  if (allIds.length === 0) {
    const { data: profile } = await supabase
      .from("users")
      .select("preferred_tag_ids")
      .eq("user_id", user.id)
      .single();

    const tagIds = (profile?.preferred_tag_ids as string[] | null) ?? [];
    if (tagIds.length === 0) return NextResponse.json({ tags: [] });

    const { data: tags } = await supabase
      .from("tags")
      .select("id, name, category")
      .in("id", tagIds);

    const result: TasteTag[] = (tags ?? []).map((t) => ({
      id: t.id as string,
      name: t.name as string,
      category: t.category as string,
      count: 1,
      pct: 100,
    }));

    return NextResponse.json({ tags: result });
  }

  // 태그 빈도 집계 (좋아요 곡은 가중치 2배)
  const { data: trackTags } = await supabase
    .from("track_tags")
    .select("track_id, tag_id, tags(id, name, category)")
    .in("track_id", allIds);

  const freq = new Map<string, { name: string; category: string; count: number }>();
  for (const row of trackTags ?? []) {
    const tag = row.tags as { id?: string; name?: string; category?: string } | null;
    if (!tag?.id || !tag.name) continue;
    const weight = likeIds.has(row.track_id as string) ? 2 : 1;
    const existing = freq.get(tag.id);
    if (existing) existing.count += weight;
    else freq.set(tag.id, { name: tag.name, category: tag.category ?? "", count: weight });
  }

  const sorted = [...freq.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10);

  const maxCount = sorted[0]?.[1].count ?? 1;

  const tags: TasteTag[] = sorted.map(([id, v]) => ({
    id,
    name: v.name,
    category: v.category,
    count: v.count,
    pct: Math.round((v.count / maxCount) * 100),
  }));

  return NextResponse.json({ tags });
}
