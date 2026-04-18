import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `당신은 음악 취향 분석 전문가입니다.
사용자가 좋아요/재생한 곡들의 태그 데이터를 분석해서, 그 사람의 음악 취향을 친근하고 감성적인 한국어 1~2문장으로 묘사합니다.

규칙:
- "당신은 ~을 즐기는 청취자입니다" 형식으로 작성
- 최대한 구체적이고 개성 있게
- 150자 이내
- 태그가 없거나 부족하면 "아직 취향이 분석되지 않았습니다." 반환`;

export async function POST() {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY가 설정되지 않았습니다." },
        { status: 503 }
      );
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 최근 재생 트랙 ID 조회
    const { data: history } = await supabase
      .from("play_history")
      .select("track_id")
      .eq("user_id", user.id)
      .order("played_at", { ascending: false })
      .limit(50);

    // 좋아요한 트랙 ID 조회
    const { data: likes } = await supabase
      .from("track_likes")
      .select("track_id")
      .eq("user_id", user.id)
      .limit(50);

    const trackIds = [
      ...new Set([
        ...(history?.map((r) => r.track_id as string) ?? []),
        ...(likes?.map((r) => r.track_id as string) ?? []),
      ]),
    ];

    if (trackIds.length === 0) {
      return NextResponse.json({ description: "아직 취향이 분석되지 않았습니다." });
    }

    // 트랙들의 태그 집계
    const { data: trackTags } = await supabase
      .from("track_tags")
      .select("tag_id, tags(name, category)")
      .in("track_id", trackIds);

    if (!trackTags || trackTags.length === 0) {
      return NextResponse.json({ description: "아직 취향이 분석되지 않았습니다." });
    }

    // 태그 빈도 집계
    const tagFreq = new Map<string, { name: string; category: string; count: number }>();
    for (const row of trackTags) {
      const tag = row.tags as { name?: string; category?: string } | null;
      if (!tag?.name || !row.tag_id) continue;
      const key = row.tag_id as string;
      const existing = tagFreq.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        tagFreq.set(key, { name: tag.name, category: tag.category ?? "", count: 1 });
      }
    }

    // 상위 태그 추출 (최대 10개)
    const topTags = [...tagFreq.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const tagList = topTags
      .map((t) => `${t.name}(${t.category}, ${t.count}회)`)
      .join(", ");

    // Claude API 호출 (prompt caching 적용)
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        {
          role: "user",
          content: `이 사용자의 상위 음악 태그: ${tagList}\n\n취향을 1~2문장으로 묘사해주세요.`,
        },
      ],
    });

    const description =
      response.content[0]?.type === "text"
        ? response.content[0].text.trim()
        : "취향 분석에 실패했습니다.";

    return NextResponse.json({ description });
  } catch (err) {
    console.error("[POST /api/user/taste-description]", err);
    return NextResponse.json(
      { error: "취향 분석 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
