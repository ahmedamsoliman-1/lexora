"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Archive, MoreHorizontal, Pencil, Pin, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Project } from "@/types/domain";
import { useToast } from "@/components/ui/toast";
import { Spinner } from "@/components/ui/spinner";

interface ProjectActionsProps {
  project: Project;
  onEdit: () => void;
}

/**
 * Per-project actions menu: pin/unpin, archive/restore, edit, delete.
 * Delete requires confirmation per the master plan.
 */
export function ProjectActions({ project, onEdit }: ProjectActionsProps) {
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  async function patch(data: Partial<Project>) {
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        throw new Error("Action failed.");
      }
      toast(
        data.pinned !== undefined
          ? data.pinned
            ? "Project pinned"
            : "Project unpinned"
          : data.archived
            ? "Project archived"
            : "Project restored",
        { variant: "success" },
      );
      router.refresh();
    } catch {
      toast("Could not update project", {
        description: "Please try again.",
        variant: "error",
      });
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error("Delete failed.");
      }
      setConfirmDelete(false);
      toast("Project deleted", { variant: "success" });
      router.push("/projects");
      router.refresh();
    } catch {
      toast("Could not delete project", {
        description: "Please try again.",
        variant: "error",
      });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Project actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onEdit}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => void patch({ pinned: !project.pinned })}
          >
            <Pin className="mr-2 h-4 w-4" />
            {project.pinned ? "Unpin" : "Pin"}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => void patch({ archived: !project.archived })}
          >
            <Archive className="mr-2 h-4 w-4" />
            {project.archived ? "Restore" : "Archive"}
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

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete project?</DialogTitle>
            <DialogDescription>
              This permanently deletes &ldquo;{project.name}&rdquo; and removes
              it from your sidebar. Prompts inside the project are not deleted
              in this phase — they will appear unassigned.
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
              {deleting ? <Spinner label="Deleting project" /> : null}
              {deleting ? "Deleting..." : "Delete project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
