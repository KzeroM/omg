import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** 빌드 시 env가 비어 있어도 모듈 로드되도록 placeholder 사용 (실제 요청은 런타임에 .env.local 적용) */
export const supabase: SupabaseClient =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : createClient(
        "https://placeholder.supabase.co",
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.placeholder"
      );

const MUSIC_BUCKET = "music";
const SIGNED_URL_EXPIRY_SEC = 3600; // 1시간

/**
 * Private music 버킷의 파일에 대해 1시간 유효한 임시 재생 URL을 반환합니다.
 */
export async function getSignedPlaybackUrl(filePath: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(MUSIC_BUCKET)
    .createSignedUrl(filePath, SIGNED_URL_EXPIRY_SEC);

  if (error) {
    console.error("getSignedPlaybackUrl error:", error);
    return null;
  }
  return data?.signedUrl ?? null;
}
