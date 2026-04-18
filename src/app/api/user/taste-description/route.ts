import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `당신은 음악 취향 분석 전문가입니다.
사용자가 좋아요/재생한 곡들의 태그 데이터를 분석해서, 그 사람의 음악 취향을 친근하고 감성적인 한국어 1~2문장으로 묘사합니다.

규칙:
- "당신은 ~을 즐기는 청취자입니다" 형식으로 작성
- 최대한 구체적이고 개성 있게
- 150자 이내
- 태그가 없거나 부족하면 "아직 취향이 분석되지 않았습니다." 반환`;

export async function POST() {
  try {
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: "GROQ_API_KEY가 설정되지 않았습니다." },
        { status: 503 }
      );
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 최근 재생 + 좋아요 트랙 ID 조회
    const [{ data: history }, { data: likes }] = await Promise.all([
      supabase.from("play_history").select("track_id").eq("user_id", user.id).order("played_at", { ascending: false }).limit(50),
      supabase.from("track_likes").select("track_id").eq("user_id", user.id).limit(50),
    ]);

    const trackIds = [
      ...new Set([
        ...(history?.map((r) => r.track_id as string) ?? []),
        ...(likes?.map((r) => r.track_id as string) ?? []),
      ]),
    ];

    if (trackIds.length === 0) {
      return NextResponse.json({ description: "아직 취향이 분석되지 않았습니다." });
    }

    // 태그 빈도 집계
    const { data: trackTags } = await supabase
      .from("track_tags")
      .select("tag_id, tags(name, category)")
      .in("track_id", trackIds);

    if (!trackTags || trackTags.length === 0) {
      return NextResponse.json({ description: "아직 취향이 분석되지 않았습니다." });
    }

    const tagFreq = new Map<string, { name: string; category: string; count: number }>();
    for (const row of trackTags) {
      const tag = row.tags as { name?: string; category?: string } | null;
      if (!tag?.name || !row.tag_id) continue;
      const key = row.tag_id as string;
      const existing = tagFreq.get(key);
      if (existing) existing.count += 1;
      else tagFreq.set(key, { name: tag.name, category: tag.category ?? "", count: 1 });
    }

    const topTags = [...tagFreq.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map((t) => `${t.name}(${t.category}, ${t.count}회)`)
      .join(", ");

    // Groq API 호출 (llama-3.1-8b-instant — 빠르고 저렴)
    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      max_tokens: 200,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `이 사용자의 상위 음악 태그: ${topTags}\n\n취향을 1~2문장으로 묘사해주세요.` },
      ],
    });

    const description = response.choices[0]?.message?.content?.trim() ?? "취향 분석에 실패했습니다.";
    return NextResponse.json({ description });
  } catch (err) {
    console.error("[POST /api/user/taste-description]", err);
    return NextResponse.json({ error: "취향 분석 중 오류가 발생했습니다." }, { status: 500 });
  }
}
