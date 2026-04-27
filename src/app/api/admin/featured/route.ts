import { requireAdmin } from "@/utils/api/auth";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const { data } = await getAdminClient()
      .from("featured_artists")
      .select("id, artist_name, display_order, created_at")
      .order("display_order", { ascending: true });
    return NextResponse.json({ featured: data ?? [] });
  } catch {
    return NextResponse.json({ featured: [] });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const body = await req.json() as { artist_name: string; display_order?: number };
  if (!body.artist_name?.trim()) {
    return NextResponse.json({ error: "artist_name required" }, { status: 400 });
  }

  const { data, error } = await getAdminClient()
    .from("featured_artists")
    .insert({ artist_name: body.artist_name.trim(), display_order: body.display_order ?? 0 })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ featured: data });
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { id } = await req.json() as { id: string };
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { error } = await getAdminClient().from("featured_artists").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
