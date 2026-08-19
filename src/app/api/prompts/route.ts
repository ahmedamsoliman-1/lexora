import type { NextRequest } from "next/server";

import { createPromptSchema, listPromptsQuerySchema } from "@/schemas/prompt";
import { errorResponse, json } from "@/server/api";
import { createPrompt, listPrompts } from "@/server/services/prompt-service";

/**
 *   GET    /api/prompts   → list the authenticated user's prompts (with filters)
 *   POST   /api/prompts   → create a new prompt
 */

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const parsed = listPromptsQuerySchema.safeParse({
      projectId: url.searchParams.get("projectId") ?? undefined,
      tag: url.searchParams.get("tag") ?? undefined,
      type: url.searchParams.get("type") ?? undefined,
      favorite: url.searchParams.get("favorite") ?? undefined,
      archived: url.searchParams.get("archived") ?? undefined,
      query: url.searchParams.get("query") ?? undefined,
      limit: url.searchParams.get("limit") ?? undefined,
      cursor: url.searchParams.get("cursor") ?? undefined,
    });
    if (!parsed.success) {
      return json(
        {
          code: "VALIDATION_ERROR" as const,
          message: "Invalid query parameters.",
          details: parsed.error.flatten(),
        },
        { status: 422 },
      );
    }

    const prompts = await listPrompts({
      projectId: parsed.data.projectId,
      tag: parsed.data.tag,
      type: parsed.data.type,
      favorite: parsed.data.favorite,
      archived: parsed.data.archived,
      limit: parsed.data.limit,
      cursor: parsed.data.cursor,
    });

    return json({ prompts });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as unknown;
    const parsed = createPromptSchema.safeParse(body);
    if (!parsed.success) {
      return json(
        {
          code: "VALIDATION_ERROR" as const,
          message: "Invalid prompt data.",
          details: parsed.error.flatten(),
        },
        { status: 422 },
      );
    }

    const prompt = await createPrompt(parsed.data);
    return json({ prompt }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
