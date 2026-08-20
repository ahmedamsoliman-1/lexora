"use client";

import { useCallback, useMemo, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { ArrowLeft, Copy, Check, X } from "lucide-react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { useAutosave, type SaveStatus } from "@/hooks/use-autosave";
import { normalizeTags } from "@/lib/tags";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import type { Block } from "@/types/domain";

interface BlockEditorProps {
  block: Block;
}

export function BlockEditor({ block }: BlockEditorProps) {
  const router = useRouter();
  const [name, setName] = useState(block.name);
  const [tags, setTags] = useState<string[]>(block.tags);
  const [tagInput, setTagInput] = useState("");
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        bold: false,
        italic: false,
        strike: false,
        code: false,
        codeBlock: false,
        blockquote: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        horizontalRule: false,
      }),
    ],
    content: block.content,
    editorProps: {
      attributes: {
        class: cn(
          "min-h-[300px] w-full resize-none bg-transparent px-0 py-4",
          "text-foreground text-base leading-relaxed outline-none",
          "placeholder:text-muted-foreground/50",
        ),
      },
    },
  });

  const content = editor?.getText() ?? "";

  const saveData = useCallback(
    async (data: unknown) => {
      const body = data as { name: string; content: string; tags: string[] };
      const res = await fetch(`/api/blocks/${block.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Save failed");
    },
    [block.id],
  );

  const { status } = useAutosave({
    data: { name, content, tags },
    save: saveData,
    delay: 800,
  });

  const blockRef = `{{block:${block.id}}}`;
  const wordCount = useMemo(() => {
    const text = content.trim();
    return text ? text.split(/\s+/).length : 0;
  }, [content]);

  function addTag() {
    const normalized = normalizeTags([...tags, tagInput]);
    if (normalized.length !== tags.length) {
      setTags(normalized);
    }
    setTagInput("");
  }

  async function copyReference() {
    try {
      await navigator.clipboard.writeText(blockRef);
      setCopied(true);
      toast("Block reference copied", { variant: "success" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast("Could not copy reference", {
        description: "Copy it manually from the reference field.",
        variant: "error",
      });
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="border-border flex items-center justify-between border-b pb-4">
        <button
          onClick={() => router.back()}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs"
        >
          <ArrowLeft className="h-3 w-3" />
          Blocks
        </button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void copyReference()}
        >
          {copied ? (
            <>
              <Check className="text-success mr-2 h-4 w-4" />
              Copied
            </>
          ) : (
            <>
              <Copy className="mr-2 h-4 w-4" />
              Copy reference
            </>
          )}
        </Button>
      </div>

      {/* Name */}
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Untitled block"
        className="placeholder:text-muted-foreground/40 mt-6 w-full bg-transparent text-2xl font-semibold tracking-tight outline-none"
      />

      {/* Tags */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {tags.map((tag) => (
          <span
            key={tag}
            className="bg-surface text-muted-foreground inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs"
          >
            #{tag}
            <button
              onClick={() => setTags(tags.filter((t) => t !== tag))}
              className="hover:text-foreground"
              aria-label={`Remove ${tag}`}
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
              addTag();
            }
          }}
          onBlur={addTag}
          placeholder={tags.length === 0 ? "Add tags..." : "+"}
          className="text-muted-foreground placeholder:text-muted-foreground/40 bg-transparent text-xs outline-none"
        />
      </div>

      {/* Reference hint */}
      <div className="bg-surface text-muted-foreground mt-3 rounded-md px-3 py-2 text-xs">
        Reference this block from any prompt:{" "}
        <code className="bg-background rounded px-1.5 py-0.5 font-mono">
          {blockRef}
        </code>
      </div>

      {/* Editor */}
      <div className="border-border mt-6 border-t pt-4">
        <EditorContent editor={editor} />
      </div>

      {/* Footer */}
      <div className="border-border text-muted-foreground mt-8 flex flex-wrap items-center gap-x-4 gap-y-1 border-t pt-3 text-xs">
        <SaveStatusIndicator status={status} />
        <span>{wordCount} words</span>
      </div>
    </div>
  );
}

function SaveStatusIndicator({ status }: { status: SaveStatus }) {
  switch (status) {
    case "saving":
      return <span className="text-muted-foreground">Saving...</span>;
    case "saved":
      return <span className="text-success">✓ Saved</span>;
    case "error":
      return <span className="text-destructive">Save failed — retrying</span>;
    case "idle":
    default:
      return <span className="text-muted-foreground">✓ Saved</span>;
  }
}
