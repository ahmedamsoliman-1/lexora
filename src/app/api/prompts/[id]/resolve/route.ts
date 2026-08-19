import type { NextRequest } from "next/server";

import { z } from "zod";
import { errorResponse, json } from "@/server/api";
import { requireAuthUser } from "@/server/auth/session";
import { getPrompt } from "@/server/repositories/prompt-repository";
import { getBlocks } from "@/server/repositories/block-repository";
import { resolvePrompt } from "@/server/services/prompt-resolver";
import { extractBlockIds } from "@/lib/template-parser";

/**
 * POST /api/prompts/:id/resolve
 *
 * Request:  { variables?: Record<string, string> }
 * Response: { content, detectedVariables, missingBlockIds, missingVariables }
 *
 * @see docs/master-plan.md §17 Prompt Resolution Engine, §56 Prompts API
 */

const resolveSchema = z.object({
  variables: z.record(z.string(), z.string()).optional(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, ctx: RouteContext) {
  try {
    const { id } = await ctx.params;
    const user = await requireAuthUser();

    const prompt = await getPrompt(user.uid, id);
    if (!prompt) {
      return json(
        {
          code: "NOT_FOUND" as const,
          message: "Prompt not found.",
        },
        { status: 404 },
      );
    }

    const body = (await request.json().catch(() => ({}))) as unknown;
    const parsed = resolveSchema.safeParse(body);
    if (!parsed.success) {
      return json(
        {
          code: "VALIDATION_ERROR" as const,
          message: "Invalid request.",
          details: parsed.error.flatten(),
        },
        { status: 422 },
      );
    }

    // Fetch all referenced blocks.
    const blockIds = extractBlockIds(prompt.content);
    const blocks =
      blockIds.length > 0 ? await getBlocks(user.uid, blockIds) : [];

    const result = resolvePrompt({
      prompt: { content: prompt.content, title: prompt.title },
      blocks,
      variables: parsed.data.variables ?? {},
    });

    return json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
