"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

interface UseAutosaveOptions {
  /** The current content to save. */
  data: unknown;
  /** Function that persists the data. Should throw on failure. */
  save: (data: unknown) => Promise<void>;
  /** Debounce delay in milliseconds. */
  delay?: number;
  /** Whether autosave is enabled. */
  enabled?: boolean;
}

/**
 * Debounced autosave hook.
 *
 * Watches `data` for changes and calls `save` after `delay` ms of inactivity.
 * Tracks a `status` field the UI can render: "saving" → "saved" / "error".
 *
 * The caller should remount the component (via a `key` prop) when switching
 * resources so the hook resets cleanly.
 *
 * @see docs/master-plan.md §34 Autosave
 */
export function useAutosave({
  data,
  save,
  delay = 800,
  enabled = true,
}: UseAutosaveOptions) {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dataRef = useRef(data);
  const isFirstRender = useRef(true);

  // Sync the ref in an effect (not during render).
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const saveNow = useCallback(async () => {
    setStatus("saving");
    try {
      await save(dataRef.current);
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }, [save]);

  useEffect(() => {
    if (!enabled) return;
    // Skip the very first render — the data was just loaded from the server.
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      void saveNow();
    }, delay);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [data, delay, enabled, saveNow]);

  return { status, saveNow };
}
