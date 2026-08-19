"use client";

import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import type { WritingIssue } from "@/server/writing/types";

interface SuggestionPopupProps {
  /** The currently selected issue, or null when no issue is selected. */
  issue: WritingIssue | null;
  /** Position to render the popup at (relative to viewport). */
  position: { top: number; left: number } | null;
  onApply: (issueId: string, replacement: string) => void;
  onIgnore: (issueId: string) => void;
  onClose: () => void;
}

/**
 * Popup that appears when clicking on a writing issue decoration.
 * Shows the issue message and replacement suggestions with Apply/Ignore.
 *
 * @see docs/master-plan.md §24 Writing Editor UX
 */
export function SuggestionPopup({
  issue,
  position,
  onApply,
  onIgnore,
  onClose,
}: SuggestionPopupProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!issue) return;
    function handlePointerDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [issue, onClose]);

  if (!issue || !position) return null;

  return (
    <div
      ref={ref}
      className="border-border bg-popover fixed z-50 w-64 rounded-lg border p-3 shadow-lg"
      style={{ top: position.top, left: position.left }}
    >
      <div className="mb-2">
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          {issue.category}
        </p>
        <p className="mt-0.5 text-sm">{issue.shortMessage ?? issue.message}</p>
      </div>

      {issue.replacements.length > 0 ? (
        <div className="space-y-1">
          {issue.replacements.slice(0, 5).map((replacement) => (
            <button
              key={replacement}
              onClick={() => onApply(issue.id, replacement)}
              className="hover:bg-accent flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm transition-colors"
            >
              <span className="truncate">{replacement}</span>
              <span className="text-muted-foreground text-xs">Apply</span>
            </button>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-xs">
          No suggestions available.
        </p>
      )}

      <div className="border-border mt-2 flex justify-end gap-2 border-t pt-2">
        <Button variant="ghost" size="sm" onClick={() => onIgnore(issue.id)}>
          Ignore
        </Button>
      </div>
    </div>
  );
}

/**
 * Find the writing issue at a given DOM element (looking for the data-issue-id
 * attribute on decorated spans).
 */
export function findIssueAtElement(
  element: HTMLElement,
  issues: WritingIssue[],
): WritingIssue | null {
  const decorated = element.closest("[data-issue-id]") as HTMLElement | null;
  if (!decorated) return null;
  const issueId = decorated.getAttribute("data-issue-id");
  if (!issueId) return null;
  return issues.find((i) => i.id === issueId) ?? null;
}

/**
 * Get the bounding rect of the decoration element for popup positioning.
 */
export function getDecorationRect(
  element: HTMLElement,
): { top: number; left: number } | null {
  const decorated = element.closest("[data-issue-id]") as HTMLElement | null;
  if (!decorated) return null;
  const rect = decorated.getBoundingClientRect();
  return {
    top: rect.bottom + 4,
    left: rect.left,
  };
}
