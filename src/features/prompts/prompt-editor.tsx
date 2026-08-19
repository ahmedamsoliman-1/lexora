"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Archive,
  Copy,
  Check,
  MoreHorizontal,
  PanelRightOpen,
  Play,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { useAutosave, type SaveStatus } from "@/hooks/use-autosave";
import { useWritingCheck, type WritingStatus } from "@/hooks/use-writing-check";
import { normalizeTags } from "@/lib/tags";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Prompt } from "@/types/domain";
import type { WritingIssue } from "@/server/writing/types";
import {
  WritingDecorations,
  applyReplacement,
  setWritingIssues,
} from "@/features/writing/writing-decorations";
import {
  SuggestionPopup,
  findIssueAtElement,
  getDecorationRect,
} from "@/features/writing/suggestion-popup";
import { WritingIssuePanel } from "@/features/writing/writing-issue-panel";
import { UsePromptDialog } from "@/features/prompts/use-prompt-dialog";

interface PromptEditorProps {
  prompt: Prompt;
}

/**
 * The prompt editor — the heart of Lexora.
 *
 * Features:
 * - TipTap-based content editor (plain text)
 * - Title editing + tag management
 * - Debounced autosave with status indicator
 * - Inline writing assistance (decorations, suggestion popup, issue panel)
 * - Favorite / archive / delete actions
 *
 * @see docs/master-plan.md §24 Writing Editor UX, §34 Autosave,
 *      §46 Prompt Editor Layout
 */
