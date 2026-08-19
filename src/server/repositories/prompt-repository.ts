import type { Prompt, PromptType } from "@/types/domain";
import { createId } from "@/server/ids";
import { indexes, keys } from "@/server/redis/keys";
import { now } from "@/server/redis/serialize";
import { normalizeTags } from "@/lib/tags";
import {
  addToIndex,
  getEntities,
  getEntity,
  listIndex,
  requireRedis,
  toScore,
} from "@/server/repositories/base";

export interface CreatePromptInput {
  projectId: string;
  title: string;
  description?: string;
  content: string;
  type: PromptType;
  tags: string[];
}

export interface UpdatePromptInput {
  title?: string;
  description?: string;
  content?: string;
  type?: PromptType;
  tags?: string[];
  favorite?: boolean;
  pinned?: boolean;
  archived?: boolean;
  projectId?: string;
}

export interface ListPromptsOptions {
  limit?: number;
  cursor?: number;
  projectId?: string;
  tag?: string;
  type?: string;
  favorite?: boolean;
  archived?: boolean;
}

/**
 * Prompt repository — owns the Redis keyspace for prompt records and their
 * indexes (user-level, project-level, tag-level, favorites, recent).
 *
 * @see docs/master-plan.md §13 Prompts, §56 Prompts API, §90 Data Consistency
 */

export async function createPrompt(
  userId: string,
  input: CreatePromptInput,
): Promise<Prompt> {
  const redis = requireRedis();
  const timestamp = now();
  const tags = normalizeTags(input.tags);

  const prompt: Prompt = {
    id: createId("prm"),
    userId,
    projectId: input.projectId,
    title: input.title,
    description: input.description,
    content: input.content,
    type: input.type,
    tags,
    favorite: false,
    pinned: false,
    archived: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  const pipeline = redis.pipeline();
  pipeline.set(keys.prompt(userId, prompt.id), JSON.stringify(prompt));
  pipeline.zadd(indexes.userPrompts(userId), {
    score: toScore(timestamp),
    member: prompt.id,
  });
  pipeline.zadd(indexes.projectPrompts(userId, input.projectId), {
    score: toScore(timestamp),
    member: prompt.id,
  });
  for (const tag of tags) {
    pipeline.zadd(indexes.tagPrompts(userId, tag), {
      score: toScore(timestamp),
      member: prompt.id,
    });
  }
  pipeline.zadd(indexes.userRecent(userId), {
    score: toScore(timestamp),
    member: prompt.id,
  });
  await pipeline.exec();
  return prompt;
}

export async function getPrompt(
  userId: string,
  promptId: string,
): Promise<Prompt | null> {
  return getEntity<Prompt>(keys.prompt(userId, promptId));
}

export async function updatePrompt(
  userId: string,
  promptId: string,
  input: UpdatePromptInput,
): Promise<Prompt | null> {
  const redis = requireRedis();
  const existing = await getPrompt(userId, promptId);
  if (!existing) {
    return null;
  }

  const tagsChanged = input.tags !== undefined;
  const projectChanged =
    input.projectId !== undefined && input.projectId !== existing.projectId;
  const favoriteChanged =
    input.favorite !== undefined && input.favorite !== existing.favorite;

  const tags =
    input.tags !== undefined ? normalizeTags(input.tags) : existing.tags;

  const updated: Prompt = {
    ...existing,
    ...input,
    tags,
    id: existing.id,
    userId: existing.userId,
    createdAt: existing.createdAt,
    updatedAt: now(),
  };

  const pipeline = redis.pipeline();
  pipeline.set(keys.prompt(userId, promptId), JSON.stringify(updated));

  // Update project index if the prompt moved projects.
  if (projectChanged) {
    pipeline.zrem(indexes.projectPrompts(userId, existing.projectId), promptId);
    pipeline.zadd(indexes.projectPrompts(userId, updated.projectId), {
      score: toScore(updated.updatedAt),
      member: promptId,
    });
  }

  // Rebuild tag indexes if tags changed.
  if (tagsChanged) {
    for (const oldTag of existing.tags) {
      if (!tags.includes(oldTag)) {
        pipeline.zrem(indexes.tagPrompts(userId, oldTag), promptId);
      }
    }
    for (const newTag of tags) {
      if (!existing.tags.includes(newTag)) {
        pipeline.zadd(indexes.tagPrompts(userId, newTag), {
          score: toScore(updated.updatedAt),
          member: promptId,
        });
      }
    }
  }

  // Update favorites index.
  if (favoriteChanged) {
    if (updated.favorite) {
      pipeline.zadd(indexes.userFavorites(userId), {
        score: toScore(updated.updatedAt),
        member: promptId,
      });
    } else {
      pipeline.zrem(indexes.userFavorites(userId), promptId);
    }
  }

  // Bump recent.
  pipeline.zadd(indexes.userRecent(userId), {
    score: toScore(updated.updatedAt),
    member: promptId,
  });

  await pipeline.exec();
  return updated;
}

export async function deletePrompt(
  userId: string,
  promptId: string,
): Promise<void> {
  const redis = requireRedis();
  const existing = await getPrompt(userId, promptId);
  if (!existing) {
    return;
  }

  const pipeline = redis.pipeline();
  pipeline.del(keys.prompt(userId, promptId));
  pipeline.zrem(indexes.userPrompts(userId), promptId);
  pipeline.zrem(indexes.projectPrompts(userId, existing.projectId), promptId);
  pipeline.zrem(indexes.userFavorites(userId), promptId);
  pipeline.zrem(indexes.userRecent(userId), promptId);
  for (const tag of existing.tags) {
    pipeline.zrem(indexes.tagPrompts(userId, tag), promptId);
  }
  await pipeline.exec();
}

export async function listPrompts(
  userId: string,
  options?: ListPromptsOptions,
): Promise<Prompt[]> {
  // Determine which index to read from.
  let indexKey: string;
  if (options?.favorite) {
    indexKey = indexes.userFavorites(userId);
  } else if (options?.projectId) {
    indexKey = indexes.projectPrompts(userId, options.projectId);
  } else if (options?.tag) {
    indexKey = indexes.tagPrompts(
      userId,
      normalizeTag(options.tag) ?? options.tag,
    );
  } else {
    indexKey = indexes.userPrompts(userId);
  }

  const ids = await listIndex(indexKey, {
    limit: options?.limit ?? 50,
    cursor: options?.cursor,
  });

  if (ids.length === 0) {
    return [];
  }

  const promptKeys = ids.map((id) => keys.prompt(userId, id));
  let prompts = await getEntities<Prompt>(promptKeys);

  // Apply client-side filters that don't have dedicated indexes.
  if (options?.archived === false) {
    prompts = prompts.filter((p) => !p.archived);
  } else if (options?.archived === undefined && options?.favorite !== true) {
    prompts = prompts.filter((p) => !p.archived);
  }
  if (options?.type) {
    prompts = prompts.filter((p) => p.type === options.type);
  }

  return prompts;
}

/** Record a prompt as recently accessed (used when opening it). */
export async function touchRecent(
  userId: string,
  promptId: string,
): Promise<void> {
  await addToIndex(indexes.userRecent(userId), promptId, toScore(now()));
}

function normalizeTag(tag: string): string | null {
  const normalized = tag.trim().toLowerCase().replace(/^#/, "").trim();
  return normalized.length > 0 ? normalized : null;
}
