"use client";

import type { ReactNode } from "react";
import { useState, useRef, useCallback } from "react";
import { Play, Pause, Loader2, Heart, ListPlus } from "lucide-react";
import { useLongPress } from "@/hooks/useLongPress";
import { TrackActionsSheet } from "./TrackActionsSheet";
import { toggleTrackLike, addToUserPlaylist } from "@/utils/supabase/tracks";

const SWIPE_THRESHOLD = 80;

interface TrackRowProps {
  coverColor: string;
  coverUrl?: string;
  title: string;
  artist?: string;
  /** 아티스트 행을 JSX로 커스터마이징 (Link, 배지 등). 제공 시 artist 텍스트 대신 사용 */
  subtitle?: ReactNode;
  isActive?: boolean;
  isPlaying?: boolean;
  isLoading?: boolean;
  /** 커버 앞 슬롯: 순위 배지, equalizer 등 */
  leading?: ReactNode;
  /** 커버 뒤 슬롯: 통계, 액션 버튼 등 */
  trailing?: ReactNode;
  /** 행 전체 클릭 (재생) */
  onClick?: () => void;
  /** 트랙 ID — 제공 시 모바일 롱프레스로 액션 바텀시트 열림, 스와이프로 좋아요/플리 추가 */
  trackId?: string;
  /** 커버에 재생/일시정지 아이콘 표시 여부 */
  showPlayIcon?: boolean;
  className?: string;
  /** 드래그앤드롭 정렬용 */
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent<HTMLLIElement>) => void;
  onDragOver?: (e: React.DragEvent<HTMLLIElement>) => void;
  onDrop?: (e: React.DragEvent<HTMLLIElement>) => void;
  onDragEnd?: (e: React.DragEvent<HTMLLIElement>) => void;
}

export function TrackRow({
  coverColor,
  coverUrl,
  title,
  artist,
  subtitle,
  isActive = false,
  isPlaying = false,
  isLoading = false,
  leading,
  trailing,
  onClick,
  trackId,
  showPlayIcon = false,
  className = "",
  draggable: isDraggable,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: TrackRowProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [swipeDelta, setSwipeDelta] = useState(0);
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);
  const swipeLockRef = useRef<"h" | "v" | null>(null);
  const justSwipedRef = useRef(false);

  const longPress = useLongPress(() => {
    if (trackId) setSheetOpen(true);
  });

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    swipeStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    swipeLockRef.current = null;
    longPress.onTouchStart(e);
  }, [longPress]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    longPress.onTouchMove();
    if (!swipeStartRef.current) return;
    const dx = e.touches[0].clientX - swipeStartRef.current.x;
    const dy = e.touches[0].clientY - swipeStartRef.current.y;
    if (!swipeLockRef.current) {
      if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return;
      swipeLockRef.current = Math.abs(dx) > Math.abs(dy) ? "h" : "v";
    }
    if (swipeLockRef.current !== "h") return;
    const clamped = Math.max(-SWIPE_THRESHOLD * 1.5, Math.min(SWIPE_THRESHOLD * 1.5, dx));
    setSwipeDelta(clamped);
  }, [longPress]);

  const handleTouchEnd = useCallback((_e: React.TouchEvent) => {
    longPress.onTouchEnd();
    const delta = swipeDelta;
    if (Math.abs(delta) >= SWIPE_THRESHOLD) justSwipedRef.current = true;
    setSwipeDelta(0);
    swipeStartRef.current = null;
    swipeLockRef.current = null;
    if (!trackId) return;
    if (delta >= SWIPE_THRESHOLD) void toggleTrackLike(trackId);
    else if (delta <= -SWIPE_THRESHOLD) void addToUserPlaylist(trackId);
  }, [longPress, swipeDelta, trackId]);

  const handleClick = useCallback(() => {
    if (justSwipedRef.current) { justSwipedRef.current = false; return; }
    onClick?.();
  }, [onClick]);

  const swipeHandlers = trackId ? {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  } : {};

  return (
    <>
    <li
      onClick={handleClick}
      {...swipeHandlers}
      draggable={isDraggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={`relative overflow-hidden flex items-center gap-4 rounded-xl px-4 py-3 transition ${
        onClick ? "cursor-pointer" : ""
      } ${isDraggable ? "cursor-grab active:cursor-grabbing" : ""} ${
        isActive
          ? "bg-white/10 ring-1 ring-[var(--color-accent)]/30"
          : "hover:bg-[var(--color-bg-hover)]"
      } ${className}`}
    >
      {/* 스와이프 힌트 */}
      {trackId && (
        <>
          <div className={`pointer-events-none absolute inset-y-0 right-0 flex w-16 items-center justify-center transition-opacity ${swipeDelta > 20 ? "opacity-100" : "opacity-0"}`}>
            <Heart className="h-5 w-5 text-pink-400" fill={swipeDelta >= SWIPE_THRESHOLD ? "currentColor" : "none"} />
          </div>
          <div className={`pointer-events-none absolute inset-y-0 left-0 flex w-16 items-center justify-center transition-opacity ${swipeDelta < -20 ? "opacity-100" : "opacity-0"}`}>
            <ListPlus className="h-5 w-5 text-blue-400" />
          </div>
        </>
      )}

      {/* 슬라이딩 콘텐츠 */}
      <div
        className="flex w-full items-center gap-4"
        style={{
          transform: `translateX(${swipeDelta}px)`,
          transition: swipeDelta !== 0 ? "none" : "transform 0.15s ease",
        }}
      >
        {leading}

        {/* 커버 아트 */}
        <div
          className={`relative h-12 w-12 shrink-0 overflow-hidden rounded-lg ${coverUrl ? "" : `bg-gradient-to-br ${coverColor}`}`}
        >
          {coverUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverUrl} alt="" className="h-full w-full object-cover" />
          )}
          {showPlayIcon && isActive && (
            <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/30">
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-white" strokeWidth={2} />
              ) : isPlaying ? (
                <Pause className="h-5 w-5 text-white" strokeWidth={2} />
              ) : (
                <Play className="ml-0.5 h-5 w-5 text-white" strokeWidth={2} />
              )}
            </div>
          )}
        </div>

        {/* 텍스트 */}
        <div className="min-w-0 flex-1">
          <p className={`truncate font-medium ${isActive ? "text-[var(--color-accent)]" : "text-[var(--color-text-primary)]"}`}>
            {title}
          </p>
          {subtitle ?? (artist && (
            <p className="truncate text-sm text-[var(--color-text-secondary)]">{artist}</p>
          ))}
        </div>

        {trailing != null && (
          <div className="flex shrink-0 items-center gap-2">
            {trailing}
          </div>
        )}
      </div>
    </li>
    {sheetOpen && trackId && (
      <TrackActionsSheet
        trackId={trackId}
        title={title}
        artist={artist}
        onPlay={onClick}
        onClose={() => setSheetOpen(false)}
      />
    )}
    </>
  );
}
