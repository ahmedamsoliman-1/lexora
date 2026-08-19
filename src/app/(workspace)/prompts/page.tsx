import { PromptList } from "@/features/prompts/prompt-list";
import { getAuthUser } from "@/server/auth/session";
import { listProjects } from "@/server/repositories/project-repository";
import { listPrompts } from "@/server/repositories/prompt-repository";

export default async function PromptsPage() {
  const user = await getAuthUser();

  const [prompts, projects] = user
    ? await Promise.all([
        listPrompts(user.uid).catch(() => []),
        listProjects(user.uid).catch(() => []),
      ])
    : [[], []];

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Prompts</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {prompts.length > 0
              ? `${prompts.length} prompt${prompts.length === 1 ? "" : "s"}`
              : "Create your first prompt to get started."}
          </p>
        </div>
      </header>

      <PromptList prompts={prompts} projects={projects} />
    </div>
  );
}
