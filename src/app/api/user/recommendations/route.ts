import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { pickCoverColor } from "@/utils/coverColor";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let recommendedTrackIds: string[] = [];

    if (user) {
      // 단일 RPC 호출로 태그 기반 추천 (기존 5~6 RTT → 1 RTT)
      const { data: recs } = await supabase.rpc("get_recommendations", {
        p_user_id: user.id,
        p_limit: 10,
      });
      recommendedTrackIds = (recs ?? []).map((r: { track_id: string }) => r.track_id);
    }

    // 비로그인 또는 결과 부족 시 인기 트랙 보충
    if (recommendedTrackIds.length < 5) {
      const { data: popular } = await supabase
        .from("tracks")
        .select("id")
        .order("play_count", { ascending: false })
        .limit(10);
      const popularIds = (popular ?? []).map((r) => r.id as string);
      const toAdd = popularIds.filter((id) => !recommendedTrackIds.includes(id));
      recommendedTrackIds = [...recommendedTrackIds, ...toAdd].slice(0, 10);
    }

    if (recommendedTrackIds.length === 0) {
      return NextResponse.json({ tracks: [] });
    }

    // 트랙 상세 조회 (1 RTT)
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
