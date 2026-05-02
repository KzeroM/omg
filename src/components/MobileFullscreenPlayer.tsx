"use client";

import { useRef, useCallback } from "react";
import { ChevronDown, SkipBack, Play, Pause, SkipForward, Shuffle, Repeat, Loader2, ListMusic } from "lucide-react";
import { usePlayer, usePlayerTime } from "@/context/PlayerContext";
import { EmojiReactions } from "./EmojiReactions";

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

interface Props {
  onClose: () => void;
  onQueueOpen: () => void;
}

export function MobileFullscreenPlayer({ onClose, onQueueOpen }: Props) {
  const {
    currentIndex,
    currentTrack,
    isPlaying,
    isLoading,
    togglePlay,
    seek,
    prev,
    next,
    playTrack,
    shuffleEnabled,
    repeatMode,
    toggleShuffle,
    setRepeatMode,
  } = usePlayer();
  const { currentTime, duration } = usePlayerTime();

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

  const cycleRepeat = () => {
    const modes: Array<"none" | "all" | "one"> = ["none", "all", "one"];
    const nextMode = modes[(modes.indexOf(repeatMode) + 1) % modes.length];
    setRepeatMode(nextMode);
  };

  // Build a gradient from coverColor class (e.g. "from-purple-500 to-blue-600")
  const coverColor = current?.coverColor ?? "from-zinc-700 to-zinc-900";

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[var(--color-bg-base)] lg:hidden">
      {/* Background gradient blur */}
      <div
        className={`absolute inset-0 bg-gradient-to-b ${coverColor} opacity-20`}
        aria-hidden
      />

      {/* Header */}
      <div className="relative flex items-center justify-between px-5 pt-safe-top pb-2 pt-12">
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-2 text-[var(--color-text-secondary)]"
          aria-label="플레이어 닫기"
        >
          <ChevronDown className="h-6 w-6" strokeWidth={2} />
        </button>
        <p className="text-sm font-medium text-[var(--color-text-primary)]">지금 재생 중</p>
        <button
          type="button"
          onClick={() => { onClose(); onQueueOpen(); }}
          className="rounded-full p-2 text-[var(--color-text-secondary)]"
          aria-label="재생 큐"
        >
          <ListMusic className="h-5 w-5" strokeWidth={1.5} />
        </button>
      </div>

      {/* Album art */}
      <div className="relative flex flex-1 items-center justify-center px-10">
        <div
          className={`aspect-square w-full max-w-xs rounded-2xl bg-gradient-to-br shadow-2xl ${coverColor}`}
        />
      </div>

      {/* Track info + controls */}
      <div className="relative space-y-6 px-6 pb-12 pt-4">
        {/* Title & artist */}
        <div>
          <p className="truncate text-2xl font-bold text-[var(--color-text-primary)]">
            {current?.title ?? "곡을 선택하세요"}
          </p>
          <p className="mt-1 truncate text-base text-[var(--color-text-secondary)]">
            {current?.artist ?? "—"}
          </p>
          {current && (
            <EmojiReactions trackId={current.id} className="mt-3" />
          )}
        </div>

        {/* Seekbar */}
        <div className="space-y-1">
          <div
            ref={progressRef}
            role="slider"
            tabIndex={0}
            aria-valuenow={progressFraction}
            aria-valuemin={0}
            aria-valuemax={1}
            className="relative h-1.5 cursor-pointer rounded-full bg-zinc-700"
            onClick={handleSeek}
          >
            <div
              className="h-full rounded-full bg-[var(--color-accent)] transition-all"
              style={{ width: `${progressFraction * 100}%` }}
            />
            {/* Thumb */}
            <div
              className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-white shadow"
              style={{ left: `calc(${progressFraction * 100}% - 8px)` }}
            />
          </div>
          <div className="flex justify-between text-xs text-[var(--color-text-muted)]">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Transport controls */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={toggleShuffle}
            className={`rounded-full p-2 transition ${shuffleEnabled ? "text-[var(--color-accent)]" : "text-[var(--color-text-secondary)]"}`}
            aria-label={shuffleEnabled ? "셔플 끄기" : "셔플 켜기"}
          >
            <Shuffle className="h-6 w-6" strokeWidth={2} />
          </button>

          <button
            type="button"
            onClick={prev}
            className="rounded-full p-2 text-[var(--color-text-primary)]"
            aria-label="이전 곡"
          >
            <SkipBack className="h-8 w-8" strokeWidth={2} />
          </button>

          <button
            type="button"
            onClick={canPlay ? togglePlay : () => current != null && playTrack(currentIndex)}
            disabled={current == null || isLoading}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-accent)] text-white shadow-lg transition hover:bg-[var(--color-accent-hover)] disabled:opacity-50"
            aria-label={isLoading ? "로딩 중" : isPlaying ? "일시 정지" : "재생"}
          >
            {isLoading ? (
              <Loader2 className="h-7 w-7 animate-spin" strokeWidth={2} />
            ) : isPlaying ? (
              <Pause className="h-7 w-7" strokeWidth={2} />
            ) : (
              <Play className="ml-1 h-7 w-7" strokeWidth={2} />
            )}
          </button>

          <button
            type="button"
            onClick={next}
            className="rounded-full p-2 text-[var(--color-text-primary)]"
            aria-label="다음 곡"
          >
            <SkipForward className="h-8 w-8" strokeWidth={2} />
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={cycleRepeat}
              className={`rounded-full p-2 transition ${repeatMode !== "none" ? "text-[var(--color-accent)]" : "text-[var(--color-text-secondary)]"}`}
              aria-label={`반복: ${repeatMode}`}
            >
              <Repeat className="h-6 w-6" strokeWidth={2} />
            </button>
            {repeatMode === "one" && (
              <span className="absolute bottom-1.5 right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[var(--color-accent)] text-[10px] font-bold text-white">
                1
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
