import { cookies } from "next/headers";

import {
  adminAuth,
  isFirebaseAdminConfigured,
  SESSION_COOKIE_MAX_AGE,
} from "@/server/auth/firebase-admin";
import { AppError } from "@/server/errors";
import type { AuthUser } from "@/types";

/**
 * Session cookie management.
 *
 * Flow:
 *   Browser (Firebase client SDK) → ID token → POST /api/auth/session
 *   → verifyIdToken → createSessionCookie → httpOnly cookie
 *
 * Subsequent requests carry the httpOnly cookie; the server verifies it with
 * verifySessionCookie to resolve the authenticated UID. Client-supplied user
 * IDs are never trusted.
 */

export const SESSION_COOKIE_NAME = "lexora-session";

/**
 * Create a session cookie from a Firebase ID token.
 * Returns the user that was authenticated.
 */
export async function createSession(idToken: string): Promise<AuthUser> {
  if (!isFirebaseAdminConfigured || !adminAuth) {
    throw new AppError(
      "AUTH_NOT_CONFIGURED",
      "Authentication is not configured on the server.",
    );
  }

  const decoded = await adminAuth.verifyIdToken(idToken);
  const expiresIn = SESSION_COOKIE_MAX_AGE;
  const sessionCookie = await adminAuth.createSessionCookie(idToken, {
    expiresIn,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(expiresIn / 1000),
  });

  return {
    uid: decoded.uid,
    email: decoded.email ?? null,
    displayName: decoded.name ?? null,
    photoURL: decoded.picture ?? null,
  };
}

/**
 * Clear the session cookie (logout).
 */
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Resolve the authenticated user from the session cookie.
 * Returns `null` when there is no session or auth is not configured — callers
 * decide how to handle that (e.g. redirect to login).
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  if (!isFirebaseAdminConfigured || !adminAuth) {
    return null;
  }

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) {
    return null;
  }

  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    return {
      uid: decoded.uid,
      email: decoded.email ?? null,
      displayName: decoded.name ?? null,
      photoURL: decoded.picture ?? null,
    };
  } catch {
    return null;
  }
}

/**
 * Require an authenticated user. Throws `AppError("UNAUTHORIZED")` when no
 * valid session exists. Use in route handlers / server actions that need a
 * verified UID.
 */
export async function requireAuthUser(): Promise<AuthUser> {
  const user = await getAuthUser();
  if (!user) {
    throw new AppError("UNAUTHORIZED", "You must be signed in to do that.");
  }
  return user;
}
