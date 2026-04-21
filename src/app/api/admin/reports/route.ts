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

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { data } = await getAdminClient()
      .from("reports")
      .select(`
        id, reason, status, created_at,
        track_id,
        tracks ( title, artist ),
        reporter:reporter_id ( email )
      `)
      .order("created_at", { ascending: false })
      .limit(100);
    return NextResponse.json({ reports: data ?? [] });
  } catch {
    return NextResponse.json({ reports: [] });
  }
}

/** PATCH: update report status — body: { id, status: "resolved"|"dismissed" } */
export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json() as { id: string; status: "resolved" | "dismissed" };
  if (!body.id || !["resolved", "dismissed"].includes(body.status)) {
    return NextResponse.json({ error: "id and valid status required" }, { status: 400 });
  }

  const { error } = await getAdminClient()
    .from("reports")
    .update({ status: body.status })
    .eq("id", body.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

/** DELETE: delete the reported track + resolve report */
export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json() as { report_id: string; track_id: string };
  if (!body.report_id || !body.track_id) {
    return NextResponse.json({ error: "report_id and track_id required" }, { status: 400 });
  }

  // Fetch track to get file_path for storage deletion
  const { data: track } = await getAdminClient()
    .from("tracks")
    .select("file_path")
    .eq("id", body.track_id)
    .single();

  if (track?.file_path) {
    await getAdminClient().storage.from("omg-tracks").remove([track.file_path]);
  }

  await getAdminClient().from("tracks").delete().eq("id", body.track_id);
  await getAdminClient().from("reports").update({ status: "resolved" }).eq("id", body.report_id);

  return NextResponse.json({ ok: true });
}
