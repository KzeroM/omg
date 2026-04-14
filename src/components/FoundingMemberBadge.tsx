"use client";

export function FoundingMemberBadge() {
  return (
    <span
      className="animate-badge-shine inline-flex items-center gap-1 rounded-full border border-[#fbbf24] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#fbbf24]"
      title="Founding Member"
    >
      <span className="text-xs" aria-hidden>✦</span>
      Founding
    </span>
  );
}
