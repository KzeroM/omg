import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { createClient } from "@/utils/supabase/server";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `당신은 음악 태그 분류 전문가입니다.
트랙 제목과 아티스트 이름을 보고, 주어진 태그 목록에서 이 곡과 가장 잘 어울리는 태그를 선택합니다.

규칙:
- 반드시 주어진 태그 목록의 ID만 사용할 것
- 3~5개 선택 (많으면 정확도가 떨어짐)
- 장르, 분위기, 악기 카테고리 위주로 선택
- 반드시 JSON 배열만 반환: ["id1", "id2", "id3"]
- 설명이나 다른 텍스트 없이 JSON만 반환`;

export async function POST(req: Request) {
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ tagIds: [] }, { status: 200 });
  }

  const body = await req.json() as { title?: string; artist?: string };
  const title = (body.title ?? "").trim();
  const artist = (body.artist ?? "").trim();

  if (!title && !artist) {
    return NextResponse.json({ tagIds: [] });
  }

  const supabase = await createClient();
  const { data: tags } = await supabase
    .from("tags")
    .select("id, name, category")
    .order("name");

  if (!tags || tags.length === 0) {
    return NextResponse.json({ tagIds: [] });
  }

  const tagList = tags.map((t) => `{"id":"${t.id}","name":"${t.name}","category":"${t.category}"}`).join(",");

  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      max_tokens: 100,
      temperature: 0.3,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `제목: ${title || "알 수 없음"}\n아티스트: ${artist || "알 수 없음"}\n\n사용 가능한 태그:\n[${tagList}]`,
        },
      ],
    });

    const text = response.choices[0]?.message?.content?.trim() ?? "[]";
    const match = text.match(/\[[\s\S]*?\]/);
    if (!match) return NextResponse.json({ tagIds: [] });

    const suggested = JSON.parse(match[0]) as string[];
    const validIds = new Set(tags.map((t) => t.id as string));
    const tagIds = suggested.filter((id) => validIds.has(id)).slice(0, 5);

    return NextResponse.json({ tagIds });
  } catch {
    return NextResponse.json({ tagIds: [] });
  }
}
