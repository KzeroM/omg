import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ playlists: [] });

  try {
    const { data } = await supabase
      .from("playlists")
      .select("id, title, description, is_public, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    return NextResponse.json({ playlists: data ?? [] });
  } catch {
    return NextResponse.json({ playlists: [] });
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });

  const body = await req.json() as { title: string; description?: string; is_public?: boolean };
  const title = body.title?.trim();
  if (!title || title.length > 100) {
    return NextResponse.json({ error: "플레이리스트 이름이 유효하지 않습니다 (1~100자)" }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from("playlists")
      .insert({ user_id: user.id, title, description: body.description ?? null, is_public: body.is_public ?? false })
      .select("id, title, description, is_public, created_at")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ playlist: data });
  } catch {
    return NextResponse.json({ error: "플레이리스트 생성에 실패했습니다" }, { status: 500 });
  }
}
