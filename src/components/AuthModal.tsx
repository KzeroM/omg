"use client";

import { useState, useEffect } from "react";
import { X, Mail } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import type { AuthModalMode } from "./Header";
import { Toast } from "./Toast";

type AuthModalProps = {
  initialMode: AuthModalMode;
  onClose: () => void;
  onSuccess: () => void;
};

const isEmailNotConfirmedError = (err: { message?: string; code?: string }) => {
  const msg = (err.message ?? "").toLowerCase();
  const code = (err.code ?? "").toLowerCase();
  return (
    msg.includes("email not confirmed") ||
    msg.includes("email_not_confirmed") ||
    code === "email_not_confirmed"
  );
};

export function AuthModal({ initialMode, onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<AuthModalMode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [nicknameError, setNicknameError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  /** 회원가입 성공 후 인증 메일 안내 화면 */
  const [signupSuccessEmail, setSignupSuccessEmail] = useState<string | null>(null);
  /** 로그인 실패 - 이메일 미인증 안내 화면 */
  const [needsVerificationEmail, setNeedsVerificationEmail] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setMode(initialMode);
    setError(null);
    setSignupSuccessEmail(null);
    setNeedsVerificationEmail(null);
  }, [initialMode]);

  const handleNicknameBlur = async () => {
    if (!nickname || mode !== "signup") return;

    // 클라이언트 검증
    const nicknameRegex = /^[a-zA-Z0-9_-]{2,30}$/;
    const reserved = new Set([
      "admin",
      "api",
      "system",
      "root",
      "support",
      "help",
      "info",
      "omg",
      "official",
      "moderator",
    ]);

    if (!nicknameRegex.test(nickname)) {
      setNicknameError("닉네임은 2~30자, 영문/숫자/_/- 만 허용됩니다.");
      return;
    }

    if (reserved.has(nickname.toLowerCase())) {
      setNicknameError("사용할 수 없는 닉네임입니다.");
      return;
    }

    // 서버에서 중복 확인
    try {
      const res = await fetch("/api/auth/check-nickname", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname }),
      });
      const data = (await res.json()) as { available?: boolean; error?: string };
      if (!data.available) {
        setNicknameError(data.error || "이미 사용 중인 닉네임입니다.");
      } else {
        setNicknameError(null);
      }
    } catch {
      setNicknameError("중복 확인 중 오류가 발생했습니다.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNeedsVerificationEmail(null);
    if (mode === "signup" && password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }
    if (password.length < 6) {
      setError("비밀번호는 6자 이상이어야 합니다.");
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      if (mode === "login") {
        const { error: err } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (err) {
          if (isEmailNotConfirmedError(err)) {
            setNeedsVerificationEmail(email);
            setError("이메일 인증이 필요합니다.");
            return;
          }
          throw err;
        }
        onSuccess();
        onClose();
      } else {
        const { error: err } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { nickname: nickname.trim() },
          },
        });
        if (err) throw err;
        setSignupSuccessEmail(email);
        // 모달은 닫지 않고 인증 메일 안내 화면으로 전환
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    const targetEmail = signupSuccessEmail ?? needsVerificationEmail;
    if (!targetEmail) return;
    setResendLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: err } = await supabase.auth.resend({
        type: "signup",
        email: targetEmail,
      });
      if (err) throw err;
      setToast("인증 메일을 다시 보냈습니다.");
      setNeedsVerificationEmail(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "재전송에 실패했습니다.");
    } finally {
      setResendLoading(false);
    }
  };

  const closeAndReset = () => {
    setSignupSuccessEmail(null);
    setNeedsVerificationEmail(null);
    setError(null);
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setNickname("");
    setNicknameError(null);
    onClose();
  };

  // 회원가입 성공 후 인증 메일 안내 화면
  if (signupSuccessEmail) {
    return (
      <>
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={closeAndReset}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-[#141414] p-6 ring-1 ring-[#1f1f1f]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">회원가입 완료</h2>
              <button
                type="button"
                onClick={closeAndReset}
                className="rounded-lg p-1 text-zinc-400 hover:bg-white/10 hover:text-white"
                aria-label="닫기"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mb-4 text-sm leading-relaxed text-zinc-300">
              인증 메일을 발송했습니다. 메일함을 확인하여 인증을 완료해주세요.
            </p>
            <p className="mb-4 truncate rounded-lg bg-white/5 px-3 py-2 text-xs text-zinc-500">
              {signupSuccessEmail}
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleResend}
                disabled={resendLoading}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#A855F7]/50 bg-[#A855F7]/10 py-2.5 text-sm font-medium text-[#A855F7] transition hover:bg-[#A855F7]/20 disabled:opacity-60"
              >
                <Mail className="h-4 w-4" strokeWidth={2} />
                {resendLoading ? "전송 중…" : "인증 메일 다시 보내기"}
              </button>
              <button
                type="button"
                onClick={closeAndReset}
                className="rounded-xl bg-[#1f1f1f] py-2.5 text-sm text-zinc-400 transition hover:bg-white/10 hover:text-white"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
        {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      </>
    );
  }

  // 로그인 실패 - 이메일 미인증 안내 화면 (에러 메시지 + 재전송)
  if (needsVerificationEmail) {
    return (
      <>
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={closeAndReset}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-[#141414] p-6 ring-1 ring-[#1f1f1f]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">이메일 인증 필요</h2>
              <button
                type="button"
                onClick={closeAndReset}
                className="rounded-lg p-1 text-zinc-400 hover:bg-white/10 hover:text-white"
                aria-label="닫기"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mb-2 text-sm font-medium text-[#f59e0b]">이메일 인증이 필요합니다.</p>
            <p className="mb-4 text-sm text-zinc-400">
              로그인하려면 메일함의 인증 링크를 먼저 확인해주세요.
            </p>
            {error && <p className="mb-4 text-sm text-red-400">{error}</p>}
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleResend}
                disabled={resendLoading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#A855F7] py-2.5 text-sm font-medium text-white transition hover:bg-[#9333ea] disabled:opacity-60"
              >
                <Mail className="h-4 w-4" strokeWidth={2} />
                {resendLoading ? "전송 중…" : "인증 메일 다시 보내기"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setNeedsVerificationEmail(null);
                  setError(null);
                }}
                className="rounded-xl bg-[#1f1f1f] py-2.5 text-sm text-zinc-400 transition hover:bg-white/10 hover:text-white"
              >
                로그인 화면으로
              </button>
            </div>
          </div>
        </div>
        {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      </>
    );
  }

  // 로그인 / 회원가입 폼
  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
        onClick={onClose}
      >
        <div
          className="w-full max-w-sm rounded-2xl bg-[#141414] p-6 ring-1 ring-[#1f1f1f]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">
              {mode === "login" ? "로그인" : "회원가입"}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1 text-zinc-400 hover:bg-white/10 hover:text-white"
              aria-label="닫기"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="auth-email" className="mb-1 block text-sm text-zinc-400">
                이메일
              </label>
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-[#1f1f1f] bg-[#0d0d0d] px-3 py-2 text-white placeholder-zinc-500 focus:border-[#A855F7] focus:outline-none"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="auth-password" className="mb-1 block text-sm text-zinc-400">
                비밀번호
              </label>
              <input
                id="auth-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full rounded-lg border border-[#1f1f1f] bg-[#0d0d0d] px-3 py-2 text-white placeholder-zinc-500 focus:border-[#A855F7] focus:outline-none"
                placeholder="6자 이상"
              />
            </div>
            {mode === "signup" && (
              <>
                <div>
                  <label htmlFor="auth-confirm" className="mb-1 block text-sm text-zinc-400">
                    비밀번호 확인
                  </label>
                  <input
                    id="auth-confirm"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full rounded-lg border border-[#1f1f1f] bg-[#0d0d0d] px-3 py-2 text-white placeholder-zinc-500 focus:border-[#A855F7] focus:outline-none"
                    placeholder="다시 입력"
                  />
                </div>
                <div>
                  <label htmlFor="auth-nickname" className="mb-1 block text-sm text-zinc-400">
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
                    className="w-full rounded-lg border border-[#1f1f1f] bg-[#0d0d0d] px-3 py-2 text-white placeholder-zinc-500 focus:border-[#A855F7] focus:outline-none"
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
              className="w-full rounded-xl bg-[#A855F7] py-2.5 text-sm font-medium text-white transition hover:bg-[#9333ea] disabled:opacity-60"
            >
              {loading ? "처리 중…" : mode === "login" ? "로그인" : "가입하기"}
            </button>
          </form>
          <button
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setError(null);
            }}
            className="mt-4 w-full text-center text-sm text-zinc-400 hover:text-[#A855F7]"
          >
            {mode === "login" ? "계정이 없으신가요? 회원가입" : "이미 계정이 있으신가요? 로그인"}
          </button>
        </div>
      </div>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </>
  );
}
