import { ulid } from "ulid";

/**
 * Generate sortable, prefixed unique IDs.
 *
 * Prefixes aid debugging and make IDs self-describing in the Redis keyspace:
 *
 *   prj_01J...  project
 *   prm_01J...  prompt
 *   blk_01J...  block
 *   ver_01J...  prompt version
 *   usr_01J...  user profile
 */

export type EntityPrefix = "prj" | "prm" | "blk" | "ver" | "usr";

export function createId(prefix: EntityPrefix): string {
  return `${prefix}_${ulid()}`;
}
