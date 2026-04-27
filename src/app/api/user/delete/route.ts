import { requireAuth } from "@/utils/api/auth";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function DELETE() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { user } = auth;

  try {
    // Admin 클라이언트로 사용자 완전 삭제 (auth.users CASCADE로 public.users도 삭제)
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { error } = await adminClient.auth.admin.deleteUser(user.id);
    if (error) {
      console.error("[DELETE /api/user/delete]", error);
      return NextResponse.json({ error: "계정 삭제에 실패했습니다." }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/user/delete] Exception:", err);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
