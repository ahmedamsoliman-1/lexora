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

  it("generates sortable IDs (later IDs sort after earlier ones)", () => {
    const ids = [createId("prm"), createId("prm"), createId("prm")];
    expect((ids[2] ?? "") > (ids[0] ?? "")).toBe(true);
  });

  it("generates unique IDs", () => {
    const set = new Set<string>();
    for (let i = 0; i < 100; i++) {
      set.add(createId("prm"));
    }
    expect(set.size).toBe(100);
  });
});
