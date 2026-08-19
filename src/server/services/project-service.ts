import type { Project } from "@/types/domain";
import { AppError } from "@/server/errors";
import { requireAuthUser } from "@/server/auth/session";
import {
  createProject as repoCreate,
  deleteProject as repoDelete,
  getProject as repoGet,
  listProjects as repoList,
  updateProject as repoUpdate,
  type CreateProjectInput,
  type ListProjectsOptions,
  type UpdateProjectInput,
} from "@/server/repositories/project-repository";

/**
 * Project service — business logic layer between route handlers and the
 * repository. Resolves the authenticated UID from the verified session and
 * enforces ownership before touching data.
 *
 * @see docs/master-plan.md §12 Projects, §55 Projects API
 */

export async function createProject(
  input: CreateProjectInput,
): Promise<Project> {
  const user = await requireAuthUser();
  return repoCreate(user.uid, input);
}

export async function getProject(projectId: string): Promise<Project> {
  const user = await requireAuthUser();
  const project = await repoGet(user.uid, projectId);
  if (!project) {
    throw new AppError("NOT_FOUND", "Project not found.");
  }
  return project;
}

export async function listProjects(
  options?: ListProjectsOptions,
): Promise<Project[]> {
  const user = await requireAuthUser();
  return repoList(user.uid, options);
}

export async function updateProject(
  projectId: string,
  input: UpdateProjectInput,
): Promise<Project> {
  const user = await requireAuthUser();
  const existing = await repoGet(user.uid, projectId);
  if (!existing) {
    throw new AppError("NOT_FOUND", "Project not found.");
  }
  return repoUpdate(user.uid, projectId, input);
}

export async function deleteProject(projectId: string): Promise<void> {
  const user = await requireAuthUser();
  const existing = await repoGet(user.uid, projectId);
  if (!existing) {
    throw new AppError("NOT_FOUND", "Project not found.");
  }
  await repoDelete(user.uid, projectId);
}

export async function pinProject(projectId: string): Promise<Project> {
  return updateProject(projectId, { pinned: true });
}

export async function unpinProject(projectId: string): Promise<Project> {
  return updateProject(projectId, { pinned: false });
}

export async function archiveProject(projectId: string): Promise<Project> {
  return updateProject(projectId, { archived: true });
}

export async function restoreProject(projectId: string): Promise<Project> {
  return updateProject(projectId, { archived: false });
}
