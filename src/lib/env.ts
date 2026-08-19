import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

/**
 * Accepts an empty string as `undefined` so optional URL env vars don't fail
 * validation when present-but-empty (common in `.env` files).
 */
const optionalUrl = z.preprocess(
  (v) => (v === "" ? undefined : v),
  z.string().url().optional(),
);

/**
 * Strongly-typed environment variables.
 *
 * Server variables are only accessible from server components / route
 * handlers / server actions. Client variables are exposed to the browser via
 * the `NEXT_PUBLIC_` prefix.
 *
 * Any variable that is not yet required for the current implementation phase
 * is marked as optional so the application remains runnable locally without a
 * full infrastructure setup. Later phases will tighten these as needed.
 */
export const env = createEnv({
  server: {
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),

    // Firebase Admin
    FIREBASE_PROJECT_ID: z.string().optional(),
    FIREBASE_CLIENT_EMAIL: z.string().optional(),
    FIREBASE_PRIVATE_KEY: z.string().optional(),

    // Upstash Redis
    UPSTASH_REDIS_REST_URL: optionalUrl,
    UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

    // Writing provider
    WRITING_PROVIDER: z.enum(["languagetool", "none"]).default("languagetool"),
    LANGUAGETOOL_BASE_URL: optionalUrl,
    LANGUAGETOOL_API_KEY: z.string().optional(),
  },
  client: {
    NEXT_PUBLIC_APP_NAME: z.string().default("Lexora"),
    NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),

    NEXT_PUBLIC_FIREBASE_API_KEY: z.string().optional(),
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().optional(),
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().optional(),
    NEXT_PUBLIC_FIREBASE_APP_ID: z.string().optional(),
  },
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,

    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,

    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,

    WRITING_PROVIDER: process.env.WRITING_PROVIDER,
    LANGUAGETOOL_BASE_URL: process.env.LANGUAGETOOL_BASE_URL,
    LANGUAGETOOL_API_KEY: process.env.LANGUAGETOOL_API_KEY,

    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,

    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID:
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  },
  skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
});
