import { describe, expect, it } from "vitest";

import { cn } from "@/lib/utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("px-2", "py-1")).toBe("px-2 py-1");
  });

  it("resolves tailwind conflicts with the last value winning", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("handles conditional and falsy values", () => {
    expect(cn("base", false && "hidden", undefined, null, "visible")).toBe(
      "base visible",
    );
  });

  it("supports objects and arrays via clsx", () => {
    expect(cn({ active: true, inactive: false }, ["a", "b"])).toBe(
      "active a b",
    );
  });
});
