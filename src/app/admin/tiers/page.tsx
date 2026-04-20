"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Search, ChevronDown } from "lucide-react";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import type { ArtistTier } from "@/types/tier";

interface TierUser {
  user_id: string;
  nickname: string | null;
  artist_tier: ArtistTier | null;
  created_at?: string;
}

const TIERS: { value: ArtistTier; label: string; color: string }[] = [
  { value: "basic", label: "Basic", color: "text-[var(--color-text-muted)] bg-zinc-800" },
  { value: "silver", label: "Silver", color: "text-slate-300 bg-slate-700/40" },
  { value: "gold", label: "Gold", color: "text-yellow-400 bg-yellow-400/10" },
  { value: "diamond", label: "Diamond", color: "text-cyan-300 bg-cyan-400/10" },
];

export default function AdminTiersPage() {
  const [users, setUsers] = useState<TierUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    void supabase
      .from("users")
      .select("user_id, nickname, artist_tier, created_at")
      .order("created_at", { ascending: false })
      .limit(200)
      .then(({ data }) => {
        setUsers((data ?? []) as TierUser[]);
        setLoading(false);
      });
  }, []);

  const handleTierChange = async (userId: string, tier: ArtistTier) => {
    setProcessingId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/tier`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artist_tier: tier }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => u.user_id === userId ? { ...u, artist_tier: tier } : u)
        );
      } else {
        alert("등급 변경 실패");
      }
    } finally {
      setProcessingId(null);
    }
  };

  const filtered = query.trim()
    ? users.filter((u) => u.nickname?.toLowerCase().includes(query.toLowerCase()))
    : users;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">아티스트 등급 관리</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          전체 {users.length}명 · Founding Member 수동 지정 및 등급 조정
        </p>
      </div>

      {/* 등급 범례 */}
      <div className="flex flex-wrap gap-2">
        {TIERS.map((t) => (
          <span
            key={t.value}
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${t.color}`}
          >
            {t.label}
          </span>
        ))}
      </div>

      {/* 검색 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="닉네임 검색"
          className="w-full rounded-xl bg-[var(--color-bg-surface)] py-2.5 pl-9 pr-4 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] outline-none ring-1 ring-[var(--color-border)] focus:ring-[var(--color-accent)]"
        />
      </div>

      {loading ? (
        <LoadingState />
      ) : filtered.length === 0 ? (
        <EmptyState title="검색 결과가 없습니다." />
      ) : (
        <div className="rounded-2xl bg-[var(--color-bg-surface)] ring-1 ring-[var(--color-border)] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-left">
                <th className="px-4 py-3 font-medium text-[var(--color-text-muted)]">사용자</th>
                <th className="px-4 py-3 font-medium text-[var(--color-text-muted)]">가입일</th>
                <th className="px-4 py-3 font-medium text-[var(--color-text-muted)]">현재 등급</th>
                <th className="px-4 py-3 font-medium text-[var(--color-text-muted)]">등급 변경</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => {
                const currentTier = TIERS.find((t) => t.value === (user.artist_tier ?? "basic")) ?? TIERS[0];
                const isProcessing = processingId === user.user_id;
                return (
                  <tr
                    key={user.user_id}
                    className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-bg-hover)]"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-[var(--color-text-primary)]">
                        {user.nickname ?? "닉네임 없음"}
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)]">{user.user_id.slice(0, 12)}…</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--color-text-muted)]">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString("ko-KR") : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${currentTier.color}`}>
                        {currentTier.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="relative inline-block">
                        <select
                          value={user.artist_tier ?? "basic"}
                          onChange={(e) => void handleTierChange(user.user_id, e.target.value as ArtistTier)}
                          disabled={isProcessing}
                          className="appearance-none rounded-lg bg-[var(--color-bg-hover)] py-1.5 pl-3 pr-7 text-xs text-[var(--color-text-primary)] outline-none ring-1 ring-[var(--color-border)] focus:ring-[var(--color-accent)] disabled:opacity-50 cursor-pointer"
                        >
                          {TIERS.map((t) => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-[var(--color-text-muted)]" />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
