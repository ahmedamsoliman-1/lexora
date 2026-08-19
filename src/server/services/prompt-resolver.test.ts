// @vitest-environment node
import { describe, expect, it } from "vitest";

import { resolvePrompt } from "@/server/services/prompt-resolver";
import type { Block } from "@/types/domain";

function makeBlock(overrides: Partial<Block> = {}): Block {
  return {
    id: "blk_01",
    userId: "uid",
    name: "Coding Rules",
    content: "Follow the existing architecture.",
    tags: [],
    favorite: false,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("resolvePrompt", () => {
  it("returns content unchanged when no blocks or variables", () => {
    const result = resolvePrompt({
      prompt: { content: "Just plain text.", title: "Test" },
      blocks: [],
    });
    expect(result.content).toBe("Just plain text.");
    expect(result.detectedVariables).toEqual([]);
    expect(result.missingBlockIds).toEqual([]);
    expect(result.missingVariables).toEqual([]);
  });

  it("resolves a single block reference", () => {
    const block = makeBlock({
      id: "blk_01",
      content: "Use TypeScript. Use Next.js.",
    });
    const result = resolvePrompt({
      prompt: {
        content: "Build the app.\n\n{{block:blk_01}}",
        title: "Test",
      },
      blocks: [block],
    });
    expect(result.content).toBe(
      "Build the app.\n\nUse TypeScript. Use Next.js.",
    );
    expect(result.missingBlockIds).toEqual([]);
  });

  it("resolves multiple block references", () => {
    const block1 = makeBlock({
      id: "blk_01",
      content: "Rule 1.",
    });
    const block2 = makeBlock({
      id: "blk_02",
      content: "Rule 2.",
    });
    const result = resolvePrompt({
      prompt: {
        content: "{{block:blk_01}}\n{{block:blk_02}}",
        title: "Test",
      },
      blocks: [block1, block2],
    });
    expect(result.content).toBe("Rule 1.\nRule 2.");
  });

  it("reports missing block IDs", () => {
    const result = resolvePrompt({
      prompt: { content: "{{block:blk_missing}}", title: "Test" },
      blocks: [],
    });
    expect(result.missingBlockIds).toEqual(["blk_missing"]);
    expect(result.content).toBe("{{block:blk_missing}}");
  });

  it("resolves variables", () => {
    const result = resolvePrompt({
      prompt: {
        content: "Create a {{framework}} app called {{name}}.",
        title: "Test",
      },
      blocks: [],
      variables: { framework: "Next.js", name: "Lexora" },
    });
    expect(result.content).toBe("Create a Next.js app called Lexora.");
    expect(result.missingVariables).toEqual([]);
  });

  it("reports missing variables", () => {
    const result = resolvePrompt({
      prompt: { content: "{{framework}} and {{database}}", title: "Test" },
      blocks: [],
      variables: { framework: "Next.js" },
    });
    expect(result.missingVariables).toEqual(["database"]);
  });

  it("resolves blocks then variables", () => {
    const block = makeBlock({
      id: "blk_01",
      content: "Use {{framework}}.",
    });
    const result = resolvePrompt({
      prompt: {
        content: "{{block:blk_01}}",
        title: "Test",
      },
      blocks: [block],
      variables: { framework: "Next.js" },
    });
    expect(result.content).toBe("Use Next.js.");
  });

  it("detects variables introduced by resolved blocks", () => {
    const block = makeBlock({
      id: "blk_01",
      content: "Deploy to {{target}}.",
    });
    const result = resolvePrompt({
      prompt: { content: "{{block:blk_01}}", title: "Test" },
      blocks: [block],
    });
    expect(result.detectedVariables.map((v) => v.name)).toEqual(["target"]);
  });

  it("handles nested block references", () => {
    const outer = makeBlock({
      id: "blk_01",
      content: "Start.\n{{block:blk_02}}\nEnd.",
    });
    const inner = makeBlock({
      id: "blk_02",
      content: "Middle.",
    });
    const result = resolvePrompt({
      prompt: { content: "{{block:blk_01}}", title: "Test" },
      blocks: [outer, inner],
    });
    expect(result.content).toBe("Start.\nMiddle.\nEnd.");
  });

  it("throws on circular block references", () => {
    const blockA = makeBlock({
      id: "blk_01",
      content: "{{block:blk_02}}",
    });
    const blockB = makeBlock({
      id: "blk_02",
      content: "{{block:blk_01}}",
    });
    expect(() =>
      resolvePrompt({
        prompt: { content: "{{block:blk_01}}", title: "Test" },
        blocks: [blockA, blockB],
      }),
    ).toThrow(/Circular block reference/);
  });
});
