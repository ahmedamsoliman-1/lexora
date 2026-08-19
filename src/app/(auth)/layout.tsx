import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { env } from "@/lib/env";
import { getAuthUser } from "@/server/auth/session";

/**
 * Layout for public auth pages (login / register). If the visitor already has
 * a valid session they are redirected to the workspace.
 */
export default async function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getAuthUser();
  if (user) {
    redirect("/");
  }

  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            {env.NEXT_PUBLIC_APP_NAME}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Your prompt workspace.
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
