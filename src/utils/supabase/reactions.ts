"use client";

import { createClient } from "./client";

export const REACTION_EMOJIS = ["🔥", "😍", "🎵", "💯"] as const;
export type ReactionEmoji = typeof REACTION_EMOJIS[number];

export interface ReactionCount {
  emoji: ReactionEmoji;
  count: number;
  userReacted: boolean;
}

/** 트랙의 이모지 반응 집계 + 현재 사용자 반응 여부 */
export async function getTrackReactions(trackId: string): Promise<ReactionCount[]> {
  const supabase = createClient();

  const [{ data: counts }, { data: { user } }] = await Promise.all([
    supabase.from("track_reactions").select("emoji").eq("track_id", trackId),
    supabase.auth.getUser(),
  ]);

  let userReactions: string[] = [];
  if (user && counts) {
    const { data: mine } = await supabase
      .from("track_reactions")
      .select("emoji")
      .eq("track_id", trackId)
      .eq("user_id", user.id);
    userReactions = (mine ?? []).map((r) => r.emoji as string);
  }

  return REACTION_EMOJIS.map((emoji) => ({
    emoji,
    count: (counts ?? []).filter((r) => r.emoji === emoji).length,
    userReacted: userReactions.includes(emoji),
  }));
}

/** 이모지 반응 토글 (추가 or 삭제) */
export async function toggleReaction(trackId: string, emoji: ReactionEmoji): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("로그인이 필요합니다.");

  const { data: existing } = await supabase
    .from("track_reactions")
    .select("id")
    .eq("track_id", trackId)
    .eq("user_id", user.id)
    .eq("emoji", emoji)
    .maybeSingle();

  if (existing) {
    await supabase.from("track_reactions").delete().eq("id", existing.id);
  } else {
    await supabase.from("track_reactions").insert({ track_id: trackId, user_id: user.id, emoji });
  }
}
