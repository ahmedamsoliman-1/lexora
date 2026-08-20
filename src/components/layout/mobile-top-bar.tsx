"use client";

import { Menu } from "lucide-react";

import { LexoraMark } from "@/components/brand/lexora-mark";
import { ThemeToggle } from "@/components/theme/theme-toggle";

interface MobileTopBarProps {
  onMenuClick: () => void;
}

/**
 * Mobile-only top bar with hamburger menu, brand mark, and theme toggle.
 * Hidden on lg+ screens where the desktop sidebar is visible.
 *
 * @see docs/master-plan.md §51 Responsive Design — "Mobile: Top navigation"
 */
export function MobileTopBar({ onMenuClick }: MobileTopBarProps) {
  return (
    <header className="border-border/60 bg-surface/70 flex h-14 shrink-0 items-center justify-between border-b px-4 backdrop-blur-xl lg:hidden">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Open menu"
        className="text-muted-foreground hover:bg-surface-hover hover:text-foreground rounded-md p-2 transition-colors"
      >
        <Menu className="h-5 w-5" />
      </button>
      <LexoraMark label />
      <ThemeToggle />
    </header>
  );
}
