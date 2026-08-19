import Link from "next/link";
import { FileText } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { getAuthUser } from "@/server/auth/session";
import { isFirebaseAdminConfigured } from "@/server/auth/firebase-admin";
import { listProjects } from "@/server/repositories/project-repository";

export default async function DashboardPage() {
  const user = await getAuthUser();
  const configured = isFirebaseAdminConfigured;

  const projects = user ? await listProjects(user.uid).catch(() => []) : [];

  const pinnedProjects = projects.filter((p) => p.pinned);
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const name = user?.displayName?.split(" ")[0] ?? "there";

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          {greeting}, {name}.
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {configured
            ? "Search your workspace or create something new."
            : "Auth is not configured — set Firebase env vars to enable the full workspace."}
        </p>
      </header>

      <div className="border-border bg-surface rounded-xl border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-medium">Recent</h2>
            <p className="text-muted-foreground mt-1 text-xs">
              Your recently edited prompts will appear here.
            </p>
          </div>
        </div>
        <div className="mt-4">
          <EmptyState
            icon={FileText}
            title="No prompts yet"
            description="Create your first prompt and Lexora will keep it organized, corrected and ready to reuse."
          />
        </div>
      </div>

      {pinnedProjects.length > 0 ? (
        <div>
          <h2 className="text-sm font-medium">Pinned Projects</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {pinnedProjects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="border-border bg-surface hover:bg-surface-hover rounded-lg border p-4 transition-colors"
              >
                <p className="text-sm font-medium">{project.name}</p>
                {project.description ? (
                  <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">
                    {project.description}
                  </p>
                ) : null}
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Projects" value={projects.length} />
        <StatCard label="Prompts" value={0} />
        <StatCard label="Blocks" value={0} />
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-border bg-surface rounded-lg border p-4">
      <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}
