import { requireAdmin } from "@/utils/api/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  const { supabase } = auth;

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
