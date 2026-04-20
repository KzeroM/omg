"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Ban, CheckCircle, Search, Shield } from "lucide-react";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";

interface AdminUser {
  user_id: string;
  nickname: string | null;
  artist_tier: string | null;
  is_admin: boolean;
  created_at?: string;
  track_count?: number;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("users")
        .select("user_id, nickname, artist_tier, is_admin, created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      setUsers(data ?? []);
      setLoading(false);
    };
    void load();
  }, []);

  const handleBan = async (userId: string) => {
    if (!window.confirm("이 계정을 정지하시겠습니까?")) return;
    setProcessingId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/ban`, { method: "POST" });
      if (res.ok) alert("계정이 정지되었습니다.");
      else alert("처리 실패");
    } finally {
      setProcessingId(null);
    }
  };

  const handleSetAdmin = async (userId: string, isAdmin: boolean) => {
    setProcessingId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/admin`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_admin: !isAdmin }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => u.user_id === userId ? { ...u, is_admin: !isAdmin } : u)
        );
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
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">사용자 관리</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">전체 {users.length}명</p>
      </div>

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
                <th className="px-4 py-3 font-medium text-[var(--color-text-muted)]">등급</th>
                <th className="px-4 py-3 font-medium text-[var(--color-text-muted)]">가입일</th>
                <th className="px-4 py-3 font-medium text-[var(--color-text-muted)]">권한</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.user_id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-bg-hover)]">
                  <td className="px-4 py-3">
                    <p className="font-medium text-[var(--color-text-primary)]">
                      {user.nickname ?? "닉네임 없음"}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">{user.user_id.slice(0, 12)}…</p>
                  </td>
                  <td className="px-4 py-3 text-[var(--color-text-secondary)] capitalize">
                    {user.artist_tier ?? "basic"}
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--color-text-muted)]">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString("ko-KR") : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {user.is_admin && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-accent-subtle)] px-2 py-0.5 text-xs text-[var(--color-accent)]">
                        <Shield className="h-3 w-3" />
                        어드민
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => void handleSetAdmin(user.user_id, user.is_admin)}
                        disabled={processingId === user.user_id}
                        className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-[var(--color-text-secondary)] transition hover:bg-[var(--color-accent-subtle)] hover:text-[var(--color-accent)] disabled:opacity-50"
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        {user.is_admin ? "어드민 해제" : "어드민 지정"}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleBan(user.user_id)}
                        disabled={processingId === user.user_id}
                        className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
                      >
                        <Ban className="h-3.5 w-3.5" />
                        정지
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
