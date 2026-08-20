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
    </div>
  );
}
