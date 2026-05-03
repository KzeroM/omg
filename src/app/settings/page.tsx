"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "next-themes";
import { ArrowLeft, Instagram, Twitter, Youtube, Music, Lock, Trash2, Sun, Moon, MessageSquare, Send } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { Toast } from "@/components/Toast";
import { validateNickname } from "@/utils/nickname";
import { validateBio, validateSocialLinks, fetchUserProfile } from "@/utils/user";
import type { SocialLinks } from "@/types/user";

interface SupportTicket {
  id: string;
  category: string;
  subject: string;
  status: "open" | "in_progress" | "resolved";
  admin_reply: string | null;
  admin_replied_at: string | null;
  created_at: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [currentNickname, setCurrentNickname] = useState<string | null>(null);
  const [newNickname, setNewNickname] = useState("");
  const [nicknameError, setNicknameError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [currentBio, setCurrentBio] = useState<string | null>(null);
  const [newBio, setNewBio] = useState("");
  const [bioError, setBioError] = useState<string | null>(null);
  const [currentSocialLinks, setCurrentSocialLinks] =
    useState<SocialLinks | null>(null);
  const [newSocialLinks, setNewSocialLinks] = useState<SocialLinks>({});
  const [socialLinksErrors, setSocialLinksErrors] = useState<
    Record<string, string>
  >({});
  const [savingProfile, setSavingProfile] = useState(false);

  // 비밀번호 변경
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [savingPassword, setSavingPassword] = useState(false);

  // 계정 삭제
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);

  // 문의하기
  const [supportCategory, setSupportCategory] = useState("other");
  const [supportSubject, setSupportSubject] = useState("");
  const [supportBody, setSupportBody] = useState("");
  const [supportError, setSupportError] = useState<string | null>(null);
  const [submittingSupport, setSubmittingSupport] = useState(false);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [supportSubmitted, setSupportSubmitted] = useState(false);

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (!authUser) {
          router.push("/");
          return;
        }

        setUser(authUser);

        // 현재 닉네임 로드
        const { data } = await supabase
          .from("users")
          .select("nickname")
          .eq("user_id", authUser.id)
          .single();

        if (data) {
          setCurrentNickname(data.nickname as string);
          setNewNickname(data.nickname as string);
        }

        // 현재 프로필 로드
        const profileData = await fetchUserProfile(supabase);
        if (profileData) {
          setCurrentBio(profileData.bio ?? null);
          setNewBio(profileData.bio ?? "");
          setCurrentSocialLinks(profileData.social_links ?? null);
          setNewSocialLinks(profileData.social_links ?? {});
        }

