import { createClient } from "@/utils/supabase/server";
import { requireAuth } from "@/utils/api/auth";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  try {
    const { data: playlist, error } = await supabase
      .from("playlists")
      .select("id, title, description, is_public, user_id, created_at")
      .eq("id", id)
      .single();

    if (error || !playlist) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // non-owner can only view public playlists
    if (!playlist.is_public && playlist.user_id !== user?.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: tracks } = await supabase
      .from("playlist_tracks")
      .select("position, added_at, tracks ( id, title, artist, file_path, play_count, like_count, artist_tier )")
      .eq("playlist_id", id)
      .order("position", { ascending: true });

    return NextResponse.json({ playlist, tracks: tracks ?? [] });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { user, supabase } = auth;

  const body = await req.json() as { title?: string; description?: string; is_public?: boolean };

  const updates: Record<string, unknown> = {};
  if (body.title !== undefined) updates.title = body.title.trim();
  if (body.description !== undefined) updates.description = body.description;
  if (body.is_public !== undefined) updates.is_public = body.is_public;

  const { error } = await supabase
    .from("playlists")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { user, supabase } = auth;

  const { error } = await supabase
    .from("playlists")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
