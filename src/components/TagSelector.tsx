"use client";

import { useEffect, useState } from "react";
import { getAllTagsByCategory } from "@/utils/supabase/tags";
import type { Tag, TagsByCategory, TagCategory } from "@/types/tag";

const CATEGORY_LABELS: Record<TagCategory, string> = {
  genre: "장르",
  mood: "무드",
  bpm: "템포",
  instrument: "악기/형태",
};

const CATEGORY_ORDER: TagCategory[] = ["genre", "mood", "bpm", "instrument"];

interface TagSelectorProps {
  selectedTagIds: string[];
  onChange: (tagIds: string[]) => void;
  disabled?: boolean;
}

export function TagSelector({ selectedTagIds, onChange, disabled = false }: TagSelectorProps) {
  const [tagsByCategory, setTagsByCategory] = useState<TagsByCategory | null>(null);

  useEffect(() => {
    getAllTagsByCategory().then(setTagsByCategory).catch(console.error);
  }, []);

  const toggle = (tag: Tag) => {
    if (disabled) return;
    const isSelected = selectedTagIds.includes(tag.id);
    if (isSelected) {
      onChange(selectedTagIds.filter((id) => id !== tag.id));
    } else {
      onChange([...selectedTagIds, tag.id]);
    }
  };

  if (!tagsByCategory) {
    return <p className="text-xs text-[var(--color-text-muted)]">태그 목록 불러오는 중…</p>;
  }

  return (
    <div className="space-y-3">
      {CATEGORY_ORDER.map((cat) => {
        const tags = tagsByCategory[cat];
        if (!tags.length) return null;
        return (
          <div key={cat}>
            <p className="mb-1.5 text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
              {CATEGORY_LABELS[cat]}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => {
                const selected = selectedTagIds.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggle(tag)}
                    disabled={disabled}
                    className={`rounded-full px-3 py-1 text-xs transition ${
                      selected
                        ? "bg-[var(--color-accent)] text-white"
                        : "bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)] hover:ring-[var(--color-accent)] hover:text-[var(--color-text-primary)]"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {tag.name}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
