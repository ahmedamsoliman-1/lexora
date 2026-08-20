import * as React from "react";

import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        // Password manager extensions (Securden, 1Password, Bitwarden, etc.)
        // inject attributes onto <input> elements before React hydrates,
        // causing hydration mismatches. suppressHydrationWarning lets React
        // tolerate the extension's DOM modifications without warning.
        suppressHydrationWarning
        className={cn(
          "border-input bg-background/60 flex h-10 w-full rounded-lg border px-3 py-2 text-sm shadow-sm backdrop-blur-sm transition-all duration-200",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          "placeholder:text-muted-foreground/70",
          "hover:border-input/80",
          "focus-visible:border-ring focus-visible:ring-ring/20 focus-visible:ring-4 focus-visible:outline-none",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
