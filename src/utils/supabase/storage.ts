import { createClient } from "./client";

const MUSIC_BUCKET = "omg-tracks";
const SIGNED_URL_EXPIRY_SEC = 3600; // 1시간

/**
 * Private music 버킷의 파일에 대해 1시간 유효한 임시 재생 URL을 반환합니다.
 * 브라우저에서만 사용 가능합니다.
 */
export async function getSignedPlaybackUrl(filePath: string): Promise<string | null> {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(MUSIC_BUCKET)
    .createSignedUrl(filePath, SIGNED_URL_EXPIRY_SEC);

  if (error) {
    console.error("getSignedPlaybackUrl error:", error);
    return null;
  }
  return data?.signedUrl ?? null;
}
