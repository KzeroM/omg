"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { Play, Pause, Loader2 } from "lucide-react";
import { useLongPress } from "@/hooks/useLongPress";
import { TrackActionsSheet } from "./TrackActionsSheet";

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
  /** 트랙 ID — 제공 시 모바일 롱프레스로 액션 바텀시트 열림 */
  trackId?: string;
  /** 커버에 재생/일시정지 아이콘 표시 여부 */
  showPlayIcon?: boolean;
  className?: string;
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
}: TrackRowProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const longPress = useLongPress(() => {
    if (trackId) setSheetOpen(true);
  });

  return (
    <>
    <li
      onClick={onClick}
      {...(trackId ? longPress : {})}
      className={`flex items-center gap-4 rounded-xl px-4 py-3 transition ${
        onClick ? "cursor-pointer" : ""
      } ${
        isActive
          ? "bg-white/10 ring-1 ring-[var(--color-accent)]/30"
          : "hover:bg-[var(--color-bg-hover)]"
      } ${className}`}
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
