// @vitest-environment node
import { describe, expect, it } from "vitest";

import { env } from "@/lib/env";

describe("env", () => {
  it("exposes the public app name with a default", () => {
    expect(env.NEXT_PUBLIC_APP_NAME).toBe("Lexora");
  });

  it("exposes the public app url with a default", () => {
    expect(env.NEXT_PUBLIC_APP_URL).toMatch(/^https?:\/\//);
  });

  it("defaults the writing provider to languagetool", () => {
    expect(env.WRITING_PROVIDER).toBe("languagetool");
  });

  it("runs in a known node env", () => {
    expect(["development", "test", "production"]).toContain(env.NODE_ENV);
  });
});
