import { createHash, randomUUID } from "node:crypto";

import { env } from "@/lib/env";
import { AppError } from "@/server/errors";
import type {
  WritingCheckInput,
  WritingCheckResult,
  WritingIssue,
  WritingIssueCategory,
  WritingProvider,
} from "@/server/writing/types";

/**
 * LanguageTool-compatible HTTP API provider.
 *
 * Normalizes LanguageTool's native response into the provider-agnostic
 * `WritingIssue[]` format. The editor never sees the raw LanguageTool shape.
 *
 * @see docs/master-plan.md §21 LanguageTool Integration
 */

interface LanguageToolMatch {
  message: string;
  shortMessage?: string;
  offset: number;
  length: number;
  replacements: { value: string }[];
  rule: {
    id: string;
    category: { id: string };
  };
}

interface LanguageToolResponse {
  language?: { code?: string };
  matches?: LanguageToolMatch[];
}

/** Map LanguageTool category IDs to our normalized categories. */
function mapCategory(categoryId: string): WritingIssueCategory {
  if (categoryId.startsWith("TYPO_") || categoryId === "TYPOS") {
    return "spelling";
  }
  if (categoryId.startsWith("GRAMMAR") || categoryId === "GRAMMAR") {
    return "grammar";
  }
  if (categoryId.startsWith("PUNCTUATION") || categoryId === "PUNCTUATION") {
    return "punctuation";
  }
  if (categoryId.startsWith("STYLE") || categoryId === "STYLE") {
    return "style";
  }
  if (categoryId.startsWith("TYPOGRAPHY") || categoryId === "TYPOGRAPHY") {
    return "typography";
  }
  return "other";
}

/** Normalize a LanguageTool match to a WritingIssue. */
function normalizeMatch(match: LanguageToolMatch): WritingIssue {
  return {
    id: `issue_${randomUUID()}`,
    message: match.message,
    shortMessage: match.shortMessage,
    offset: match.offset,
    length: match.length,
    category: mapCategory(match.rule.category.id),
    replacements: match.replacements.map((r) => r.value).filter(Boolean),
    ruleId: match.rule.id,
  };
}

export class LanguageToolProvider implements WritingProvider {
  readonly name = "languagetool";

  async check(input: WritingCheckInput): Promise<WritingCheckResult> {
    const baseUrl = env.LANGUAGETOOL_BASE_URL;
    if (!baseUrl) {
      throw new AppError(
        "WRITING_PROVIDER_UNAVAILABLE",
        "Writing provider is not configured.",
      );
    }

    const params = new URLSearchParams();
    params.set("text", input.text);
    params.set("language", input.language ?? "auto");
    params.set("level", "default");
    if (env.LANGUAGETOOL_API_KEY) {
      params.set("apiKey", env.LANGUAGETOOL_API_KEY);
    }

    let response: Response;
    try {
      response = await fetch(`${baseUrl}/check`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      });
    } catch {
      throw new AppError(
        "WRITING_PROVIDER_UNAVAILABLE",
        "Could not reach the writing provider.",
      );
    }

    if (response.status === 429) {
      throw new AppError(
        "WRITING_PROVIDER_RATE_LIMITED",
        "Writing provider rate limit reached. Please slow down.",
      );
    }

    if (!response.ok) {
      throw new AppError(
        "WRITING_PROVIDER_UNAVAILABLE",
        "Writing provider returned an error.",
      );
    }

    const data = (await response.json()) as LanguageToolResponse;
    const issues = (data.matches ?? []).map(normalizeMatch);

    return {
      language: data.language?.code ?? input.language ?? "auto",
      issues,
    };
  }
}

/**
 * A no-op provider used when `WRITING_PROVIDER=none` or when the configured
 * provider is unavailable. Returns zero issues so the editor continues to
 * work normally — writing assistance is an enhancement, not a dependency.
 */
export class NoopWritingProvider implements WritingProvider {
  readonly name = "none";
  async check(input: WritingCheckInput): Promise<WritingCheckResult> {
    return {
      language: input.language ?? "auto",
      issues: [],
    };
  }
}

/** Resolve the active writing provider based on environment configuration. */
export function getWritingProvider(): WritingProvider {
  switch (env.WRITING_PROVIDER) {
    case "languagetool":
      return new LanguageToolProvider();
    case "none":
    default:
      return new NoopWritingProvider();
  }
}

/**
 * Calculate the cache key hash for a writing check.
 *
 * Hash = SHA-256(`provider|language|text|configVersion`)
 *
 * @see docs/master-plan.md §23 Writing Cache
 */
export function writingCacheHash(
  provider: string,
  language: string,
  text: string,
): string {
  const input = `${provider}|${language}|${text}`;
  return createHash("sha256").update(input).digest("hex");
}
