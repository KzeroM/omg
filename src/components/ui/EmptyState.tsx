import type { LucideIcon } from "lucide-react";
import { Music } from "lucide-react";
import Link from "next/link";

interface EmptyStateAction {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: EmptyStateAction;
  className?: string;
}

export function EmptyState({
  icon: Icon = Music,
  title,
  description,
  action,
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
      {action && (
        action.href ? (
          <Link
            href={action.href}
            className="mt-1 text-xs font-medium text-[var(--color-accent)] hover:underline"
          >
            {action.label}
          </Link>
        ) : (
          <button
            type="button"
            onClick={action.onClick}
            className="mt-1 text-xs font-medium text-[var(--color-accent)] hover:underline"
          >
            {action.label}
          </button>
        )
      )}
    </div>
  );
}