export function PromptEditor({ prompt }: PromptEditorProps) {
  const router = useRouter();

  const [title, setTitle] = useState(prompt.title);
  const [tags, setTags] = useState<string[]>(prompt.tags);
  const [tagInput, setTagInput] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showIssuePanel, setShowIssuePanel] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState<WritingIssue | null>(null);
  const [popupPosition, setPopupPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [usePromptOpen, setUsePromptOpen] = useState(false);
  const [copied, setCopied] = useState(false);

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
      WritingDecorations,
    ],
    content: prompt.content,
    editorProps: {
      attributes: {
        class: cn(
          "prose-lexora min-h-[400px] w-full resize-none bg-transparent px-0 py-4",
          "text-foreground text-base leading-relaxed outline-none",
          "placeholder:text-muted-foreground/50",
        ),
      },
      handleClick: (view, pos, event) => {
        const target = event.target as HTMLElement;
        const issue = findIssueAtElement(target, writingIssuesRef.current);
        if (issue) {
          setSelectedIssue(issue);
          setPopupPosition(getDecorationRect(target));
        } else {
          setSelectedIssue(null);
          setPopupPosition(null);
        }
      },
    },
  });

  const content = editor?.getText() ?? "";

  // Writing check hook — debounced, calls /api/writing/check.
  const {
    status: writingStatus,
    issues: writingIssues,
    recheck,
    applyReplacement: removeIssueFromList,
    ignoreIssue,
  } = useWritingCheck({
    text: content,
    language: "en-US",
    enabled: true,
    delay: 800,
  });

  // Keep a ref of issues for the click handler (which runs inside ProseMirror).
  const writingIssuesRef = useRef<WritingIssue[]>(writingIssues);
  useEffect(() => {
    writingIssuesRef.current = writingIssues;
  }, [writingIssues]);

  // Sync issues to the ProseMirror plugin for inline decorations.
  useEffect(() => {
    if (editor) {
      setWritingIssues(editor, writingIssues);
    }
  }, [editor, writingIssues]);

  const saveData = useCallback(
    async (data: unknown) => {
      const body = data as { title: string; content: string; tags: string[] };
      const res = await fetch(`/api/prompts/${prompt.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: body.title,
          content: body.content,
          tags: body.tags,
        }),
      });
      if (!res.ok) {
        throw new Error("Save failed");
      }
    },
    [prompt.id],
  );

  const { status: saveStatus } = useAutosave({
    data: { title, content, tags },
    save: saveData,
    delay: 800,
  });

  const wordCount = useMemo(() => {
    const text = content.trim();
    if (!text) return 0;
    return text.split(/\s+/).length;
  }, [content]);

  function addTag() {
    const normalized = normalizeTags([...tags, tagInput]);
    if (normalized.length !== tags.length) {
      setTags(normalized);
    }
    setTagInput("");
  }

  function removeTag(tag: string) {
    setTags(tags.filter((t) => t !== tag));
  }

  async function patchField(data: Partial<Prompt>) {
    const res = await fetch(`/api/prompts/${prompt.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      router.refresh();
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await fetch(`/api/prompts/${prompt.id}`, { method: "DELETE" });
      router.push("/prompts");
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  function handleApplyReplacement(issueId: string, replacement: string) {
    const issue = writingIssues.find((i) => i.id === issueId);
    if (issue && editor) {
      applyReplacement(editor, issue, replacement);
      removeIssueFromList(issueId, replacement);
    }
    setSelectedIssue(null);
    setPopupPosition(null);
  }

  function handleIgnoreIssue(issueId: string) {
    ignoreIssue(issueId);
    setSelectedIssue(null);
    setPopupPosition(null);
  }

  function handleIgnoreAll() {
    writingIssues.forEach((issue) => ignoreIssue(issue.id));
  }

  return (
    <div className="flex h-full">
      {/* Main editor column */}
      <div className="mx-auto flex w-full max-w-3xl flex-col">
        {/* Header: breadcrumb + actions */}
        <div className="border-border flex items-center justify-between border-b pb-4">
          <div className="text-muted-foreground flex items-center gap-2 text-xs">
            <button
              onClick={() => router.back()}
              className="hover:text-foreground"
            >
              ← Back
            </button>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setUsePromptOpen(true)}
              className="mr-2"
            >
              <Play className="mr-1.5 h-3.5 w-3.5" />
              Use
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={async () => {
                await navigator.clipboard.writeText(content);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              aria-label="Copy prompt"
            >
              {copied ? (
                <Check className="text-success h-4 w-4" />
              ) : (
                <Copy className="text-muted-foreground h-4 w-4" />
              )}
            </Button>
            {writingIssues.length > 0 ? (
              <button
                onClick={() => setShowIssuePanel(!showIssuePanel)}
                className="text-muted-foreground hover:bg-surface-hover rounded-md p-2 transition-colors"
                aria-label="Toggle writing panel"
              >
                <PanelRightOpen className="h-4 w-4" />
              </button>
            ) : null}
            <button
              onClick={() => void patchField({ favorite: !prompt.favorite })}
              className={cn(
                "hover:bg-surface-hover rounded-md p-2 transition-colors",
                prompt.favorite ? "text-warning" : "text-muted-foreground",
              )}
              aria-label={prompt.favorite ? "Unfavorite" : "Favorite"}
            >
              <Star
                className={cn("h-4 w-4", prompt.favorite && "fill-current")}
              />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() =>
                    void patchField({ archived: !prompt.archived })
                  }
                >
                  <Archive className="mr-2 h-4 w-4" />
                  {prompt.archived ? "Restore" : "Archive"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setConfirmDelete(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Title */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled prompt"
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
                onClick={() => removeTag(tag)}
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

        {/* Editor */}
        <div className="border-border mt-6 border-t pt-4">
          <EditorContent editor={editor} />
        </div>

        {/* Footer */}
        <div className="border-border text-muted-foreground mt-8 flex items-center gap-4 border-t pt-3 text-xs">
          <SaveStatusIndicator status={saveStatus} />
          <WritingStatusIndicator
            status={writingStatus}
            issueCount={writingIssues.length}
          />
          <span>{wordCount} words</span>
          <span className="ml-auto capitalize">{prompt.type}</span>
        </div>

        {/* Delete confirmation */}
        <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete prompt?</DialogTitle>
              <DialogDescription>
                This permanently deletes &ldquo;{prompt.title}&rdquo;. This
                action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => void handleDelete()}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete prompt"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Writing issue panel (right column) */}
      {showIssuePanel && writingIssues.length > 0 ? (
        <aside className="border-border hidden w-72 shrink-0 border-l lg:block">
          <WritingIssuePanel
            issues={writingIssues}
            onApply={handleApplyReplacement}
            onIgnore={handleIgnoreIssue}
            onIgnoreAll={handleIgnoreAll}
            onRecheck={recheck}
          />
        </aside>
      ) : null}

      {/* Suggestion popup (floating) */}
      <SuggestionPopup
        issue={selectedIssue}
        position={popupPosition}
        onApply={handleApplyReplacement}
        onIgnore={handleIgnoreIssue}
        onClose={() => {
          setSelectedIssue(null);
          setPopupPosition(null);
        }}
      />

      {/* Use prompt dialog (resolve + copy) */}
      <UsePromptDialog
        open={usePromptOpen}
        onOpenChange={setUsePromptOpen}
        promptId={prompt.id}
      />
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

function WritingStatusIndicator({
  status,
  issueCount,
}: {
  status: WritingStatus;
  issueCount: number;
}) {
  switch (status) {
    case "checking":
      return <span className="text-muted-foreground">Checking...</span>;
    case "issues":
      return (
        <span className="text-warning">
          {issueCount} writing issue{issueCount === 1 ? "" : "s"}
        </span>
      );
    case "no-issues":
      return <span className="text-success">No writing issues</span>;
    case "unavailable":
      return (
        <span className="text-muted-foreground">
          Writing assistance unavailable
        </span>
      );
    case "disabled":
      return (
        <span className="text-muted-foreground">
          Writing assistance disabled
        </span>
      );
    case "idle":
    default:
      return null;
  }
}
