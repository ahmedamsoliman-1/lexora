import { Redis } from "@upstash/redis";

import { env } from "@/lib/env";

/**
 * Upstash Redis client singleton (server-only).
 *
 * Uses the REST API which is ideal for serverless (Vercel) — no long-lived
 * connections. When the environment variables are absent the client is `null`
 * and repositories return a normalized "service unavailable" error so the app
 * remains runnable without infrastructure.
 *
 * This module must never be imported from client code.
 */

export const isRedisConfigured = Boolean(
  env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN,
);

export const redis: Redis | null = isRedisConfigured
  ? new Redis({
      url: env.UPSTASH_REDIS_REST_URL!,
      token: env.UPSTASH_REDIS_REST_TOKEN!,
      automaticDeserialization: false,
    })
  : null;
