// @vitest-environment node
import { describe, expect, it } from "vitest";

import {
  addDictionaryWordSchema,
  removeDictionaryWordSchema,
  writingCheckSchema,
} from "@/schemas/writing";

describe("writingCheckSchema", () => {
  it("accepts a valid check request", () => {
    const result = writingCheckSchema.safeParse({
      text: "Create an applicaton.",
      language: "en-US",
    });
    expect(result.success).toBe(true);
  });

  it("accepts without language (optional)", () => {
    const result = writingCheckSchema.safeParse({ text: "Hello world." });
    expect(result.success).toBe(true);
  });

  it("rejects empty text", () => {
    const result = writingCheckSchema.safeParse({ text: "" });
    expect(result.success).toBe(false);
  });

  it("rejects text over 50,000 characters", () => {
    const result = writingCheckSchema.safeParse({ text: "x".repeat(50_001) });
    expect(result.success).toBe(false);
  });
});

describe("addDictionaryWordSchema", () => {
  it("accepts a valid word", () => {
    expect(addDictionaryWordSchema.safeParse({ word: "Next.js" }).success).toBe(
      true,
    );
  });

  it("rejects an empty word", () => {
    expect(addDictionaryWordSchema.safeParse({ word: "" }).success).toBe(false);
  });
});

describe("removeDictionaryWordSchema", () => {
  it("accepts a valid word", () => {
    expect(
      removeDictionaryWordSchema.safeParse({ word: "Upstash" }).success,
    ).toBe(true);
  });

  it("rejects an empty word", () => {
    expect(removeDictionaryWordSchema.safeParse({ word: "" }).success).toBe(
      false,
    );
  });
});
