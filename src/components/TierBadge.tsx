"use client";

import type { ArtistTier, TierBadgeProps } from "@/types/tier";

const tierColorsAndLabels: Record<ArtistTier, { color: string; label: string } | null> = {
  basic: null,
  silver: { color: "#C0C0C0", label: "Silver" },
  gold: { color: "#FFD700", label: "Gold" },
  diamond: { color: "#B9F2FF", label: "Diamond" },
};

export function TierBadge({ tier, size = "sm" }: TierBadgeProps) {
  const tierConfig = tierColorsAndLabels[tier];

  if (!tierConfig) {
    return null;
  }

  const { color, label } = tierConfig;
  const sizeClass = size === "sm" ? "text-[10px]" : "text-xs";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-semibold uppercase tracking-wide ${sizeClass}`}
      style={{
        borderColor: color,
        color: color,
      }}
      title={`${label} Tier`}
    >
      <span className="text-xs" aria-hidden>
        ✦
      </span>
      {label}
    </span>
  );
}
