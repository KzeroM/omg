import { NextResponse } from "next/server";
import { requireAuth } from "@/utils/api/auth";

export async function PATCH(req: Request) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { user, supabase } = auth;

  const body = await req.json() as { trackIds: string[] };
  if (!Array.isArray(body.trackIds) || body.trackIds.length === 0) {
    return NextResponse.json({ error: "trackIds required" }, { status: 400 });
  }

  // Verify all tracks belong to this user
  const { data: tracks } = await supabase
    .from("tracks")
    .select("id")
    .in("id", body.trackIds)
    .eq("user_id", user.id);

  if (!tracks || tracks.length !== body.trackIds.length) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Batch update display_order
  await Promise.all(
    body.trackIds.map((id, index) =>
      supabase.from("tracks").update({ display_order: index + 1 }).eq("id", id).eq("user_id", user.id)
    )
  );

  return NextResponse.json({ ok: true });
}
