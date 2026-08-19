// @vitest-environment node
import { describe, expect, it } from "vitest";

import { caches, indexes, keys, rateLimits } from "@/server/redis/keys";

describe("keys (entity records)", () => {
  it("namespaces user records", () => {
    expect(keys.user("uid123")).toBe("lexora:v1:user:uid123");
  });

  it("namespaces project records with user + project scope", () => {
    expect(keys.project("uid123", "prj_01")).toBe(
      "lexora:v1:project:uid123:prj_01",
    );
  });

  it("namespaces prompt records with user + prompt scope", () => {
    expect(keys.prompt("uid123", "prm_01")).toBe(
      "lexora:v1:prompt:uid123:prm_01",
    );
  });

  it("namespaces block records with user + block scope", () => {
    expect(keys.block("uid123", "blk_01")).toBe(
      "lexora:v1:block:uid123:blk_01",
    );
  });

  it("namespaces prompt version records", () => {
    expect(keys.promptVersion("uid123", "ver_01")).toBe(
      "lexora:v1:promptversion:uid123:ver_01",
    );
  });
});

describe("indexes (sorted sets / sets)", () => {
  it("namespaces user-level indexes", () => {
    expect(indexes.userProjects("uid")).toBe("lexora:v1:user:uid:projects");
    expect(indexes.userPrompts("uid")).toBe("lexora:v1:user:uid:prompts");
    expect(indexes.userBlocks("uid")).toBe("lexora:v1:user:uid:blocks");
    expect(indexes.userFavorites("uid")).toBe("lexora:v1:user:uid:favorites");
    expect(indexes.userRecent("uid")).toBe("lexora:v1:user:uid:recent");
    expect(indexes.userTags("uid")).toBe("lexora:v1:user:uid:tags");
  });

  it("namespaces project-prompt index", () => {
    expect(indexes.projectPrompts("uid", "prj_01")).toBe(
      "lexora:v1:project:uid:prj_01:prompts",
    );
  });

  it("namespaces tag index with normalized tag", () => {
    expect(indexes.tagPrompts("uid", "nextjs")).toBe(
      "lexora:v1:tag:uid:nextjs:prompts",
    );
  });

  it("namespaces prompt version index", () => {
    expect(indexes.promptVersions("uid", "prm_01")).toBe(
      "lexora:v1:prompt:uid:prm_01:versions",
    );
  });

  it("namespaces personal dictionary", () => {
    expect(indexes.userDictionary("uid")).toBe("lexora:v1:user:uid:dictionary");
  });
});

describe("caches", () => {
  it("namespaces writing cache by hash", () => {
    expect(caches.writing("abc123")).toBe("lexora:v1:writing:abc123");
  });
});

describe("rateLimits", () => {
  it("namespaces writing rate limit by uid", () => {
    expect(rateLimits.writing("uid")).toBe("lexora:v1:ratelimit:writing:uid");
  });

  it("namespaces search rate limit by uid", () => {
    expect(rateLimits.search("uid")).toBe("lexora:v1:ratelimit:search:uid");
  });
});
