import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const PERIOD_DAYS: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90 };

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const period = req.nextUrl.searchParams.get('period') ?? '7d';
    const days = PERIOD_DAYS[period] ?? 7;

    const now = new Date();
    const periodStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
    const days7ago = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // 내 트랙 ID 조회
    const { data: myTracks } = await supabase
      .from("tracks")
      .select("id, title, play_count, like_count")
      .eq("user_id", user.id);

    if (!myTracks || myTracks.length === 0) {
      return NextResponse.json({ daily: [], hourly: [], topTracks: [], period });
    }

    const trackIds = myTracks.map((t) => t.id as string);

    // 기간 내 play_history 조회
    const { data: history } = await supabase
      .from("play_history")
      .select("track_id, played_at")
      .in("track_id", trackIds)
      .gte("played_at", periodStart);

    if (!history || history.length === 0) {
      return NextResponse.json({ daily: [], hourly: new Array(24).fill(0), topTracks: buildTopTracks(myTracks), period });
    }

    // 일별 재생수 (90d는 주별로 묶음)
    const dayMap = new Map<string, number>();
    if (days <= 30) {
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const key = `${d.getMonth() + 1}/${d.getDate()}`;
        dayMap.set(key, 0);
      }
      for (const row of history) {
        const d = new Date(row.played_at as string);
        const key = `${d.getMonth() + 1}/${d.getDate()}`;
        if (dayMap.has(key)) dayMap.set(key, (dayMap.get(key) ?? 0) + 1);
      }
    } else {
      // 90일: 13주 단위
      const weeks = Math.ceil(days / 7);
      for (let w = weeks - 1; w >= 0; w--) {
        const weekStart = new Date(now.getTime() - (w + 1) * 7 * 24 * 60 * 60 * 1000);
        const weekEnd   = new Date(now.getTime() - w * 7 * 24 * 60 * 60 * 1000);
        const key = `${weekStart.getMonth() + 1}/${weekStart.getDate()}~${weekEnd.getMonth() + 1}/${weekEnd.getDate()}`;
        dayMap.set(key, 0);
      }
      for (const row of history) {
        const played = new Date(row.played_at as string).getTime();
        let weekIdx = 0;
        for (let w = Math.ceil(days / 7) - 1; w >= 0; w--) {
          const ws = now.getTime() - (w + 1) * 7 * 24 * 60 * 60 * 1000;
          const we = now.getTime() - w * 7 * 24 * 60 * 60 * 1000;
          if (played >= ws && played < we) { weekIdx = w; break; }
        }
        const ws2 = new Date(now.getTime() - (weekIdx + 1) * 7 * 24 * 60 * 60 * 1000);
        const we2 = new Date(now.getTime() - weekIdx * 7 * 24 * 60 * 60 * 1000);
        const key = `${ws2.getMonth() + 1}/${ws2.getDate()}~${we2.getMonth() + 1}/${we2.getDate()}`;
        if (dayMap.has(key)) dayMap.set(key, (dayMap.get(key) ?? 0) + 1);
      }
    }
    const daily = [...dayMap.entries()].map(([label, count]) => ({ label, count }));

    // 시간대별 분포 (0~23시) — 항상 최근 7일 기준
    const hourly = new Array(24).fill(0) as number[];
    const recentHistory = history.filter((r) => (r.played_at as string) >= days7ago);
    for (const row of recentHistory) {
      const hour = new Date(row.played_at as string).getHours();
      hourly[hour] += 1;
    }

    // 상위 트랙 (play_count 기준)
    const topTracks = buildTopTracks(myTracks);

    return NextResponse.json({ daily, hourly, topTracks, period });
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
