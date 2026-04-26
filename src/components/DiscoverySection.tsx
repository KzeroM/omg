"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import type { TagWithCount } from "@/types/tag";

// 카테고리별 그라디언트
const CATEGORY_GRADIENTS: Record<string, string> = {
  genre: "from-purple-600 to-indigo-600",
  mood: "from-pink-500 to-rose-500",
  tempo: "from-amber-500 to-orange-500",
  instrument: "from-teal-500 to-cyan-500",
  vocal: "from-sky-500 to-blue-600",
  era: "from-emerald-500 to-green-600",
};

const DEFAULT_GRADIENT = "from-zinc-600 to-zinc-800";

interface TagWithRep extends TagWithCount {
  rep_title?: string;
  rep_artist?: string;
}

export function DiscoverySection({ initialTags }: { initialTags?: TagWithCount[] }) {
  const [tags, setTags] = useState<TagWithRep[]>(initialTags ?? []);
  const [loading, setLoading] = useState(!initialTags);

  useEffect(() => {
    if (initialTags) {
      setTags(initialTags);
      return;
    }
    const supabase = createClient();
    void supabase
      .from("track_tags")
      .select("tag_id, tags(id, name, category), tracks!track_id(id, title, artist, play_count)")
      .limit(500)
      .then(({ data }) => {
        if (!data) { setLoading(false); return; }
        const countMap = new Map<string, TagWithRep>();
        const repMap = new Map<string, { title: string; artist: string; play_count: number }>();

        for (const row of data) {
          const tag = row.tags as { id?: string; name?: string; category?: string } | null;
          const track = row.tracks as { id?: string; title?: string; artist?: string; play_count?: number } | null;
          if (!tag?.id || !tag.name) continue;

          const existing = countMap.get(tag.id);
          if (existing) existing.track_count += 1;
          else countMap.set(tag.id, { id: tag.id, name: tag.name, category: tag.category ?? "", track_count: 1 });

          // 대표곡: play_count 가장 높은 트랙
          if (track?.title && track.artist) {
            const pc = track.play_count ?? 0;
            const cur = repMap.get(tag.id);
            if (!cur || pc > cur.play_count) {
              repMap.set(tag.id, { title: track.title, artist: track.artist, play_count: pc });
            }
          }
        }
        const sorted = [...countMap.values()]
          .sort((a, b) => b.track_count - a.track_count)
          .slice(0, 12)
          .map((t) => {
            const rep = repMap.get(t.id);
            return { ...t, rep_title: rep?.title, rep_artist: rep?.artist };
          });
        setTags(sorted);
        setLoading(false);
      });
  }, [initialTags]);

  if (loading || tags.length === 0) return null;

  return (
    <section>
      <h2 className="mb-4 text-lg font-bold text-[var(--color-text-primary)]">탐색</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {tags.map((tag) => {
          const gradient = CATEGORY_GRADIENTS[tag.category] ?? DEFAULT_GRADIENT;
          return (
            <Link
              key={tag.id}
              href={`/search?tags=${tag.id}`}
              className={`group relative flex h-24 flex-col justify-between overflow-hidden rounded-xl bg-gradient-to-br ${gradient} p-4 transition hover:scale-[1.02] active:scale-[0.98]`}
            >
              <div>
                <p className="text-sm font-semibold text-white">{tag.name}</p>
                <p className="mt-0.5 text-xs text-white/70">{tag.track_count}곡</p>
              </div>
              {tag.rep_title && (
                <p className="relative z-10 truncate text-[11px] text-white/80 leading-tight">
                  ♪ {tag.rep_title}
                  {tag.rep_artist ? ` — ${tag.rep_artist}` : ""}
                </p>
              )}
              {/* 장식 원 */}
              <div className="absolute -right-4 -bottom-4 h-20 w-20 rounded-full bg-white/10" />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
