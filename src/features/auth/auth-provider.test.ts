import { describe, expect, it } from "vitest";

import { getAuthErrorMessage } from "@/features/auth/auth-provider";

describe("getAuthErrorMessage", () => {
  it("maps known Firebase errors to user-friendly messages", () => {
    expect(getAuthErrorMessage({ code: "auth/popup-closed-by-user" })).toBe(
      "The sign-in popup was closed before completing.",
    );
  });

  it("maps auth/unauthorized-domain with actionable guidance", () => {
    expect(getAuthErrorMessage({ code: "auth/unauthorized-domain" })).toBe(
      "This domain is not authorized for Firebase sign-in. Add it in Firebase Console → Authentication → Settings → Authorized domains.",
    );
  });

  it("maps auth/network-request-failed", () => {
    expect(getAuthErrorMessage({ code: "auth/network-request-failed" })).toBe(
      "Network error reaching Firebase. Check your connection.",
    );
  });

  it("maps auth/api-key-not-valid", () => {
    expect(getAuthErrorMessage({ code: "auth/api-key-not-valid" })).toBe(
      "The Firebase API key is invalid. Check NEXT_PUBLIC_FIREBASE_API_KEY.",
    );
  });

  it("maps auth/configuration-not-found", () => {
    expect(getAuthErrorMessage({ code: "auth/configuration-not-found" })).toBe(
      "Firebase configuration not found. Check your NEXT_PUBLIC_FIREBASE_* env vars.",
    );
  });

  it("maps auth/operation-not-allowed with Firebase Console hint", () => {
    expect(getAuthErrorMessage({ code: "auth/operation-not-allowed" })).toBe(
      "This sign-in method is not enabled in Firebase Console.",
    );
  });

  it("maps auth/invalid-credential", () => {
    expect(getAuthErrorMessage({ code: "auth/invalid-credential" })).toBe(
      "Invalid email or password.",
    );
  });

  it("does not expose unexpected error details", () => {
    expect(getAuthErrorMessage(new Error("Database is closing/hidden"))).toBe(
      "Something went wrong. Please try again.",
    );
  });
});
