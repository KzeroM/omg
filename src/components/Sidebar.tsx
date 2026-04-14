"use client";

import Link from "next/link";
import { Home, BarChart2, Search, FolderOpen } from "lucide-react";

const menus = [
  { label: "홈", href: "/", icon: Home },
  { label: "인기 차트", href: "/#chart", icon: BarChart2 },
  { label: "그룹 찾기", href: "/#", icon: Search },
  { label: "내 보관함", href: "/library", icon: FolderOpen },
];

export function Sidebar() {
  return (
    <aside className="hidden h-full w-56 flex-col border-r border-[#1f1f1f] bg-[#0d0d0d] px-3 py-6 lg:flex">
      <div className="mb-8 text-xl font-bold tracking-tight text-white">
        <span className="text-[#A855F7]">OMG</span>
      </div>
      <nav className="flex flex-col gap-1">
        {menus.map(({ label, href, icon: Icon }) => (
          <Link
            key={label}
            href={href}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
          >
            <Icon className="h-5 w-5" strokeWidth={1.5} />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
