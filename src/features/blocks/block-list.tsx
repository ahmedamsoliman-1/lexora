"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Layers, Plus, X } from "lucide-react";

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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { Spinner } from "@/components/ui/spinner";
import { normalizeTags } from "@/lib/tags";
import type { Block } from "@/types/domain";

interface BlockListProps {
  blocks: Block[];
}

export function BlockList({ blocks }: BlockListProps) {
  const [createOpen, setCreateOpen] = useState(false);

  if (blocks.length === 0) {
    return (
      <>
        <EmptyState
          icon={Layers}
          title="No blocks yet"
          description="Reusable blocks prevent you from repeating the same instructions across prompts. Create one for your coding rules, output format, or any recurring text."
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Block
            </Button>
          }
        />
        <CreateBlockDialog open={createOpen} onOpenChange={setCreateOpen} />
      </>
    );
  }

  return (
    <>
      <div className="space-y-1">
        {blocks.map((block) => (
          <a
            key={block.id}
            href={`/blocks/${block.id}`}
            className="group border-border bg-surface hover:border-foreground/20 hover:bg-surface-hover flex items-start gap-3 rounded-lg border p-4 transition-colors"
          >
            <Layers className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="truncate text-sm font-medium">{block.name}</h3>
                {block.favorite ? (
                  <span className="text-warning text-xs">★</span>
                ) : null}
              </div>
              {block.content ? (
                <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">
                  {block.content.slice(0, 200)}
                </p>
              ) : (
                <p className="text-muted-foreground/60 mt-1 text-xs italic">
                  Empty
                </p>
              )}
              {block.tags.length > 0 ? (
                <div className="mt-2 flex gap-2">
                  {block.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="text-muted-foreground text-[10px]"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </a>
        ))}
      </div>
      <CreateBlockDialog open={createOpen} onOpenChange={setCreateOpen} />
      <div className="mt-4 flex justify-center">
        <Button variant="outline" size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Block
        </Button>
      </div>
    </>
  );
}

function CreateBlockDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          content: content.trim(),
          tags,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          message?: string;
        } | null;
        throw new Error(body?.message ?? "Failed to create block.");
      }
      const data = (await res.json()) as { block: Block };
      onOpenChange(false);
      toast("Block created", { variant: "success" });
      setName("");
      setContent("");
      setTags([]);
      router.push(`/blocks/${data.block.id}`);
      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
      setError(message);
      toast("Could not create block", {
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
          <DialogTitle>New block</DialogTitle>
          <DialogDescription>
            Create a reusable block of text you can reference from prompts with{" "}
            <code className="bg-surface rounded px-1 text-xs">
              {"{{block:id}}"}
            </code>
            .
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="block-name">Name</Label>
            <Input
              id="block-name"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitting}
              placeholder="e.g. Coding Agent Rules"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="block-content">Content</Label>
            <Textarea
              id="block-content"
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={submitting}
              placeholder="Read the project documentation completely before implementation..."
              rows={6}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Tags (optional)</Label>
            <div className="flex flex-wrap items-center gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-surface text-muted-foreground inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => setTags(tags.filter((t) => t !== tag))}
                    className="hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    setTags(normalizeTags([...tags, tagInput]));
                    setTagInput("");
                  }
                }}
                placeholder={tags.length === 0 ? "Add tags..." : "+"}
                className="text-muted-foreground placeholder:text-muted-foreground/40 bg-transparent text-xs outline-none"
              />
            </div>
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
            <Button
              type="submit"
              disabled={submitting || !name.trim() || !content.trim()}
            >
              {submitting ? <Spinner label="Creating block" /> : null}
              {submitting ? "Creating..." : "Create block"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
