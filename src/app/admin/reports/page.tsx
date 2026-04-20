"use client";

import { useEffect, useState } from "react";
import { Flag, CheckCircle, XCircle, Trash2 } from "lucide-react";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";

interface Report {
  id: string;
  reason: string;
  status: "pending" | "resolved" | "dismissed";
  created_at: string;
  track_id: string;
  tracks: { title: string; artist: string } | null;
  reporter: { email: string } | null;
}

const STATUS_COLORS = {
  pending: "bg-yellow-400/15 text-yellow-400",
  resolved: "bg-green-400/15 text-green-400",
  dismissed: "bg-[var(--color-text-muted)]/15 text-[var(--color-text-muted)]",
};

const STATUS_LABELS = { pending: "대기", resolved: "처리됨", dismissed: "기각" };

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending">("pending");

  const fetchReports = async () => {
    const res = await fetch("/api/admin/reports");
    const data = await res.json() as { reports: Report[] };
    setReports(data.reports ?? []);
    setLoading(false);
  };

  useEffect(() => { void fetchReports(); }, []);

  const handleStatus = async (id: string, status: "resolved" | "dismissed") => {
    await fetch("/api/admin/reports", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    setReports((prev) => prev.map((r) => r.id === id ? { ...r, status } : r));
  };

  const handleDeleteTrack = async (reportId: string, trackId: string) => {
    if (!window.confirm("신고된 트랙을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) return;
    await fetch("/api/admin/reports", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ report_id: reportId, track_id: trackId }),
    });
    setReports((prev) => prev.map((r) => r.id === reportId ? { ...r, status: "resolved" } : r));
  };

  const visible = filter === "pending" ? reports.filter((r) => r.status === "pending") : reports;
  const pendingCount = reports.filter((r) => r.status === "pending").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">신고 처리</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            사용자가 신고한 콘텐츠를 검토하고 처리합니다.
          </p>
        </div>
        {pendingCount > 0 && (
          <span className="rounded-full bg-red-500/15 px-3 py-1 text-sm font-medium text-red-400">
            미처리 {pendingCount}건
          </span>
        )}
      </div>

      {/* DB 스키마 안내 */}
      <div className="rounded-xl border border-dashed border-[var(--color-border)] p-4 text-xs text-[var(--color-text-muted)]">
        <p className="font-mono font-semibold mb-1">필요 DB 스키마 (최초 1회 실행)</p>
        <pre className="whitespace-pre-wrap">{`CREATE TABLE reports (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id uuid REFERENCES auth.users(id),
  track_id uuid REFERENCES tracks(id) ON DELETE CASCADE,
  reason text NOT NULL,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);`}</pre>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(["pending", "all"] as const).map((f) => (
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
            {f === "pending" ? "미처리" : "전체"}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingState />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={Flag}
          title={filter === "pending" ? "처리 대기 중인 신고가 없습니다." : "신고 내역이 없습니다."}
        />
      ) : (
        <div className="space-y-3">
          {visible.map((report) => (
            <div
              key={report.id}
              className="rounded-xl bg-[var(--color-bg-surface)] p-4 ring-1 ring-[var(--color-border)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[report.status]}`}>
                      {STATUS_LABELS[report.status]}
                    </span>
                    <span className="text-xs text-[var(--color-text-muted)]">
                      {new Date(report.created_at).toLocaleDateString("ko-KR")}
                    </span>
                  </div>
                  <p className="font-medium text-[var(--color-text-primary)]">
                    {report.tracks?.title ?? "삭제된 트랙"}{" "}
                    <span className="text-[var(--color-text-secondary)]">— {report.tracks?.artist}</span>
                  </p>
                  <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                    신고 사유: <span className="text-[var(--color-text-secondary)]">{report.reason}</span>
                  </p>
                  {report.reporter && (
                    <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                      신고자: {report.reporter.email}
                    </p>
                  )}
                </div>

                {report.status === "pending" && (
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void handleDeleteTrack(report.id, report.track_id)}
                      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-red-400 ring-1 ring-red-400/30 transition hover:bg-red-500/10"
                      title="트랙 삭제 (신고 처리)"
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                      삭제
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleStatus(report.id, "dismissed")}
                      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)] transition hover:bg-[var(--color-bg-hover)]"
                      title="신고 기각"
                    >
                      <XCircle className="h-4 w-4" strokeWidth={1.5} />
                      기각
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleStatus(report.id, "resolved")}
                      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-green-400 ring-1 ring-green-400/30 transition hover:bg-green-500/10"
                      title="처리 완료"
                    >
                      <CheckCircle className="h-4 w-4" strokeWidth={1.5} />
                      완료
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
