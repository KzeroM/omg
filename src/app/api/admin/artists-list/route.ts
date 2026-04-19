import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: profile } = await supabase.from("users").select("is_admin").eq("user_id", user.id).single();
  if (!profile?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { data } = await supabase
      .from("tracks")
      .select("artist")
      .order("artist");

    const unique = [...new Set((data ?? []).map((r) => r.artist).filter(Boolean))];
    return NextResponse.json({ artists: unique.map((a) => ({ artist: a })) });
  } catch {
    return NextResponse.json({ artists: [] });
  }
}
