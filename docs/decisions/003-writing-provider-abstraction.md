# ADR 003 — Writing Provider Abstraction

**Status:** Accepted
**Date:** Phase 0

## Context

Writing assistance is a defining feature of Lexora. The product plan requires
that the editor depend on a normalized issue format rather than a specific
provider's response shape, and that providers be pluggable (e.g. a future
self-hosted provider should be possible without redesigning the application).

## Decision

Introduce a `WritingProvider` interface and adapt the initial
LanguageTool-compatible HTTP API to it.

```ts
interface WritingProvider {
  check(input: WritingCheckInput): Promise<WritingCheckResult>;
}
```

- The editor only ever sees `WritingIssue[]`.
- The BFF exposes `POST /api/writing/check` returning the normalized shape.
- Provider-specific response structures never reach frontend components.

## Rationale

- Keeps the editor decoupled from any single grammar API.
- Allows self-hosted or alternative providers later without UI changes.
- Makes caching, rate limiting, and personal-dictionary filtering uniform.

## Consequences

- A normalization layer maps provider responses to `WritingIssue[]`.
- Provider failures degrade gracefully: the editor continues to work and save.
- Cache keys incorporate `provider | language | text | config version` and
  live under `lexora:v1:writing:{hash}` with a TTL.

## Alternatives Considered

- Calling LanguageTool directly from the editor — rejected; violates BFF
  boundaries and couples the UI to a single provider.
- Bundling writing into a generic "AI" interface — rejected; the master plan
  keeps deterministic grammar/spelling separate from future generative AI.
