import { requireAuth } from "@/utils/api/auth";
import { NextRequest, NextResponse } from "next/server";
import { createNotification } from "@/utils/notifications";
import { checkRateLimit } from "@/utils/rateLimiter";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ artistId: string }> }
) {
  const { artistId } = await params;
  if (!artistId) {
    return NextResponse.json({ error: "Artist ID is required" }, { status: 400 });
  }
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { user, supabase } = auth;

  try {
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
