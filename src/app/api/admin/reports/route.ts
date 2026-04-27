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
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

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
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

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
