import type { SupabaseClient } from "@supabase/supabase-js";
import type { SocialLinks } from "@/types/user";

/**
 * bio 클라이언트 검증 (UI)
 * - 최대 300자
 * - 앞뒤 공백 제거 후 체크
 */
export function validateBio(bio: string): {
  valid: boolean;
  error?: string;
} {
  const trimmed = bio.trim();
  if (trimmed.length > 300) {
    return {
      valid: false,
      error: "자기소개는 300자 이하여야 합니다.",
    };
  }
  return { valid: true };
}

/**
 * social_links 클라이언트 검증 (UI)
 * - 각 URL이 https:// 또는 http://로 시작
 * - 공백만 있으면 undefined 처리
 */
export function validateSocialLinks(links: Record<string, any>): {
  valid: boolean;
  errors?: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  const platforms = ["instagram", "twitter", "youtube", "soundcloud"];
  for (const platform of platforms) {
    const url = links[platform];
    if (!url) continue;

    const trimmed = (url as string).trim();
    if (!trimmed) continue;

    if (!trimmed.startsWith("https://") && !trimmed.startsWith("http://")) {
      errors[platform] = "https://로 시작하는 URL을 입력해주세요.";
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors: Object.keys(errors).length > 0 ? errors : undefined,
  };
}

/**
 * 프로필 DB 업데이트 (서버 함수, API 라우트에서만 호출)
 * - bio 검증 + 길이 체크
 * - social_links 검증 + URL 형식 체크
 * - 공백 필드 제거
 * - DB 업데이트
 */
export async function updateProfileInDB(
  userId: string,
  bio: string | null | undefined,
  socialLinks: Record<string, any> | null | undefined,
  supabase: SupabaseClient
): Promise<{ ok: boolean; error?: string }> {
  try {
    // bio 정제 및 검증
    let finalBio: string | null = null;
    if (bio) {
      finalBio = bio.trim();
      if (finalBio.length > 300) {
        return { ok: false, error: "검증 실패: bio 길이 초과" };
      }
    }

    // social_links 정제 및 검증
    let finalLinks: Record<string, string> | null = null;
    if (socialLinks && typeof socialLinks === "object") {
      finalLinks = {};
      const platforms = ["instagram", "twitter", "youtube", "soundcloud"];

      for (const platform of platforms) {
        const url = socialLinks[platform];
        if (!url) continue;

        const trimmed = (url as string).trim();
        if (!trimmed) continue;

        if (!trimmed.startsWith("https://") && !trimmed.startsWith("http://")) {
          return {
            ok: false,
            error: `검증 실패: ${platform} URL 형식 오류`,
          };
        }

        finalLinks[platform] = trimmed;
      }

      // 모든 필드가 공백이면 null로 처리
      if (Object.keys(finalLinks).length === 0) {
        finalLinks = null;
      }
    }

    // Supabase 업데이트
    const { error } = await supabase
      .from("users")
      .update({
        bio: finalBio,
        social_links: finalLinks,
      })
      .eq("user_id", userId);

    if (error) {
      console.error("[updateProfileInDB] Supabase error:", error);
      return { ok: false, error: "프로필 업데이트 실패" };
    }

    return { ok: true };
  } catch (err) {
    console.error("[updateProfileInDB] Exception:", err);
    return { ok: false, error: "서버 오류 발생" };
  }
}

/**
 * 사용자 프로필 조회 (클라이언트)
 * - 현재 인증된 사용자의 프로필 정보 반환
 */
export async function fetchUserProfile(
  supabase: SupabaseClient
): Promise<{
  bio?: string | null;
  social_links?: Record<string, string> | null;
} | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("users")
    .select("bio, social_links")
    .eq("user_id", user.id)
    .single();

  if (error || !data) {
    console.error("[fetchUserProfile] Error:", error);
    return null;
  }

  return {
    bio: data.bio,
    social_links: data.social_links,
  };
}

/**
 * 아티스트 프로필 조회 (클라이언트)
 * - nickname 또는 user_id로 아티스트 프로필 조회
 */
export async function fetchArtistProfile(
  supabase: SupabaseClient,
  userIdOrNickname: string
): Promise<{
  bio?: string | null;
  social_links?: Record<string, string> | null;
} | null> {
  // user_id (UUID) 형식이면 직접 조회
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    userIdOrNickname
  );

  let userId: string | null = null;

  if (isUUID) {
    userId = userIdOrNickname;
  } else {
    // nickname으로 조회
    const { data } = await supabase
      .from("users")
      .select("user_id")
      .ilike("nickname", userIdOrNickname)
      .maybeSingle();

    if (data) {
      userId = data.user_id;
    }
  }

  if (!userId) return null;

  const { data } = await supabase
    .from("users")
    .select("bio, social_links")
    .eq("user_id", userId)
    .maybeSingle();

  return {
    bio: data?.bio,
    social_links: data?.social_links,
  };
}
