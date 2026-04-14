export const COVER_COLORS = [
  "from-[#A855F7] to-[#6366f1]",
  "from-[#ec4899] to-[#A855F7]",
  "from-[#06b6d4] to-[#A855F7]",
  "from-[#f59e0b] to-[#ef4444]",
  "from-[#10b981] to-[#A855F7]",
  "from-[#6366f1] to-[#06b6d4]",
];

export function pickCoverColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return COVER_COLORS[hash % COVER_COLORS.length];
}
