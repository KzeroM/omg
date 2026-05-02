import { NextResponse } from "next/server";
import { requireAuth } from "@/utils/api/auth";

export async function POST() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { user, supabase } = auth;

  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const { data: profile } = await supabase
    .from("users")
    .select("login_streak, last_login_at")
    .eq("user_id", user.id)
    .single();

  const lastDate = profile?.last_login_at
    ? new Date(profile.last_login_at as string).toISOString().slice(0, 10)
    : null;

  if (lastDate === today) {
    return NextResponse.json({ streak: profile?.login_streak ?? 0, updated: false });
  }

  const yesterday = new Date(Date.now() - 86400_000).toISOString().slice(0, 10);
  const currentStreak = (profile?.login_streak ?? 0) as number;
  const newStreak = lastDate === yesterday ? currentStreak + 1 : 1;

  await supabase
    .from("users")
    .update({ login_streak: newStreak, last_login_at: new Date().toISOString() })
    .eq("user_id", user.id);

  return NextResponse.json({ streak: newStreak, updated: true });
}
