import type { NextRequest } from "next/server";

import { updatePromptSchema } from "@/schemas/prompt";
import { errorResponse, json } from "@/server/api";
import {
  archivePrompt,
  deletePrompt,
  favoritePrompt,
  getPrompt,
  unarchivePrompt,
  unfavoritePrompt,
  updatePrompt,
} from "@/server/services/prompt-service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 *   GET    /api/prompts/:id   → fetch a single prompt
 *   PATCH  /api/prompts/:id   → update fields / favorite / archive
 *   DELETE /api/prompts/:id   → permanently delete
 */

export async function GET(_request: NextRequest, ctx: RouteContext) {
  try {
    const { id } = await ctx.params;
    const prompt = await getPrompt(id);
    return json({ prompt });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: NextRequest, ctx: RouteContext) {
  try {
    const { id } = await ctx.params;
    const body = (await request.json()) as unknown;
    const parsed = updatePromptSchema.safeParse(body);
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

    const data = parsed.data;

    // Convenience actions mapped from the same PATCH endpoint.
    if (data.favorite === true) {
      const prompt = await favoritePrompt(id);
      return json({ prompt });
    }
    if (data.favorite === false) {
      const prompt = await unfavoritePrompt(id);
      return json({ prompt });
    }
    if (data.archived === true) {
      const prompt = await archivePrompt(id);
      return json({ prompt });
    }
    if (data.archived === false) {
      const prompt = await unarchivePrompt(id);
      return json({ prompt });
    }

    const prompt = await updatePrompt(id, data);
    return json({ prompt });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: NextRequest, ctx: RouteContext) {
  try {
    const { id } = await ctx.params;
    await deletePrompt(id);
    return json({ deleted: true });
  } catch (error) {
    return errorResponse(error);
  }
}
