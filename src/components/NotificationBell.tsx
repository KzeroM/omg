"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, Check, UserPlus, Heart, Music } from "lucide-react";

interface Notification {
  id: string;
  type: string;
  actor_nickname: string;
  track_id: string | null;
  message: string | null;
  is_read: boolean;
  created_at: string;
}

const TYPE_CONFIG = {
  follow: { icon: UserPlus, text: (n: Notification) => `${n.actor_nickname}님이 팔로우했습니다` },
  like: { icon: Heart, text: (n: Notification) => `${n.actor_nickname}님이 좋아요를 눌렀습니다` },
  new_track: { icon: Music, text: (n: Notification) => n.message ?? `${n.actor_nickname}님이 새 트랙을 업로드했습니다` },
};

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json() as { notifications: Notification[]; unread: number };
      setNotifications(data.notifications ?? []);
      setUnread(data.unread ?? 0);
    } catch { /* 무시 */ }
  };

  // 초기 로드 + 30초 폴링
  useEffect(() => {
    void fetchNotifications();
    const interval = setInterval(() => void fetchNotifications(), 30_000);
    return () => clearInterval(interval);
  }, []);

  // 패널 외부 클릭 시 닫기
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleOpen = async () => {
    setOpen((v) => !v);
    if (!open && unread > 0) {
      // 열 때 모두 읽음 처리
      await fetch("/api/notifications", { method: "PATCH" });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnread(0);
    }
  };

  const formatTime = (iso: string) => {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60) return "방금";
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
    return `${Math.floor(diff / 86400)}일 전`;
  };

  return (
    <div ref={panelRef} className="relative">
      <button
        type="button"
        onClick={() => void handleOpen()}
        className="relative rounded-full p-2 text-[var(--color-text-secondary)] transition hover:text-[var(--color-text-primary)]"
        aria-label="알림"
      >
        <Bell className="h-5 w-5" strokeWidth={1.5} />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-accent)] text-[9px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-2xl bg-[var(--color-bg-surface)] shadow-2xl ring-1 ring-[var(--color-border)]">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">알림</p>
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={async () => {
                  await fetch("/api/notifications", { method: "PATCH" });
                  setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
                  setUnread(0);
                }}
                className="flex items-center gap-1 text-xs text-[var(--color-text-muted)] transition hover:text-[var(--color-accent)]"
              >
                <Check className="h-3 w-3" />
                모두 읽음
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-10 text-center">
                <Bell className="mx-auto mb-2 h-8 w-8 text-[var(--color-text-muted)]" strokeWidth={1} />
                <p className="text-sm text-[var(--color-text-muted)]">알림이 없습니다</p>
              </div>
            ) : (
              <ul className="py-2">
                {notifications.map((n) => {
                  const config = TYPE_CONFIG[n.type as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.follow;
                  const Icon = config.icon;
                  return (
                    <li
                      key={n.id}
                      className={`flex items-start gap-3 px-4 py-3 transition hover:bg-[var(--color-bg-hover)] ${
                        !n.is_read ? "bg-[var(--color-accent)]/5" : ""
                      }`}
                    >
                      <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        !n.is_read ? "bg-[var(--color-accent)]/20" : "bg-[var(--color-bg-hover)]"
                      }`}>
                        <Icon className={`h-4 w-4 ${!n.is_read ? "text-[var(--color-accent)]" : "text-[var(--color-text-muted)]"}`} strokeWidth={2} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-[var(--color-text-primary)]">{config.text(n)}</p>
                        <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">{formatTime(n.created_at)}</p>
                      </div>
                      {!n.is_read && (
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--color-accent)]" />
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
