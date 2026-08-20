import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { WorkspaceShell } from "@/components/layout/workspace-shell";
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

  const displayUser = user ?? {
    uid: "dev-user",
    email: "dev@localhost",
    displayName: "Developer",
    photoURL: null,
  };

  const projects = user ? await listProjects(user.uid).catch(() => []) : [];

  return (
    <WorkspaceShell user={displayUser} projects={projects}>
      {children}
    </WorkspaceShell>
  );
}
