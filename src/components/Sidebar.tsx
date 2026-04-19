"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BarChart2, Search, FolderOpen, Heart } from "lucide-react";

const menus = [
  { label: "홈", href: "/" },
  { label: "인기 차트", href: "/#chart" },
  { label: "검색", href: "/search" },
  { label: "내 보관함", href: "/library" },
  { label: "마이페이지", href: "/my" },
];

const icons: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  "홈": Home,
  "인기 차트": BarChart2,
  "검색": Search,
  "내 보관함": FolderOpen,
  "마이페이지": Heart,
};

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    const path = href.split("#")[0];
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  return (
    <aside className="hidden h-full w-56 flex-col border-r border-[var(--color-border)] bg-[var(--color-bg-base)] px-3 py-6 lg:flex">
      <div className="mb-8 text-xl font-bold tracking-tight text-[var(--color-text-primary)]">
        <span className="text-[var(--color-accent)]">OMG</span>
      </div>
      <nav className="flex flex-col gap-1">
        {menus.map(({ label, href }) => {
          const active = isActive(href);
          const Icon = icons[label];
          return (
            <Link
              key={label}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                active
                  ? "bg-[var(--color-accent-subtle)] text-[var(--color-accent)] font-medium"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]"
              }`}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2 : 1.5} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
