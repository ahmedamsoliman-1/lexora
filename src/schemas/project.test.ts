// @vitest-environment node
import { describe, expect, it } from "vitest";

import {
  createProjectSchema,
  listProjectsQuerySchema,
  updateProjectSchema,
} from "@/schemas/project";

describe("createProjectSchema", () => {
  it("accepts a minimal valid project", () => {
    const result = createProjectSchema.safeParse({ name: "Personal Projects" });
    expect(result.success).toBe(true);
  });

  it("accepts a project with all fields", () => {
    const result = createProjectSchema.safeParse({
      name: "Omnisphere",
      description: "Omnisphere-related prompts",
      icon: "folder",
      color: "#3b82f6",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty name", () => {
    const result = createProjectSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a name over 100 characters", () => {
    const result = createProjectSchema.safeParse({ name: "x".repeat(101) });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid hex color", () => {
    const result = createProjectSchema.safeParse({
      name: "Test",
      color: "blue",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a valid hex color", () => {
    const result = createProjectSchema.safeParse({
      name: "Test",
      color: "#ABCDEF",
    });
    expect(result.success).toBe(true);
  });
});

describe("updateProjectSchema", () => {
  it("accepts a partial update", () => {
    const result = updateProjectSchema.safeParse({ name: "New Name" });
    expect(result.success).toBe(true);
  });

  it("accepts pinned and archived booleans", () => {
    expect(updateProjectSchema.safeParse({ pinned: true }).success).toBe(true);
    expect(updateProjectSchema.safeParse({ archived: false }).success).toBe(
      true,
    );
  });

  it("accepts an empty object", () => {
    const result = updateProjectSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("rejects an invalid name", () => {
    const result = updateProjectSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });
});

describe("listProjectsQuerySchema", () => {
  it("defaults limit to 50 and archived to false when absent", () => {
    const result = listProjectsQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(50);
      expect(result.data.archived).toBe(false);
    }
  });

  it("parses archived=true", () => {
    const result = listProjectsQuerySchema.safeParse({ archived: "true" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.archived).toBe(true);
    }
  });

  it("parses a custom limit", () => {
    const result = listProjectsQuerySchema.safeParse({ limit: "10" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(10);
    }
  });

  it("parses a cursor timestamp", () => {
    const result = listProjectsQuerySchema.safeParse({
      cursor: "1700000000000",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.cursor).toBe(1700000000000);
    }
  });
});
