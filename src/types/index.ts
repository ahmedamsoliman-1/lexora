/**
 * Shared application domain types.
 *
 * These types are intentionally framework-agnostic so they can be used on both
 * the client and the server. Provider-specific shapes (Firebase, LanguageTool,
 * Redis) live closer to their respective modules and are normalized into these
 * types before crossing boundaries.
 */

/** A normalized application error with a stable code. */
export interface AppError {
  code: AppErrorCode;
  message: string;
  /** Optional field-level details for validation errors. */
  details?: Record<string, unknown>;
}

export type AppErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR"
  | "AUTH_NOT_CONFIGURED"
  | "AUTH_INVALID_CREDENTIALS"
  | "AUTH_EMAIL_ALREADY_IN_USE"
  | "AUTH_TOO_MANY_REQUESTS"
  | "WRITING_PROVIDER_UNAVAILABLE"
  | "WRITING_PROVIDER_RATE_LIMITED"
  | "PROMPT_BLOCK_NOT_FOUND"
  | "PROMPT_VARIABLE_MISSING"
  | "PROMPT_CIRCULAR_REFERENCE";

/** Authenticated user shape used across the app. */
export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

/** Session status returned by GET /api/auth/session. */
export interface SessionStatus {
  authenticated: boolean;
  user?: AuthUser;
}
