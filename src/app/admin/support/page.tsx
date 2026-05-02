"use client";

import { useEffect, useState } from "react";
import { MessageSquare, Send } from "lucide-react";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";

interface Ticket {
  id: string;
  category: string;
  subject: string;
  body: string;
  status: "open" | "in_progress" | "resolved";
  admin_reply: string | null;
  admin_replied_at: string | null;
  created_at: string;
  user_id: string;
  users: { nickname: string | null; email: string } | null;
}

const STATUS_COLORS = {
  open: "bg-yellow-400/15 text-yellow-400",
  in_progress: "bg-blue-400/15 text-blue-400",
  resolved: "bg-green-400/15 text-green-400",
};

const STATUS_LABELS = { open: "대기", in_progress: "처리 중", resolved: "완료" };

const CATEGORY_LABELS: Record<string, string> = {
  bug: "버그 신고",
  feature: "기능 제안",
  account: "계정 문의",
  other: "기타",
};

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "open" | "resolved">("open");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [reply, setReply] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);

  const fetchTickets = async () => {
    const res = await fetch("/api/admin/support");
    const data = await res.json() as { tickets: Ticket[] };
    setTickets(data.tickets ?? []);
    setLoading(false);
  };

  useEffect(() => { void fetchTickets(); }, []);

  const handleStatusChange = async (id: string, status: string) => {
    await fetch("/api/admin/support", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    setTickets((prev) => prev.map((t) => t.id === id ? { ...t, status: status as Ticket["status"] } : t));
  };

  const handleReply = async (id: string) => {
    const text = reply[id]?.trim();
    if (!text) return;
    setSubmitting(id);
    await fetch("/api/admin/support", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, admin_reply: text }),
    });
    setTickets((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, admin_reply: text, admin_replied_at: new Date().toISOString(), status: "resolved" }
          : t
      )
    );
    setReply((prev) => ({ ...prev, [id]: "" }));
    setSubmitting(null);
  };

  const visible =
    filter === "all"
      ? tickets
      : filter === "open"
      ? tickets.filter((t) => t.status !== "resolved")
      : tickets.filter((t) => t.status === "resolved");

  const openCount = tickets.filter((t) => t.status !== "resolved").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">문의 관리</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            사용자 문의를 확인하고 답변합니다.
          </p>
        </div>
        {openCount > 0 && (
          <span className="rounded-full bg-yellow-500/15 px-3 py-1 text-sm font-medium text-yellow-400">
            미답변 {openCount}건
          </span>
        )}
      </div>

      <div className="flex gap-2">
        {(["open", "all", "resolved"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              filter === f
                ? "bg-[var(--color-accent)] text-white"
                : "bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]"
            }`}
          >
            {f === "open" ? "미처리" : f === "resolved" ? "완료" : "전체"}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingState />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title={filter === "open" ? "미처리 문의가 없습니다." : "문의 내역이 없습니다."}
        />
      ) : (
        <div className="space-y-3">
          {visible.map((ticket) => {
            const isExpanded = expanded === ticket.id;
            return (
              <div
                key={ticket.id}
                className="rounded-xl bg-[var(--color-bg-surface)] ring-1 ring-[var(--color-border)] overflow-hidden"
              >
                {/* Header row */}
                <button
                  type="button"
                  className="w-full p-4 text-left flex items-start justify-between gap-4 hover:bg-[var(--color-bg-hover)] transition"
                  onClick={() => setExpanded(isExpanded ? null : ticket.id)}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[ticket.status]}`}>
                        {STATUS_LABELS[ticket.status]}
                      </span>
                      <span className="rounded-full bg-[var(--color-bg-elevated)] px-2 py-0.5 text-xs text-[var(--color-text-muted)]">
                        {CATEGORY_LABELS[ticket.category] ?? ticket.category}
                      </span>
                      <span className="text-xs text-[var(--color-text-muted)]">
                        {new Date(ticket.created_at).toLocaleDateString("ko-KR")}
                      </span>
                    </div>
                    <p className="font-medium text-[var(--color-text-primary)] truncate">{ticket.subject}</p>
                    <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                      {ticket.users?.nickname ?? "알 수 없음"} · {ticket.users?.email}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-[var(--color-text-muted)]">{isExpanded ? "▲" : "▼"}</span>
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="border-t border-[var(--color-border)] p-4 space-y-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">문의 내용</p>
                      <p className="text-sm text-[var(--color-text-primary)] whitespace-pre-wrap leading-relaxed">{ticket.body}</p>
                    </div>

                    {ticket.admin_reply && (
                      <div className="rounded-lg bg-[var(--color-bg-elevated)] p-3">
                        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-accent)] mb-1">관리자 답변</p>
                        <p className="text-sm text-[var(--color-text-primary)] whitespace-pre-wrap leading-relaxed">{ticket.admin_reply}</p>
                        {ticket.admin_replied_at && (
                          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                            {new Date(ticket.admin_replied_at).toLocaleString("ko-KR")}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="space-y-2">
                      <textarea
                        rows={3}
                        value={reply[ticket.id] ?? ""}
                        onChange={(e) => setReply((prev) => ({ ...prev, [ticket.id]: e.target.value }))}
                        placeholder="답변을 입력하세요…"
                        className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-base)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none resize-none"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => void handleReply(ticket.id)}
                          disabled={!reply[ticket.id]?.trim() || submitting === ticket.id}
                          className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-white bg-[var(--color-accent)] hover:opacity-90 transition disabled:opacity-50"
                        >
                          <Send className="h-3.5 w-3.5" />
                          {submitting === ticket.id ? "전송 중…" : "답변 전송"}
                        </button>
                        {ticket.status !== "resolved" && (
                          <button
                            type="button"
                            onClick={() => void handleStatusChange(ticket.id, "in_progress")}
                            className="rounded-lg px-3 py-2 text-sm text-blue-400 ring-1 ring-blue-400/30 hover:bg-blue-500/10 transition"
                          >
                            처리 중으로 변경
                          </button>
                        )}
                        {ticket.status !== "resolved" && (
                          <button
                            type="button"
                            onClick={() => void handleStatusChange(ticket.id, "resolved")}
                            className="rounded-lg px-3 py-2 text-sm text-green-400 ring-1 ring-green-400/30 hover:bg-green-500/10 transition"
                          >
                            완료 처리
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
