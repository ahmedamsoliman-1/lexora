import type { Block } from "@/types/domain";
import { AppError } from "@/server/errors";
import { requireAuthUser } from "@/server/auth/session";
import {
  createBlock as repoCreate,
  deleteBlock as repoDelete,
  getBlock as repoGet,
  getBlocks as repoGetBlocks,
  listBlocks as repoList,
  updateBlock as repoUpdate,
  type CreateBlockInput,
  type ListBlocksOptions,
  type UpdateBlockInput,
} from "@/server/repositories/block-repository";

/**
 * Block service — business logic layer between route handlers and the
 * repository. Resolves the authenticated UID and enforces ownership.
 *
 * @see docs/master-plan.md §14 Reusable Blocks, §57 Blocks API
 */

export async function createBlock(input: CreateBlockInput): Promise<Block> {
  const user = await requireAuthUser();
  return repoCreate(user.uid, input);
}

export async function getBlock(blockId: string): Promise<Block> {
  const user = await requireAuthUser();
  const block = await repoGet(user.uid, blockId);
  if (!block) {
    throw new AppError("NOT_FOUND", "Block not found.");
  }
  return block;
}

export async function listBlocks(
  options?: ListBlocksOptions,
): Promise<Block[]> {
  const user = await requireAuthUser();
  return repoList(user.uid, options);
}

export async function updateBlock(
  blockId: string,
  input: UpdateBlockInput,
): Promise<Block> {
  const user = await requireAuthUser();
  const existing = await repoGet(user.uid, blockId);
  if (!existing) {
    throw new AppError("NOT_FOUND", "Block not found.");
  }
  const updated = await repoUpdate(user.uid, blockId, input);
  if (!updated) {
    throw new AppError("NOT_FOUND", "Block not found.");
  }
  return updated;
}

export async function deleteBlock(blockId: string): Promise<void> {
  const user = await requireAuthUser();
  const existing = await repoGet(user.uid, blockId);
  if (!existing) {
    throw new AppError("NOT_FOUND", "Block not found.");
  }
  await repoDelete(user.uid, blockId);
}

/** Fetch multiple blocks by ID (used by the prompt resolver). */
export async function getBlocksByIds(blockIds: string[]): Promise<Block[]> {
  const user = await requireAuthUser();
  return repoGetBlocks(user.uid, blockIds);
}
