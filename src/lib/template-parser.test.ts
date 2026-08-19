// @vitest-environment node
import { describe, expect, it } from "vitest";

import {
  detectVariables,
  extractBlockIds,
  parseBlockReferences,
  parseVariables,
} from "@/lib/template-parser";

describe("parseBlockReferences", () => {
  it("detects a single block reference", () => {
    const refs = parseBlockReferences("Hello {{block:blk_01ABC}} world");
    expect(refs).toHaveLength(1);
    expect(refs[0]?.blockId).toBe("blk_01ABC");
    expect(refs[0]?.raw).toBe("{{block:blk_01ABC}}");
  });

  it("detects multiple block references", () => {
    const refs = parseBlockReferences("{{block:blk_01}} and {{block:blk_02}}");
    expect(refs).toHaveLength(2);
    expect(refs[0]?.blockId).toBe("blk_01");
    expect(refs[1]?.blockId).toBe("blk_02");
  });

  it("handles whitespace inside braces", () => {
    const refs = parseBlockReferences("{{ block:blk_01 }}");
    expect(refs).toHaveLength(1);
    expect(refs[0]?.blockId).toBe("blk_01");
  });

  it("returns empty for no references", () => {
    expect(parseBlockReferences("No references here")).toEqual([]);
  });

  it("records correct offsets", () => {
    const text = "AB{{block:blk_01}}CD";
    const refs = parseBlockReferences(text);
    expect(refs[0]?.offset).toBe(2);
    expect(refs[0]?.length).toBe("{{block:blk_01}}".length);
  });
});

describe("parseVariables", () => {
  it("detects a single variable", () => {
    const vars = parseVariables("Create a {{framework}} app");
    expect(vars).toHaveLength(1);
    expect(vars[0]?.name).toBe("framework");
  });

  it("detects multiple variables", () => {
    const vars = parseVariables(
      "{{project_name}} uses {{framework}} and {{database}}",
    );
    expect(vars).toHaveLength(3);
    expect(vars.map((v) => v.name)).toEqual([
      "project_name",
      "framework",
      "database",
    ]);
  });

  it("does not treat block references as variables", () => {
    const vars = parseVariables("{{block:blk_01}} and {{framework}}");
    expect(vars).toHaveLength(1);
    expect(vars[0]?.name).toBe("framework");
  });

  it("handles whitespace inside braces", () => {
    const vars = parseVariables("{{ framework }}");
    expect(vars).toHaveLength(1);
    expect(vars[0]?.name).toBe("framework");
  });

  it("supports hyphens and digits in names", () => {
    const vars = parseVariables("{{project-1}} and {{var_2}}");
    expect(vars).toHaveLength(2);
    expect(vars[0]?.name).toBe("project-1");
    expect(vars[1]?.name).toBe("var_2");
  });

  it("returns empty for no variables", () => {
    expect(parseVariables("No variables here")).toEqual([]);
  });
});

describe("detectVariables", () => {
  it("returns unique variable names sorted", () => {
    const vars = detectVariables("{{zebra}} {{apple}} {{zebra}} {{mango}}");
    expect(vars.map((v) => v.name)).toEqual(["apple", "mango", "zebra"]);
  });

  it("returns empty for no variables", () => {
    expect(detectVariables("No variables")).toEqual([]);
  });

  it("ignores block references", () => {
    const vars = detectVariables("{{block:blk_01}} {{name}}");
    expect(vars).toHaveLength(1);
    expect(vars[0]?.name).toBe("name");
  });
});

describe("extractBlockIds", () => {
  it("returns unique block IDs", () => {
    const ids = extractBlockIds(
      "{{block:blk_01}} {{block:blk_02}} {{block:blk_01}}",
    );
    expect(ids).toEqual(["blk_01", "blk_02"]);
  });

  it("returns empty for no references", () => {
    expect(extractBlockIds("No blocks")).toEqual([]);
  });
});
