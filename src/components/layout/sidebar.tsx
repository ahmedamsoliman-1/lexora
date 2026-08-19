"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FolderClosed,
  FileText,
  Layers,
  LogOut,
  Plus,
  Settings,
  Star,
} from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";
import { useAuth } from "@/features/auth/auth-provider";
import { Button } from "@/components/ui/button";
import type { AuthUser } from "@/types";
import type { Project } from "@/types/domain";
import { ProjectDialog } from "@/features/projects/project-dialog";

const navItems = [
  { href: "/", label: "Home", icon: FileText, exact: true },
  { href: "/projects", label: "Projects", icon: FolderClosed },
  { href: "/prompts", label: "All Prompts", icon: Layers },
  { href: "/blocks", label: "Blocks", icon: Layers },
  { href: "/favorites", label: "Favorites", icon: Star },
];

interface SidebarProps {
  user: AuthUser;
  projects: Project[];
}

export function Sidebar({ user, projects }: SidebarProps) {
  const pathname = usePathname();
  const { signOut } = useAuth();
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);

  const initials = (user.displayName ?? user.email ?? "?")
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  const sortedProjects = [...projects].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.name.localeCompare(a.name);
  });

  return (
    <aside className="border-border bg-surface flex h-screen w-60 flex-col border-r">
      <div className="flex h-14 items-center px-5">
        <Link href="/" className="text-base font-semibold tracking-tight">
          Lexora
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {navItems.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-surface-hover hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}

        <div className="text-muted-foreground px-3 pt-6 pb-1 text-xs font-medium tracking-wide uppercase">
          Projects
        </div>

        {sortedProjects.length === 0 ? (
          <p className="text-muted-foreground px-3 py-2 text-xs">
            No projects yet.
          </p>
        ) : (
          sortedProjects.map((project) => {
            const href = `/projects/${project.id}`;
            const active = pathname === href;
            return (
              <Link
                key={project.id}
                href={href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors",
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-surface-hover hover:text-foreground",
                )}
              >
                {project.pinned ? (
                  <span className="text-warning text-xs">★</span>
                ) : (
                  <span className="text-muted-foreground/50 text-xs">○</span>
                )}
                <span className="truncate">{project.name}</span>
                {project.archived ? (
                  <span className="text-muted-foreground ml-auto text-[10px] uppercase">
                    arch
                  </span>
                ) : null}
              </Link>
            );
          })
        )}

        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground mt-1 w-full justify-start"
          onClick={() => setProjectDialogOpen(true)}
        >
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </nav>

      <div className="border-border border-t p-3">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            pathname.startsWith("/settings")
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:bg-surface-hover hover:text-foreground",
          )}
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>

        <div className="mt-2 flex items-center gap-2.5 rounded-md px-3 py-2">
          <div className="bg-primary text-primary-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium">
            {initials || "?"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {user.displayName ?? "Account"}
            </p>
            <p className="text-muted-foreground truncate text-xs">
              {user.email}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void signOut()}
            aria-label="Sign out"
            className="text-muted-foreground hover:bg-surface-hover hover:text-foreground rounded-md p-1.5 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      <ProjectDialog
        open={projectDialogOpen}
        onOpenChange={setProjectDialogOpen}
      />
    </aside>
  );
}
