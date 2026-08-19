"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { WritingIssue } from "@/server/writing/types";

export type WritingStatus =
  "idle" | "checking" | "issues" | "no-issues" | "unavailable" | "disabled";

interface UseWritingCheckOptions {
  /** The text to check. */
  text: string;
  /** Language code (e.g. "en-US"). */
  language?: string;
  /** Whether writing assistance is enabled. */
  enabled?: boolean;
  /** Debounce delay in milliseconds. */
  delay?: number;
}

interface WritingCheckState {
  status: WritingStatus;
  issues: WritingIssue[];
  error: string | null;
  /** Force a re-check (bypasses debounce). */
  recheck: () => void;
  /** Remove an issue after applying a replacement. */
  applyReplacement: (issueId: string, _replacement: string) => void;
  /** Ignore an issue (removes it from the list). */
  ignoreIssue: (issueId: string) => void;
}

/**
 * Debounced writing check hook.
 *
 * Watches `text` for changes and calls POST /api/writing/check after `delay`
 * ms of inactivity. Manages issue state and provides actions for applying
 * replacements and ignoring issues.
 *
 * When `enabled` is false, the hook derives a "disabled" status and empty
 * issues list without calling setState in an effect.
 *
 * @see docs/master-plan.md §22 Writing Check Behavior
 */
export function useWritingCheck({
  text,
  language = "en-US",
  enabled = true,
  delay = 800,
}: UseWritingCheckOptions): WritingCheckState {
  const [issues, setIssues] = useState<WritingIssue[]>([]);
  const [status, setStatus] = useState<WritingStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastCheckedText = useRef<string>("");
  const abortRef = useRef<AbortController | null>(null);

  const performCheck = useCallback(async () => {
    if (!enabled || !text.trim()) {
      setIssues([]);
      setStatus(enabled ? "no-issues" : "idle");
      return;
    }

    // Skip if text hasn't changed since last check.
    if (text === lastCheckedText.current) return;
    lastCheckedText.current = text;

    setStatus("checking");
    setError(null);

    // Abort any in-flight request.
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/writing/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, language }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          code?: string;
          message?: string;
        } | null;
        if (
          body?.code === "WRITING_PROVIDER_UNAVAILABLE" ||
          body?.code === "WRITING_PROVIDER_RATE_LIMITED"
        ) {
          setStatus("unavailable");
          setError(body.message ?? null);
          return;
        }
        throw new Error(body?.message ?? "Check failed");
      }

      const data = (await res.json()) as { issues: WritingIssue[] };
      setIssues(data.issues);
      setStatus(data.issues.length > 0 ? "issues" : "no-issues");
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setStatus("unavailable");
      setError("Writing assistance is temporarily unavailable.");
    }
  }, [text, language, enabled]);

  // Debounced check on text change — only when enabled.
  useEffect(() => {
    if (!enabled) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      void performCheck();
    }, delay);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [text, delay, enabled, performCheck]);

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const recheck = useCallback(() => {
    lastCheckedText.current = "";
    void performCheck();
  }, [performCheck]);

  const applyReplacement = useCallback(
    (issueId: string, _replacement: string) => {
      setIssues((prev) => prev.filter((i) => i.id !== issueId));
    },
    [],
  );

  const ignoreIssue = useCallback((issueId: string) => {
    setIssues((prev) => prev.filter((i) => i.id !== issueId));
  }, []);

  // Derive the effective status/issues when disabled — no setState in effect.
  const effectiveStatus: WritingStatus = enabled ? status : "disabled";
  const effectiveIssues = enabled ? issues : [];

  return {
    status: effectiveStatus,
    issues: effectiveIssues,
    error,
    recheck,
    applyReplacement,
    ignoreIssue,
  };
}
