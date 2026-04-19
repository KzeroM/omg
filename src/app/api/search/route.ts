import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { pickCoverColor } from "@/utils/coverColor";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const q = searchParams.get("q")?.trim() ?? "";
    const tagIds = searchParams.get("tags")?.split(",").filter(Boolean) ?? [];
    const sort = searchParams.get("sort") ?? "popular";

    const supabase = await createClient();

    // 태그 필터가 있으면 track_tags 서브쿼리 사용
    if (tagIds.length > 0) {
      // 선택된 태그를 모두 가진 트랙 ID 조회
      const { data: tagMatches } = await supabase
        .from("track_tags")
        .select("track_id")
        .in("tag_id", tagIds);

      if (!tagMatches || tagMatches.length === 0) {
        return NextResponse.json({ tracks: [], tags: [] });
      }

      // 선택된 태그를 모두 포함하는 track_id 필터링
      const countMap = new Map<string, number>();
      for (const row of tagMatches) {
        const id = row.track_id as string;
        countMap.set(id, (countMap.get(id) ?? 0) + 1);
      }
      const matchingIds = [...countMap.entries()]
        .filter(([, count]) => count >= tagIds.length)
        .map(([id]) => id);

      if (matchingIds.length === 0) {
        return NextResponse.json({ tracks: [], tags: [] });
      }

      let query = supabase
        .from("tracks")
        .select("id, title, artist, file_path, play_count, like_count, users!user_id(nickname)")
        .in("id", matchingIds);

      if (q) {
        query = query.or(`title.ilike.%${q}%,artist.ilike.%${q}%`);
      }

      query = sort === "newest"
        ? query.order("created_at", { ascending: false })
        : query.order("play_count", { ascending: false });

      query = query.limit(50);

      const { data: tracks } = await query;
      return NextResponse.json({ tracks: buildResult(tracks ?? []) });
    }

    // 텍스트 검색만
    if (q) {
      let query = supabase
        .from("tracks")
        .select("id, title, artist, file_path, play_count, like_count, users!user_id(nickname)")
        .or(`title.ilike.%${q}%,artist.ilike.%${q}%`);

      query = sort === "newest"
        ? query.order("created_at", { ascending: false })
        : query.order("play_count", { ascending: false });

      query = query.limit(50);

      const { data: tracks } = await query;
      return NextResponse.json({ tracks: buildResult(tracks ?? []) });
    }

    // 쿼리 없으면 빈 결과
    return NextResponse.json({ tracks: [] });
  } catch (err) {
    console.error("[GET /api/search]", err);
    return NextResponse.json({ error: "검색 실패" }, { status: 500 });
  }
}

function buildResult(tracks: Record<string, unknown>[]) {
  return tracks.map((row) => ({
    id: row.id as string,
    title: (row.title as string | null) ?? "제목 없음",
    artist: (row.artist as string | null) ?? "Unknown Artist",
    file_path: (row.file_path as string | null) ?? undefined,
    play_count: (row.play_count as number | null) ?? 0,
    like_count: (row.like_count as number | null) ?? 0,
    coverColor: pickCoverColor(row.id as string),
    uploader_nickname: (row.users as { nickname?: string } | null)?.nickname,
  }));
}
