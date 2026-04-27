import { createClient } from "@/utils/supabase/server";
import { requireAuth } from "@/utils/api/auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ notifications: [], unread: 0 });

    const { data, error } = await supabase
      .from("notifications")
      .select("id, type, actor_id, track_id, message, is_read, created_at, users!actor_id(nickname)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) {
      // 테이블 미생성 시 빈 목록
      return NextResponse.json({ notifications: [], unread: 0 });
    }

    const notifications = (data ?? []).map((n) => ({
      id: n.id as string,
      type: n.type as string,
      actor_nickname: (n.users as { nickname?: string } | null)?.nickname ?? "누군가",
      track_id: n.track_id as string | null,
      message: n.message as string | null,
      is_read: n.is_read as boolean,
      created_at: n.created_at as string,
    }));

    const unread = notifications.filter((n) => !n.is_read).length;
    return NextResponse.json({ notifications, unread });
  } catch {
    return NextResponse.json({ notifications: [], unread: 0 });
  }
}

export async function PATCH() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { user, supabase } = auth;

  try {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true }); // fail-open
  }
}
