"use client";

import { useState } from "react";
import { ArrowLeft, FileText } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/common/empty-state";
import { ProjectActions } from "@/features/projects/project-actions";
import { ProjectDialog } from "@/features/projects/project-dialog";
import type { Project, Prompt } from "@/types/domain";

interface ProjectDetailClientProps {
  project: Project;
  prompts: Prompt[];
}

/**
 * Client wrapper for the project detail page. Holds the edit-dialog open state
 * so the actions dropdown can trigger it.
 */
export function ProjectDetailClient({
  project,
  prompts,
}: ProjectDetailClientProps) {
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

      {prompts.length === 0 ? (
        <div className="border-border rounded-xl border border-dashed py-20">
          <EmptyState
            icon={FileText}
            title="No prompts in this project"
            description="Create a prompt from the Prompts page and assign it to this project."
          />
        </div>
      ) : (
        <div className="space-y-1">
          {prompts.map((prompt) => (
            <a
              key={prompt.id}
              href={`/prompts/${prompt.id}`}
              className="group border-border bg-surface hover:bg-surface-hover flex items-start gap-3 rounded-lg border p-4 transition-colors"
            >
              <FileText className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-medium">{prompt.title}</h3>
                {prompt.content ? (
                  <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">
                    {prompt.content.slice(0, 200)}
                  </p>
                ) : null}
              </div>
            </a>
          ))}
        </div>
      )}

      <ProjectDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        project={project}
      />
    </div>
  );
}
