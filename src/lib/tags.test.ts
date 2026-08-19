// @vitest-environment node
import { describe, expect, it } from "vitest";

import { normalizeTag, normalizeTags } from "@/lib/tags";

describe("normalizeTag", () => {
  it("lowercases and trims", () => {
    expect(normalizeTag("  NextJS  ")).toBe("nextjs");
  });

  it("strips a leading #", () => {
    expect(normalizeTag("#firebase")).toBe("firebase");
  });

  it("strips multiple leading #", () => {
    expect(normalizeTag("##agent")).toBe("agent");
  });

  it("returns null for empty input", () => {
    expect(normalizeTag("")).toBeNull();
    expect(normalizeTag("   ")).toBeNull();
    expect(normalizeTag("#")).toBeNull();
  });

  it("preserves hyphens and numbers", () => {
    expect(normalizeTag("next-js-3")).toBe("next-js-3");
  });
});

describe("normalizeTags", () => {
  it("deduplicates case-insensitively", () => {
    expect(normalizeTags(["NextJS", "nextjs", "NEXTJS"])).toEqual(["nextjs"]);
  });

  it("strips # and lowercases", () => {
    expect(normalizeTags(["#Firebase", "#Agent"])).toEqual([
      "agent",
      "firebase",
    ]);
  });

  it("sorts alphabetically", () => {
    expect(normalizeTags(["zebra", "apple", "mango"])).toEqual([
      "apple",
      "mango",
      "zebra",
    ]);
  });

  it("filters out empty tags", () => {
    expect(normalizeTags(["real", "", "  ", "#"])).toEqual(["real"]);
  });

  it("returns empty array for empty input", () => {
    expect(normalizeTags([])).toEqual([]);
  });
});
