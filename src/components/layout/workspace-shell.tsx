"use client";

import { useState, type ReactNode } from "react";

import { Sidebar, MobileSidebar } from "@/components/layout/sidebar";
import { MobileTopBar } from "@/components/layout/mobile-top-bar";
import type { AuthUser } from "@/types";
import type { Project } from "@/types/domain";

interface WorkspaceShellProps {
  user: AuthUser;
  projects: Project[];
  children: ReactNode;
}

/**
 * Client-side workspace shell that manages mobile sidebar open/close state.
 * Renders the desktop sidebar (lg+), mobile top bar + drawer (below lg),
 * and the main content area.
 */
export function WorkspaceShell({
  user,
  projects,
  children,
}: WorkspaceShellProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen flex-col overflow-hidden lg:flex-row">
      {/* Desktop sidebar */}
      <Sidebar user={user} projects={projects} />

      {/* Mobile sidebar drawer */}
      <MobileSidebar
        user={user}
        projects={projects}
        open={mobileSidebarOpen}
        onOpenChange={setMobileSidebarOpen}
      />

      {/* Right column: top bar (mobile) + main content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileTopBar onMenuClick={() => setMobileSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
