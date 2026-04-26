import type { ReactNode } from "react";
import { Play, Pause, Loader2 } from "lucide-react";

interface TrackRowProps {
  coverColor: string;
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
  /** 커버에 재생/일시정지 아이콘 표시 여부 */
  showPlayIcon?: boolean;
  className?: string;
}

export function TrackRow({
  coverColor,
  title,
  artist,
  subtitle,
  isActive = false,
  isPlaying = false,
  isLoading = false,
  leading,
  trailing,
  onClick,
  showPlayIcon = false,
  className = "",
}: TrackRowProps) {
  return (
    <li
      onClick={onClick}
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
        className={`relative h-12 w-12 shrink-0 rounded-lg bg-gradient-to-br ${coverColor}`}
      >
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
  );
}
