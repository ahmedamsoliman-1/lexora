import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { Sidebar } from "@/components/layout/sidebar";
import { getAuthUser } from "@/server/auth/session";
import { isFirebaseAdminConfigured } from "@/server/auth/firebase-admin";
import { listProjects } from "@/server/repositories/project-repository";

/**
 * Protected workspace layout. Every route in the `(workspace)` group requires
 * an authenticated session. Unauthenticated visitors are redirected to the
 * login page with a `next` parameter to return them after sign-in.
 *
 * When Firebase Admin is not configured (local dev without credentials) we
 * still render the shell so the UI remains inspectable; route handlers will
 * return "auth not configured" errors for data operations.
 */
export default async function WorkspaceLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getAuthUser();

  if (!user && isFirebaseAdminConfigured) {
    redirect("/login?next=/");
  }

  // Dev fallback: when auth isn't configured, use a placeholder user so the
  // shell renders without crashing. Data operations will still fail safely.
  const displayUser = user ?? {
    uid: "dev-user",
    email: "dev@localhost",
    displayName: "Developer",
    photoURL: null,
  };

  // Best-effort project fetch for the sidebar. When Redis isn't configured or
  // the user has no profile yet, the sidebar shows the empty state.
  const projects = user ? await listProjects(user.uid).catch(() => []) : [];

  return (
    <div className="bg-background flex h-screen overflow-hidden">
      <Sidebar user={displayUser} projects={projects} />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
