"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import type { TagWithCount } from "@/utils/supabase/tags";

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

export function DiscoverySection({ initialTags }: { initialTags?: TagWithCount[] }) {
  const [tags, setTags] = useState<TagWithCount[]>(initialTags ?? []);
  const [loading, setLoading] = useState(!initialTags);

  useEffect(() => {
    if (initialTags) return; // SSR 데이터 있으면 클라이언트 fetch 생략
    const supabase = createClient();
    void supabase
      .from("track_tags")
      .select("tag_id, tags(id, name, category)")
      .then(({ data }) => {
        if (!data) { setLoading(false); return; }
        const countMap = new Map<string, TagWithCount>();
        for (const row of data) {
          const tag = row.tags as { id?: string; name?: string; category?: string } | null;
          if (!tag?.id || !tag.name) continue;
          const existing = countMap.get(tag.id);
          if (existing) existing.track_count += 1;
          else countMap.set(tag.id, { id: tag.id, name: tag.name, category: tag.category ?? "", track_count: 1 });
        }
        const sorted = [...countMap.values()]
          .sort((a, b) => b.track_count - a.track_count)
          .slice(0, 12);
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
              className={`group relative flex h-20 overflow-hidden rounded-xl bg-gradient-to-br ${gradient} p-4 transition hover:scale-[1.02] active:scale-[0.98]`}
            >
              <div>
                <p className="text-sm font-semibold text-white">{tag.name}</p>
                <p className="mt-0.5 text-xs text-white/70">{tag.track_count}곡</p>
              </div>
              {/* 장식 원 */}
              <div className="absolute -right-4 -bottom-4 h-20 w-20 rounded-full bg-white/10" />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
