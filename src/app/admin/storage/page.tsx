"use client";

import { useEffect, useState } from "react";
import { HardDrive, FileAudio, Loader2 } from "lucide-react";

interface UserStorage {
  userId: string;
  nickname: string;
  fileCount: number;
  totalMb: number;
  tracks: { id: string; title: string | null; filePath: string }[];
}

interface StorageStats {
  totalMb: number;
  fileCount: number;
  byUser: UserStorage[];
}

export default function AdminStoragePage() {
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetch("/api/admin/storage")
      .then((r) => r.json())
      .then((data: StorageStats) => { setStats(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Storage 사용량</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">omg-tracks 버킷 현황</p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">불러오는 중…</span>
        </div>
      ) : !stats ? (
        <p className="text-sm text-red-400">데이터를 불러올 수 없습니다.</p>
      ) : (
        <>
          {/* 요약 카드 */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-[var(--color-bg-surface)] p-5 ring-1 ring-[var(--color-border)]">
              <div className="flex items-center justify-between">
                <p className="text-sm text-[var(--color-text-muted)]">총 사용량</p>
                <HardDrive className="h-5 w-5 text-purple-400" strokeWidth={1.5} />
              </div>
              <p className="mt-3 text-2xl font-bold text-[var(--color-text-primary)]">
                {stats.totalMb >= 1024
                  ? `${(stats.totalMb / 1024).toFixed(2)} GB`
                  : `${stats.totalMb} MB`}
              </p>
            </div>
            <div className="rounded-2xl bg-[var(--color-bg-surface)] p-5 ring-1 ring-[var(--color-border)]">
              <div className="flex items-center justify-between">
                <p className="text-sm text-[var(--color-text-muted)]">트랙 수</p>
                <FileAudio className="h-5 w-5 text-blue-400" strokeWidth={1.5} />
              </div>
              <p className="mt-3 text-2xl font-bold text-[var(--color-text-primary)]">
                {stats.fileCount.toLocaleString()}
              </p>
            </div>
            <div className="rounded-2xl bg-[var(--color-bg-surface)] p-5 ring-1 ring-[var(--color-border)]">
              <div className="flex items-center justify-between">
                <p className="text-sm text-[var(--color-text-muted)]">아티스트 수</p>
                <HardDrive className="h-5 w-5 text-green-400" strokeWidth={1.5} />
              </div>
              <p className="mt-3 text-2xl font-bold text-[var(--color-text-primary)]">
                {stats.byUser.length.toLocaleString()}
              </p>
            </div>
          </div>

          {/* 사용자별 Storage */}
          <div className="rounded-2xl bg-[var(--color-bg-surface)] ring-1 ring-[var(--color-border)] overflow-hidden">
            <div className="border-b border-[var(--color-border)] px-4 py-3">
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">사용자별 사용량</h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-left">
                  <th className="px-4 py-3 font-medium text-[var(--color-text-muted)]">아티스트</th>
                  <th className="px-4 py-3 font-medium text-[var(--color-text-muted)] text-right">트랙</th>
                  <th className="px-4 py-3 font-medium text-[var(--color-text-muted)] text-right">사용량</th>
                  <th className="px-4 py-3 font-medium text-[var(--color-text-muted)]">비율</th>
                </tr>
              </thead>
              <tbody>
                {stats.byUser.map((u) => {
                  const pct = stats.totalMb > 0 ? (u.totalMb / stats.totalMb) * 100 : 0;
                  return (
                    <tr key={u.userId} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-bg-hover)]">
                      <td className="px-4 py-3">
                        <p className="font-medium text-[var(--color-text-primary)]">{u.nickname}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">{u.userId.slice(0, 12)}…</p>
                      </td>
                      <td className="px-4 py-3 text-right text-[var(--color-text-secondary)]">{u.fileCount}</td>
                      <td className="px-4 py-3 text-right text-[var(--color-text-secondary)]">
                        {u.totalMb >= 1024
                          ? `${(u.totalMb / 1024).toFixed(2)} GB`
                          : `${u.totalMb} MB`}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 flex-1 rounded-full bg-zinc-800">
                            <div
                              className="h-full rounded-full bg-[var(--color-accent)]"
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                          <span className="w-10 shrink-0 text-right text-xs text-[var(--color-text-muted)]">
                            {pct.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {stats.byUser.length === 0 && (
              <p className="py-8 text-center text-sm text-[var(--color-text-muted)]">트랙이 없습니다.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
