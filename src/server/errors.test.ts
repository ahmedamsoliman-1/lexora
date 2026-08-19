// @vitest-environment node
import { describe, expect, it } from "vitest";

import { AppError } from "@/server/errors";

describe("AppError", () => {
  it("maps known codes to the correct HTTP status", () => {
    expect(new AppError("UNAUTHORIZED", "").statusCode).toBe(401);
    expect(new AppError("FORBIDDEN", "").statusCode).toBe(403);
    expect(new AppError("NOT_FOUND", "").statusCode).toBe(404);
    expect(new AppError("VALIDATION_ERROR", "").statusCode).toBe(422);
    expect(new AppError("CONFLICT", "").statusCode).toBe(409);
    expect(new AppError("RATE_LIMITED", "").statusCode).toBe(429);
    expect(new AppError("WRITING_PROVIDER_UNAVAILABLE", "").statusCode).toBe(
      503,
    );
    expect(new AppError("INTERNAL_ERROR", "").statusCode).toBe(500);
  });

  it("maps auth-specific codes", () => {
    expect(new AppError("AUTH_NOT_CONFIGURED", "").statusCode).toBe(401);
    expect(new AppError("AUTH_INVALID_CREDENTIALS", "").statusCode).toBe(401);
    expect(new AppError("AUTH_EMAIL_ALREADY_IN_USE", "").statusCode).toBe(409);
    expect(new AppError("AUTH_TOO_MANY_REQUESTS", "").statusCode).toBe(429);
  });

  it("maps prompt resolver codes", () => {
    expect(new AppError("PROMPT_BLOCK_NOT_FOUND", "").statusCode).toBe(404);
    expect(new AppError("PROMPT_VARIABLE_MISSING", "").statusCode).toBe(422);
    expect(new AppError("PROMPT_CIRCULAR_REFERENCE", "").statusCode).toBe(422);
  });

  it("allows overriding the status code", () => {
    const err = new AppError("VALIDATION_ERROR", "bad", { statusCode: 400 });
    expect(err.statusCode).toBe(400);
  });

  it("serializes to a JSON shape without leaking internals", () => {
    const err = new AppError("NOT_FOUND", "Prompt not found.", {
      details: { id: "prm_123" },
    });
    expect(err.toJSON()).toEqual({
      code: "NOT_FOUND",
      message: "Prompt not found.",
      details: { id: "prm_123" },
    });
  });

  it("preserves the cause", () => {
    const cause = new Error("underlying");
    const err = new AppError("INTERNAL_ERROR", "oops", { cause });
    expect(err.cause).toBe(cause);
  });
});
