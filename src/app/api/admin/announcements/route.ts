import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("users").select("is_admin").eq("user_id", user.id).single();
  return profile?.is_admin ? user : null;
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json() as { title: string; body: string; type?: string; expires_at?: string };
  const { error } = await getAdminClient().from("announcements").insert({
    title: body.title,
    body: body.body,
    type: body.type ?? "info",
    is_active: true,
    expires_at: body.expires_at ?? null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data, error } = await getAdminClient()
    .from("announcements")
    .select("id, title, body, type, is_active, created_at, expires_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ announcements: [] });
  return NextResponse.json({ announcements: data ?? [] });
}
