"use client";

import Link from "next/link";
import { pickCoverColor } from "@/utils/coverColor";
import type { AlbumWithTracks } from "@/types/album";

interface AlbumCardProps {
  album: AlbumWithTracks;
  onClick?: () => void;
}

export function AlbumCard({ album, onClick }: AlbumCardProps) {
  const trackCount = album.tracks.length;

  return (
    <Link href={`/album/${album.id}`} onClick={onClick}>
      <div className="group cursor-pointer rounded-2xl overflow-hidden bg-[var(--color-bg-surface)] ring-1 ring-[var(--color-border)] transition hover:ring-[var(--color-accent)]/30 hover:shadow-lg">
        {/* 커버 영역 (정사각형) */}
        <div className="aspect-square overflow-hidden bg-gradient-to-br">
          {album.cover_type === "gradient" ? (
            <div
              className={`w-full h-full bg-gradient-to-br ${pickCoverColor(album.id)}`}
            />
          ) : (
            <img
              src={album.cover_image_path || ""}
              alt={album.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                // 이미지 로드 실패 시 그라디언트로 폴백
                const img = e.currentTarget;
                img.style.display = "none";
              }}
            />
          )}
        </div>

        {/* 정보 영역 */}
        <div className="p-4">
          <h3 className="font-semibold text-[var(--color-text-primary)] truncate">
            {album.title}
          </h3>
          <p className="text-sm text-[var(--color-text-secondary)] truncate mt-0.5">
            {trackCount} Tracks
          </p>
        </div>
      </div>
    </Link>
  );
}
