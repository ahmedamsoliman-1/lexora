// @vitest-environment node
import { describe, expect, it } from "vitest";

import { deserialize, now, serialize } from "@/server/redis/serialize";

describe("now", () => {
  it("returns an ISO-8601 string", () => {
    const ts = now();
    expect(ts).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(() => new Date(ts).toISOString()).not.toThrow();
  });
});

describe("serialize / deserialize", () => {
  it("round-trips an entity", () => {
    const entity = { id: "prm_01", title: "Hello", tags: ["a", "b"] };
    const stored = serialize(entity);
    expect(deserialize(stored)).toEqual(entity);
  });

  it("returns null for a key miss", () => {
    expect(deserialize(null)).toBeNull();
    expect(deserialize(undefined)).toBeNull();
  });

  it("throws on malformed JSON", () => {
    expect(() => deserialize("{not json")).toThrow(/Failed to deserialize/);
  });
});
