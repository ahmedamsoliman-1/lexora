import { NextResponse } from "next/server";

import { AppError } from "@/server/errors";
import type { AppErrorCode } from "@/types";

/**
 * Convert an unknown error into a normalized JSON response.
 *
 * Provider internals are never leaked — known `AppError` codes map to stable
 * messages, everything else collapses to a generic 500.
 */
export function errorResponse(error: unknown): NextResponse {
  if (error instanceof AppError) {
    return NextResponse.json(error.toJSON(), { status: error.statusCode });
  }

  // Firebase Admin error shapes have a `code` string like `auth/email-already-in-use`.
  const fbCode = isFirebaseError(error)
    ? String(error.errorInfo?.code ?? "")
    : "";

  const mapped = mapFirebaseError(fbCode, error);
  if (mapped) {
    return NextResponse.json(mapped.toJSON(), { status: mapped.statusCode });
  }

  return NextResponse.json(
    {
      code: "INTERNAL_ERROR" satisfies AppErrorCode,
      message: "Something went wrong. Please try again.",
    },
    { status: 500 },
  );
}

export function json(body: unknown, init?: ResponseInit): NextResponse {
  return NextResponse.json(body, init);
}

function isFirebaseError(error: unknown): error is {
  errorInfo?: { code?: string };
} {
  return (
    typeof error === "object" &&
    error !== null &&
    "errorInfo" in error &&
    typeof (error as { errorInfo: unknown }).errorInfo === "object"
  );
}

function mapFirebaseError(code: string, cause: unknown): AppError | null {
  switch (code) {
    case "auth/email-already-exists":
    case "auth/email-already-in-use":
      return new AppError(
        "AUTH_EMAIL_ALREADY_IN_USE",
        "An account with this email already exists.",
        { cause },
      );
    case "auth/invalid-email":
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return new AppError(
        "AUTH_INVALID_CREDENTIALS",
        "Invalid email or password.",
        { cause },
      );
    case "auth/too-many-requests":
      return new AppError(
        "AUTH_TOO_MANY_REQUESTS",
        "Too many attempts. Please try again later.",
        { cause },
      );
    case "auth/id-token-expired":
    case "auth/id-token-revoked":
    case "auth/session-cookie-expired":
    case "auth/session-cookie-revoked":
      return new AppError("UNAUTHORIZED", "Your session has expired.", {
        cause,
      });
    default:
      return null;
  }
}
