"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";

interface FeaturedArtist {
  id: string;
  artist_name: string;
  display_order: number;
  created_at: string;
}

interface DbArtist {
  artist: string;
}

export default function FeaturedArtistsPage() {
  const [featured, setFeatured] = useState<FeaturedArtist[]>([]);
  const [allArtists, setAllArtists] = useState<string[]>([]);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFeatured = async () => {
    const res = await fetch("/api/admin/featured");
    const data = await res.json() as { featured: FeaturedArtist[] };
    setFeatured(data.featured ?? []);
    setLoading(false);
  };

  const fetchArtists = async () => {
    const res = await fetch("/api/admin/artists-list");
    if (res.ok) {
      const data = await res.json() as { artists: DbArtist[] };
      setAllArtists((data.artists ?? []).map((a) => a.artist));
    }
  };

  useEffect(() => {
    void fetchFeatured();
    void fetchArtists();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setSaving(true);
    setError(null);
    const res = await fetch("/api/admin/featured", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ artist_name: newName.trim(), display_order: featured.length }),
    });
    const data = await res.json() as { error?: string; featured?: FeaturedArtist };
    if (!res.ok) {
      setError(data.error ?? "추가에 실패했습니다.");
    } else {
      setNewName("");
      await fetchFeatured();
    }
    setSaving(false);
  };

  const handleRemove = async (id: string) => {
    const res = await fetch("/api/admin/featured", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) setFeatured((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">피처드 아티스트</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          HeroBanner에 표시할 아티스트를 수동으로 지정합니다. 비어 있으면 자동으로 인기 아티스트가 표시됩니다.
        </p>
      </div>

      {/* DB 스키마 안내 */}
      <div className="rounded-xl border border-dashed border-[var(--color-border)] p-4 text-xs text-[var(--color-text-muted)]">
        <p className="font-mono font-semibold mb-1">필요 DB 스키마 (최초 1회 실행)</p>
        <pre className="whitespace-pre-wrap">{`CREATE TABLE featured_artists (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  artist_name text NOT NULL UNIQUE,
  display_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);`}</pre>
      </div>

      {/* Add form */}
      <form onSubmit={(e) => void handleAdd(e)} className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            list="artists-list"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="아티스트 닉네임 입력"
            className="w-full rounded-xl bg-[var(--color-bg-surface)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] ring-1 ring-[var(--color-border)] focus:outline-none focus:ring-[var(--color-accent)]"
          />
          <datalist id="artists-list">
            {allArtists.map((name) => <option key={name} value={name} />)}
          </datalist>
        </div>
        <button
          type="submit"
          disabled={saving || !newName.trim()}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--color-accent)] px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" strokeWidth={2} />
          추가
        </button>
      </form>
      {error && <p className="text-sm text-red-400">{error}</p>}

      {/* Featured list */}
      {loading ? (
        <LoadingState />
      ) : featured.length === 0 ? (
        <EmptyState
          title="피처드 아티스트가 없습니다."
          description="아티스트를 추가하면 HeroBanner에 표시됩니다."
        />
      ) : (
        <ul className="space-y-2">
          {featured.map((f, i) => (
            <li
              key={f.id}
              className="flex items-center gap-3 rounded-xl bg-[var(--color-bg-surface)] px-4 py-3 ring-1 ring-[var(--color-border)]"
            >
              <GripVertical className="h-4 w-4 text-[var(--color-text-muted)] shrink-0" strokeWidth={1.5} />
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-accent-subtle)] text-xs font-bold text-[var(--color-accent)] shrink-0">
                {i + 1}
              </span>
              <span className="flex-1 text-sm font-medium text-[var(--color-text-primary)]">{f.artist_name}</span>
              <button
                type="button"
                onClick={() => void handleRemove(f.id)}
                className="rounded-lg p-1.5 text-[var(--color-text-muted)] transition hover:bg-red-500/10 hover:text-red-400"
                aria-label="제거"
              >
                <Trash2 className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
