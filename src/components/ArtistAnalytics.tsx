"use client";

import { useEffect, useState } from "react";
import { TrendingUp, BarChart2 } from "lucide-react";
import { formatKoreanNumber } from "@/utils/formatNumber";
import { LoadingState } from "@/components/ui/LoadingState";

type Period = '7d' | '30d' | '90d';
const PERIOD_LABELS: Record<Period, string> = { '7d': '7일', '30d': '30일', '90d': '90일' };

interface DailyPoint { label: string; count: number }
interface TopTrack { id: string; title: string; play_count: number; like_count: number }

interface AnalyticsData {
  daily: DailyPoint[];
  hourly: number[];
  topTracks: TopTrack[];
  period: string;
}

export function ArtistAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('7d');

  useEffect(() => {
    setLoading(true);
    void fetch(`/api/user/analytics?period=${period}`)
      .then((r) => r.json())
      .then((json: AnalyticsData & { error?: string }) => {
        if (!json.error) setData(json);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [period]);

  return (
    <div className="space-y-4">
      {/* 기간 선택 탭 */}
      <div className="flex gap-1 rounded-xl bg-[var(--color-bg-surface)] p-1 ring-1 ring-[var(--color-border)] w-fit">
        {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPeriod(p)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${
              period === p
                ? "bg-[var(--color-accent)] text-white"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            {PERIOD_LABELS[p]}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingState message="분석 로딩 중…" />
      ) : !data ? null : (
      <>
      {/* 재생 추이 */}
      {data.daily.length > 0 && (() => {
        const maxDaily = Math.max(...data.daily.map((d) => d.count), 1);
        return (
        <div className="rounded-2xl bg-[var(--color-bg-surface)] p-6 ring-1 ring-[var(--color-border)]">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[var(--color-accent)]" strokeWidth={2} />
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
              최근 {PERIOD_LABELS[period]} 재생 추이
            </h3>
          </div>
          <div className="flex h-24 items-end gap-1.5">
            {data.daily.map(({ label, count }) => (
              <div key={label} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-[9px] text-[var(--color-text-muted)]">{count > 0 ? count : ""}</span>
                <div
                  className="w-full min-h-[3px] rounded-t-sm bg-[var(--color-accent)] opacity-80"
                  style={{ height: `${Math.max((count / maxDaily) * 100, 4)}%` }}
                />
                <span className="truncate text-[8px] text-[var(--color-text-muted)] max-w-full">{label}</span>
              </div>
            ))}
          </div>
        </div>
        );
      })()}

      {/* 시간대별 재생 분포 (항상 최근 7일) */}
      {data.hourly.some((v) => v > 0) && (() => {
        const maxHourly = Math.max(...data.hourly, 1);
        return (
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
            <span>0시</span><span>6시</span><span>12시</span><span>18시</span><span>23시</span>
          </div>
        </div>
        );
      })()}

      {/* 상위 트랙 */}
      {data.topTracks.length > 0 && (
        <div className="rounded-2xl bg-[var(--color-bg-surface)] p-6 ring-1 ring-[var(--color-border)]">
          <h3 className="mb-4 text-sm font-semibold text-[var(--color-text-primary)]">내 인기 트랙</h3>
          <ul className="space-y-2">
            {data.topTracks.map((track, i) => (
              <li key={track.id} className="flex items-center gap-3">
                <span className="w-4 shrink-0 text-xs font-bold text-[var(--color-text-muted)]">{i + 1}</span>
                <p className="flex-1 truncate text-sm text-[var(--color-text-primary)]">{track.title}</p>
                <span className="text-xs text-[var(--color-text-muted)]">{formatKoreanNumber(track.play_count)} 재생</span>
                <span className="text-xs text-[var(--color-text-muted)]">{formatKoreanNumber(track.like_count)} ♥</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      </>
      )}
    </div>
  );
}
