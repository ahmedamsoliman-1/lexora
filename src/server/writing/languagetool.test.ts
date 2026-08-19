// @vitest-environment node
import { describe, expect, it } from "vitest";

import { writingCacheHash } from "@/server/writing/languagetool";

describe("writingCacheHash", () => {
  it("produces a stable SHA-256 hex hash", () => {
    const hash = writingCacheHash("languagetool", "en-US", "hello world");
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("is deterministic for the same inputs", () => {
    const a = writingCacheHash("languagetool", "en-US", "test");
    const b = writingCacheHash("languagetool", "en-US", "test");
    expect(a).toBe(b);
  });

  it("changes when provider changes", () => {
    const a = writingCacheHash("languagetool", "en-US", "test");
    const b = writingCacheHash("other", "en-US", "test");
    expect(a).not.toBe(b);
  });

  it("changes when language changes", () => {
    const a = writingCacheHash("languagetool", "en-US", "test");
    const b = writingCacheHash("languagetool", "en-GB", "test");
    expect(a).not.toBe(b);
  });

  it("changes when text changes", () => {
    const a = writingCacheHash("languagetool", "en-US", "hello");
    const b = writingCacheHash("languagetool", "en-US", "world");
    expect(a).not.toBe(b);
  });
});
