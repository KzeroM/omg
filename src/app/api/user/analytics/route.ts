import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const now = new Date();
    const days30ago = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const days7ago = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // 내 트랙 ID 조회
    const { data: myTracks } = await supabase
      .from("tracks")
      .select("id, title, play_count, like_count")
      .eq("user_id", user.id);

    if (!myTracks || myTracks.length === 0) {
      return NextResponse.json({ daily: [], hourly: [], topTracks: [] });
    }

    const trackIds = myTracks.map((t) => t.id as string);

    // 최근 30일 play_history 조회
    const { data: history } = await supabase
      .from("play_history")
      .select("track_id, played_at")
      .in("track_id", trackIds)
      .gte("played_at", days30ago);

    if (!history || history.length === 0) {
      return NextResponse.json({ daily: [], hourly: new Array(24).fill(0), topTracks: buildTopTracks(myTracks) });
    }

    // 7일 일별 재생수
    const dayMap = new Map<string, number>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = `${d.getMonth() + 1}/${d.getDate()}`;
      dayMap.set(key, 0);
    }
    for (const row of history) {
      const d = new Date(row.played_at as string);
      const key = `${d.getMonth() + 1}/${d.getDate()}`;
      if (dayMap.has(key)) dayMap.set(key, (dayMap.get(key) ?? 0) + 1);
    }
    const daily = [...dayMap.entries()].map(([label, count]) => ({ label, count }));

    // 시간대별 분포 (0~23시)
    const hourly = new Array(24).fill(0) as number[];
    const recentHistory = history.filter((r) => (r.played_at as string) >= days7ago);
    for (const row of recentHistory) {
      const hour = new Date(row.played_at as string).getHours();
      hourly[hour] += 1;
    }

    // 상위 트랙 (play_count 기준)
    const topTracks = buildTopTracks(myTracks);

    return NextResponse.json({ daily, hourly, topTracks });
  } catch (err) {
    console.error("[GET /api/user/analytics]", err);
    return NextResponse.json({ error: "분석 로드 실패" }, { status: 500 });
  }
}

function buildTopTracks(tracks: Record<string, unknown>[]) {
  return tracks
    .sort((a, b) => ((b.play_count as number) ?? 0) - ((a.play_count as number) ?? 0))
    .slice(0, 5)
    .map((t) => ({
      id: t.id as string,
      title: (t.title as string | null) ?? "제목 없음",
      play_count: (t.play_count as number | null) ?? 0,
      like_count: (t.like_count as number | null) ?? 0,
    }));
}
