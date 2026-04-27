"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import type { AuthModalMode } from "@/components/Header";

const isEmailNotConfirmedError = (err: { message?: string; code?: string }) => {
  const msg = (err.message ?? "").toLowerCase();
  const code = (err.code ?? "").toLowerCase();
  return (
    msg.includes("email not confirmed") ||
    msg.includes("email_not_confirmed") ||
    code === "email_not_confirmed"
  );
};

export function useAuthModal({
  initialMode,
  onClose,
  onSuccess,
}: {
  initialMode: AuthModalMode;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [mode, setMode] = useState<AuthModalMode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [nicknameError, setNicknameError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [signupSuccessEmail, setSignupSuccessEmail] = useState<string | null>(null);
  const [needsVerificationEmail, setNeedsVerificationEmail] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setMode(initialMode);
    setError(null);
    setSignupSuccessEmail(null);
    setNeedsVerificationEmail(null);
  }, [initialMode]);

  const handleNicknameBlur = useCallback(async () => {
    if (!nickname || mode !== "signup") return;

    const nicknameRegex = /^[a-zA-Z0-9_-]{2,30}$/;
    const reserved = new Set([
      "admin", "api", "system", "root", "support",
      "help", "info", "omg", "official", "moderator",
    ]);

    if (!nicknameRegex.test(nickname)) {
      setNicknameError("닉네임은 2~30자, 영문/숫자/_/- 만 허용됩니다.");
      return;
    }
    if (reserved.has(nickname.toLowerCase())) {
      setNicknameError("사용할 수 없는 닉네임입니다.");
      return;
    }

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
  }, [nickname, mode]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
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
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
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
          options: { data: { nickname: nickname.trim() } },
        });
        if (err) throw err;
        setSignupSuccessEmail(email);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, [mode, email, password, confirmPassword, nickname, onSuccess, onClose]);

  const handleResend = useCallback(async () => {
    const targetEmail = signupSuccessEmail ?? needsVerificationEmail;
    if (!targetEmail) return;
    setResendLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: err } = await supabase.auth.resend({ type: "signup", email: targetEmail });
      if (err) throw err;
      setToast("인증 메일을 다시 보냈습니다.");
      setNeedsVerificationEmail(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "재전송에 실패했습니다.");
    } finally {
      setResendLoading(false);
    }
  }, [signupSuccessEmail, needsVerificationEmail]);

  const closeAndReset = useCallback(() => {
    setSignupSuccessEmail(null);
    setNeedsVerificationEmail(null);
    setError(null);
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setNickname("");
    setNicknameError(null);
    onClose();
  }, [onClose]);

  const switchMode = useCallback(() => {
    setMode((m) => (m === "login" ? "signup" : "login"));
    setError(null);
  }, []);

  const dismissVerification = useCallback(() => {
    setNeedsVerificationEmail(null);
    setError(null);
  }, []);

  return {
    mode, email, setEmail, password, setPassword,
    confirmPassword, setConfirmPassword, nickname, setNickname,
    nicknameError, setNicknameError, error, loading,
    signupSuccessEmail, needsVerificationEmail,
    resendLoading, toast, setToast,
    handleNicknameBlur, handleSubmit, handleResend,
    closeAndReset, switchMode, dismissVerification,
  };
}
