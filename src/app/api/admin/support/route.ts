import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/utils/api/auth";
import { createClient as createAdminClient } from "@supabase/supabase-js";

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/** GET: 전체 문의 목록 (어드민용) */
export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const status = new URL(req.url).searchParams.get("status") ?? "all";
  const query = getAdminClient()
    .from("support_tickets")
    .select("id, category, subject, body, status, admin_reply, admin_replied_at, created_at, user_id, users!support_tickets_user_id_fkey(nickname, email)")
    .order("created_at", { ascending: false })
    .limit(200);

  if (status !== "all") query.eq("status", status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ tickets: [] });
  return NextResponse.json({ tickets: data ?? [] });
}

/** PATCH: 답변 등록 + 상태 변경 */
export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const body = await req.json() as { id?: string; status?: string; admin_reply?: string };
  if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.status) updates.status = body.status;
  if (body.admin_reply !== undefined) {
    updates.admin_reply = body.admin_reply;
    updates.admin_replied_at = new Date().toISOString();
    if (!body.status) updates.status = "resolved";
  }

  const { error } = await getAdminClient()
    .from("support_tickets")
    .update(updates)
    .eq("id", body.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
