import { AlertCircle } from "lucide-react";

interface ErrorStateProps {
  message?: string;
  className?: string;
}

export function ErrorState({
  message = "오류가 발생했습니다. 다시 시도해 주세요.",
  className = "",
}: ErrorStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 rounded-2xl bg-[var(--color-bg-surface)] px-6 py-12 text-center ring-1 ring-[var(--color-border)] ${className}`}
    >
      <AlertCircle className="h-8 w-8 text-red-400 opacity-70" strokeWidth={1.5} />
      <p className="text-sm text-[var(--color-text-muted)]">{message}</p>
    </div>
  );
}
