"use client";

import { useEffect, useState, useCallback } from "react";
import { AlbumCard } from "./AlbumCard";
import { getPublicAlbums } from "@/utils/supabase/albums";
import type { AlbumWithTracks } from "@/types/album";

export function AlbumGrid() {
  const [albums, setAlbums] = useState<AlbumWithTracks[]>([]);
  const [loading, setLoading] = useState(true);
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
    void fetchAlbums();
  }, [fetchAlbums]);

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
        <div className="py-8 text-center">
          <p className="text-sm text-[var(--color-text-muted)]">로딩 중…</p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-dashed border-[var(--color-border)] py-8 text-center">
          <p className="text-sm text-[var(--color-text-muted)]">{error}</p>
        </div>
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
