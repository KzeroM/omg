import { requireAdmin } from "@/utils/api/auth";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const MUSIC_BUCKET = "omg-tracks";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  const { data: track } = await getAdminClient()
    .from("tracks")
    .select("file_path")
    .eq("id", id)
    .single();

  if (!track) return NextResponse.json({ error: "Track not found" }, { status: 404 });

  if (track.file_path) {
    await getAdminClient().storage.from(MUSIC_BUCKET).remove([track.file_path as string]);
  }

  const { error } = await getAdminClient().from("tracks").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
