import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { checkRateLimit } from "@/utils/rateLimiter";

const NICKNAME_RE = /^[a-zA-Z0-9_-]{2,30}$/;
const RESERVED = new Set([
  "admin",
  "api",
  "system",
  "root",
  "support",
  "help",
  "info",
  "omg",
  "official",
  "moderator",
]);

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  if (!await checkRateLimit(`check-nick:${ip}`, 20, 60)) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 }
    );
  }

  const { nickname } = (await req.json()) as { nickname?: string };
  if (!nickname || !NICKNAME_RE.test(nickname)) {
    return NextResponse.json(
      { available: false, error: "Invalid format" },
      { status: 400 }
    );
  }
  if (RESERVED.has(nickname.toLowerCase())) {
    return NextResponse.json({ available: false, error: "Reserved nickname" });
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("users")
    .select("user_id")
    .ilike("nickname", nickname)
    .maybeSingle();

  return NextResponse.json({ available: data === null });
}
