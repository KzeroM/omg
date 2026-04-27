import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/utils/api/auth";
import { validateAudioFileMeta } from "@/utils/audioValidation";

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return NextResponse.json({ ok: false, message: "인증이 필요합니다." }, { status: 401 });

  const body = await req.json() as { size: number; mimeType: string; magicBytes: number[] };
  const result = validateAudioFileMeta(body);

  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
