import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { createNotification } from "@/utils/notifications";
import { checkRateLimit } from "@/utils/rateLimiter";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ artistId: string }> }
) {
  try {
    const { artistId } = await params;

    if (!artistId) {
      return NextResponse.json(
        { error: "Artist ID is required" },
        { status: 400 }
      );
    }

    // Supabase 클라이언트 (서버 사이드)
    const supabase = await createClient();

    // 현재 사용자 확인
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!await checkRateLimit(`follow:${user.id}`, 20, 60)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    // toggle_follow RPC 호출
    // artistId는 users.user_id (UUID)로 매핑되어야 함
    const { data, error } = await supabase.rpc("toggle_follow", {
      p_artist_user_id: artistId,
    });

    if (error) {
      console.error("[POST /api/follow] RPC error:", error);
      return NextResponse.json(
        { error: error.message || "Follow operation failed" },
        { status: 500 }
      );
    }

    if (!data?.success) {
      return NextResponse.json(
        { error: data?.error || "Follow operation failed" },
        { status: 400 }
      );
    }

    // 팔로우 시 알림 생성 (언팔은 알림 없음)
    if (data.following) {
      void createNotification(supabase, artistId, "follow", { actor_id: user.id });
    }

    // 성공 응답
    return NextResponse.json({
      following: data.following,
      follower_count: data.follower_count,
    });
  } catch (err) {
    console.error("[POST /api/follow] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
