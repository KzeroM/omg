"use client";

import { useRef, useCallback, useState } from "react";
import { SkipBack, Play, Pause, SkipForward, Volume2, Loader2, Shuffle, Repeat, ListMusic, ChevronUp } from "lucide-react";
import { usePlayer, usePlayerTime } from "@/context/PlayerContext";
import { QueuePanel } from "./QueuePanel";
import { MobileFullscreenPlayer } from "./MobileFullscreenPlayer";

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function PlayerBar() {
  const {
    newReleases,
    currentIndex,
    currentTrack,
    upNextTrack,
    isPlaying,
    isLoading,
    volume,
    togglePlay,
    seek,
    setVolume,
    prev,
    next,
    playTrack,
    shuffleEnabled,
    repeatMode,
    toggleShuffle,
    setRepeatMode,
    queueOpen,
    setQueueOpen,
  } = usePlayer();
  const { currentTime, duration } = usePlayerTime();

  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);
  const current = currentTrack;
  const canPlay = current?.blobUrl != null || current?.file_path != null;
  const progressFraction = duration > 0 ? currentTime / duration : 0;

  const handleSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!progressRef.current || !canPlay) return;
      const rect = progressRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const fraction = Math.max(0, Math.min(1, x / rect.width));
      seek(fraction);
    },
    [canPlay, seek]
  );

  return (
    <>
    <footer className="fixed bottom-14 left-0 right-0 z-50 border-t border-[var(--color-border)] bg-[var(--color-bg-base)]/95 backdrop-blur lg:bottom-0">
      {/* 모바일 seekbar — footer 상단 얇은 progress bar */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5 cursor-pointer bg-zinc-800 lg:hidden"
        onClick={handleSeek}
      >
        <div
          className="h-full bg-[var(--color-accent)] transition-all"
          style={{ width: `${progressFraction * 100}%` }}
        />
      </div>
      {/* 모바일: 간소화 (곡 제목 + 재생 버튼 위주), 터치하기 쉬운 높이 */}
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 lg:h-20 lg:gap-6 lg:px-6">
        {/* 곡 정보 */}
        <div className="flex min-w-0 flex-1 items-center gap-3 lg:gap-4">
          {/* 모바일: 탭하면 풀스크린 플레이어 열기 */}
          <button
            type="button"
            onClick={() => current != null && setFullscreenOpen(true)}
            className="flex min-w-0 flex-1 items-center gap-3 text-left lg:pointer-events-none"
            aria-label="플레이어 전체화면 열기"
          >
            <div
              className={`h-10 w-10 shrink-0 overflow-hidden rounded-lg lg:h-12 lg:w-12 ${current?.cover_url ? "" : `bg-gradient-to-br ${current?.coverColor ?? "from-[var(--color-border)] to-[var(--color-bg-surface)]"}`}`}
            >
              {current?.cover_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={current.cover_url} alt="" className="h-full w-full object-cover" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[var(--color-text-primary)] lg:text-base">
                {current?.title ?? "곡을 선택하세요"}
              </p>
              <p className="truncate text-xs text-[var(--color-text-secondary)] lg:text-sm">
                {current?.artist ?? ""}
              </p>
            </div>
            {current != null && (
              <ChevronUp className="h-4 w-4 shrink-0 text-[var(--color-text-muted)] lg:hidden" strokeWidth={2} />
            )}
          </button>
        </div>

        {/* 재생 컨트롤 - 데스크톱에서 더 넓게 */}
        <div className="flex flex-1 flex-col items-center gap-1 lg:gap-2">
          <div className="flex items-center gap-2 lg:gap-4">
            {/* Shuffle 버튼 */}
            <button
              type="button"
              onClick={toggleShuffle}
              className={`rounded-full p-2 transition ${shuffleEnabled ? "text-[var(--color-accent)]" : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"}`}
              style={{ transitionDuration: "150ms" }}
              aria-label={shuffleEnabled ? "셔플 비활성화" : "셔플 활성화"}
            >
              <Shuffle className="h-5 w-5 lg:h-5 lg:w-5" strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={prev}
              className="rounded-full p-2 text-[var(--color-text-secondary)] transition hover:text-[var(--color-text-primary)]"
              aria-label="이전 곡"
            >
              <SkipBack className="h-5 w-5 lg:h-5 lg:w-5" strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={canPlay ? togglePlay : () => current != null && playTrack(currentIndex)}
              disabled={current == null || isLoading}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-accent)] text-[var(--color-text-primary)] transition hover:bg-[var(--color-accent-hover)] disabled:opacity-50 lg:h-12 lg:w-12"
              aria-label={isLoading ? "로딩 중" : isPlaying ? "일시 정지" : "재생"}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin lg:h-6 lg:w-6" strokeWidth={2} />
              ) : isPlaying ? (
                <Pause className="h-5 w-5 lg:h-6 lg:w-6" strokeWidth={2} />
              ) : (
                <Play className="ml-0.5 h-5 w-5 lg:h-6 lg:w-6" strokeWidth={2} />
              )}
            </button>
            <button
              type="button"
              onClick={next}
              className="rounded-full p-2 text-[var(--color-text-secondary)] transition hover:text-[var(--color-text-primary)]"
              aria-label="다음 곡"
            >
              <SkipForward className="h-5 w-5 lg:h-5 lg:w-5" strokeWidth={2} />
            </button>
            {/* Repeat 버튼 */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  const modes: Array<'none' | 'all' | 'one'> = ['none', 'all', 'one'];
                  const currentModeIndex = modes.indexOf(repeatMode);
                  const nextMode = modes[(currentModeIndex + 1) % modes.length];
                  setRepeatMode(nextMode);
                }}
                className={`rounded-full p-2 transition ${repeatMode !== 'none' ? "text-[var(--color-accent)]" : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"}`}
                style={{ transitionDuration: "150ms" }}
                aria-label={
                  repeatMode === 'none'
                    ? "반복 모드: 반복 없음"
                    : repeatMode === 'all'
                      ? "반복 모드: 전체 반복"
                      : "반복 모드: 한곡 반복"
                }
              >
                <Repeat className="h-5 w-5 lg:h-5 lg:w-5" strokeWidth={2} />
              </button>
              {/* Repeat 'one' 모드 배지 */}
              {repeatMode === 'one' && (
                <span className="absolute bottom-1.5 right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[var(--color-accent)] text-[10px] font-bold text-[var(--color-text-primary)]">
                  1
                </span>
              )}
            </div>
          </div>
          {/* Seekbar - 데스크톱에서만 전체 표시, 모바일은 생략 또는 짧게 */}
          <div className="hidden w-full max-w-md items-center gap-2 text-xs text-[var(--color-text-muted)] lg:flex">
            <span className="w-8 shrink-0 text-right">{formatTime(currentTime)}</span>
            <div
              ref={progressRef}
              role="slider"
              tabIndex={0}
              aria-valuenow={progressFraction}
              aria-valuemin={0}
              aria-valuemax={1}
              className="relative h-1 flex-1 cursor-pointer rounded-full bg-zinc-700"
              onClick={handleSeek}
            >
              <div
                className="h-full rounded-full bg-[var(--color-accent)] transition-all"
                style={{ width: `${progressFraction * 100}%` }}
              />
            </div>
            <span className="w-8 shrink-0">{formatTime(duration)}</span>
          </div>
        </div>

        {/* 볼륨 + 큐 버튼 - 데스크톱만 */}
        <div className="hidden flex-1 items-center justify-end gap-3 lg:flex">
          <Volume2 className="h-5 w-5 shrink-0 text-[var(--color-text-secondary)]" strokeWidth={1.5} />
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="h-1.5 w-24 cursor-pointer appearance-none rounded-full bg-zinc-700 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--color-accent)]"
          />
          <button
            type="button"
            onClick={() => setQueueOpen(!queueOpen)}
            className={`rounded-full p-2 transition ${queueOpen ? "text-[var(--color-accent)]" : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"}`}
            aria-label="재생 큐 열기"
          >
            <ListMusic className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>

        {/* 큐 버튼 - 모바일만 */}
        <button
          type="button"
          onClick={() => setQueueOpen(!queueOpen)}
          className={`rounded-full p-2 transition lg:hidden ${queueOpen ? "text-[var(--color-accent)]" : "text-[var(--color-text-secondary)]"}`}
          aria-label="재생 큐 열기"
        >
          <ListMusic className="h-5 w-5" strokeWidth={1.5} />
        </button>

        {/* Up Next - 데스크톱만 */}
        <div className="hidden items-center gap-3 border-l border-[var(--color-border)] pl-6 lg:flex lg:w-48">
          {shuffleEnabled && !upNextTrack ? (
            <p className="text-xs text-[var(--color-text-muted)]">셔플 중…</p>
          ) : upNextTrack ? (
            <div className="min-w-0 flex-1">
              <p className="text-xs text-[var(--color-text-muted)]">Up Next</p>
              <p className="truncate text-sm text-[var(--color-text-secondary)]">{upNextTrack.title}</p>
              <p className="truncate text-xs text-[var(--color-text-muted)]">{upNextTrack.artist}</p>
            </div>
          ) : (
            <p className="text-sm text-[var(--color-text-muted)]">—</p>
          )}
        </div>
      </div>
    </footer>

    {queueOpen && <QueuePanel onClose={() => setQueueOpen(false)} />}
    {fullscreenOpen && (
      <MobileFullscreenPlayer
        onClose={() => setFullscreenOpen(false)}
        onQueueOpen={() => setQueueOpen(true)}
      />
    )}
    </>
  );
}
