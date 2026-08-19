import { cn } from "@/lib/utils";

interface LexoraMarkProps {
  className?: string;
  label?: boolean;
}

export function LexoraMark({ className, label = false }: LexoraMarkProps) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <svg viewBox="0 0 40 40" aria-hidden="true" className="h-8 w-8 shrink-0">
        <defs>
          <linearGradient id="lexora-gradient" x1="6" y1="4" x2="34" y2="36">
            <stop stopColor="#8b5cf6" />
            <stop offset="1" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
        <rect width="40" height="40" rx="12" fill="url(#lexora-gradient)" />
        <path
          d="M12 9.5v21h16"
          fill="none"
          stroke="white"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="4.5"
        />
        <path
          d="M17 24.5 27.5 14"
          fill="none"
          opacity=".72"
          stroke="white"
          strokeLinecap="round"
          strokeWidth="3"
        />
      </svg>
      {label ? (
        <span className="text-[1.05rem] font-bold tracking-[-0.04em]">
          Lexora
        </span>
      ) : null}
    </span>
  );
}
