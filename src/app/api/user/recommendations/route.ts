import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { pickCoverColor } from "@/utils/coverColor";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // ─── 사용자 탑 태그 조회 ─────────────────────────────────
    let userTopTagIds: string[] = [];

    if (user) {
      // 재생/좋아요 트랙들의 태그 집계
      const [{ data: history }, { data: likes }] = await Promise.all([
        supabase
          .from("play_history")
          .select("track_id")
          .eq("user_id", user.id)
          .limit(50),
        supabase
          .from("track_likes")
          .select("track_id")
          .eq("user_id", user.id)
          .limit(50),
      ]);

      const interactedTrackIds = [
        ...new Set([
          ...(history?.map((r) => r.track_id as string) ?? []),
          ...(likes?.map((r) => r.track_id as string) ?? []),
        ]),
      ];

      if (interactedTrackIds.length > 0) {
        const { data: trackTags } = await supabase
          .from("track_tags")
          .select("tag_id")
          .in("track_id", interactedTrackIds);

        if (trackTags) {
          const tagFreq = new Map<string, number>();
          for (const row of trackTags) {
            const id = row.tag_id as string;
            tagFreq.set(id, (tagFreq.get(id) ?? 0) + 1);
          }
          userTopTagIds = [...tagFreq.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([id]) => id);
        }
      }
    }

    // ─── 추천 트랙 조회 ────────────────────────────────────────
    let recommendedTrackIds: string[] = [];

    if (userTopTagIds.length > 0) {
      // 태그 기반 추천: 공통 태그 보유 트랙 (이미 상호작용한 것 제외)
      const { data: tagMatches } = await supabase
        .from("track_tags")
        .select("track_id")
        .in("tag_id", userTopTagIds)
        .limit(100);

      if (tagMatches) {
        // 태그 겹침 수로 정렬
        const trackScore = new Map<string, number>();
        for (const row of tagMatches) {
          const id = row.track_id as string;
          trackScore.set(id, (trackScore.get(id) ?? 0) + 1);
        }
        recommendedTrackIds = [...trackScore.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([id]) => id);
      }
    }

    // ─── 콜드 스타트: 인기 트랙 추천 ────────────────────────────
    if (recommendedTrackIds.length < 5) {
      const { data: popular } = await supabase
        .from("tracks")
        .select("id")
        .order("play_count", { ascending: false })
        .limit(10);

      const popularIds = popular?.map((r) => r.id as string) ?? [];
      const toAdd = popularIds.filter((id) => !recommendedTrackIds.includes(id));
      recommendedTrackIds = [...recommendedTrackIds, ...toAdd].slice(0, 10);
    }

    if (recommendedTrackIds.length === 0) {
      return NextResponse.json({ tracks: [] });
    }

    // ─── 트랙 상세 조회 ───────────────────────────────────────
    const { data: tracks } = await supabase
      .from("tracks")
      .select("id, title, artist, file_path, play_count, like_count, users!user_id(nickname)")
      .in("id", recommendedTrackIds);

    if (!tracks) return NextResponse.json({ tracks: [] });

    const result = tracks.map((row) => ({
      id: row.id as string,
      title: (row.title as string | null) ?? "제목 없음",
      artist: (row.artist as string | null) ?? "Unknown Artist",
      file_path: (row.file_path as string | null) ?? undefined,
      play_count: (row.play_count as number | null) ?? 0,
      like_count: (row.like_count as number | null) ?? 0,
      coverColor: pickCoverColor(row.id as string),
      uploader_nickname: (row.users as { nickname?: string } | null)?.nickname,
      rank: 0,
      isFoundingMember: false,
    }));

    return NextResponse.json({ tracks: result });
  } catch (err) {
    console.error("[GET /api/user/recommendations]", err);
    return NextResponse.json({ error: "추천 로드 실패" }, { status: 500 });
  }
}
