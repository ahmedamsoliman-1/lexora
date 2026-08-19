import type { NextRequest } from "next/server";

import { createBlockSchema, listBlocksQuerySchema } from "@/schemas/block";
import { errorResponse, json } from "@/server/api";
import { createBlock, listBlocks } from "@/server/services/block-service";

/**
 *   GET    /api/blocks   → list the authenticated user's blocks
 *   POST   /api/blocks   → create a new block
 */

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const parsed = listBlocksQuerySchema.safeParse({
      tag: url.searchParams.get("tag") ?? undefined,
      favorite: url.searchParams.get("favorite") ?? undefined,
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

    const blocks = await listBlocks({
      tag: parsed.data.tag,
      favorite: parsed.data.favorite,
      limit: parsed.data.limit,
      cursor: parsed.data.cursor,
    });

    return json({ blocks });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as unknown;
    const parsed = createBlockSchema.safeParse(body);
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

    const block = await createBlock(parsed.data);
    return json({ block }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
