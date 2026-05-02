import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/utils/api/auth";

/** GET: 아티스트 포스트 목록
 *  ?userId=xxx  → 특정 아티스트의 포스트
 *  ?feed=1      → 팔로우 중인 아티스트들의 포스트 피드
 */
export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) {
    // 비로그인도 userId 쿼리는 허용 (퍼블릭 read)
    const userId = new URL(req.url).searchParams.get("userId");
    if (!userId) return NextResponse.json({ posts: [] });

    const { createClient } = await import("@/utils/supabase/server");
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("artist_posts")
      .select("id, content, created_at, user_id, users!artist_posts_user_id_fkey(nickname)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) return NextResponse.json({ posts: [] });
    return NextResponse.json({ posts: data ?? [] });
  }

  const { user, supabase } = auth;
  const params = new URL(req.url).searchParams;
  const userId = params.get("userId");
  const feed = params.get("feed");

  if (userId) {
    const { data, error } = await supabase
      .from("artist_posts")
      .select("id, content, created_at, user_id, users!artist_posts_user_id_fkey(nickname)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) return NextResponse.json({ posts: [] });
    return NextResponse.json({ posts: data ?? [] });
  }

  if (feed) {
    // 팔로우 중인 아티스트 목록 조회
    const { data: follows } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", user.id);

    const followingIds = (follows ?? []).map((f) => f.following_id as string);
    if (followingIds.length === 0) return NextResponse.json({ posts: [] });

    const { data, error } = await supabase
      .from("artist_posts")
      .select("id, content, created_at, user_id, users!artist_posts_user_id_fkey(nickname)")
      .in("user_id", followingIds)
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) return NextResponse.json({ posts: [] });
    return NextResponse.json({ posts: data ?? [] });
  }

  return NextResponse.json({ posts: [] });
}

/** POST: 포스트 작성 */
export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { user, supabase } = auth;

  const body = await req.json() as { content?: string };
  const content = body.content?.trim();
  if (!content) return NextResponse.json({ error: "내용을 입력해주세요." }, { status: 400 });
  if (content.length > 1000) return NextResponse.json({ error: "1000자 이하로 입력해주세요." }, { status: 400 });

  const { data, error } = await supabase
    .from("artist_posts")
    .insert({ user_id: user.id, content })
    .select("id, content, created_at, user_id, users!artist_posts_user_id_fkey(nickname)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ post: data });
}
