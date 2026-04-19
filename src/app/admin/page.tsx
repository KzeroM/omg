import { createClient } from "@/utils/supabase/server";
import { Music, Users, Play, Heart, TrendingUp, UserPlus, Upload, Activity } from "lucide-react";

export default async function AdminDashboard() {
  const supabase = await createClient();

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const week7ago = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const month30ago = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: trackCount },
    { count: userCount },
    { data: playData },
    { data: likeData },
    { count: newUsers7d },
    { count: newTracks7d },
    { count: dau },
    { count: mau },
    { data: dailyPlays },
  ] = await Promise.all([
    supabase.from("tracks").select("*", { count: "exact", head: true }),
    supabase.from("users").select("*", { count: "exact", head: true }),
    supabase.from("tracks").select("play_count"),
    supabase.from("tracks").select("like_count"),
    supabase.from("users").select("*", { count: "exact", head: true }).gte("created_at", week7ago),
    supabase.from("tracks").select("*", { count: "exact", head: true }).gte("created_at", week7ago),
    supabase.from("play_history").select("user_id", { count: "exact", head: true }).gte("played_at", todayStart),
    supabase.from("play_history").select("user_id", { count: "exact", head: true }).gte("played_at", month30ago),
    // 최근 7일 일별 재생수 집계
    supabase.from("play_history").select("played_at").gte("played_at", week7ago),
  ]);

  const totalPlays = playData?.reduce((s, t) => s + (t.play_count ?? 0), 0) ?? 0;
  const totalLikes = likeData?.reduce((s, t) => s + (t.like_count ?? 0), 0) ?? 0;

  // 7일 일별 재생수 계산
  const dayCountMap = new Map<string, number>();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = `${d.getMonth() + 1}/${d.getDate()}`;
    dayCountMap.set(key, 0);
  }
  for (const row of dailyPlays ?? []) {
    const d = new Date(row.played_at as string);
    const key = `${d.getMonth() + 1}/${d.getDate()}`;
    dayCountMap.set(key, (dayCountMap.get(key) ?? 0) + 1);
  }
  const dailyData = [...dayCountMap.entries()];
  const maxPlays = Math.max(...dailyData.map(([, v]) => v), 1);

  const summaryStats = [
    { label: "총 트랙", value: trackCount ?? 0, icon: Music, color: "text-purple-400" },
    { label: "총 사용자", value: userCount ?? 0, icon: Users, color: "text-blue-400" },
    { label: "총 재생수", value: totalPlays, icon: Play, color: "text-green-400" },
    { label: "총 좋아요", value: totalLikes, icon: Heart, color: "text-red-400" },
  ];

  const activityStats = [
    { label: "DAU (오늘)", value: dau ?? 0, icon: Activity, color: "text-cyan-400" },
    { label: "MAU (30일)", value: mau ?? 0, icon: TrendingUp, color: "text-indigo-400" },
    { label: "신규 가입 (7일)", value: newUsers7d ?? 0, icon: UserPlus, color: "text-emerald-400" },
    { label: "신규 트랙 (7일)", value: newTracks7d ?? 0, icon: Upload, color: "text-amber-400" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">대시보드</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">OMG 플랫폼 현황</p>
      </div>

      {/* 누적 지표 */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">누적</p>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {summaryStats.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-2xl bg-[var(--color-bg-surface)] p-5 ring-1 ring-[var(--color-border)]">
              <div className="flex items-center justify-between">
                <p className="text-sm text-[var(--color-text-muted)]">{label}</p>
                <Icon className={`h-5 w-5 ${color}`} strokeWidth={1.5} />
              </div>
              <p className="mt-3 text-2xl font-bold text-[var(--color-text-primary)]">
                {value.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 활동 지표 */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">활동</p>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {activityStats.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-2xl bg-[var(--color-bg-surface)] p-5 ring-1 ring-[var(--color-border)]">
              <div className="flex items-center justify-between">
                <p className="text-sm text-[var(--color-text-muted)]">{label}</p>
                <Icon className={`h-5 w-5 ${color}`} strokeWidth={1.5} />
              </div>
              <p className="mt-3 text-2xl font-bold text-[var(--color-text-primary)]">
                {value.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 7일 재생 추이 (CSS 바 차트) */}
      <div className="rounded-2xl bg-[var(--color-bg-surface)] p-6 ring-1 ring-[var(--color-border)]">
        <h2 className="mb-5 text-sm font-semibold text-[var(--color-text-primary)]">최근 7일 재생 추이</h2>
        <div className="flex h-32 items-end gap-2">
          {dailyData.map(([label, count]) => {
            const heightPct = Math.round((count / maxPlays) * 100);
            return (
              <div key={label} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-[10px] text-[var(--color-text-muted)]">{count}</span>
                <div
                  className="w-full min-h-[4px] rounded-t-sm bg-[var(--color-accent)] opacity-80 transition-all"
                  style={{ height: `${Math.max(heightPct, 4)}%` }}
                />
                <span className="text-[10px] text-[var(--color-text-muted)]">{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 관리 메뉴 */}
      <div className="rounded-2xl bg-[var(--color-bg-surface)] p-6 ring-1 ring-[var(--color-border)]">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">관리 메뉴</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            { label: "트랙 관리", desc: "신고된 트랙 검토 및 강제 삭제", href: "/admin/tracks" },
            { label: "사용자 관리", desc: "계정 정지 및 권한 관리", href: "/admin/users" },
            { label: "아티스트 등급", desc: "Founding Member 수동 부여", href: "/admin/tiers" },
            { label: "Storage", desc: "버킷 사용량 및 사용자별 점유율", href: "/admin/storage" },
          ].map(({ label, desc, href }) => (
            <a
              key={href}
              href={href}
              className="rounded-xl p-4 ring-1 ring-[var(--color-border)] transition hover:bg-[var(--color-bg-hover)] hover:ring-[var(--color-accent)]/30"
            >
              <p className="font-medium text-[var(--color-text-primary)]">{label}</p>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">{desc}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
