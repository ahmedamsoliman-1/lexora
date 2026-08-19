/**
 * Serialization + timestamp helpers for Redis-backed entities.
 *
 * Entities are stored as JSON strings. Timestamps are UTC ISO-8601. Using
 * these helpers keeps serialization consistent across repositories and makes
 * the storage format easy to reason about.
 */

/** Current UTC timestamp as an ISO-8601 string. */
export function now(): string {
  return new Date().toISOString();
}

/** Serialize an entity to a JSON string for Redis storage. */
export function serialize<T>(entity: T): string {
  return JSON.stringify(entity);
}

/**
 * Deserialize a JSON string from Redis.
 * Returns `null` for `null`/`undefined` (key miss) and throws on malformed JSON
 * so callers can decide how to surface the error.
 */
export function deserialize<T>(data: string | null | undefined): T | null {
  if (data === null || data === undefined) {
    return null;
  }
  try {
    return JSON.parse(data) as T;
  } catch (error) {
    throw new Error(
      `Failed to deserialize entity: ${error instanceof Error ? error.message : "unknown error"}`,
    );
  }
}
