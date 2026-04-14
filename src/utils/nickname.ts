import type { SupabaseClient } from "@supabase/supabase-js";

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

export function validateNickname(
  nickname: string
): { valid: boolean; error?: string } {
  if (!nickname || typeof nickname !== "string") {
    return { valid: false, error: "닉네임을 입력하세요." };
  }

  if (!NICKNAME_RE.test(nickname)) {
    return {
      valid: false,
      error: "닉네임은 2~30자, 영문/숫자/_/- 만 허용됩니다.",
    };
  }

  if (RESERVED.has(nickname.toLowerCase())) {
    return { valid: false, error: "사용할 수 없는 닉네임입니다." };
  }

  return { valid: true };
}

export async function updateNicknameInDB(
  userId: string,
  nickname: string,
  supabase: SupabaseClient
): Promise<{ ok: boolean; error?: string }> {
  // 클라이언트 검증
  const validation = validateNickname(nickname);
  if (!validation.valid) {
    return { ok: false, error: validation.error };
  }

  // DB 업데이트
  const { error } = await supabase
    .from("users")
    .update({ nickname })
    .eq("user_id", userId);

  if (error) {
    // unique violation
    if (error.code === "23505") {
      return { ok: false, error: "이미 사용 중인 닉네임입니다." };
    }
    // check constraint violation
    if (error.code === "23514") {
      return { ok: false, error: "유효하지 않은 닉네임입니다." };
    }
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
