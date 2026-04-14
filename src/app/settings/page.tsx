"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Instagram, Twitter, Youtube, Music } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { Toast } from "@/components/Toast";
import { validateNickname } from "@/utils/nickname";
import { validateBio, validateSocialLinks, fetchUserProfile } from "@/utils/user";
import type { SocialLinks } from "@/types/user";

export default function SettingsPage() {
  const router = useRouter();
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

  useEffect(() => {
    const loadUserProfile = async () => {
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

      setLoading(false);
    };

    void loadUserProfile();
  }, [router]);

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
      </div>
    </>
  );
}
