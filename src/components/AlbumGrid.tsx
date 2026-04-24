"use client";

import { useEffect, useState, useCallback } from "react";
import { AlbumCard } from "./AlbumCard";
import { getPublicAlbums } from "@/utils/supabase/albums";
import type { AlbumWithTracks } from "@/types/album";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";

export function AlbumGrid({ initialAlbums }: { initialAlbums?: AlbumWithTracks[] }) {
  const [albums, setAlbums] = useState<AlbumWithTracks[]>(initialAlbums ?? []);
  const [loading, setLoading] = useState(!initialAlbums);
  const [error, setError] = useState<string | null>(null);

  const fetchAlbums = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getPublicAlbums(20);
      setAlbums(data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch albums:", err);
      setError("앨범을 불러올 수 없습니다.");
      setAlbums([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialAlbums) return; // SSR 데이터 있으면 클라이언트 fetch 생략
    void fetchAlbums();
  }, [fetchAlbums, initialAlbums]);

  // 앨범이 없으면 섹션 자체를 렌더링하지 않음
  if (!loading && albums.length === 0) {
    return null;
  }

  return (
    <section
      id="albums"
      className="rounded-2xl bg-[var(--color-bg-surface)] p-6 ring-1 ring-[var(--color-border)]"
    >
      <div className="mb-6">
        <h2 className="text-lg font-bold text-[var(--color-text-primary)]">앨범 탐색</h2>
        <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">Albums</p>
      </div>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {albums.map((album) => (
            <AlbumCard key={album.id} album={album} />
          ))}
        </div>
      )}
    </section>
  );
}
