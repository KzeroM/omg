import type { LucideIcon } from "lucide-react";
import { Music } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  className?: string;
}

export function EmptyState({
  icon: Icon = Music,
  title,
  description,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 rounded-2xl bg-[var(--color-bg-surface)] px-6 py-12 text-center ring-1 ring-[var(--color-border)] ${className}`}
    >
      <Icon className="h-8 w-8 text-[var(--color-text-muted)] opacity-40" strokeWidth={1.5} />
      <p className="text-sm font-medium text-[var(--color-text-primary)]">{title}</p>
      {description && (
        <p className="text-xs text-[var(--color-text-muted)]">{description}</p>
      )}
    </div>
  );
}
