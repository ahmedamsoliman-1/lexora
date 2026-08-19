import type { NextRequest } from "next/server";

import { createSessionSchema } from "@/schemas/auth";
import { errorResponse, json } from "@/server/api";
import {
  clearSession,
  createSession,
  getAuthUser,
} from "@/server/auth/session";
import { bootstrapUser } from "@/server/repositories/user-repository";

/**
 * Session cookie endpoints.
 *
 *   GET    /api/auth/session  → current session status
 *   POST   /api/auth/session  → exchange Firebase ID token for a session cookie
 *   DELETE /api/auth/session  → clear the session cookie (logout)
 */

export async function GET() {
  const user = await getAuthUser();
  return json({
    authenticated: Boolean(user),
    ...(user ? { user } : {}),
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as unknown;
    const parsed = createSessionSchema.safeParse(body);
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

    const user = await createSession(parsed.data.idToken);
    // Best-effort user profile bootstrap. Failures here must not block login.
    await bootstrapUser(user).catch(() => {});
    return json({ authenticated: true, user });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE() {
  try {
    await clearSession();
    return json({ authenticated: false });
  } catch (error) {
    return errorResponse(error);
  }
}
