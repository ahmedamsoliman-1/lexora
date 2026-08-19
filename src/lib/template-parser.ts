import type { PromptVariable } from "@/types/domain";

/**
 * Regex for detecting template variables: `{{variable_name}}`
 *
 * - Must start with a letter or underscore
 * - Can contain letters, digits, underscores, hyphens
 * - Whitespace inside the braces is trimmed
 */
const VARIABLE_REGEX = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_-]*)\s*\}\}/g;

/**
 * Regex for detecting block references: `{{block:block_id}}`
 *
 * Block IDs use the `blk_` prefix per our ULID convention.
 */
const BLOCK_REF_REGEX = /\{\{\s*block:([a-zA-Z0-9_]+)\s*\}\}/g;

/** A parsed block reference found in prompt content. */
export interface BlockReference {
  /** The raw matched text, e.g. `{{block:blk_01ABC}}`. */
  raw: string;
  /** The block ID extracted from the reference. */
  blockId: string;
  /** Character offset in the source text. */
  offset: number;
  /** Length of the matched text. */
  length: number;
}

/** A parsed variable found in prompt content. */
export interface ParsedVariable {
  /** The raw matched text, e.g. `{{project_name}}`. */
  raw: string;
  /** The variable name extracted from the reference. */
  name: string;
  /** Character offset in the source text. */
  offset: number;
  /** Length of the matched text. */
  length: number;
}

/**
 * Extract all block references from text.
 *
 * @see docs/master-plan.md §15 Block References
 */
export function parseBlockReferences(text: string): BlockReference[] {
  const refs: BlockReference[] = [];
  const regex = new RegExp(BLOCK_REF_REGEX);
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const blockId = match[1];
    if (!blockId) continue;
    refs.push({
      raw: match[0],
      blockId,
      offset: match.index,
      length: match[0].length,
    });
  }

  return refs;
}

/**
 * Extract all template variables from text (excluding block references).
 *
 * @see docs/master-plan.md §16 Prompt Variables
 */
export function parseVariables(text: string): ParsedVariable[] {
  const vars: ParsedVariable[] = [];
  const blockRegex = new RegExp(BLOCK_REF_REGEX);
  const regex = new RegExp(VARIABLE_REGEX);
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    // Skip if this is actually a block reference.
    if (blockRegex.test(match[0])) {
      continue;
    }
    const name = match[1];
    if (!name) continue;
    vars.push({
      raw: match[0],
      name,
      offset: match.index,
      length: match[0].length,
    });
  }

  return vars;
}

/**
 * Detect unique variable names from text, returning PromptVariable objects.
 * Variables without a default have no `defaultValue`.
 */
export function detectVariables(text: string): PromptVariable[] {
  const vars = parseVariables(text);
  const seen = new Set<string>();
  const result: PromptVariable[] = [];

  for (const v of vars) {
    if (!seen.has(v.name)) {
      seen.add(v.name);
      result.push({ name: v.name });
    }
  }

  return result.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Extract all unique block IDs referenced in the text.
 */
export function extractBlockIds(text: string): string[] {
  const refs = parseBlockReferences(text);
  const seen = new Set<string>();
  const result: string[] = [];

  for (const ref of refs) {
    if (!seen.has(ref.blockId)) {
      seen.add(ref.blockId);
      result.push(ref.blockId);
    }
  }

  return result;
}
