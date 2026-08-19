import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getAuthUser } from "@/server/auth/session";
import { isFirebaseAdminConfigured } from "@/server/auth/firebase-admin";

export default async function DashboardPage() {
  const user = await getAuthUser();
  const configured = isFirebaseAdminConfigured;

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
        <div className="border-border mt-4 flex items-center justify-center rounded-lg border border-dashed py-12">
          <div className="text-center">
            <p className="text-muted-foreground text-sm">No prompts yet</p>
            <p className="text-muted-foreground mt-1 text-xs">
              Create your first prompt and Lexora will keep it organized,
              corrected and ready to reuse.
            </p>
            <Button asChild className="mt-4" disabled={!configured}>
              <Link href="/prompts">Create Prompt</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Projects" value="0" />
        <StatCard label="Prompts" value="0" />
        <StatCard label="Blocks" value="0" />
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-border bg-surface rounded-lg border p-4">
      <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}
