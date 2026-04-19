import type { SupabaseClient } from "@supabase/supabase-js";

type NotificationType = "follow" | "like" | "new_track";

interface NotificationPayload {
  actor_id: string;
  track_id?: string;
  message?: string;
}

/**
 * 알림 생성 — notifications 테이블이 없으면 조용히 실패 (fail-open)
 * 테이블 스키마: id, user_id, type, actor_id, track_id, message, is_read, created_at
 */
export async function createNotification(
  supabase: SupabaseClient,
  recipientId: string,
  type: NotificationType,
  payload: NotificationPayload
): Promise<void> {
  try {
    await supabase.from("notifications").insert({
      user_id: recipientId,
      type,
      actor_id: payload.actor_id,
      track_id: payload.track_id ?? null,
      message: payload.message ?? null,
      is_read: false,
    });
  } catch {
    // 테이블 미생성 시 무시
  }
}
