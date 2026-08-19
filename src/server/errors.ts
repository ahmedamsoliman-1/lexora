import type { AppErrorCode } from "@/types";

/**
 * Normalized application error. Thrown by services and route handlers so the
 * BFF can map it to a consistent HTTP response without leaking provider
 * internals.
 */
export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly statusCode: number;
  readonly details?: Record<string, unknown>;

  constructor(
    code: AppErrorCode,
    message: string,
    options?: {
      statusCode?: number;
      details?: Record<string, unknown>;
      cause?: unknown;
    },
  ) {
    super(message, { cause: options?.cause });
    this.name = "AppError";
    this.code = code;
    this.statusCode = options?.statusCode ?? codeToStatus(code);
    this.details = options?.details;
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      ...(this.details ? { details: this.details } : {}),
    };
  }
}

function codeToStatus(code: AppErrorCode): number {
  switch (code) {
    case "UNAUTHORIZED":
    case "AUTH_NOT_CONFIGURED":
    case "AUTH_INVALID_CREDENTIALS":
      return 401;
    case "FORBIDDEN":
      return 403;
    case "NOT_FOUND":
    case "PROMPT_BLOCK_NOT_FOUND":
      return 404;
    case "VALIDATION_ERROR":
    case "PROMPT_VARIABLE_MISSING":
    case "PROMPT_CIRCULAR_REFERENCE":
      return 422;
    case "CONFLICT":
    case "AUTH_EMAIL_ALREADY_IN_USE":
      return 409;
    case "RATE_LIMITED":
    case "WRITING_PROVIDER_RATE_LIMITED":
    case "AUTH_TOO_MANY_REQUESTS":
      return 429;
    case "WRITING_PROVIDER_UNAVAILABLE":
      return 503;
    case "INTERNAL_ERROR":
    default:
      return 500;
  }
}
