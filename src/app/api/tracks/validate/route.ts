import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { validateAudioFileMeta } from "@/utils/audioValidation";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, message: "인증이 필요합니다." }, { status: 401 });
  }

  const body = await req.json() as { size: number; mimeType: string; magicBytes: number[] };
  const result = validateAudioFileMeta(body);

  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
