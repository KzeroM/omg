import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/utils/api/auth";

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { user, supabase } = auth;

  let body: {
    referral_source: number;
    primary_purpose: number;
    birth_date: string;
    gender: number;
    preferred_tag_ids: string[];
  };

  try {
    body = await req.json() as typeof body;
  } catch {
    return NextResponse.json({ error: "유효하지 않은 JSON" }, { status: 400 });
  }

  const { referral_source, primary_purpose, birth_date, gender, preferred_tag_ids } = body;

  if (!referral_source || !primary_purpose || !birth_date || !gender) {
    return NextResponse.json({ error: "필수 항목 누락" }, { status: 400 });
  }

  const { error } = await supabase
    .from("users")
    .update({
      referral_source,
      primary_purpose,
      birth_date,
      gender,
      preferred_tag_ids: preferred_tag_ids ?? [],
    })
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
