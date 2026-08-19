import type { NextRequest } from "next/server";

import {
  addDictionaryWordSchema,
  removeDictionaryWordSchema,
} from "@/schemas/writing";
import { errorResponse, json } from "@/server/api";
import {
  addToDictionary,
  getDictionary,
  removeFromDictionary,
} from "@/server/writing/service";

/**
 *   GET    /api/writing/dictionary           → list personal dictionary
 *   POST   /api/writing/dictionary           → add a word
 *   DELETE /api/writing/dictionary?word=...  → remove a word
 *
 * @see docs/master-plan.md §27 Personal Dictionary
 */
export async function GET() {
  try {
    const words = await getDictionary();
    return json({ words });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as unknown;
    const parsed = addDictionaryWordSchema.safeParse(body);
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
    const words = await addToDictionary(parsed.data.word);
    return json({ words });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const word = url.searchParams.get("word");
    const parsed = removeDictionaryWordSchema.safeParse({ word: word ?? "" });
    if (!parsed.success) {
      return json(
        {
          code: "VALIDATION_ERROR" as const,
          message: "Word parameter is required.",
          details: parsed.error.flatten(),
        },
        { status: 422 },
      );
    }
    const words = await removeFromDictionary(parsed.data.word);
    return json({ words });
  } catch (error) {
    return errorResponse(error);
  }
}
