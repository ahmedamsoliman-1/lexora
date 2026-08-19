# ADR 005 — Block Reference Syntax

**Status:** Accepted
**Date:** Phase 6

## Context

The master plan (§15) specifies that prompts should support block references
and that "references should preferably use immutable IDs" so that renaming a
block doesn't break references. The plan shows both a friendly syntax
(`{{block:coding-agent-rules}}`) and an ID-based syntax (`{{block:blk_01ABC}}`).

## Decision

Use **immutable ULID-based IDs** as the reference key:

```
{{block:blk_01J...}}
```

The block editor displays the reference string and provides a "Copy reference"
button so users don't need to type IDs manually.

## Rationale

- Renaming a block never breaks references — the ID is stable across renames.
- Consistent with the ULID-prefixed ID scheme used for all entities
  (see §6 IDs).
- The editor UI shows the reference string; users copy-paste rather than type.
- Friendly names could collide; IDs are guaranteed unique.

## Consequences

- The resolver (`src/server/services/prompt-resolver.ts`) looks up blocks by
  ID via `getBlocks(userId, blockIds)`.
- If a block is deleted, the reference remains in the prompt text and is
  reported as a `missingBlockId` during resolution — the user sees it
  explicitly rather than silent corruption.
- A future enhancement could render the block *name* in the editor as a
  decoration while storing the ID, but the stored content always uses IDs.

## Alternatives Considered

- **Friendly name-based references** (`{{block:coding-rules}}`) — simpler to
  type but breaks on rename and risks collisions. Rejected per the master plan.
- **Separate reference registry** — over-engineered for the MVP; IDs are
  already unique and stable.
