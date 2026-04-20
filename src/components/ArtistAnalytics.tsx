"use client";

import { useEffect, useState } from "react";
import { TrendingUp, BarChart2 } from "lucide-react";
import { LoadingState } from "@/components/ui/LoadingState";

interface DailyPoint { label: string; count: number }
interface TopTrack { id: string; title: string; play_count: number; like_count: number }

interface AnalyticsData {
  daily: DailyPoint[];
  hourly: number[];
  topTracks: TopTrack[];
}

export function ArtistAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetch("/api/user/analytics")
      .then((r) => r.json())
      .then((json: AnalyticsData & { error?: string }) => {
        if (!json.error) setData(json);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <LoadingState message="분석 로딩 중…" />;
  }

  if (!data) return null;

  const maxDaily = Math.max(...data.daily.map((d) => d.count), 1);
  const maxHourly = Math.max(...data.hourly, 1);

  return (
    <div className="space-y-4">
      {/* 7일 재생 추이 */}
      {data.daily.length > 0 && (
        <div className="rounded-2xl bg-[var(--color-bg-surface)] p-6 ring-1 ring-[var(--color-border)]">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[var(--color-accent)]" strokeWidth={2} />
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">최근 7일 재생 추이</h3>
          </div>
          <div className="flex h-24 items-end gap-1.5">
            {data.daily.map(({ label, count }) => (
              <div key={label} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-[9px] text-[var(--color-text-muted)]">{count > 0 ? count : ""}</span>
                <div
                  className="w-full min-h-[3px] rounded-t-sm bg-[var(--color-accent)] opacity-80"
                  style={{ height: `${Math.max((count / maxDaily) * 100, 4)}%` }}
                />
                <span className="text-[9px] text-[var(--color-text-muted)]">{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 시간대별 재생 분포 */}
      {data.hourly.some((v) => v > 0) && (
        <div className="rounded-2xl bg-[var(--color-bg-surface)] p-6 ring-1 ring-[var(--color-border)]">
          <div className="mb-4 flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-[var(--color-accent)]" strokeWidth={2} />
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">시간대별 재생 (최근 7일)</h3>
          </div>
          <div className="flex h-16 items-end gap-px">
            {data.hourly.map((count, hour) => (
              <div
                key={hour}
                className="flex-1 rounded-t-[2px] bg-[var(--color-accent)] opacity-70 min-h-[2px]"
                style={{ height: `${Math.max((count / maxHourly) * 100, 2)}%` }}
                title={`${hour}시: ${count}회`}
              />
            ))}
          </div>
          <div className="mt-1 flex justify-between text-[9px] text-[var(--color-text-muted)]">
            <span>0시</span>
            <span>6시</span>
            <span>12시</span>
            <span>18시</span>
            <span>23시</span>
          </div>
        </div>
      )}

      {/* 상위 트랙 */}
      {data.topTracks.length > 0 && (
        <div className="rounded-2xl bg-[var(--color-bg-surface)] p-6 ring-1 ring-[var(--color-border)]">
          <h3 className="mb-4 text-sm font-semibold text-[var(--color-text-primary)]">내 인기 트랙</h3>
          <ul className="space-y-2">
            {data.topTracks.map((track, i) => (
              <li key={track.id} className="flex items-center gap-3">
                <span className="w-4 shrink-0 text-xs font-bold text-[var(--color-text-muted)]">{i + 1}</span>
                <p className="flex-1 truncate text-sm text-[var(--color-text-primary)]">{track.title}</p>
                <span className="text-xs text-[var(--color-text-muted)]">{track.play_count.toLocaleString()} 재생</span>
                <span className="text-xs text-[var(--color-text-muted)]">{track.like_count.toLocaleString()} ♥</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
