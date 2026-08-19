import type { NextRequest } from "next/server";

import {
  createProjectSchema,
  listProjectsQuerySchema,
} from "@/schemas/project";
import { errorResponse, json } from "@/server/api";
import { createProject, listProjects } from "@/server/services/project-service";

/**
 *   GET    /api/projects   → list the authenticated user's projects
 *   POST   /api/projects   → create a new project
 */

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const parsed = listProjectsQuerySchema.safeParse({
      archived: url.searchParams.get("archived") ?? undefined,
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

    const projects = await listProjects({
      limit: parsed.data.limit,
      cursor: parsed.data.cursor,
      includeArchived: parsed.data.archived,
    });

    return json({ projects });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as unknown;
    const parsed = createProjectSchema.safeParse(body);
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

    const project = await createProject(parsed.data);
    return json({ project }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
