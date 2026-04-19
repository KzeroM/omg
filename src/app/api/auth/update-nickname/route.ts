import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { checkRateLimit } from "@/utils/rateLimiter";
import { updateNicknameInDB } from "@/utils/nickname";

export async function PUT(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!await checkRateLimit(`update-nick:${user.id}`, 3, 60)) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 }
    );
  }

  const { nickname } = (await req.json()) as { nickname?: string };

  const result = await updateNicknameInDB(user.id, nickname || "", supabase);
  if (!result.ok) {
    const statusCode = result.error?.includes("이미 사용")
      ? 409
      : result.error?.includes("유효하지")
        ? 400
        : 500;
    return NextResponse.json({ error: result.error }, { status: statusCode });
  }

  return NextResponse.json({ ok: true });
}
