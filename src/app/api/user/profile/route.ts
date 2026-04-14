import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { checkRateLimit } from "@/utils/rateLimiter";
import { updateProfileInDB } from "@/utils/user";

export async function PUT(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit: 3회/분
  if (!checkRateLimit(`update-profile:${user.id}`, 3, 60_000)) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 }
    );
  }

  let bio: string | null = null;
  let socialLinks: object | null = null;

  try {
    const body = (await req.json()) as {
      bio?: string | null;
      social_links?: object | null;
    };
    bio = body.bio ?? null;
    socialLinks = body.social_links ?? null;
  } catch {
    return NextResponse.json(
      { error: "유효하지 않은 JSON" },
      { status: 400 }
    );
  }

  const result = await updateProfileInDB(user.id, bio, socialLinks, supabase);

  if (!result.ok) {
    const statusCode = result.error?.includes("검증") ? 400 : 500;
    return NextResponse.json({ error: result.error }, { status: statusCode });
  }

  return NextResponse.json({ ok: true });
}
