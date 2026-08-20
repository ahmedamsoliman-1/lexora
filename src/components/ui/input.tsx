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
          "border-input bg-background/80 flex h-10 w-full rounded-lg border px-3 py-2 text-sm shadow-sm transition-all",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          "placeholder:text-muted-foreground",
          "focus-visible:ring-ring focus-visible:ring-offset-background focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none",
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
