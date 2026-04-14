"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Toast } from "./Toast";

/**
 * 이메일 인증 완료 후 리다이렉트 시 ?verified=1 이 있으면 성공 메시지를 띄웁니다.
 * Supabase 리다이렉트 URL을 https://yoursite.com/?verified=1 로 설정하면 됩니다.
 */
export function AuthVerifiedToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const verified = searchParams.get("verified");
    if (verified === "1") {
      setShow(true);
      const url = new URL(window.location.href);
      url.searchParams.delete("verified");
      router.replace(url.pathname + url.search, { scroll: false });
    }
  }, [searchParams, router]);

  if (!show) return null;

  return (
    <Toast
      message="인증이 완료되었습니다! 이제 로그인할 수 있습니다."
      onClose={() => setShow(false)}
      duration={5000}
    />
  );
}
