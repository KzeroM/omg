"use client";

import { X } from "lucide-react";
import type { AuthModalMode } from "./Header";
import { Toast } from "./Toast";
import { useAuthModal } from "@/hooks/useAuthModal";
import { SignupSuccessScreen } from "./auth/SignupSuccessScreen";
import { VerificationScreen } from "./auth/VerificationScreen";

type AuthModalProps = {
  initialMode: AuthModalMode;
  onClose: () => void;
  onSuccess: () => void;
};

export function AuthModal({ initialMode, onClose, onSuccess }: AuthModalProps) {
  const {
    mode, email, setEmail, password, setPassword,
    confirmPassword, setConfirmPassword, nickname, setNickname,
    nicknameError, setNicknameError, error, loading,
    signupSuccessEmail, needsVerificationEmail,
    resendLoading, toast, setToast,
    handleNicknameBlur, handleSubmit, handleResend,
    closeAndReset, switchMode, dismissVerification,
  } = useAuthModal({ initialMode, onClose, onSuccess });

  if (signupSuccessEmail) {
    return (
      <>
        <SignupSuccessScreen
          email={signupSuccessEmail}
          error={error}
          resendLoading={resendLoading}
          onResend={handleResend}
          onClose={closeAndReset}
        />
        {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      </>
    );
  }

  if (needsVerificationEmail) {
    return (
      <>
        <VerificationScreen
          error={error}
          resendLoading={resendLoading}
          onResend={handleResend}
          onBack={dismissVerification}
          onClose={closeAndReset}
        />
        {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      </>
    );
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
        onClick={onClose}
      >
        <div
          className="w-full max-w-sm rounded-2xl bg-[var(--color-bg-surface)] p-6 ring-1 ring-[var(--color-border)]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
              {mode === "login" ? "로그인" : "회원가입"}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1 text-[var(--color-text-secondary)] hover:bg-white/10 hover:text-[var(--color-text-primary)]"
              aria-label="닫기"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="auth-email" className="mb-1 block text-sm text-[var(--color-text-secondary)]">
                이메일
              </label>
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-base)] px-3 py-2 text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="auth-password" className="mb-1 block text-sm text-[var(--color-text-secondary)]">
                비밀번호
              </label>
              <input
                id="auth-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-base)] px-3 py-2 text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none"
                placeholder="6자 이상"
              />
            </div>
            {mode === "signup" && (
              <>
                <div>
                  <label htmlFor="auth-confirm" className="mb-1 block text-sm text-[var(--color-text-secondary)]">
                    비밀번호 확인
                  </label>
                  <input
                    id="auth-confirm"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-base)] px-3 py-2 text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none"
                    placeholder="다시 입력"
                  />
                </div>
                <div>
                  <label htmlFor="auth-nickname" className="mb-1 block text-sm text-[var(--color-text-secondary)]">
                    닉네임
                  </label>
                  <input
                    id="auth-nickname"
                    type="text"
                    value={nickname}
                    onChange={(e) => {
                      setNickname(e.target.value);
                      setNicknameError(null);
                    }}
                    onBlur={handleNicknameBlur}
                    required
                    className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-base)] px-3 py-2 text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none"
                    placeholder="닉네임을 입력하세요 (2~30자, 영문/숫자/_/-)"
                  />
                  {nicknameError && (
                    <p className="mt-1 text-xs text-red-400">{nicknameError}</p>
                  )}
                </div>
              </>
            )}
            {error && (
              <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400 ring-1 ring-red-500/20">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[var(--color-accent)] py-2.5 text-sm font-medium text-[var(--color-text-primary)] transition hover:bg-[var(--color-accent-hover)] disabled:opacity-60"
            >
              {loading ? "처리 중…" : mode === "login" ? "로그인" : "가입하기"}
            </button>
          </form>
          <button
            type="button"
            onClick={switchMode}
            className="mt-4 w-full text-center text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-accent)]"
          >
            {mode === "login" ? "계정이 없으신가요? 회원가입" : "이미 계정이 있으신가요? 로그인"}
          </button>
        </div>
      </div>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </>
  );
}
