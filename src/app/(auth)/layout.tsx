import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { LexoraMark } from "@/components/brand/lexora-mark";
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
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <LexoraMark label />
          <p className="text-muted-foreground mt-3 text-sm">
            Your prompt workspace.
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
