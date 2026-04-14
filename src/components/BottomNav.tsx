"use client";

import Link from "next/link";
import { Home, BarChart2, Users, User } from "lucide-react";

const items = [
  { label: "홈", href: "/", icon: Home },
  { label: "차트", href: "/#chart", icon: BarChart2 },
  { label: "그룹", href: "/#", icon: Users },
  { label: "내 보관함", href: "/library", icon: User },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-[var(--color-border)] bg-[var(--color-bg-base)]/95 backdrop-blur safe-area-pb lg:hidden">
      {items.map(({ label, href, icon: Icon }) => (
        <Link
          key={label}
          href={href}
          className="flex flex-col items-center gap-1 py-3 px-4 text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
        >
          <Icon className="h-6 w-6" strokeWidth={1.5} />
          <span className="text-xs">{label}</span>
        </Link>
      ))}
    </nav>
  );
}
