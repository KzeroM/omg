"use client";

import { useEffect, useState } from "react";
import { X, Info, AlertTriangle, CheckCircle } from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  body: string;
  type: "info" | "warning" | "success";
}

const STYLES = {
  info: {
    bg: "bg-blue-500/10 ring-blue-500/20",
    text: "text-blue-300",
    icon: Info,
  },
  warning: {
    bg: "bg-yellow-500/10 ring-yellow-500/20",
    text: "text-yellow-300",
    icon: AlertTriangle,
  },
  success: {
    bg: "bg-green-500/10 ring-green-500/20",
    text: "text-green-300",
    icon: CheckCircle,
  },
};

export function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    void fetch("/api/announcements")
      .then((r) => r.json())
      .then((data: { announcements?: Announcement[] }) => {
        setAnnouncements(data.announcements ?? []);
      })
      .catch(() => {/* 공지 없음 */});
  }, []);

  const visible = announcements.filter((a) => !dismissed.has(a.id));
  if (visible.length === 0) return null;

  return (
    <div className="space-y-2">
      {visible.map((a) => {
        const style = STYLES[a.type] ?? STYLES.info;
        const Icon = style.icon;
        return (
          <div
            key={a.id}
            className={`flex items-start gap-3 rounded-xl px-4 py-3 ring-1 ${style.bg}`}
          >
            <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${style.text}`} strokeWidth={2} />
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-medium ${style.text}`}>{a.title}</p>
              <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">{a.body}</p>
            </div>
            <button
              type="button"
              onClick={() => setDismissed((prev) => new Set([...prev, a.id]))}
              className="shrink-0 text-[var(--color-text-muted)] transition hover:text-[var(--color-text-primary)]"
              aria-label="닫기"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
