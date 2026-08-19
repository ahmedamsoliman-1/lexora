/**
 * Redis key namespace helpers.
 *
 * All keys are prefixed with `lexora:v1:`. Every helper is user-scoped so
 * queries never cross tenant boundaries. Application code must never use
 * `KEYS *`; all lookups go through the explicit indexes maintained here.
 *
 * @see docs/master-plan.md §9 Redis Namespace
 */

const NS = "lexora:v1";

/** Entity records (hashes / strings). */
export const keys = {
  user: (uid: string) => `${NS}:user:${uid}`,
  project: (uid: string, projectId: string) =>
    `${NS}:project:${uid}:${projectId}`,
  prompt: (uid: string, promptId: string) => `${NS}:prompt:${uid}:${promptId}`,
  block: (uid: string, blockId: string) => `${NS}:block:${uid}:${blockId}`,
  promptVersion: (uid: string, versionId: string) =>
    `${NS}:promptversion:${uid}:${versionId}`,
} as const;

/** Sorted-set / set indexes for listing. */
export const indexes = {
  userProjects: (uid: string) => `${NS}:user:${uid}:projects`,
  userPrompts: (uid: string) => `${NS}:user:${uid}:prompts`,
  userBlocks: (uid: string) => `${NS}:user:${uid}:blocks`,
  projectPrompts: (uid: string, projectId: string) =>
    `${NS}:project:${uid}:${projectId}:prompts`,
  userFavorites: (uid: string) => `${NS}:user:${uid}:favorites`,
  userRecent: (uid: string) => `${NS}:user:${uid}:recent`,
  userTags: (uid: string) => `${NS}:user:${uid}:tags`,
  tagPrompts: (uid: string, tag: string) => `${NS}:tag:${uid}:${tag}:prompts`,
  promptVersions: (uid: string, promptId: string) =>
    `${NS}:prompt:${uid}:${promptId}:versions`,
  userDictionary: (uid: string) => `${NS}:user:${uid}:dictionary`,
  ignoredRules: (uid: string) => `${NS}:user:${uid}:writing:ignored-rules`,
} as const;

/** Ephemeral caches with a TTL. */
export const caches = {
  writing: (hash: string) => `${NS}:writing:${hash}`,
} as const;

/** Rate-limit keys. */
export const rateLimits = {
  writing: (uid: string) => `${NS}:ratelimit:writing:${uid}`,
  search: (uid: string) => `${NS}:ratelimit:search:${uid}`,
} as const;
