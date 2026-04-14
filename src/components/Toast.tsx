"use client";

import { useEffect } from "react";

type ToastProps = {
  message: string;
  onClose: () => void;
  duration?: number;
};

export function Toast({ message, onClose, duration = 2000 }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [onClose, duration]);

  return (
    <div
      className="fixed left-1/2 top-6 z-[100] -translate-x-1/2 rounded-xl bg-[var(--color-bg-surface)] px-5 py-3 text-sm font-medium text-[var(--color-text-primary)] shadow-lg ring-1 ring-[var(--color-accent)]/30"
      role="alert"
    >
      {message}
    </div>
  );
}
