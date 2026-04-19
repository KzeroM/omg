"use client";

import { useState, useEffect } from "react";
import { LogIn, UserPlus, LogOut } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import type { User } from "@supabase/supabase-js";
import { AuthModal } from "./AuthModal";
import { NotificationBell } from "./NotificationBell";
import Link from "next/link";

export type AuthModalMode = "login" | "signup";

export function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<AuthModalMode>("login");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user: u } }) => setUser(u));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-bg-base)]/95 px-4 backdrop-blur lg:px-6">
        <Link href="/" className="text-xl font-bold tracking-tight text-[var(--color-text-primary)]">
          <span className="text-[var(--color-accent)]">OMG</span>
        </Link>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <NotificationBell />
              <span className="max-w-[120px] truncate text-sm text-[var(--color-text-secondary)] lg:max-w-[200px]">
                {user.user_metadata?.nickname || user.user_metadata?.name || user.email}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-[var(--color-text-secondary)] transition hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]"
              >
                <LogOut className="h-4 w-4" strokeWidth={1.5} />
                로그아웃
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  setAuthModalMode("login");
                  setAuthModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-[var(--color-text-secondary)] transition hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]"
              >
                <LogIn className="h-4 w-4" strokeWidth={1.5} />
                로그인
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthModalMode("signup");
                  setAuthModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--color-accent)] px-3 py-2 text-sm font-medium text-[var(--color-text-primary)] transition hover:bg-[var(--color-accent-hover)]"
              >
                <UserPlus className="h-4 w-4" strokeWidth={1.5} />
                회원가입
              </button>
            </>
          )}
        </div>
      </header>
      {authModalOpen && (
        <AuthModal
          initialMode={authModalMode}
          onClose={() => setAuthModalOpen(false)}
          onSuccess={() => setAuthModalOpen(false)}
        />
      )}
    </>
  );
}
