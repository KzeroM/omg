"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BarChart2, Search, User } from "lucide-react";

const items = [
  { label: "홈", href: "/", icon: Home },
  { label: "차트", href: "/#chart", icon: BarChart2 },
  { label: "검색", href: "/search", icon: Search },
  { label: "마이페이지", href: "/my", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href.split("#")[0]) && href.split("#")[0] !== "/";
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-[var(--color-border)] bg-[var(--color-bg-base)]/95 backdrop-blur safe-area-pb lg:hidden">
      {items.map(({ label, href, icon: Icon }) => {
        const active = isActive(href);
        return (
          <Link
            key={label}
            href={href}
            className={`flex flex-col items-center gap-1 py-3 px-4 transition-colors ${
              active
                ? "text-[var(--color-accent)]"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            <Icon className="h-6 w-6" strokeWidth={active ? 2 : 1.5} />
            <span className="text-xs">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
