"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { TagSelector } from "@/components/TagSelector";
import {
  REFERRAL_LABELS, PURPOSE_LABELS, GENDER_LABELS,
  type ReferralSourceValue, type PrimaryPurposeValue, type GenderValue,
} from "@/constants/survey";

type Step = 1 | 2 | 3 | 4;

const REFERRAL_OPTIONS = Object.entries(REFERRAL_LABELS).map(([k, v]) => ({
  value: Number(k) as ReferralSourceValue,
  label: v,
}));

const PURPOSE_OPTIONS = Object.entries(PURPOSE_LABELS).map(([k, v]) => ({
  value: Number(k) as PrimaryPurposeValue,
  label: v,
}));

const GENDER_OPTIONS = Object.entries(GENDER_LABELS).map(([k, v]) => ({
  value: Number(k) as GenderValue,
  label: v,
}));

export function OnboardingModal() {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState<Step>(1);
  const [submitting, setSubmitting] = useState(false);

  // 폼 상태
  const [referralSource, setReferralSource] = useState<ReferralSourceValue | null>(null);
  const [primaryPurpose, setPrimaryPurpose] = useState<PrimaryPurposeValue | null>(null);
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState<GenderValue | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  useEffect(() => {
    const check = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("users")
        .select("birth_date")
        .eq("user_id", user.id)
        .single();

      if (data && !data.birth_date) {
        setShow(true);
      }
    };

    void check();

    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      void check();
    });
    return () => subscription.unsubscribe();
  }, []);

  const canNext = () => {
    if (step === 1) return referralSource !== null;
    if (step === 2) return primaryPurpose !== null;
    if (step === 3) return birthDate !== "" && gender !== null;
    return true; // step 4: 태그는 선택 없어도 통과
  };

  const handleNext = () => {
    if (step < 4) setStep((prev) => (prev + 1) as Step);
    else void handleSubmit();
  };

  const handleSubmit = async () => {
    if (!referralSource || !primaryPurpose || !birthDate || !gender) return;
    setSubmitting(true);
    try {
      await fetch("/api/user/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          referral_source: referralSource,
          primary_purpose: primaryPurpose,
          birth_date: birthDate,
          gender,
          preferred_tag_ids: selectedTagIds,
        }),
      });
      setShow(false);
    } finally {
      setSubmitting(false);
    }
  };

  if (!show) return null;

  const STEP_TITLES: Record<Step, string> = {
    1: "OMG를 어떻게 알게 됐나요?",
    2: "주로 무엇을 하실 건가요?",
    3: "기본 정보를 알려주세요",
    4: "좋아하는 장르를 골라주세요",
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-2xl bg-[var(--color-bg-surface)] p-8 ring-1 ring-[var(--color-border)]">

        {/* 진행 바 */}
        <div className="mb-6 flex gap-1.5">
          {([1, 2, 3, 4] as Step[]).map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                s <= step ? "bg-[var(--color-accent)]" : "bg-[var(--color-bg-hover)]"
              }`}
            />
          ))}
        </div>

        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
          {step} / 4
        </p>
        <h2 className="mb-6 text-xl font-bold text-[var(--color-text-primary)]">
          {STEP_TITLES[step]}
        </h2>

        {/* Step 1 — 유입 경로 */}
        {step === 1 && (
          <div className="flex flex-col gap-3">
            {REFERRAL_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setReferralSource(opt.value)}
                className={`rounded-xl px-5 py-3.5 text-left text-sm font-medium transition ring-1 ${
                  referralSource === opt.value
                    ? "bg-[var(--color-accent-subtle)] text-[var(--color-accent)] ring-[var(--color-accent)]"
                    : "text-[var(--color-text-primary)] ring-[var(--color-border)] hover:ring-[var(--color-accent)]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {/* Step 2 — 주요 목적 */}
        {step === 2 && (
          <div className="flex flex-col gap-3">
            {PURPOSE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPrimaryPurpose(opt.value)}
                className={`rounded-xl px-5 py-3.5 text-left text-sm font-medium transition ring-1 ${
                  primaryPurpose === opt.value
                    ? "bg-[var(--color-accent-subtle)] text-[var(--color-accent)] ring-[var(--color-accent)]"
                    : "text-[var(--color-text-primary)] ring-[var(--color-border)] hover:ring-[var(--color-accent)]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {/* Step 3 — 생년월일 + 성별 */}
        {step === 3 && (
          <div className="flex flex-col gap-5">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--color-text-secondary)]">
                생년월일
              </label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                min="1900-01-01"
                className="w-full rounded-xl bg-[var(--color-bg-base)] px-4 py-3 text-sm text-[var(--color-text-primary)] ring-1 ring-[var(--color-border)] focus:outline-none focus:ring-[var(--color-accent)]"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--color-text-secondary)]">
                성별
              </label>
              <div className="grid grid-cols-2 gap-2">
                {GENDER_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setGender(opt.value)}
                    className={`rounded-xl px-4 py-2.5 text-sm font-medium transition ring-1 ${
                      gender === opt.value
                        ? "bg-[var(--color-accent-subtle)] text-[var(--color-accent)] ring-[var(--color-accent)]"
                        : "text-[var(--color-text-primary)] ring-[var(--color-border)] hover:ring-[var(--color-accent)]"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 4 — 취향 태그 */}
        {step === 4 && (
          <div className="max-h-64 overflow-y-auto">
            <TagSelector
              selectedTagIds={selectedTagIds}
              onChange={setSelectedTagIds}
            />
          </div>
        )}

        {/* 버튼 */}
        <div className="mt-8 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((prev) => (prev - 1) as Step)}
              className="text-sm text-[var(--color-text-muted)] transition hover:text-[var(--color-text-primary)]"
            >
              이전
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={handleNext}
            disabled={!canNext() || submitting}
            className="rounded-xl bg-[var(--color-accent)] px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
          >
            {step === 4 ? (submitting ? "저장 중…" : "시작하기") : "다음"}
          </button>
        </div>
      </div>
    </div>
  );
}
