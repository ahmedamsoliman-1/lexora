import { LoaderCircle } from "lucide-react";

import { cn } from "@/lib/utils";

interface SpinnerProps {
  className?: string;
  label?: string;
}

/** A compact, accessible progress indicator for pending user actions. */
export function Spinner({ className, label = "Loading" }: SpinnerProps) {
  return (
    <>
      <LoaderCircle
        aria-hidden="true"
        className={cn("h-4 w-4 animate-spin", className)}
      />
      <span className="sr-only">{label}</span>
    </>
  );
}
