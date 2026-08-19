import type { NextRequest } from "next/server";

import { updateProjectSchema } from "@/schemas/project";
import { errorResponse, json } from "@/server/api";
import {
  archiveProject,
  deleteProject,
  getProject,
  pinProject,
  restoreProject,
  unpinProject,
  updateProject,
} from "@/server/services/project-service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 *   GET    /api/projects/:id   → fetch a single project
 *   PATCH  /api/projects/:id   → update fields / pin / archive / restore
 *   DELETE /api/projects/:id   → permanently delete
 */

export async function GET(_request: NextRequest, ctx: RouteContext) {
  try {
    const { id } = await ctx.params;
    const project = await getProject(id);
    return json({ project });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: NextRequest, ctx: RouteContext) {
  try {
    const { id } = await ctx.params;
    const body = (await request.json()) as unknown;
    const parsed = updateProjectSchema.safeParse(body);
    if (!parsed.success) {
      return json(
        {
          code: "VALIDATION_ERROR" as const,
          message: "Invalid project data.",
          details: parsed.error.flatten(),
        },
        { status: 422 },
      );
    }

    const data = parsed.data;

    // Convenience actions mapped from the same PATCH endpoint.
    if (data.pinned === true) {
      const project = await pinProject(id);
      return json({ project });
    }
    if (data.pinned === false) {
      const project = await unpinProject(id);
      return json({ project });
    }
    if (data.archived === true) {
      const project = await archiveProject(id);
      return json({ project });
    }
    if (data.archived === false) {
      const project = await restoreProject(id);
      return json({ project });
    }

    const project = await updateProject(id, data);
    return json({ project });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: NextRequest, ctx: RouteContext) {
  try {
    const { id } = await ctx.params;
    await deleteProject(id);
    return json({ deleted: true });
  } catch (error) {
    return errorResponse(error);
  }
}
