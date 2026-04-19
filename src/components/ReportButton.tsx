"use client";

import { useState } from "react";
import { Flag, X } from "lucide-react";

const REASONS = [
  "저작권 침해",
  "불건전한 콘텐츠",
  "스팸 / 광고",
  "허위 정보",
  "기타",
] as const;

interface ReportButtonProps {
  trackId: string;
}

export function ReportButton({ trackId }: ReportButtonProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    if (!reason) return;
    setSubmitting(true);
    try {
      await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ track_id: trackId, reason }),
      });
      setDone(true);
      setTimeout(() => { setOpen(false); setDone(false); setReason(""); }, 1500);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        className="rounded-lg p-1.5 text-[var(--color-text-muted)] transition hover:bg-red-500/10 hover:text-red-400"
        aria-label="신고"
        title="신고"
      >
        <Flag className="h-3.5 w-3.5" strokeWidth={1.5} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-[var(--color-bg-surface)] p-6 shadow-2xl ring-1 ring-[var(--color-border)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-[var(--color-text-primary)]">트랙 신고</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-[var(--color-text-muted)] transition hover:text-[var(--color-text-primary)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {done ? (
              <p className="py-4 text-center text-sm text-green-400">신고가 접수되었습니다. 감사합니다.</p>
            ) : (
              <>
                <p className="mb-3 text-sm text-[var(--color-text-muted)]">신고 사유를 선택해 주세요.</p>
                <div className="space-y-2">
                  {REASONS.map((r) => (
                    <label
                      key={r}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl px-4 py-3 ring-1 transition ${
                        reason === r
                          ? "bg-[var(--color-accent-subtle)] ring-[var(--color-accent)]"
                          : "ring-[var(--color-border)] hover:bg-[var(--color-bg-hover)]"
                      }`}
                    >
                      <input
                        type="radio"
                        name="reason"
                        value={r}
                        checked={reason === r}
                        onChange={() => setReason(r)}
                        className="sr-only"
                      />
                      <span className="text-sm text-[var(--color-text-primary)]">{r}</span>
                    </label>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => void handleSubmit()}
                  disabled={!reason || submitting}
                  className="mt-4 w-full rounded-xl bg-red-500 py-2.5 text-sm font-medium text-white transition hover:bg-red-600 disabled:opacity-50"
                >
                  {submitting ? "제출 중…" : "신고 제출"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
