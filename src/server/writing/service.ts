import { redis } from "@/server/redis/client";
import { caches, indexes, rateLimits } from "@/server/redis/keys";
import { requireAuthUser } from "@/server/auth/session";
import { AppError } from "@/server/errors";
import { env } from "@/lib/env";
import {
  getWritingProvider,
  writingCacheHash,
} from "@/server/writing/languagetool";
import type {
  WritingCheckInput,
  WritingCheckResult,
} from "@/server/writing/types";

/**
 * Writing service — orchestrates provider calls with caching, rate limiting,
 * and personal-dictionary filtering.
 *
 * @see docs/master-plan.md §22 Writing Check Behavior, §23 Writing Cache,
 *      §27 Personal Dictionary, §62 Rate Limiting
 */

const CACHE_TTL = 60 * 60 * 24; // 24 hours
const RATE_LIMIT_WINDOW = 60; // 1 minute
const RATE_LIMIT_MAX = 30; // 30 checks per minute

/** Personal dictionary operations. */
export async function getDictionary(): Promise<string[]> {
  const user = await requireAuthUser();
  if (!redis) return [];
  const members = await redis.smembers(indexes.userDictionary(user.uid));
  return members.sort();
}

export async function addToDictionary(word: string): Promise<string[]> {
  const user = await requireAuthUser();
  if (!redis) return [];
  const normalized = word.trim().toLowerCase();
  if (!normalized) return getDictionary();
  await redis.sadd(indexes.userDictionary(user.uid), normalized);
  return getDictionary();
}

export async function removeFromDictionary(word: string): Promise<string[]> {
  const user = await requireAuthUser();
  if (!redis) return [];
  await redis.srem(indexes.userDictionary(user.uid), word.trim().toLowerCase());
  return getDictionary();
}

/** Check if the user has exceeded the writing check rate limit. */
async function checkRateLimit(uid: string): Promise<void> {
  if (!redis) return;
  const key = rateLimits.writing(uid);
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, RATE_LIMIT_WINDOW);
  }
  if (count > RATE_LIMIT_MAX) {
    throw new AppError(
      "WRITING_PROVIDER_RATE_LIMITED",
      "Too many writing checks. Please slow down.",
    );
  }
}

/**
 * Filter out issues that match a word in the user's personal dictionary.
 * Compares the problematic text span against dictionary entries.
 */
function filterDictionaryIssues(
  issues: WritingCheckResult["issues"],
  text: string,
  dictionary: Set<string>,
): WritingCheckResult["issues"] {
  if (dictionary.size === 0) return issues;
  return issues.filter((issue) => {
    const word = text
      .slice(issue.offset, issue.offset + issue.length)
      .toLowerCase();
    return !dictionary.has(word);
  });
}

/**
 * Run a writing check with caching, rate limiting, and dictionary filtering.
 *
 * Flow:
 *   1. Check rate limit
 *   2. Calculate hash → check Redis cache
 *   3. If cache miss → call provider
 *   4. Filter issues against personal dictionary
 *   5. Return normalized result
 */
export async function checkWriting(
  input: WritingCheckInput,
): Promise<WritingCheckResult> {
  const user = await requireAuthUser();
  await checkRateLimit(user.uid);

  const provider = getWritingProvider();
  const language = input.language ?? "auto";

  // Check cache (if Redis is configured).
  if (redis) {
    const hash = writingCacheHash(provider.name, language, input.text);
    const cached = await redis.get<string>(caches.writing(hash));
    if (cached) {
      const result = JSON.parse(cached) as WritingCheckResult;
      // Still apply dictionary filtering on cache hits.
      const dictionary = new Set(
        await redis.smembers(indexes.userDictionary(user.uid)),
      );
      return {
        ...result,
        issues: filterDictionaryIssues(result.issues, input.text, dictionary),
      };
    }
  }

  // Call the provider.
  const result = await provider.check({ text: input.text, language });

  // Cache the result (if Redis is configured).
  if (redis) {
    const hash = writingCacheHash(provider.name, language, input.text);
    await redis.set(caches.writing(hash), JSON.stringify(result), {
      ex: CACHE_TTL,
    });
  }

  // Filter against personal dictionary.
  if (redis) {
    const dictionary = new Set(
      await redis.smembers(indexes.userDictionary(user.uid)),
    );
    return {
      ...result,
      issues: filterDictionaryIssues(result.issues, input.text, dictionary),
    };
  }

  return result;
}

/** Whether writing assistance is available (provider configured + Redis up). */
export function isWritingAvailable(): boolean {
  return env.WRITING_PROVIDER !== "none";
}
