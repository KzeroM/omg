import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { LayoutDashboard, Music, Users, Star, HardDrive, Megaphone, Flag } from "lucide-react";

const adminNavItems = [
  { label: "대시보드", href: "/admin", icon: LayoutDashboard },
  { label: "트랙 관리", href: "/admin/tracks", icon: Music },
  { label: "사용자 관리", href: "/admin/users", icon: Users },
  { label: "아티스트 등급", href: "/admin/tiers", icon: Star },
  { label: "Storage", href: "/admin/storage", icon: HardDrive },
  { label: "공지사항", href: "/admin/announcements", icon: Megaphone },
  { label: "신고 처리", href: "/admin/reports", icon: Flag },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("users")
    .select("is_admin, nickname")
    .eq("user_id", user.id)
    .single();

  if (!profile?.is_admin) redirect("/");

  return (
    <div className="flex min-h-screen bg-[var(--color-bg-base)]">
      {/* Admin Sidebar */}
      <aside className="w-56 shrink-0 border-r border-[var(--color-border)] bg-[var(--color-bg-surface)] px-3 py-6">
        <div className="mb-6 px-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">Admin</p>
          <p className="mt-1 text-sm font-medium text-[var(--color-text-primary)]">{profile.nickname ?? user.email}</p>
        </div>
        <nav className="flex flex-col gap-1">
          {adminNavItems.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]"
            >
              <Icon className="h-4 w-4" strokeWidth={1.5} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto pt-6 px-3">
          <Link href="/" className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition">
            ← 서비스로 돌아가기
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-8">
        {children}
      </main>
    </div>
  );
}
