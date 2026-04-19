import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  try {
    const { data } = await supabase
      .from("track_comments")
      .select(`
        id, content, timestamp_sec, created_at,
        users ( nickname )
      `)
      .eq("track_id", id)
      .order("created_at", { ascending: true })
      .limit(100);

    return NextResponse.json({ comments: data ?? [] });
  } catch {
    return NextResponse.json({ comments: [] }); // fail-open
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });

  const body = await req.json() as { content: string; timestamp_sec?: number };
  const content = body.content?.trim();
  if (!content || content.length > 500) {
    return NextResponse.json({ error: "댓글 내용이 유효하지 않습니다 (1~500자)" }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from("track_comments")
      .insert({
        track_id: id,
        user_id: user.id,
        content,
        timestamp_sec: body.timestamp_sec ?? null,
      })
      .select(`id, content, timestamp_sec, created_at, users ( nickname )`)
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ comment: data });
  } catch {
    return NextResponse.json({ error: "댓글 저장에 실패했습니다" }, { status: 500 });
  }
}
