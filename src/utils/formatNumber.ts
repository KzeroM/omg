/**
 * 숫자를 한국식 단위로 포맷합니다.
 * - 10,000 미만: toLocaleString (예: 9,999)
 * - 10,000 이상: X만 또는 X.X만 (예: 12,340 → 1.2만, 150,000 → 15만)
 */
export function formatKoreanNumber(n: number): string {
  if (n < 10000) return n.toLocaleString("ko-KR");
  const man = n / 10000;
  const rounded = Math.round(man * 10) / 10;
  return `${rounded}만`;
}