        // 기존 문의 내역 로드
        void fetch("/api/support")
          .then((res) => res.ok ? res.json() as Promise<{ tickets: SupportTicket[] }> : { tickets: [] })
          .then((d) => setSupportTickets(d.tickets ?? []))
          .catch(() => {});
      } catch (err) {
        console.error("[Settings] loadUserProfile 실패:", err);
      } finally {
        setLoading(false);
      }
    };

    void loadUserProfile();
  }, [router]);

  const handleChangePassword = async () => {
    if (newPassword.length < 8) {
      setPasswordError("비밀번호는 8자 이상이어야 합니다.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("비밀번호가 일치하지 않습니다.");
      return;
    }
    setSavingPassword(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setPasswordError(error.message);
        return;
      }
      setNewPassword("");
      setConfirmPassword("");
      setPasswordError(null);
      setToast("비밀번호가 변경되었습니다.");
    } catch {
      setPasswordError("비밀번호 변경 중 오류가 발생했습니다.");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "계정삭제") return;
    setDeletingAccount(true);
    try {
      const res = await fetch("/api/user/delete", { method: "DELETE" });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setToast(data.error ?? "계정 삭제에 실패했습니다.");
        setDeletingAccount(false);
        return;
      }
      // 로그아웃 후 홈으로
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/");
    } catch {
      setToast("계정 삭제 중 오류가 발생했습니다.");
      setDeletingAccount(false);
    }
  };

  const handleSubmitSupport = async () => {
    setSupportError(null);
    if (!supportSubject.trim() || !supportBody.trim()) {
      setSupportError("제목과 내용을 입력해주세요.");
      return;
    }
    setSubmittingSupport(true);
    const res = await fetch("/api/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: supportCategory, subject: supportSubject, body: supportBody }),
    });
    const data = await res.json() as { ok?: boolean; error?: string };
    if (!res.ok || !data.ok) {
      setSupportError(data.error ?? "문의 등록에 실패했습니다.");
      setSubmittingSupport(false);
      return;
    }
    setSupportCategory("other");
    setSupportSubject("");
    setSupportBody("");
    setSupportSubmitted(true);
    setSubmittingSupport(false);
    // 목록 갱신
    const listRes = await fetch("/api/support");
    const listData = await listRes.json() as { tickets: SupportTicket[] };
    setSupportTickets(listData.tickets ?? []);
    setTimeout(() => setSupportSubmitted(false), 3000);
  };

  const isProfileChanged =
    newBio !== (currentBio ?? "") ||
    JSON.stringify(newSocialLinks) !==
      JSON.stringify(currentSocialLinks ?? {});

  const handleBioChange = (value: string) => {
    setNewBio(value);
    setBioError(null);
  };

  const handleSocialLinkChange = (platform: keyof SocialLinks, value: string) => {
    setNewSocialLinks((prev) => ({
      ...prev,
      [platform]: value,
    }));
    setSocialLinksErrors((prev) => ({
      ...prev,
      [platform]: "",
    }));
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    if (!isProfileChanged) {
      setToast("변경사항이 없습니다.");
      return;
    }

    // 클라이언트 검증
    const bioValidation = validateBio(newBio);
    if (!bioValidation.valid) {
      setBioError(bioValidation.error || "유효하지 않은 자기소개입니다.");
      return;
    }

    const socialLinksValidation = validateSocialLinks(newSocialLinks);
    if (!socialLinksValidation.valid) {
      setSocialLinksErrors(socialLinksValidation.errors || {});
      return;
    }

    setSavingProfile(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bio: newBio || null,
          social_links:
            Object.keys(newSocialLinks).length > 0 ? newSocialLinks : null,
        }),
      });

      const result = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !result.ok) {
        setToast(result.error || "저장에 실패했습니다.");
        return;
      }

      setCurrentBio(newBio || null);
      setCurrentSocialLinks(
        Object.keys(newSocialLinks).length > 0 ? newSocialLinks : null
      );
      setBioError(null);
      setSocialLinksErrors({});
      setToast("프로필이 업데이트되었습니다.");
    } catch {
      setToast("저장 중 오류가 발생했습니다.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleNicknameBlur = async () => {
    if (!newNickname || newNickname === currentNickname) {
      setNicknameError(null);
      return;
    }

    // 클라이언트 검증
    const validation = validateNickname(newNickname);
    if (!validation.valid) {
      setNicknameError(validation.error || "유효하지 않은 닉네임입니다.");
      return;
    }

    // 서버에서 중복 확인
    try {
      const res = await fetch("/api/auth/check-nickname", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: newNickname }),
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

  const handleSaveNickname = async () => {
    if (!user) return;

    // 변경사항 없으면 종료
    if (newNickname === currentNickname) {
      setToast("변경사항이 없습니다.");
      return;
    }

    // 검증
    const validation = validateNickname(newNickname);
    if (!validation.valid) {
      setNicknameError(validation.error || "유효하지 않은 닉네임입니다.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/auth/update-nickname", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: newNickname }),
      });

      const result = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !result.ok) {
        setToast(result.error || "저장에 실패했습니다.");
        return;
      }

      setCurrentNickname(newNickname);
      setNicknameError(null);
      setToast("닉네임이 업데이트되었습니다.");
    } catch {
      setToast("저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-8">
        <p className="text-zinc-500">불러오는 중…</p>
      </div>
    );
  }

  return (
    <>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      <div className="mx-auto max-w-2xl space-y-8 px-6 py-8">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-sm text-zinc-400 transition hover:text-[#A855F7]"
            aria-label="뒤로가기"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold text-white">설정</h1>
        </div>

        {/* 테마 */}
        <section className="rounded-2xl bg-[var(--color-bg-surface)] p-6 ring-1 ring-[var(--color-border)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {theme === "light" ? (
                <Sun className="h-4 w-4 text-[var(--color-text-muted)]" />
              ) : (
                <Moon className="h-4 w-4 text-[var(--color-text-muted)]" />
              )}
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">테마</h2>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  theme === "dark"
                    ? "bg-[var(--color-accent)] text-white"
                    : "bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                }`}
              >
                <Moon className="h-3 w-3" />
                다크
              </button>
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  theme === "light"
                    ? "bg-[var(--color-accent)] text-white"
                    : "bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                }`}
              >
                <Sun className="h-3 w-3" />
                라이트
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-2xl bg-[#141414] p-6 ring-1 ring-[#1f1f1f] space-y-6">
          <div>
            <h2 className="mb-4 text-lg font-semibold text-white">프로필</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="current-nickname" className="mb-2 block text-sm text-zinc-400">
                  현재 닉네임
                </label>
                <input
                  id="current-nickname"
                  type="text"
                  value={currentNickname ?? ""}
                  disabled
                  className="w-full rounded-lg border border-[#1f1f1f] bg-[#0d0d0d] px-3 py-2 text-zinc-500 placeholder-zinc-600 focus:border-[#A855F7] focus:outline-none disabled:opacity-60"
                />
              </div>

              <div>
                <label htmlFor="new-nickname" className="mb-2 block text-sm text-zinc-400">
                  새 닉네임
                </label>
                <input
                  id="new-nickname"
                  type="text"
                  value={newNickname}
                  onChange={(e) => {
                    setNewNickname(e.target.value);
                    setNicknameError(null);
                  }}
                  onBlur={handleNicknameBlur}
                  className="w-full rounded-lg border border-[#1f1f1f] bg-[#0d0d0d] px-3 py-2 text-white placeholder-zinc-500 focus:border-[#A855F7] focus:outline-none"
                  placeholder="2~30자, 영문/숫자/_/-"
                />
                {nicknameError && (
                  <p className="mt-1 text-xs text-red-400">{nicknameError}</p>
                )}
                {!nicknameError && newNickname && newNickname !== currentNickname && (
                  <p className="mt-1 text-xs text-green-400">사용 가능한 닉네임입니다.</p>
                )}
              </div>

              <button
                type="button"
                onClick={handleSaveNickname}
                disabled={saving || newNickname === currentNickname || !!nicknameError}
                className="rounded-xl bg-[#A855F7] px-6 py-2.5 text-sm font-medium text-white transition hover:bg-[#9333ea] disabled:opacity-60"
              >
                {saving ? "저장 중…" : "저장"}
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-2xl bg-[#141414] p-6 ring-1 ring-[#1f1f1f] space-y-6">
          <div>
            <h2 className="mb-4 text-lg font-semibold text-white">프로필 편집</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="bio" className="mb-2 block text-sm text-zinc-400">
                  자기소개
                </label>
                <div className="relative">
                  <textarea
                    id="bio"
                    value={newBio}
                    onChange={(e) => handleBioChange(e.target.value)}
                    maxLength={300}
                    rows={4}
                    className="w-full rounded-lg border border-[#1f1f1f] bg-[#0d0d0d] px-3 py-2 text-white placeholder-zinc-500 focus:border-[#A855F7] focus:outline-none resize-none"
                    placeholder="자신을 소개해주세요. (최대 300자)"
                  />
                  <p className="absolute bottom-2 right-3 text-xs text-zinc-500">
                    {newBio.length} / 300
                  </p>
                </div>
                {bioError && (
                  <p className="mt-1 text-xs text-red-400">{bioError}</p>
                )}
              </div>

              <div>
                <label className="mb-4 block text-sm text-zinc-400">
                  소셜 링크
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="instagram" className="mb-2 flex items-center gap-2 text-xs text-zinc-400">
                      <Instagram className="h-4 w-4" />
                      Instagram
                    </label>
                    <input
                      id="instagram"
                      type="text"
                      value={newSocialLinks.instagram ?? ""}
                      onChange={(e) =>
                        handleSocialLinkChange("instagram", e.target.value)
                      }
                      className="w-full rounded-lg border border-[#1f1f1f] bg-[#0d0d0d] px-3 py-2 text-white placeholder-zinc-500 focus:border-[#A855F7] focus:outline-none"
                      placeholder="https://instagram.com/username"
                    />
                    {socialLinksErrors.instagram && (
                      <p className="mt-1 text-xs text-red-400">
                        {socialLinksErrors.instagram}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="twitter" className="mb-2 flex items-center gap-2 text-xs text-zinc-400">
                      <Twitter className="h-4 w-4" />
                      Twitter
                    </label>
                    <input
                      id="twitter"
                      type="text"
                      value={newSocialLinks.twitter ?? ""}
                      onChange={(e) =>
                        handleSocialLinkChange("twitter", e.target.value)
                      }
                      className="w-full rounded-lg border border-[#1f1f1f] bg-[#0d0d0d] px-3 py-2 text-white placeholder-zinc-500 focus:border-[#A855F7] focus:outline-none"
                      placeholder="https://twitter.com/username"
                    />
                    {socialLinksErrors.twitter && (
                      <p className="mt-1 text-xs text-red-400">
                        {socialLinksErrors.twitter}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="youtube" className="mb-2 flex items-center gap-2 text-xs text-zinc-400">
                      <Youtube className="h-4 w-4" />
                      YouTube
                    </label>
                    <input
                      id="youtube"
                      type="text"
                      value={newSocialLinks.youtube ?? ""}
                      onChange={(e) =>
                        handleSocialLinkChange("youtube", e.target.value)
                      }
                      className="w-full rounded-lg border border-[#1f1f1f] bg-[#0d0d0d] px-3 py-2 text-white placeholder-zinc-500 focus:border-[#A855F7] focus:outline-none"
                      placeholder="https://youtube.com/@username"
                    />
                    {socialLinksErrors.youtube && (
                      <p className="mt-1 text-xs text-red-400">
                        {socialLinksErrors.youtube}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="soundcloud" className="mb-2 flex items-center gap-2 text-xs text-zinc-400">
                      <Music className="h-4 w-4" />
                      SoundCloud
                    </label>
                    <input
                      id="soundcloud"
                      type="text"
                      value={newSocialLinks.soundcloud ?? ""}
                      onChange={(e) =>
                        handleSocialLinkChange("soundcloud", e.target.value)
                      }
                      className="w-full rounded-lg border border-[#1f1f1f] bg-[#0d0d0d] px-3 py-2 text-white placeholder-zinc-500 focus:border-[#A855F7] focus:outline-none"
                      placeholder="https://soundcloud.com/username"
                    />
                    {socialLinksErrors.soundcloud && (
                      <p className="mt-1 text-xs text-red-400">
                        {socialLinksErrors.soundcloud}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={
                  savingProfile ||
                  !isProfileChanged ||
                  !!bioError ||
                  Object.keys(socialLinksErrors).length > 0
                }
                className="rounded-xl bg-[#A855F7] px-6 py-2.5 text-sm font-medium text-white transition hover:bg-[#9333ea] disabled:opacity-60"
              >
                {savingProfile ? "저장 중…" : "저장"}
              </button>
            </div>
          </div>
        </section>
        {/* 비밀번호 변경 */}
        <section className="rounded-2xl bg-[#141414] p-6 ring-1 ring-[#1f1f1f] space-y-4">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-zinc-400" />
            <h2 className="text-lg font-semibold text-white">비밀번호 변경</h2>
          </div>
          <div className="space-y-3">
            <div>
              <label htmlFor="new-password" className="mb-1.5 block text-sm text-zinc-400">
                새 비밀번호
              </label>
              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); setPasswordError(null); }}
                className="w-full rounded-lg border border-[#1f1f1f] bg-[#0d0d0d] px-3 py-2 text-white placeholder-zinc-500 focus:border-[#A855F7] focus:outline-none"
                placeholder="8자 이상"
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="mb-1.5 block text-sm text-zinc-400">
                새 비밀번호 확인
              </label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(null); }}
                className="w-full rounded-lg border border-[#1f1f1f] bg-[#0d0d0d] px-3 py-2 text-white placeholder-zinc-500 focus:border-[#A855F7] focus:outline-none"
                placeholder="비밀번호 재입력"
              />
            </div>
            {passwordError && <p className="text-xs text-red-400">{passwordError}</p>}
            <button
              type="button"
              onClick={handleChangePassword}
              disabled={savingPassword || !newPassword || !confirmPassword}
              className="rounded-xl bg-[#A855F7] px-6 py-2.5 text-sm font-medium text-white transition hover:bg-[#9333ea] disabled:opacity-60"
            >
              {savingPassword ? "변경 중…" : "비밀번호 변경"}
            </button>
          </div>
        </section>

        {/* 문의하기 */}
        <section className="rounded-2xl bg-[var(--color-bg-surface)] p-6 ring-1 ring-[var(--color-border)] space-y-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-[var(--color-text-muted)]" />
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">문의하기</h2>
          </div>

          <div className="space-y-3">
            <div>
              <label htmlFor="support-category" className="mb-1.5 block text-sm text-[var(--color-text-secondary)]">
                카테고리
              </label>
              <select
                id="support-category"
                value={supportCategory}
                onChange={(e) => setSupportCategory(e.target.value)}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-base)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none"
              >
                <option value="bug">버그 신고</option>
                <option value="feature">기능 제안</option>
                <option value="account">계정 문의</option>
                <option value="other">기타</option>
              </select>
            </div>
            <div>
              <label htmlFor="support-subject" className="mb-1.5 block text-sm text-[var(--color-text-secondary)]">
                제목
              </label>
              <input
                id="support-subject"
                type="text"
                value={supportSubject}
                onChange={(e) => { setSupportSubject(e.target.value); setSupportError(null); }}
                maxLength={100}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-base)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none"
                placeholder="문의 제목을 입력해주세요."
              />
            </div>
            <div>
              <label htmlFor="support-body" className="mb-1.5 block text-sm text-[var(--color-text-secondary)]">
                내용
              </label>
              <div className="relative">
                <textarea
                  id="support-body"
                  value={supportBody}
                  onChange={(e) => { setSupportBody(e.target.value); setSupportError(null); }}
                  maxLength={2000}
                  rows={5}
                  className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-base)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none resize-none"
                  placeholder="문의 내용을 상세히 입력해주세요."
                />
                <p className="absolute bottom-2 right-3 text-xs text-[var(--color-text-muted)]">
                  {supportBody.length} / 2000
                </p>
              </div>
            </div>
            {supportError && <p className="text-xs text-red-400">{supportError}</p>}
            {supportSubmitted && (
              <p className="text-xs text-green-400">문의가 접수되었습니다. 빠른 시일 내에 답변드리겠습니다.</p>
            )}
            <button
              type="button"
              onClick={handleSubmitSupport}
              disabled={submittingSupport || !supportSubject.trim() || !supportBody.trim()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--color-accent)] px-6 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
            >
              <Send className="h-3.5 w-3.5" />
              {submittingSupport ? "등록 중…" : "문의 등록"}
            </button>
          </div>

          {/* 이전 문의 내역 */}
          {supportTickets.length > 0 && (
            <div className="mt-6 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">내 문의 내역</p>
              {supportTickets.map((t) => (
                <div key={t.id} className="rounded-lg border border-[var(--color-border)] p-3 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      t.status === "resolved"
                        ? "bg-green-400/15 text-green-400"
                        : t.status === "in_progress"
                        ? "bg-blue-400/15 text-blue-400"
                        : "bg-yellow-400/15 text-yellow-400"
                    }`}>
                      {t.status === "resolved" ? "완료" : t.status === "in_progress" ? "처리 중" : "대기"}
                    </span>
                    <span className="text-xs text-[var(--color-text-muted)]">
                      {new Date(t.created_at).toLocaleDateString("ko-KR")}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--color-text-primary)]">{t.subject}</p>
                  {t.admin_reply && (
                    <p className="text-xs text-[var(--color-text-secondary)] border-l-2 border-[var(--color-accent)] pl-2">
                      {t.admin_reply}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 계정 삭제 */}
        <section className="rounded-2xl bg-[#141414] p-6 ring-1 ring-red-900/40 space-y-4">
          <div className="flex items-center gap-2">
            <Trash2 className="h-4 w-4 text-red-400" />
            <h2 className="text-lg font-semibold text-red-400">계정 삭제</h2>
          </div>
          <p className="text-sm text-zinc-400">
            계정을 삭제하면 모든 데이터(업로드한 곡, 좋아요, 팔로우 등)가 영구적으로 삭제되며 복구할 수 없습니다.
          </p>
          {!showDeleteConfirm ? (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="rounded-xl border border-red-800 px-5 py-2 text-sm font-medium text-red-400 transition hover:bg-red-900/30"
            >
              계정 삭제
            </button>
          ) : (
            <div className="space-y-3 rounded-xl bg-red-950/30 p-4 ring-1 ring-red-900/50">
              <p className="text-sm text-red-300">
                확인을 위해 <strong>계정삭제</strong>를 입력해주세요.
              </p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="w-full rounded-lg border border-red-900/60 bg-[#0d0d0d] px-3 py-2 text-white placeholder-zinc-600 focus:border-red-500 focus:outline-none"
                placeholder="계정삭제"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(""); }}
                  className="rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-400 transition hover:border-zinc-500"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmText !== "계정삭제" || deletingAccount}
                  className="rounded-xl bg-red-700 px-5 py-2 text-sm font-medium text-white transition hover:bg-red-600 disabled:opacity-50"
                >
                  {deletingAccount ? "삭제 중…" : "영구 삭제"}
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
