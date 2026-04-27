"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

export interface UseAuthReturn {
  isLoggedIn: boolean | null;
  userId: string | null;
  profileNickname: string;
}

/**
 * Provides reactive auth state (login status, userId, nickname).
 * Subscribes to Supabase auth changes and keeps state in sync.
 */
export function useAuth(): UseAuthReturn {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [profileNickname, setProfileNickname] = useState("");

  useEffect(() => {
    const supabase = createClient();

    void supabase.auth.getUser().then(async ({ data: { user } }) => {
      setIsLoggedIn(!!user);
      setUserId(user?.id ?? null);
      if (user) {
        const { data } = await supabase
          .from("users")
          .select("nickname")
          .eq("user_id", user.id)
          .single();
        if (data?.nickname) setProfileNickname(data.nickname as string);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_e, session) => {
      setIsLoggedIn(!!session?.user);
      setUserId(session?.user?.id ?? null);
      if (session?.user) {
        const supabase2 = createClient();
        const { data } = await supabase2
          .from("users")
          .select("nickname")
          .eq("user_id", session.user.id)
          .single();
        if (data?.nickname) setProfileNickname(data.nickname as string);
      } else {
        setProfileNickname("");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return { isLoggedIn, userId, profileNickname };
}
