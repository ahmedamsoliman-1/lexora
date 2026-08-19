import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

/**
 * Consistent empty-state placeholder used across list views.
 * @see docs/master-plan.md §86 Empty States
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "border-border flex items-center justify-center rounded-xl border border-dashed py-20",
        className,
      )}
    >
      <div className="text-center">
        <Icon className="text-muted-foreground mx-auto h-8 w-8" />
        <p className="mt-3 text-sm font-medium">{title}</p>
        <p className="text-muted-foreground mt-1 text-xs">{description}</p>
        {action ? <div className="mt-4">{action}</div> : null}
      </div>
    </div>
  );
}
