"use client";

import { RefreshCw, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  WritingIssue,
  WritingIssueCategory,
} from "@/server/writing/types";

interface WritingIssuePanelProps {
  issues: WritingIssue[];
  onApply: (issueId: string, replacement: string) => void;
  onIgnore: (issueId: string) => void;
  onIgnoreAll: () => void;
  onRecheck: () => void;
  className?: string;
}

const CATEGORY_LABELS: Record<WritingIssueCategory, string> = {
  spelling: "Spelling",
  grammar: "Grammar",
  punctuation: "Punctuation",
  style: "Style",
  typography: "Typography",
  other: "Other",
};

const CATEGORY_COLORS: Record<WritingIssueCategory, string> = {
  spelling: "text-destructive",
  grammar: "text-warning",
  punctuation: "text-blue-500",
  style: "text-purple-500",
  typography: "text-blue-400",
  other: "text-muted-foreground",
};

/**
 * Side panel listing all writing issues grouped by category.
 * Provides quick apply, ignore, ignore-all, and recheck actions.
 *
 * @see docs/master-plan.md §25 Writing Issue Panel
 */
export function WritingIssuePanel({
  issues,
  onApply,
  onIgnore,
  onIgnoreAll,
  onRecheck,
  className,
}: WritingIssuePanelProps) {
  // Group issues by category.
  const grouped = issues.reduce<Record<WritingIssueCategory, WritingIssue[]>>(
    (acc, issue) => {
      (acc[issue.category] ??= []).push(issue);
      return acc;
    },
    {
      spelling: [],
      grammar: [],
      punctuation: [],
      style: [],
      typography: [],
      other: [],
    },
  );

  const categoryOrder: WritingIssueCategory[] = [
    "spelling",
    "grammar",
    "punctuation",
    "style",
    "typography",
    "other",
  ];

  return (
    <div className={cn("flex h-full flex-col", className)}>
      <div className="border-border flex items-center justify-between border-b px-4 py-3">
        <h3 className="text-sm font-semibold">Writing</h3>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onRecheck}
            className="h-7 px-2 text-xs"
          >
            <RefreshCw className="mr-1 h-3 w-3" />
            Recheck
          </Button>
          {issues.length > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={onIgnoreAll}
              className="h-7 px-2 text-xs"
            >
              Ignore all
            </Button>
          ) : null}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {issues.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center text-sm">
            No issues found.
          </p>
        ) : (
          <div className="space-y-4">
            <p className="text-muted-foreground text-xs">
              {issues.length} issue{issues.length === 1 ? "" : "s"}
            </p>
            {categoryOrder.map((category) => {
              const catIssues = grouped[category];
              if (!catIssues || catIssues.length === 0) return null;
              return (
                <div key={category}>
                  <h4
                    className={cn(
                      "mb-1.5 text-xs font-medium tracking-wide uppercase",
                      CATEGORY_COLORS[category],
                    )}
                  >
                    {CATEGORY_LABELS[category]}
                  </h4>
                  <div className="space-y-1">
                    {catIssues.map((issue) => (
                      <div
                        key={issue.id}
                        className="group border-border bg-surface rounded-md border p-2 text-xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="flex-1">{issue.message}</p>
                          <button
                            onClick={() => onIgnore(issue.id)}
                            className="text-muted-foreground hover:text-foreground opacity-0 transition-opacity group-hover:opacity-100"
                            aria-label="Ignore issue"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                        {issue.replacements.length > 0 ? (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {issue.replacements.slice(0, 3).map((rep) => (
                              <button
                                key={rep}
                                onClick={() => onApply(issue.id, rep)}
                                className="bg-accent hover:bg-accent/80 rounded px-1.5 py-0.5 text-xs transition-colors"
                              >
                                {rep}
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
