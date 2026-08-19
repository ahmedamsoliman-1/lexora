/**
 * Tag normalization helpers.
 *
 * Tag names are lowercased, trimmed, and stripped of leading `#` so that
 * `#NextJS`, `NextJS`, and `nextjs` all resolve to the same tag.
 *
 * @see docs/master-plan.md §40 Tags
 */

/** Normalize a single tag name. Returns `null` for empty/whitespace input. */
export function normalizeTag(tag: string): string | null {
  const normalized = tag.trim().toLowerCase().replace(/^#+/, "").trim();
  return normalized.length > 0 ? normalized : null;
}

/** Normalize an array of tags, deduplicating and sorting the result. */
export function normalizeTags(tags: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const tag of tags) {
    const normalized = normalizeTag(tag);
    if (normalized && !seen.has(normalized)) {
      seen.add(normalized);
      result.push(normalized);
    }
  }
  return result.sort();
}
