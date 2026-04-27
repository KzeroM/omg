"use client";

import { X, Mail } from "lucide-react";

type Props = {
  email: string;
  error: string | null;
  resendLoading: boolean;
  onResend: () => void;
  onClose: () => void;
};

export function SignupSuccessScreen({ email, error, resendLoading, onResend, onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-[var(--color-bg-surface)] p-6 ring-1 ring-[var(--color-border)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[var(--color-text-primary)]">회원가입 완료</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-[var(--color-text-secondary)] hover:bg-white/10 hover:text-[var(--color-text-primary)]"
            aria-label="닫기"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mb-4 text-sm leading-relaxed text-[var(--color-text-secondary)]">
          인증 메일을 발송했습니다. 메일함을 확인하여 인증을 완료해주세요.
        </p>
        <p className="mb-4 truncate rounded-lg bg-white/5 px-3 py-2 text-xs text-[var(--color-text-muted)]">
          {email}
        </p>
        {error && <p className="mb-4 text-sm text-red-400">{error}</p>}
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={onResend}
            disabled={resendLoading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--color-accent)]/50 bg-[var(--color-accent-subtle)] py-2.5 text-sm font-medium text-[var(--color-accent)] transition hover:bg-[var(--color-accent)]/20 disabled:opacity-60"
          >
            <Mail className="h-4 w-4" strokeWidth={2} />
            {resendLoading ? "전송 중…" : "인증 메일 다시 보내기"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[var(--color-bg-elevated)] py-2.5 text-sm text-[var(--color-text-secondary)] transition hover:bg-white/10 hover:text-[var(--color-text-primary)]"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
