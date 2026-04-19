/** 공유 방법: "shared" = 네이티브 공유, "copied" = 클립보드 복사, "cancelled" = 사용자 취소 */
export type ShareResult = "shared" | "copied" | "cancelled";

export async function copyTrackUrl(
  artistName: string,
  trackId: string
): Promise<ShareResult> {
  const url = `${window.location.origin}/track/${trackId}`;

  // 모바일: 네이티브 공유 시트 사용
  if (typeof navigator.share === "function") {
    try {
      await navigator.share({
        title: artistName ? `${artistName} — OMG Music` : "OMG Music",
        url,
      });
      return "shared";
    } catch (err) {
      // 사용자가 공유 취소 시 AbortError 발생
      if (err instanceof Error && err.name === "AbortError") return "cancelled";
      // share API 실패 시 클립보드로 폴백
    }
  }

  // 데스크톱: 클립보드 복사
  await navigator.clipboard.writeText(url);
  return "copied";
}
