"use client";

import { useRef, useState } from "react";
import { Upload, X, Globe, Users, Lock, ImagePlus, Sparkles, Plus, Loader2 } from "lucide-react";
import { type TrackVisibility } from "@/utils/upload";
import { useTrackUpload } from "@/hooks/useTrackUpload";
import { TagSelector } from "./TagSelector";
import { Toast } from "./Toast";
import { AuthModal } from "./AuthModal";

const VISIBILITY_OPTIONS: { value: TrackVisibility; label: string; icon: React.ReactNode; desc: string }[] = [
  { value: "public",         label: "전체 공개",   icon: <Globe  className="h-3.5 w-3.5" />, desc: "누구나 들을 수 있습니다" },
  { value: "followers_only", label: "팔로워 공개", icon: <Users  className="h-3.5 w-3.5" />, desc: "팔로워만 들을 수 있습니다" },
  { value: "private",        label: "비공개",       icon: <Lock   className="h-3.5 w-3.5" />, desc: "나만 볼 수 있습니다" },
];

export function UploadButton({ onUploadSuccess, variant = "inline" }: { onUploadSuccess?: () => void | Promise<void>; variant?: "inline" | "fab" }) {
  const audioInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const {
    isLoggedIn, loading, profileNickname,
    pendingFile, trackTitle, setTrackTitle, artistName, setArtistName,
    visibility, setVisibility, uploadStep, uploadError,
    coverPreview,
    selectedTagIds, setSelectedTagIds, isSuggestingTags, suggestTags,
    handleAudioChange, handleCoverChange, clearCover, handleConfirm, cancelUpload,
  } = useTrackUpload({ onUploadSuccess, onToast: setToast });

  return (
    <>
      {/* 파일 input (hidden — button.onClick에서 ref.click()으로 활성화) */}
      <input
        ref={audioInputRef}
        type="file"
        accept=".mp3"
        className="hidden"
        onChange={handleAudioChange}
        disabled={loading}
        aria-hidden="true"
      />

      {variant === "fab" ? (
        <button
          type="button"
          onClick={() => isLoggedIn === false ? setShowAuthModal(true) : audioInputRef.current?.click()}
          disabled={loading}
          className="fixed bottom-32 right-4 z-45 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-accent)] text-white shadow-lg shadow-black/30 transition hover:bg-[var(--color-accent-hover)] disabled:opacity-60 lg:hidden"
          aria-label="곡 올리기"
        >
          {loading
            ? <Loader2 className="h-6 w-6 animate-spin" strokeWidth={2} />
            : <Plus className="h-6 w-6" strokeWidth={2} />
          }
        </button>
      ) : isLoggedIn === false ? (
        <button
          type="button"
          onClick={() => setShowAuthModal(true)}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-accent)] px-4 py-2.5 text-sm font-medium text-[var(--color-text-primary)] transition hover:bg-[var(--color-accent-hover)] disabled:opacity-60"
        >
          <Upload className="h-4 w-4" strokeWidth={2} />
          곡 올리기
        </button>
      ) : (
        <button
          type="button"
          onClick={() => audioInputRef.current?.click()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-accent)] px-4 py-2.5 text-sm font-medium text-[var(--color-text-primary)] transition hover:bg-[var(--color-accent-hover)] disabled:opacity-60"
        >
          <Upload className="h-4 w-4" strokeWidth={2} />
          {loading ? "업로드 중…" : "곡 올리기"}
        </button>
      )}

      {showAuthModal && (
        <AuthModal
          initialMode="login"
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => setShowAuthModal(false)}
        />
      )}

      {/* 곡 정보 입력 모달 — 모바일 bottom sheet, 데스크톱 중앙 */}
      {pendingFile && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/60 sm:items-center sm:p-4">
          <div className="w-full max-w-sm max-h-[85dvh] overflow-y-auto rounded-t-2xl bg-[var(--color-bg-surface)] p-6 ring-1 ring-[var(--color-border)] sm:rounded-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-[var(--color-text-primary)]">곡 정보 입력</h3>
              <button
                type="button"
                onClick={cancelUpload}
                disabled={uploadStep !== null}
                className="rounded-lg p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mb-4 truncate text-sm text-[var(--color-text-secondary)]">{pendingFile.name}</p>

            {/* 앨범 커버 */}
            <div className="mb-4 flex items-center gap-4">
              <label className="relative flex h-16 w-16 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl bg-[var(--color-bg-elevated)] ring-1 ring-[var(--color-border)] hover:ring-[var(--color-accent)]">
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 cursor-pointer opacity-0"
                  onChange={handleCoverChange}
                  disabled={uploadStep !== null}
                />
                {coverPreview ? (
                  <img src={coverPreview} alt="커버" className="h-full w-full object-cover" />
                ) : (
                  <ImagePlus className="h-6 w-6 text-[var(--color-text-muted)]" strokeWidth={1.5} />
                )}
              </label>
              <div className="min-w-0">
                <p className="text-xs font-medium text-[var(--color-text-primary)]">앨범 커버</p>
                <p className="text-xs text-[var(--color-text-muted)]">{coverPreview ? "이미지 선택됨" : "선택 사항 · 최대 5MB"}</p>
                {coverPreview && (
                  <button
                    type="button"
                    onClick={clearCover}
                    className="mt-1 text-xs text-red-400 hover:text-red-300"
                  >
                    제거
                  </button>
                )}
              </div>
            </div>

            <label className="mb-1 block text-xs text-[var(--color-text-muted)]">곡 제목</label>
            <input
              type="text"
              value={trackTitle}
              onChange={(e) => setTrackTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
              placeholder="곡 제목을 입력하세요"
              disabled={uploadStep !== null}
              className="mb-3 w-full rounded-xl bg-[var(--color-bg-elevated)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] outline-none ring-1 ring-[var(--color-border)] focus:ring-[var(--color-accent)] disabled:opacity-60 disabled:cursor-not-allowed"
            />

            <div className="mb-1 flex items-center justify-between">
              <label className="text-xs text-[var(--color-text-muted)]">아티스트명</label>
              {artistName === profileNickname && profileNickname && (
                <span className="text-xs text-[var(--color-accent)]">내 닉네임으로 자동 입력됨</span>
              )}
            </div>
            <input
              type="text"
              value={artistName}
              onChange={(e) => setArtistName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
              placeholder={profileNickname || "아티스트명을 입력하세요"}
              disabled={uploadStep !== null}
              className="mb-4 w-full rounded-xl bg-[var(--color-bg-elevated)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] outline-none ring-1 ring-[var(--color-border)] focus:ring-[var(--color-accent)] disabled:opacity-60 disabled:cursor-not-allowed"
            />

            <label className="mb-2 block text-xs text-[var(--color-text-muted)]">공개 범위</label>
            <div className="mb-4 flex gap-2">
              {VISIBILITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  disabled={uploadStep !== null}
                  onClick={() => setVisibility(opt.value)}
                  title={opt.desc}
                  className={`flex flex-1 flex-col items-center gap-1 rounded-xl py-2 text-xs font-medium transition ring-1 ${
                    visibility === opt.value
                      ? "bg-[var(--color-accent-subtle)] text-[var(--color-accent)] ring-[var(--color-accent)]/40"
                      : "bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)] ring-[var(--color-border)] hover:text-[var(--color-text-primary)]"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {opt.icon}
                  {opt.label}
                </button>
              ))}
            </div>

            {/* 태그 선택 */}
            <div className="mb-4">
              <div className="mb-2 flex items-center justify-between">
                <label className="text-xs text-[var(--color-text-muted)]">태그 (선택사항)</label>
                <button
                  type="button"
                  onClick={suggestTags}
                  disabled={uploadStep !== null || isSuggestingTags || (!trackTitle && !artistName)}
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-[var(--color-accent)] transition hover:bg-[var(--color-accent-subtle)] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isSuggestingTags ? (
                    <>
                      <div className="h-3 w-3 animate-spin rounded-full border border-[var(--color-accent)] border-t-transparent" />
                      분석 중…
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3 w-3" />
                      AI 태그 제안
                    </>
                  )}
                </button>
              </div>
              <TagSelector
                selectedTagIds={selectedTagIds}
                onChange={setSelectedTagIds}
                disabled={uploadStep !== null}
              />
            </div>

            {uploadError && (
              <p className="mb-3 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">
                {uploadError}
              </p>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={cancelUpload}
                disabled={uploadStep !== null}
                className="flex-1 rounded-xl bg-[var(--color-bg-elevated)] py-2.5 text-sm text-[var(--color-text-secondary)] transition hover:text-[var(--color-text-primary)] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                취소
              </button>
              {uploadStep === null ? (
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="flex-1 rounded-xl bg-[var(--color-accent)] py-2.5 text-sm font-medium text-[var(--color-text-primary)] transition hover:bg-[var(--color-accent-hover)]"
                >
                  업로드
                </button>
              ) : (
                <div className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--color-accent)] py-2.5 text-sm font-medium text-[var(--color-text-primary)]">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-text-primary)] border-t-transparent" />
                  {uploadStep === 'uploading' ? '업로드 중...' : '저장 중...'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </>
  );
}
