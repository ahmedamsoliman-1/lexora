/**
 * Writing assistance types — the normalized format the editor depends on.
 *
 * Provider-specific response shapes (LanguageTool, future providers) are
 * normalized into these types before crossing the BFF boundary. The editor
 * never sees provider-specific structures.
 *
 * @see docs/master-plan.md §20 Writing Provider Interface
 */

export type WritingIssueCategory =
  "spelling" | "grammar" | "punctuation" | "style" | "typography" | "other";

export interface WritingIssue {
  /** Stable unique ID for this issue (used as React key, decoration key, etc.). */
  id: string;
  message: string;
  shortMessage?: string;
  /** Character offset in the original text where the issue starts. */
  offset: number;
  /** Length of the problematic text span. */
  length: number;
  category: WritingIssueCategory;
  /** Suggested replacements, ordered by relevance. */
  replacements: string[];
  /** Provider-specific rule ID (e.g. LanguageTool's rule id). Optional. */
  ruleId?: string;
}

export interface WritingCheckInput {
  text: string;
  language?: string;
}

export interface WritingCheckResult {
  language: string;
  issues: WritingIssue[];
}

/**
 * The provider abstraction. The BFF's WritingService depends on this
 * interface, not on any specific provider's API.
 *
 * @see docs/master-plan.md §19, §20, §21
 */
export interface WritingProvider {
  /** Provider identifier (e.g. "languagetool"). Used in cache keys. */
  readonly name: string;
  check(input: WritingCheckInput): Promise<WritingCheckResult>;
}
