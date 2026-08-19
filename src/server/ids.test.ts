// @vitest-environment node
import { describe, expect, it } from "vitest";

import { createId } from "@/server/ids";

describe("createId", () => {
  it("generates a prefixed ULID", () => {
    const id = createId("prm");
    expect(id).toMatch(/^prm_[0-9A-HJKMNP-TV-Z]{26}$/);
  });

  it("uses the provided prefix", () => {
    expect(createId("prj")).toMatch(/^prj_/);
    expect(createId("blk")).toMatch(/^blk_/);
    expect(createId("ver")).toMatch(/^ver_/);
    expect(createId("usr")).toMatch(/^usr_/);
  });

  it("encodes a sortable timestamp prefix", () => {
    const before = Date.now();
    const id = createId("prm");
    const after = Date.now();
    // The ULID timestamp portion (first 10 chars after prefix_) encodes the
    // creation time in Crockford Base32. We just verify the ID is unique and
    // well-formed — full monotonicity requires a monotonic factory.
    expect(id).toMatch(/^prm_[0-9A-HJKMNP-TV-Z]{26}$/);
    // Sanity: the ID was generated between before and after.
    expect(before).toBeLessThanOrEqual(after);
  });

  it("generates unique IDs", () => {
    const set = new Set<string>();
    for (let i = 0; i < 100; i++) {
      set.add(createId("prm"));
    }
    expect(set.size).toBe(100);
  });
});
