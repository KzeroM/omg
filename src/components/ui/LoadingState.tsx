import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function LoadingState({ message = "불러오는 중…", className = "" }: LoadingStateProps) {
  return (
    <div className={`flex items-center justify-center gap-2 py-12 text-[var(--color-text-muted)] ${className}`}>
      <Loader2 className="h-4 w-4 animate-spin" />
      <span className="text-sm">{message}</span>
    </div>
  );
}
