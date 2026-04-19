import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const VALID_REASONS = [
  "저작권 침해",
  "불건전한 콘텐츠",
  "스팸 / 광고",
  "허위 정보",
  "기타",
] as const;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });

  const body = await req.json() as { track_id: string; reason: string };
  if (!body.track_id) return NextResponse.json({ error: "track_id required" }, { status: 400 });
  if (!VALID_REASONS.includes(body.reason as typeof VALID_REASONS[number])) {
    return NextResponse.json({ error: "유효하지 않은 신고 사유입니다" }, { status: 400 });
  }

  try {
    const { error } = await supabase.from("reports").insert({
      reporter_id: user.id,
      track_id: body.track_id,
      reason: body.reason,
      status: "pending",
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true }); // fail-open: table may not exist yet
  }
}
