import { createClient } from "@supabase/supabase-js";

// 서버리스 환경에서도 동작하는 Supabase 기반 Rate Limiter
// in-memory Map은 cold start 시 리셋되어 rate limit이 무효화됨
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function checkRateLimit(
  key: string,
  max = 5,
  windowSeconds = 60
): Promise<boolean> {
  const { data, error } = await getAdminClient().rpc("check_rate_limit", {
    p_key: key,
    p_max: max,
    p_window_seconds: windowSeconds,
  });
  if (error) {
    console.error("[RateLimit] Supabase RPC error:", error.message);
    return false; // 오류 시 차단 (fail-closed)
  }
  return data === true;
}
