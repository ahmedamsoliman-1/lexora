import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ProjectList } from "@/features/projects/project-list";
import { getAuthUser } from "@/server/auth/session";
import { listProjects } from "@/server/repositories/project-repository";

export default async function ProjectsPage() {
  const user = await getAuthUser();
  const projects = user
    ? await listProjects(user.uid, { includeArchived: true }).catch(() => [])
    : [];

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {projects.length > 0
              ? `${projects.length} project${projects.length === 1 ? "" : "s"}`
              : "Create your first project to start organizing prompts."}
          </p>
        </div>
      </header>

      <ProjectList projects={projects} />

      {projects.length > 0 ? (
        <div className="flex justify-center pt-4">
          <Button variant="outline" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </div>
      ) : null}
    </div>
  );
}
