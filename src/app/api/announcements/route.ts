import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("announcements")
      .select("id, title, body, type")
      .eq("is_active", true)
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .order("created_at", { ascending: false })
      .limit(3);

    if (error) {
      // 테이블 미생성 시 빈 배열 반환
      return NextResponse.json({ announcements: [] });
    }

    return NextResponse.json({ announcements: data ?? [] });
  } catch {
    return NextResponse.json({ announcements: [] });
  }
}
