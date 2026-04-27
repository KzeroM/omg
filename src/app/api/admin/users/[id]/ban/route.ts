import { requireAdmin } from "@/utils/api/auth";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  const { user } = auth;

  const { id } = await params;

  // Prevent self-ban
  if (id === user.id) return NextResponse.json({ error: "Cannot ban yourself" }, { status: 400 });

  const { error } = await getAdminClient().auth.admin.updateUserById(id, { ban_duration: "876600h" }); // ~100 years
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
