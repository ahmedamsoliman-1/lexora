"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/empty-state";
import { ProjectDialog } from "@/features/projects/project-dialog";
import type { Project } from "@/types/domain";

interface ProjectListProps {
  projects: Project[];
}

/**
 * Client-side projects list with create-project dialog. Receives the initial
 * list from the server component parent; mutations call `router.refresh()`
 * inside the dialog to re-fetch.
 */
export function ProjectList({ projects }: ProjectListProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  if (projects.length === 0) {
    return (
      <>
        <EmptyState
          icon={Plus}
          title="No projects yet"
          description="Projects keep your prompts organized by context — one for each product, client, or topic you write for."
          action={
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Project
            </Button>
          }
        />
        <ProjectDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      </>
    );
  }

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
      <ProjectDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}

function ProjectCard({ project }: { project: Project }) {
  return (
    <a
      href={`/projects/${project.id}`}
      className="group border-border bg-surface hover:border-foreground/20 hover:bg-surface-hover rounded-lg border p-4 transition-colors"
    >
      <div className="flex items-start justify-between">
        <h3 className="text-sm font-medium">{project.name}</h3>
        {project.pinned ? (
          <span className="text-warning text-xs">★</span>
        ) : null}
      </div>
      {project.description ? (
        <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">
          {project.description}
        </p>
      ) : (
        <p className="text-muted-foreground/60 mt-1 text-xs italic">
          No description
        </p>
      )}
      {project.archived ? (
        <span className="text-muted-foreground mt-3 inline-block text-[10px] tracking-wide uppercase">
          Archived
        </span>
      ) : null}
    </a>
  );
}
