import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { id: playlistId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // verify ownership
  const { data: playlist } = await supabase
    .from("playlists")
    .select("user_id")
    .eq("id", playlistId)
    .single();
  if (!playlist || playlist.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json() as { track_id: string };
  if (!body.track_id) return NextResponse.json({ error: "track_id required" }, { status: 400 });

  // get current max position
  const { data: existing } = await supabase
    .from("playlist_tracks")
    .select("position")
    .eq("playlist_id", playlistId)
    .order("position", { ascending: false })
    .limit(1);

  const nextPosition = existing && existing.length > 0 ? (existing[0].position ?? 0) + 1 : 0;

  const { error } = await supabase.from("playlist_tracks").insert({
    playlist_id: playlistId,
    track_id: body.track_id,
    position: nextPosition,
  });

  if (error) {
    // unique constraint: track already in playlist
    if (error.code === "23505") return NextResponse.json({ error: "이미 추가된 곡입니다" }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { id: playlistId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: playlist } = await supabase
    .from("playlists")
    .select("user_id")
    .eq("id", playlistId)
    .single();
  if (!playlist || playlist.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json() as { track_id: string };
  if (!body.track_id) return NextResponse.json({ error: "track_id required" }, { status: 400 });

  const { error } = await supabase
    .from("playlist_tracks")
    .delete()
    .eq("playlist_id", playlistId)
    .eq("track_id", body.track_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
