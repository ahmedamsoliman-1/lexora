"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FileText, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/common/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { Spinner } from "@/components/ui/spinner";
import type { Prompt } from "@/types/domain";

interface PromptListProps {
  prompts: Prompt[];
  /** Projects available for the create dialog. */
  projects: { id: string; name: string }[];
}

export function PromptList({ prompts, projects }: PromptListProps) {
  const [createOpen, setCreateOpen] = useState(false);

  if (prompts.length === 0) {
    return (
      <>
        <EmptyState
          icon={FileText}
          title="No prompts yet"
          description="Create your first prompt and Lexora will keep it organized, corrected and ready to reuse."
          action={
            <Button
              onClick={() => setCreateOpen(true)}
              disabled={projects.length === 0}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Prompt
            </Button>
          }
        />
        {projects.length === 0 ? (
          <p className="text-muted-foreground mt-2 text-center text-xs">
            Create a project first to organize your prompts.
          </p>
        ) : null}
        <CreatePromptDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          projects={projects}
        />
      </>
    );
  }

  return (
    <>
      <div className="space-y-1">
        {prompts.map((prompt) => (
          <a
            key={prompt.id}
            href={`/prompts/${prompt.id}`}
            className="group border-border bg-surface hover:border-foreground/20 hover:bg-surface-hover flex items-start gap-3 rounded-lg border p-4 transition-colors"
          >
            <FileText className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="truncate text-sm font-medium">{prompt.title}</h3>
                {prompt.favorite ? (
                  <Star className="text-warning h-3 w-3 shrink-0" />
                ) : null}
                {prompt.archived ? (
                  <span className="text-muted-foreground text-[10px] uppercase">
                    arch
                  </span>
                ) : null}
              </div>
              {prompt.content ? (
                <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">
                  {prompt.content.slice(0, 200)}
                </p>
              ) : (
                <p className="text-muted-foreground/60 mt-1 text-xs italic">
                  Empty
                </p>
              )}
              <div className="mt-2 flex items-center gap-2">
                <span className="text-muted-foreground text-[10px] tracking-wide uppercase">
                  {prompt.type}
                </span>
                {prompt.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="text-muted-foreground text-[10px]">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </a>
        ))}
      </div>
      <CreatePromptDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        projects={projects}
      />
      <div className="mt-4 flex justify-center">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCreateOpen(true)}
          disabled={projects.length === 0}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Prompt
        </Button>
      </div>
    </>
  );
}

function Star({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

function CreatePromptDialog({
  open,
  onOpenChange,
  projects,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          projectId,
          content: "",
          type: "prompt",
          tags: [],
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          message?: string;
        } | null;
        throw new Error(body?.message ?? "Failed to create prompt.");
      }
      const data = (await res.json()) as { prompt: Prompt };
      onOpenChange(false);
      toast("Prompt created", { variant: "success" });
      setTitle("");
      router.push(`/prompts/${data.prompt.id}`);
      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
      setError(message);
      toast("Could not create prompt", {
        description: message,
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New prompt</DialogTitle>
          <DialogDescription>
            Create a new prompt. You can start writing right away.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="prompt-title">Title</Label>
            <Input
              id="prompt-title"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={submitting}
              placeholder="e.g. Backend Implementation Agent"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="prompt-project">Project</Label>
            <select
              id="prompt-project"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              disabled={submitting}
              className="border-input bg-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm shadow-sm focus-visible:ring-2 focus-visible:outline-none"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          {error && (
            <p className="text-destructive text-sm" role="alert">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !title.trim()}>
              {submitting ? <Spinner label="Creating prompt" /> : null}
              {submitting ? "Creating..." : "Create prompt"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
