import { Redis } from "@upstash/redis";

import { redis } from "@/server/redis/client";
import { deserialize, serialize } from "@/server/redis/serialize";
import { AppError } from "@/server/errors";

/**
 * Common repository operations backed by Upstash Redis.
 *
 * Every method enforces that Redis is configured before touching the client.
 * Business logic calls these helpers rather than issuing Redis commands
 * directly, keeping the keyspace and serialization concerns centralized.
 */

/** Ensure Redis is available; throw a normalized error otherwise. */
export function requireRedis(): Redis {
  if (!redis) {
    throw new AppError(
      "INTERNAL_ERROR",
      "Persistence is not configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.",
    );
  }
  return redis;
}

/** Store an entity as a JSON string. */
export async function setEntity<T>(key: string, entity: T): Promise<void> {
  const client = requireRedis();
  await client.set(key, serialize(entity));
}

/** Fetch and deserialize an entity. Returns `null` on key miss. */
export async function getEntity<T>(key: string): Promise<T | null> {
  const client = requireRedis();
  const data = await client.get<string>(key);
  return deserialize<T>(data);
}

/** Delete an entity record. */
export async function deleteEntity(key: string): Promise<void> {
  const client = requireRedis();
  await client.del(key);
}

/**
 * Add an ID to a sorted-set index scored by timestamp.
 * Used for `user:prompts`, `project:prompts`, `user:recent`, etc.
 */
export async function addToIndex(
  indexKey: string,
  id: string,
  score: number,
): Promise<void> {
  const client = requireRedis();
  await client.zadd(indexKey, { score, member: id });
}

/** Remove an ID from a sorted-set index. */
export async function removeFromIndex(
  indexKey: string,
  id: string,
): Promise<void> {
  const client = requireRedis();
  await client.zrem(indexKey, id);
}

/** Paginated range from a sorted-set index (newest first by default). */
export async function listIndex(
  indexKey: string,
  options?: { limit?: number; cursor?: number },
): Promise<string[]> {
  const client = requireRedis();
  const limit = options?.limit ?? 50;
  const cursor = options?.cursor ?? Date.now();
  // ZREVRANGEBYSCORE: newest (highest score) first, up to the cursor timestamp.
  const results = await client.zrange(
    indexKey,
    `(${cursor}`, // exclusive — pagination cursor
    "-inf",
    { byScore: true, rev: true, offset: 0, count: limit },
  );
  return results.map((r) => String(r));
}

/** Fetch multiple entities by key, preserving order, skipping misses. */
export async function getEntities<T>(keys: string[]): Promise<T[]> {
  if (keys.length === 0) return [];
  const client = requireRedis();
  const data = await client.mget<string[]>(...keys);
  return data
    .map((d) => deserialize<T>(d))
    .filter((entity): entity is T => entity !== null);
}

/** Convert an ISO-8601 timestamp to a numeric score for sorted sets. */
export function toScore(iso: string): number {
  return new Date(iso).getTime();
}
