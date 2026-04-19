"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Eye, EyeOff, Loader2 } from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  body: string;
  type: "info" | "warning" | "success";
  is_active: boolean;
  created_at: string;
  expires_at: string | null;
}

const TYPE_STYLES = {
  info: "bg-blue-500/10 text-blue-400 ring-blue-500/20",
  warning: "bg-yellow-500/10 text-yellow-400 ring-yellow-500/20",
  success: "bg-green-500/10 text-green-400 ring-green-500/20",
};

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", type: "info", expires_at: "" });

  const load = async () => {
    const res = await fetch("/api/admin/announcements");
    const data = await res.json() as { announcements: Announcement[] };
    setAnnouncements(data.announcements ?? []);
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) return;
    setSubmitting(true);
    try {
      await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          body: form.body,
          type: form.type,
          expires_at: form.expires_at || null,
        }),
      });
      setForm({ title: "", body: "", type: "info", expires_at: "" });
      setShowForm(false);
      await load();
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (id: string, current: boolean) => {
    await fetch(`/api/admin/announcements/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !current }),
    });
    setAnnouncements((prev) => prev.map((a) => a.id === id ? { ...a, is_active: !current } : a));
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("공지사항을 삭제하시겠습니까?")) return;
    await fetch(`/api/admin/announcements/${id}`, { method: "DELETE" });
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">공지사항 관리</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">홈 화면 상단 배너로 노출됩니다</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 rounded-xl bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--color-accent-hover)]"
        >
          <Plus className="h-4 w-4" />
          새 공지
        </button>
      </div>

      {/* 작성 폼 */}
      {showForm && (
        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="space-y-4 rounded-2xl bg-[var(--color-bg-surface)] p-6 ring-1 ring-[var(--color-border)]"
        >
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">공지사항 작성</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-[var(--color-text-muted)]">제목</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                required
                className="w-full rounded-lg bg-[var(--color-bg-hover)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none ring-1 ring-[var(--color-border)] focus:ring-[var(--color-accent)]"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-[var(--color-text-muted)]">내용</label>
              <textarea
                value={form.body}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                required
                rows={3}
                className="w-full rounded-lg bg-[var(--color-bg-hover)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none ring-1 ring-[var(--color-border)] focus:ring-[var(--color-accent)]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-[var(--color-text-muted)]">유형</label>
              <select
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                className="w-full rounded-lg bg-[var(--color-bg-hover)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none ring-1 ring-[var(--color-border)]"
              >
                <option value="info">정보 (파랑)</option>
                <option value="warning">경고 (노랑)</option>
                <option value="success">성공 (초록)</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-[var(--color-text-muted)]">만료일 (선택)</label>
              <input
                type="datetime-local"
                value={form.expires_at}
                onChange={(e) => setForm((f) => ({ ...f, expires_at: e.target.value }))}
                className="w-full rounded-lg bg-[var(--color-bg-hover)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none ring-1 ring-[var(--color-border)]"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              게시
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg px-4 py-2 text-sm text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)]"
            >
              취소
            </button>
          </div>
        </form>
      )}

      {/* 목록 */}
      {loading ? (
        <p className="text-sm text-[var(--color-text-muted)]">불러오는 중…</p>
      ) : announcements.length === 0 ? (
        <p className="py-12 text-center text-sm text-[var(--color-text-muted)]">공지사항이 없습니다.</p>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <div
              key={a.id}
              className={`rounded-2xl p-5 ring-1 ${a.is_active ? TYPE_STYLES[a.type] ?? TYPE_STYLES.info : "bg-[var(--color-bg-surface)] text-[var(--color-text-muted)] ring-[var(--color-border)] opacity-60"}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{a.title}</p>
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-current">
                      {a.type}
                    </span>
                    {!a.is_active && (
                      <span className="rounded-full bg-zinc-700 px-2 py-0.5 text-[10px] text-zinc-400">비활성</span>
                    )}
                  </div>
                  <p className="mt-1 text-sm opacity-90">{a.body}</p>
                  <p className="mt-2 text-xs opacity-60">
                    {new Date(a.created_at).toLocaleDateString("ko-KR")}
                    {a.expires_at && ` · 만료: ${new Date(a.expires_at).toLocaleDateString("ko-KR")}`}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => void handleToggle(a.id, a.is_active)}
                    className="rounded-lg p-1.5 opacity-70 transition hover:opacity-100"
                    aria-label={a.is_active ? "비활성화" : "활성화"}
                  >
                    {a.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(a.id)}
                    className="rounded-lg p-1.5 opacity-70 transition hover:text-red-400 hover:opacity-100"
                    aria-label="삭제"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
