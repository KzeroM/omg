"use client";

import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTrackReactions, toggleReaction, REACTION_EMOJIS, type ReactionCount, type ReactionEmoji } from "@/utils/supabase/reactions";

interface EmojiReactionsProps {
  trackId: string;
  className?: string;
}

export function EmojiReactions({ trackId, className = "" }: EmojiReactionsProps) {
  const queryClient = useQueryClient();
  const queryKey = ["reactions", trackId];

  const { data: reactions } = useQuery<ReactionCount[]>({
    queryKey,
    queryFn: () => getTrackReactions(trackId),
    staleTime: 30_000,
  });

  const mutation = useMutation({
    mutationFn: (emoji: ReactionEmoji) => toggleReaction(trackId, emoji),
    onMutate: async (emoji) => {
      await queryClient.cancelQueries({ queryKey });
      const prev = queryClient.getQueryData<ReactionCount[]>(queryKey);
      queryClient.setQueryData<ReactionCount[]>(queryKey, (old) =>
        (old ?? REACTION_EMOJIS.map((e) => ({ emoji: e, count: 0, userReacted: false }))).map((r) =>
          r.emoji === emoji
            ? { ...r, count: r.userReacted ? r.count - 1 : r.count + 1, userReacted: !r.userReacted }
            : r
        )
      );
      return { prev };
    },
    onError: (_err, _emoji, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(queryKey, ctx.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  const handleToggle = useCallback((emoji: ReactionEmoji) => {
    mutation.mutate(emoji);
  }, [mutation]);

  const display = reactions ?? REACTION_EMOJIS.map((emoji) => ({ emoji, count: 0, userReacted: false }));

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {display.map(({ emoji, count, userReacted }) => (
        <button
          key={emoji}
          type="button"
          onClick={() => handleToggle(emoji as ReactionEmoji)}
          className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-sm transition ${
            userReacted
              ? "bg-[var(--color-accent-subtle)] ring-1 ring-[var(--color-accent)]/40 text-[var(--color-accent)]"
              : "bg-[var(--color-bg-elevated)] ring-1 ring-[var(--color-border)] text-[var(--color-text-secondary)] hover:ring-[var(--color-accent)]/40"
          }`}
          aria-label={`${emoji} 반응 ${userReacted ? "취소" : "추가"}`}
          aria-pressed={userReacted}
        >
          <span>{emoji}</span>
          {count > 0 && <span className="text-xs font-medium">{count}</span>}
        </button>
      ))}
    </div>
  );
}
