"use client";

import { useState } from "react";
import { ArrowLeft, FileText } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/common/empty-state";
import { ProjectActions } from "@/features/projects/project-actions";
import { ProjectDialog } from "@/features/projects/project-dialog";
import type { Project } from "@/types/domain";

interface ProjectDetailClientProps {
  project: Project;
}

/**
 * Client wrapper for the project detail page. Holds the edit-dialog open state
 * so the actions dropdown can trigger it.
 */
export function ProjectDetailClient({ project }: ProjectDetailClientProps) {
  const [editOpen, setEditOpen] = useState(false);

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <Link
            href="/projects"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs"
          >
            <ArrowLeft className="h-3 w-3" />
            Projects
          </Link>
          <div className="mt-2 flex items-center gap-2">
            <h1 className="truncate text-2xl font-semibold tracking-tight">
              {project.name}
            </h1>
            {project.pinned ? (
              <span className="text-warning text-sm">★</span>
            ) : null}
          </div>
          {project.description ? (
            <p className="text-muted-foreground mt-1 text-sm">
              {project.description}
            </p>
          ) : (
            <p className="text-muted-foreground/60 mt-1 text-sm italic">
              No description
            </p>
          )}
          {project.archived ? (
            <span className="text-muted-foreground mt-2 inline-block text-xs tracking-wide uppercase">
              Archived
            </span>
          ) : null}
        </div>
        <ProjectActions project={project} onEdit={() => setEditOpen(true)} />
      </header>

      <div className="border-border rounded-xl border border-dashed py-20">
        <EmptyState
          icon={FileText}
          title="No prompts in this project"
          description="Prompts created in this project will appear here. Prompt management arrives in Phase 4."
        />
      </div>

      <ProjectDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        project={project}
      />
    </div>
  );
}
