import type { Project } from "@/types/domain";
import { createId } from "@/server/ids";
import { indexes, keys } from "@/server/redis/keys";
import { now, toScore } from "@/server/redis/serialize";
import {
  addToIndex,
  deleteEntity,
  getEntities,
  getEntity,
  listIndex,
  removeFromIndex,
  setEntity,
} from "@/server/repositories/base";

export interface CreateProjectInput {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
  pinned?: boolean;
  archived?: boolean;
}

/**
 * Project repository — owns the Redis keyspace for project records and the
 * user-level project index. All operations are scoped to the authenticated
 * UID; client-supplied user IDs are never trusted.
 *
 * @see docs/master-plan.md §12 Projects
 */
export async function createProject(
  userId: string,
  input: CreateProjectInput,
): Promise<Project> {
  const timestamp = now();
  const project: Project = {
    id: createId("prj"),
    userId,
    name: input.name,
    description: input.description,
    icon: input.icon,
    color: input.color,
    pinned: false,
    archived: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await setEntity(keys.project(userId, project.id), project);
  await addToIndex(indexes.userProjects(userId), project.id, toScore(timestamp));

  return project;
}

export async function getProject(
  userId: string,
  projectId: string,
): Promise<Project | null> {
  return getEntity<Project>(keys.project(userId, projectId));
}

export async function updateProject(
  userId: string,
  projectId: string,
  input: UpdateProjectInput,
): Promise<Project> {
  const existing = await getProject(userId, projectId);
  if (!existing) {
    return null as never;
  }

  const updated: Project = {
    ...existing,
    ...input,
    id: existing.id,
    userId: existing.userId,
    createdAt: existing.createdAt,
    updatedAt: now(),
  };

  await setEntity(keys.project(userId, projectId), updated);
  return updated;
}

export async function deleteProject(
  userId: string,
  projectId: string,
): Promise<void> {
  await deleteEntity(keys.project(userId, projectId));
  await removeFromIndex(indexes.userProjects(userId), projectId);
}

export interface ListProjectsOptions {
  limit?: number;
  cursor?: number;
  includeArchived?: boolean;
}

export async function listProjects(
  userId: string,
  options?: ListProjectsOptions,
): Promise<Project[]> {
  const ids = await listIndex(indexes.userProjects(userId), {
    limit: options?.limit ?? 50,
    cursor: options?.cursor,
  });

  if (ids.length === 0) {
    return [];
  }

  const projectKeys = ids.map((id) => keys.project(userId, id));
  const projects = await getEntities<Project>(projectKeys);

  if (options?.includeArchived) {
    return projects;
  }

  return projects.filter((p) => !p.archived);
}

/**
 * Pin/unpin a project. Pinned projects appear first in navigation.
 */
export async function setProjectPinned(
  userId: string,
  projectId: string,
  pinned: boolean,
): Promise<Project> {
  return updateProject(userId, projectId, { pinned });
}

/**
 * Archive/restore a project. Archived projects are hidden from the default
 * list but not deleted.
 */
export async function setProjectArchived(
  userId: string,
  projectId: string,
  archived: boolean,
): Promise<Project> {
  return updateProject(userId, projectId, { archived });
}
