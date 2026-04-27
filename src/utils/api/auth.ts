import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;
export type AuthSuccess = { user: User; supabase: SupabaseServerClient };

/**
 * Requires a logged-in user. Returns { user, supabase } or a 401 NextResponse.
 * Usage: const auth = await requireAuth(); if (auth instanceof NextResponse) return auth;
 */
export async function requireAuth(): Promise<AuthSuccess | NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return { user, supabase };
}

/**
 * Requires a logged-in admin user. Returns { user, supabase } or a 403 NextResponse.
 * Usage: const auth = await requireAdmin(); if (auth instanceof NextResponse) return auth;
 */
export async function requireAdmin(): Promise<AuthSuccess | NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { data: profile } = await supabase
    .from("users")
    .select("is_admin")
    .eq("user_id", user.id)
    .single();
  if (!profile?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return { user, supabase };
}
