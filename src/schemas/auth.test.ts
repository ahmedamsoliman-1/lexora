// @vitest-environment node
import { describe, expect, it } from "vitest";

import {
  createSessionSchema,
  loginSchema,
  registerSchema,
} from "@/schemas/auth";

describe("createSessionSchema", () => {
  it("accepts a non-empty idToken", () => {
    const result = createSessionSchema.safeParse({ idToken: "token123" });
    expect(result.success).toBe(true);
  });

  it("rejects an empty idToken", () => {
    const result = createSessionSchema.safeParse({ idToken: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a missing idToken", () => {
    const result = createSessionSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("accepts a valid email and password", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "secret",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid email", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "secret",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty password", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("registerSchema", () => {
  it("accepts a valid email and 8+ char password", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a password shorter than 8 characters", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
      password: "short",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email", () => {
    const result = registerSchema.safeParse({
      email: "bad",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });
});
