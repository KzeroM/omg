import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/utils/api/auth";

const CATEGORY_OPTIONS = ["bug", "feature", "account", "other"] as const;

/** GET: 내 문의 목록 */
export async function GET() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { user, supabase } = auth;

  const { data, error } = await supabase
    .from("support_tickets")
    .select("id, category, subject, status, admin_reply, admin_replied_at, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tickets: data ?? [] });
}

/** POST: 문의 등록 */
export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { user, supabase } = auth;

  const body = await req.json() as { category?: string; subject?: string; body?: string };
  if (!CATEGORY_OPTIONS.includes(body.category as never)) {
    return NextResponse.json({ error: "유효하지 않은 카테고리입니다." }, { status: 400 });
  }
  if (!body.subject?.trim() || !body.body?.trim()) {
    return NextResponse.json({ error: "제목과 내용을 입력해주세요." }, { status: 400 });
  }
  if (body.subject.length > 100) {
    return NextResponse.json({ error: "제목은 100자 이하여야 합니다." }, { status: 400 });
  }
  if (body.body.length > 2000) {
    return NextResponse.json({ error: "내용은 2000자 이하여야 합니다." }, { status: 400 });
  }

  const { error } = await supabase.from("support_tickets").insert({
    user_id: user.id,
    category: body.category,
    subject: body.subject.trim(),
    body: body.body.trim(),
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
