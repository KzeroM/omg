"use client";

import { X, Mail } from "lucide-react";

type Props = {
  error: string | null;
  resendLoading: boolean;
  onResend: () => void;
  onBack: () => void;
  onClose: () => void;
};

export function VerificationScreen({ error, resendLoading, onResend, onBack, onClose }: Props) {
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
          <h2 className="text-lg font-bold text-[var(--color-text-primary)]">이메일 인증 필요</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-[var(--color-text-secondary)] hover:bg-white/10 hover:text-[var(--color-text-primary)]"
            aria-label="닫기"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mb-2 text-sm font-medium text-[#f59e0b]">이메일 인증이 필요합니다.</p>
        <p className="mb-4 text-sm text-[var(--color-text-secondary)]">
          로그인하려면 메일함의 인증 링크를 먼저 확인해주세요.
        </p>
        {error && <p className="mb-4 text-sm text-red-400">{error}</p>}
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={onResend}
            disabled={resendLoading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-accent)] py-2.5 text-sm font-medium text-[var(--color-text-primary)] transition hover:bg-[var(--color-accent-hover)] disabled:opacity-60"
          >
            <Mail className="h-4 w-4" strokeWidth={2} />
            {resendLoading ? "전송 중…" : "인증 메일 다시 보내기"}
          </button>
          <button
            type="button"
            onClick={onBack}
            className="rounded-xl bg-[var(--color-bg-elevated)] py-2.5 text-sm text-[var(--color-text-secondary)] transition hover:bg-white/10 hover:text-[var(--color-text-primary)]"
          >
            로그인 화면으로
          </button>
        </div>
      </div>
    </div>
  );
}
