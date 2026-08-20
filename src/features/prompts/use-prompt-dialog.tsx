"use client";

import { useEffect, useState } from "react";
import { Check, Copy, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PromptVariable } from "@/types/domain";

interface UsePromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promptId: string;
}

interface ResolveResult {
  content: string;
  detectedVariables: PromptVariable[];
  missingBlockIds: string[];
  missingVariables: string[];
}

/**
 * "Use Prompt" dialog — resolves block references and template variables,
 * then lets the user copy the final resolved prompt.
 *
 * @see docs/master-plan.md §16 Prompt Variables, §17 Prompt Resolution Engine,
 *      §53 Copy Experience
 */
export function UsePromptDialog({
  open,
  onOpenChange,
  promptId,
}: UsePromptDialogProps) {
  const { toast } = useToast();
  const [result, setResult] = useState<ResolveResult | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchKey, setFetchKey] = useState(0);

  // Derive loading state — loading when we've triggered a fetch but haven't
  // gotten a result or error yet.
  const loading = fetchKey > 0 && !result && !error;

  // Fetch the initial resolution when the dialog opens or fetchKey changes.
  useEffect(() => {
    if (!open || fetchKey === 0) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`/api/prompts/${promptId}/resolve`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ variables: {} }),
        });
        if (!res.ok) throw new Error("Failed");
        const data = (await res.json()) as ResolveResult;
        if (cancelled) return;
        setResult(data);
        setError(null);
        setCopied(false);
        const initial: Record<string, string> = {};
        for (const v of data.detectedVariables) {
          initial[v.name] = v.defaultValue ?? "";
        }
        setValues(initial);
      } catch {
        if (!cancelled) setError("Could not resolve prompt.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, fetchKey, promptId]);

  // Re-resolve whenever a variable value changes.
  const [resolvedContent, setResolvedContent] = useState("");
  useEffect(() => {
    if (!result || !open) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`/api/prompts/${promptId}/resolve`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ variables: values }),
        });
        if (!res.ok) throw new Error("Failed");
        const data = (await res.json()) as ResolveResult;
        if (!cancelled) setResolvedContent(data.content);
      } catch {
        // best-effort
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [values, result, promptId, open]);

  // Handle open changes — reset state when opening.
  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setResult(null);
      setError(null);
      setFetchKey((k) => k + 1);
    }
    onOpenChange(nextOpen);
  }

  async function copyResolved() {
    try {
      await navigator.clipboard.writeText(
        resolvedContent || result?.content || "",
      );
      setCopied(true);
      toast("Resolved prompt copied", { variant: "success" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast("Could not copy prompt", {
        description: "Please try again.",
        variant: "error",
      });
    }
  }

  async function copyOriginal() {
    try {
      const res = await fetch(`/api/prompts/${promptId}`);
      if (!res.ok) throw new Error("Fetch failed");
      const data = (await res.json()) as { prompt: { content: string } };
      await navigator.clipboard.writeText(data.prompt.content);
      setCopied(true);
      toast("Original prompt copied", { variant: "success" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast("Could not copy prompt", {
        description: "Please try again.",
        variant: "error",
      });
    }
  }

  const hasVariables = (result?.detectedVariables.length ?? 0) > 0;
  const hasMissingBlocks = (result?.missingBlockIds.length ?? 0) > 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Use Prompt</DialogTitle>
          <DialogDescription>
            Resolve block references and template variables, then copy the final
            prompt.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="text-muted-foreground py-8 text-center text-sm">
            Resolving...
          </div>
        ) : error ? (
          <p className="text-destructive text-sm">{error}</p>
        ) : result ? (
          <div className="space-y-4">
            {hasMissingBlocks ? (
              <div className="border-warning/30 bg-warning/5 flex items-start gap-2 rounded-md border p-3 text-sm">
                <AlertCircle className="text-warning mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-medium">Missing block references</p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {result.missingBlockIds
                      .map((id) => `{{block:${id}}}`)
                      .join(", ")}
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    These references will remain in the output as-is.
                  </p>
                </div>
              </div>
            ) : null}

            {hasVariables ? (
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Variables</h4>
                {result.detectedVariables.map((v) => (
                  <div key={v.name} className="space-y-1">
                    <Label htmlFor={`var-${v.name}`}>{v.name}</Label>
                    <Input
                      id={`var-${v.name}`}
                      value={values[v.name] ?? ""}
                      onChange={(e) =>
                        setValues((prev) => ({
                          ...prev,
                          [v.name]: e.target.value,
                        }))
                      }
                      placeholder={`Value for ${v.name}`}
                    />
                  </div>
                ))}
              </div>
            ) : null}

            <div className="space-y-1.5">
              <h4 className="text-sm font-medium">Resolved preview</h4>
              <pre className="border-border bg-surface max-h-64 overflow-y-auto rounded-md border p-3 text-xs whitespace-pre-wrap">
                {resolvedContent || result.content}
              </pre>
            </div>
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => void copyOriginal()}>
            <Copy className="mr-2 h-4 w-4" />
            Copy Original
          </Button>
          <Button onClick={() => void copyResolved()} disabled={loading}>
            {copied ? (
              <>
                <Check className="text-success mr-2 h-4 w-4" />
                Copied
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copy Resolved
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
