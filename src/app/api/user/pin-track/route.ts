import { NextResponse } from "next/server";
import { requireAuth } from "@/utils/api/auth";

export async function PATCH(req: Request) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { user, supabase } = auth;

  const body = await req.json() as { track_id: string | null };
  const trackId = body.track_id ?? null;

  // Verify ownership if pinning a specific track
  if (trackId) {
    const { data: track } = await supabase
      .from("tracks")
      .select("user_id")
      .eq("id", trackId)
      .single();
    if (!track || track.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const { error } = await supabase
    .from("users")
    .update({ pinned_track_id: trackId })
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
