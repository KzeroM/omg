"use client";

import { useRef, useState } from "react";
import { X, Trash2, ChevronUp, ChevronDown, Play, Pause, GripVertical } from "lucide-react";
import { usePlayer } from "@/context/PlayerContext";

interface QueuePanelProps {
  onClose: () => void;
}

export function QueuePanel({ onClose }: QueuePanelProps) {
  const {
    newReleases,
    currentIndex,
    currentTrack,
    isPlaying,
    playTrack,
    removeFromQueue,
    clearQueue,
    moveInQueue,
  } = usePlayer();

  const dragSrcRef = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (i: number) => {
    dragSrcRef.current = i;
  };
  const handleDragOver = (e: React.DragEvent, i: number) => {
    e.preventDefault();
    setDragOverIndex(i);
  };
  const handleDrop = (e: React.DragEvent, i: number) => {
    e.preventDefault();
    if (dragSrcRef.current !== null && dragSrcRef.current !== i) {
      moveInQueue(dragSrcRef.current, i);
    }
    dragSrcRef.current = null;
    setDragOverIndex(null);
  };
  const handleDragEnd = () => {
    dragSrcRef.current = null;
    setDragOverIndex(null);
  };

  return (
    <>
      {/* 오버레이 — 모바일만 표시 */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
        onClick={onClose}
        aria-hidden
      />

      {/* 패널 */}
      <aside className="fixed right-0 top-0 z-50 flex h-full w-80 flex-col bg-[var(--color-bg-surface)] shadow-2xl ring-1 ring-[var(--color-border)]">
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-[var(--color-text-primary)]">재생 큐</h2>
            <p className="text-xs text-[var(--color-text-muted)]">{newReleases.length}곡</p>
          </div>
          <div className="flex items-center gap-2">
            {newReleases.length > 0 && (
              <button
                type="button"
                onClick={clearQueue}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-[var(--color-text-muted)] ring-1 ring-[var(--color-border)] transition hover:text-red-400 hover:ring-red-800"
                aria-label="큐 전체 비우기"
              >
                <Trash2 className="h-3.5 w-3.5" />
                전체 비우기
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-[var(--color-text-muted)] transition hover:text-[var(--color-text-primary)]"
              aria-label="닫기"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* 큐 목록 */}
        <div className="flex-1 overflow-y-auto pb-32 lg:pb-20">
          {newReleases.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
              <p className="text-[var(--color-text-muted)]">재생 큐가 비어 있습니다.</p>
              <p className="text-xs text-[var(--color-text-muted)]">곡을 추가하면 여기에 표시됩니다.</p>
            </div>
          ) : (
            <ul className="flex flex-col gap-0.5 p-3">
              {newReleases.map((track, i) => {
                const isCurrent = currentTrack?.id === track.id && i === currentIndex;
                return (
                  <li
                    key={`${track.id}-${i}`}
                    draggable
                    onDragStart={() => handleDragStart(i)}
                    onDragOver={(e) => handleDragOver(e, i)}
                    onDrop={(e) => handleDrop(e, i)}
                    onDragEnd={handleDragEnd}
                    className={`group flex items-center gap-2 rounded-xl px-2 py-2.5 transition ${
                      dragOverIndex === i
                        ? "bg-[var(--color-accent)]/20 ring-1 ring-[var(--color-accent)]/50"
                        : isCurrent
                        ? "bg-[var(--color-accent)]/10 ring-1 ring-[var(--color-accent)]/30"
                        : "hover:bg-[var(--color-bg-hover)]"
                    }`}
                  >
                    {/* 드래그 핸들 */}
                    <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 active:cursor-grabbing" strokeWidth={2} />
                    {/* 커버 / 재생 상태 */}
                    <button
                      type="button"
                      onClick={() => playTrack(i)}
                      className={`relative h-10 w-10 shrink-0 rounded-lg bg-gradient-to-br ${track.coverColor} flex items-center justify-center`}
                      aria-label={isCurrent && isPlaying ? "일시 정지" : "재생"}
                    >
                      {isCurrent && isPlaying ? (
                        <Pause className="h-4 w-4 text-white drop-shadow" strokeWidth={2} />
                      ) : isCurrent ? (
                        <Play className="ml-0.5 h-4 w-4 text-white drop-shadow" strokeWidth={2} />
                      ) : null}
                    </button>

                    {/* 곡 정보 */}
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-sm font-medium ${isCurrent ? "text-[var(--color-accent)]" : "text-[var(--color-text-primary)]"}`}>
                        {track.title ?? "제목 없음"}
                      </p>
                      <p className="truncate text-xs text-[var(--color-text-muted)]">
                        {track.artist ?? "Unknown Artist"}
                      </p>
                    </div>

                    {/* 조작 버튼 (hover 시 표시) */}
                    <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => moveInQueue(i, i - 1)}
                        disabled={i === 0}
                        className="rounded-md p-1 text-[var(--color-text-muted)] transition hover:text-[var(--color-text-primary)] disabled:opacity-30"
                        aria-label="위로 이동"
                      >
                        <ChevronUp className="h-4 w-4" strokeWidth={2} />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveInQueue(i, i + 1)}
                        disabled={i === newReleases.length - 1}
                        className="rounded-md p-1 text-[var(--color-text-muted)] transition hover:text-[var(--color-text-primary)] disabled:opacity-30"
                        aria-label="아래로 이동"
                      >
                        <ChevronDown className="h-4 w-4" strokeWidth={2} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeFromQueue(i)}
                        className="rounded-md p-1 text-[var(--color-text-muted)] transition hover:text-red-400"
                        aria-label="큐에서 제거"
                      >
                        <X className="h-4 w-4" strokeWidth={2} />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>
    </>
  );
}
