import type { Block } from "@/types/domain";
import { createId } from "@/server/ids";
import { indexes, keys } from "@/server/redis/keys";
import { now } from "@/server/redis/serialize";
import { normalizeTags } from "@/lib/tags";
import {
  getEntities,
  getEntity,
  listIndex,
  requireRedis,
  toScore,
} from "@/server/repositories/base";

export interface CreateBlockInput {
  name: string;
  description?: string;
  content: string;
  tags: string[];
}

export interface UpdateBlockInput {
  name?: string;
  description?: string;
  content?: string;
  tags?: string[];
  favorite?: boolean;
}

export interface ListBlocksOptions {
  limit?: number;
  cursor?: number;
  tag?: string;
  favorite?: boolean;
}

/**
 * Block repository — owns the Redis keyspace for block records and their
 * indexes (user-level, tag-level, favorites).
 *
 * @see docs/master-plan.md §14 Reusable Blocks, §57 Blocks API
 */

export async function createBlock(
  userId: string,
  input: CreateBlockInput,
): Promise<Block> {
  const redis = requireRedis();
  const timestamp = now();
  const tags = normalizeTags(input.tags);

  const block: Block = {
    id: createId("blk"),
    userId,
    name: input.name,
    description: input.description,
    content: input.content,
    tags,
    favorite: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  const pipeline = redis.pipeline();
  pipeline.set(keys.block(userId, block.id), JSON.stringify(block));
  pipeline.zadd(indexes.userBlocks(userId), {
    score: toScore(timestamp),
    member: block.id,
  });
  for (const tag of tags) {
    pipeline.zadd(indexes.tagPrompts(userId, tag), {
      score: toScore(timestamp),
      member: block.id,
    });
  }
  await pipeline.exec();
  return block;
}

export async function getBlock(
  userId: string,
  blockId: string,
): Promise<Block | null> {
  return getEntity<Block>(keys.block(userId, blockId));
}

/** Fetch multiple blocks by ID (used by the resolver). */
export async function getBlocks(
  userId: string,
  blockIds: string[],
): Promise<Block[]> {
  if (blockIds.length === 0) return [];
  const blockKeys = blockIds.map((id) => keys.block(userId, id));
  return getEntities<Block>(blockKeys);
}

export async function updateBlock(
  userId: string,
  blockId: string,
  input: UpdateBlockInput,
): Promise<Block | null> {
  const redis = requireRedis();
  const existing = await getBlock(userId, blockId);
  if (!existing) {
    return null;
  }

  const tagsChanged = input.tags !== undefined;
  const favoriteChanged =
    input.favorite !== undefined && input.favorite !== existing.favorite;
  const tags =
    input.tags !== undefined ? normalizeTags(input.tags) : existing.tags;

  const updated: Block = {
    ...existing,
    ...input,
    tags,
    id: existing.id,
    userId: existing.userId,
    createdAt: existing.createdAt,
    updatedAt: now(),
  };

  const pipeline = redis.pipeline();
  pipeline.set(keys.block(userId, blockId), JSON.stringify(updated));

  if (tagsChanged) {
    for (const oldTag of existing.tags) {
      if (!tags.includes(oldTag)) {
        pipeline.zrem(indexes.tagPrompts(userId, oldTag), blockId);
      }
    }
    for (const newTag of tags) {
      if (!existing.tags.includes(newTag)) {
        pipeline.zadd(indexes.tagPrompts(userId, newTag), {
          score: toScore(updated.updatedAt),
          member: blockId,
        });
      }
    }
  }

  if (favoriteChanged) {
    if (updated.favorite) {
      pipeline.zadd(indexes.userFavorites(userId), {
        score: toScore(updated.updatedAt),
        member: blockId,
      });
    } else {
      pipeline.zrem(indexes.userFavorites(userId), blockId);
    }
  }

  await pipeline.exec();
  return updated;
}

export async function deleteBlock(
  userId: string,
  blockId: string,
): Promise<void> {
  const redis = requireRedis();
  const existing = await getBlock(userId, blockId);
  if (!existing) {
    return;
  }

  const pipeline = redis.pipeline();
  pipeline.del(keys.block(userId, blockId));
  pipeline.zrem(indexes.userBlocks(userId), blockId);
  pipeline.zrem(indexes.userFavorites(userId), blockId);
  for (const tag of existing.tags) {
    pipeline.zrem(indexes.tagPrompts(userId, tag), blockId);
  }
  await pipeline.exec();
}

export async function listBlocks(
  userId: string,
  options?: ListBlocksOptions,
): Promise<Block[]> {
  let indexKey: string;
  if (options?.favorite) {
    indexKey = indexes.userFavorites(userId);
  } else if (options?.tag) {
    const normalized = options.tag.trim().toLowerCase().replace(/^#/, "");
    indexKey = indexes.tagPrompts(userId, normalized || options.tag);
  } else {
    indexKey = indexes.userBlocks(userId);
  }

  const ids = await listIndex(indexKey, {
    limit: options?.limit ?? 50,
    cursor: options?.cursor,
  });

  if (ids.length === 0) {
    return [];
  }

  const blockKeys = ids.map((id) => keys.block(userId, id));
  return getEntities<Block>(blockKeys);
}
