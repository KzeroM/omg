import { createClient } from "@/utils/supabase/server";
import { Music, Users, Play, Heart } from "lucide-react";

export default async function AdminDashboard() {
  const supabase = await createClient();

  const [
    { count: trackCount },
    { count: userCount },
    { data: playData },
    { data: likeData },
  ] = await Promise.all([
    supabase.from("tracks").select("*", { count: "exact", head: true }),
    supabase.from("users").select("*", { count: "exact", head: true }),
    supabase.from("tracks").select("play_count"),
    supabase.from("tracks").select("like_count"),
  ]);

  const totalPlays = playData?.reduce((s, t) => s + (t.play_count ?? 0), 0) ?? 0;
  const totalLikes = likeData?.reduce((s, t) => s + (t.like_count ?? 0), 0) ?? 0;

  const stats = [
    { label: "총 트랙", value: trackCount ?? 0, icon: Music, color: "text-purple-400" },
    { label: "총 사용자", value: userCount ?? 0, icon: Users, color: "text-blue-400" },
    { label: "총 재생수", value: totalPlays, icon: Play, color: "text-green-400" },
    { label: "총 좋아요", value: totalLikes, icon: Heart, color: "text-red-400" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">대시보드</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">OMG 플랫폼 현황</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="rounded-2xl bg-[var(--color-bg-surface)] p-5 ring-1 ring-[var(--color-border)]"
          >
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

      <div className="rounded-2xl bg-[var(--color-bg-surface)] p-6 ring-1 ring-[var(--color-border)]">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
          관리 메뉴
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            { label: "트랙 관리", desc: "신고된 트랙 검토 및 강제 삭제", href: "/admin/tracks" },
            { label: "사용자 관리", desc: "계정 정지 및 권한 관리", href: "/admin/users" },
            { label: "아티스트 등급", desc: "Founding Member 수동 부여", href: "/admin/tiers" },
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
