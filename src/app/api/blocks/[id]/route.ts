import type { NextRequest } from "next/server";

import { updateBlockSchema } from "@/schemas/block";
import { errorResponse, json } from "@/server/api";
import {
  deleteBlock,
  getBlock,
  updateBlock,
} from "@/server/services/block-service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 *   GET    /api/blocks/:id   → fetch a single block
 *   PATCH  /api/blocks/:id   → update fields / favorite
 *   DELETE /api/blocks/:id   → permanently delete
 */

export async function GET(_request: NextRequest, ctx: RouteContext) {
  try {
    const { id } = await ctx.params;
    const block = await getBlock(id);
    return json({ block });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: NextRequest, ctx: RouteContext) {
  try {
    const { id } = await ctx.params;
    const body = (await request.json()) as unknown;
    const parsed = updateBlockSchema.safeParse(body);
    if (!parsed.success) {
      return json(
        {
          code: "VALIDATION_ERROR" as const,
          message: "Invalid block data.",
          details: parsed.error.flatten(),
        },
        { status: 422 },
      );
    }

    const block = await updateBlock(id, parsed.data);
    return json({ block });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: NextRequest, ctx: RouteContext) {
  try {
    const { id } = await ctx.params;
    await deleteBlock(id);
    return json({ deleted: true });
  } catch (error) {
    return errorResponse(error);
  }
}
