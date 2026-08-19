import type { NextRequest } from "next/server";

import { writingCheckSchema } from "@/schemas/writing";
import { errorResponse, json } from "@/server/api";
import { checkWriting } from "@/server/writing/service";

/**
 * POST /api/writing/check
 *
 * Request:  { text: string, language?: string }
 * Response: { language: string, issues: WritingIssue[] }
 *
 * The editor calls this endpoint (debounced) to get inline writing issues.
 * Provider failures return a 503 so the editor can show "unavailable"
 * without blocking editing or saving.
 *
 * @see docs/master-plan.md §58 Writing API
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as unknown;
    const parsed = writingCheckSchema.safeParse(body);
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

    const result = await checkWriting({
      text: parsed.data.text,
      language: parsed.data.language,
    });

    return json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
