import type { Prompt } from "@/types/domain";
import { AppError } from "@/server/errors";
import { requireAuthUser } from "@/server/auth/session";
import {
  createPrompt as repoCreate,
  deletePrompt as repoDelete,
  getPrompt as repoGet,
  listPrompts as repoList,
  touchRecent,
  updatePrompt as repoUpdate,
  type CreatePromptInput,
  type ListPromptsOptions,
  type UpdatePromptInput,
} from "@/server/repositories/prompt-repository";

/**
 * Prompt service — business logic layer between route handlers and the
 * repository. Resolves the authenticated UID and enforces ownership.
 *
 * @see docs/master-plan.md §13 Prompts, §56 Prompts API
 */

export async function createPrompt(input: CreatePromptInput): Promise<Prompt> {
  const user = await requireAuthUser();
  return repoCreate(user.uid, input);
}

export async function getPrompt(promptId: string): Promise<Prompt> {
  const user = await requireAuthUser();
  const prompt = await repoGet(user.uid, promptId);
  if (!prompt) {
    throw new AppError("NOT_FOUND", "Prompt not found.");
  }
  // Record access for "recent" — best-effort.
  await touchRecent(user.uid, promptId).catch(() => {});
  return prompt;
}

export async function listPrompts(
  options?: ListPromptsOptions,
): Promise<Prompt[]> {
  const user = await requireAuthUser();
  return repoList(user.uid, options);
}

export async function updatePrompt(
  promptId: string,
  input: UpdatePromptInput,
): Promise<Prompt> {
  const user = await requireAuthUser();
  const existing = await repoGet(user.uid, promptId);
  if (!existing) {
    throw new AppError("NOT_FOUND", "Prompt not found.");
  }
  const updated = await repoUpdate(user.uid, promptId, input);
  if (!updated) {
    throw new AppError("NOT_FOUND", "Prompt not found.");
  }
  return updated;
}

export async function deletePrompt(promptId: string): Promise<void> {
  const user = await requireAuthUser();
  const existing = await repoGet(user.uid, promptId);
  if (!existing) {
    throw new AppError("NOT_FOUND", "Prompt not found.");
  }
  await repoDelete(user.uid, promptId);
}

export async function setFavorite(
  promptId: string,
  favorite: boolean,
): Promise<Prompt> {
  return updatePrompt(promptId, { favorite });
}

export async function favoritePrompt(promptId: string): Promise<Prompt> {
  return setFavorite(promptId, true);
}

export async function unfavoritePrompt(promptId: string): Promise<Prompt> {
  return setFavorite(promptId, false);
}

export async function setArchived(
  promptId: string,
  archived: boolean,
): Promise<Prompt> {
  return updatePrompt(promptId, { archived });
}

export async function archivePrompt(promptId: string): Promise<Prompt> {
  return setArchived(promptId, true);
}

export async function unarchivePrompt(promptId: string): Promise<Prompt> {
  return setArchived(promptId, false);
}
