import type { Block, Prompt, PromptVariable } from "@/types/domain";
import { AppError } from "@/server/errors";
import {
  detectVariables,
  extractBlockIds,
  parseBlockReferences,
} from "@/lib/template-parser";

export interface ResolvePromptInput {
  prompt: Pick<Prompt, "content" | "title">;
  blocks: Block[];
  /** Variable values keyed by name. */
  variables?: Record<string, string>;
}

export interface ResolvedPrompt {
  content: string;
  /** Variables detected in the prompt (after block resolution). */
  detectedVariables: PromptVariable[];
  /** Block IDs that were referenced but not found. */
  missingBlockIds: string[];
  /** Variable names that were required but not provided. */
  missingVariables: string[];
}

/**
 * The prompt resolution engine.
 *
 * Flow:
 *   1. Resolve block references (with circular reference detection)
 *   2. Resolve template variables
 *   3. Validate (missing blocks, missing variables)
 *
 * @see docs/master-plan.md §17 Prompt Resolution Engine
 */
export function resolvePrompt(input: ResolvePromptInput): ResolvedPrompt {
  const { prompt, blocks, variables = {} } = input;

  const blockMap = new Map<string, Block>();
  for (const block of blocks) {
    blockMap.set(block.id, block);
  }

  // 1. Resolve block references.
  const blockIds = extractBlockIds(prompt.content);
  const missingBlockIds: string[] = [];
  const visited = new Set<string>();

  let resolvedContent = resolveBlocks(
    prompt.content,
    blockMap,
    blockIds,
    missingBlockIds,
    visited,
  );

  // 2. Detect variables (after block resolution, since blocks may introduce
  //    their own variables).
  const detectedVariables = detectVariables(resolvedContent);

  // 3. Resolve variables.
  const missingVariables: string[] = [];
  for (const v of detectedVariables) {
    const value = variables[v.name];
    if (value === undefined || value === "") {
      missingVariables.push(v.name);
    } else {
      resolvedContent = resolvedContent.replaceAll(
        new RegExp(`\\{\\{\\s*${escapeRegex(v.name)}\\s*\\}\\}`, "g"),
        value,
      );
    }
  }

  return {
    content: resolvedContent,
    detectedVariables,
    missingBlockIds,
    missingVariables,
  };
}

/**
 * Recursively resolve block references in text.
 * Detects circular references by tracking visited block IDs in the chain.
 */
function resolveBlocks(
  text: string,
  blockMap: Map<string, Block>,
  blockIds: string[],
  missingBlockIds: string[],
  visited: Set<string>,
): string {
  const refs = parseBlockReferences(text);
  if (refs.length === 0) {
    return text;
  }

  let result = text;
  // Process refs from last to first so offsets stay valid.
  for (let i = refs.length - 1; i >= 0; i--) {
    const ref = refs[i];
    if (!ref) continue;

    const block = blockMap.get(ref.blockId);
    if (!block) {
      if (!missingBlockIds.includes(ref.blockId)) {
        missingBlockIds.push(ref.blockId);
      }
      // Leave the reference in place — the user sees it's unresolved.
      continue;
    }

    // Circular reference detection.
    if (visited.has(ref.blockId)) {
      throw new AppError(
        "PROMPT_CIRCULAR_REFERENCE",
        `Circular block reference detected: ${ref.blockId}`,
      );
    }

    // Recursively resolve blocks within the block's content.
    visited.add(ref.blockId);
    const innerBlockIds = extractBlockIds(block.content);
    const resolvedInner = resolveBlocks(
      block.content,
      blockMap,
      innerBlockIds,
      missingBlockIds,
      new Set(visited),
    );

    result =
      result.slice(0, ref.offset) +
      resolvedInner +
      result.slice(ref.offset + ref.length);
  }

  return result;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
