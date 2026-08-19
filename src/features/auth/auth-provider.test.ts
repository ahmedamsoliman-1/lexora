import { describe, expect, it } from "vitest";

import { getAuthErrorMessage } from "@/features/auth/auth-provider";

describe("getAuthErrorMessage", () => {
  it("maps known Firebase errors to user-friendly messages", () => {
    expect(getAuthErrorMessage({ code: "auth/popup-closed-by-user" })).toBe(
      "The sign-in popup was closed before completing.",
    );
  });

  it("does not expose unexpected error details", () => {
    expect(getAuthErrorMessage(new Error("Database is closing/hidden"))).toBe(
      "Something went wrong. Please try again.",
    );
  });
});
