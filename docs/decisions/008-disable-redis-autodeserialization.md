# ADR 008 — Disable Redis Automatic Deserialization

**Status:** Accepted
**Date:** Post-Phase 7

## Context

The `@upstash/redis` client enables `automaticDeserialization` by default.
This feature attempts to JSON-parse every value returned from Redis. However,
Lexora's repositories explicitly serialize entities with `JSON.stringify()`
and deserialize with `JSON.parse()` via the `serialize`/`deserialize` helpers
in `src/server/redis/serialize.ts`.

When `automaticDeserialization` is enabled, the client may:
- Double-parse values (the client parses, then our `deserialize` parses again).
- Parse values that are not JSON (e.g. raw string scores from sorted sets).
- Return inconsistent types depending on whether the value looks like JSON.

This caused subtle type mismatches where `redis.get<T>()` returned an already-
parsed object instead of a string, breaking the `deserialize<T>` contract.

## Decision

Disable automatic deserialization on the Upstash Redis client:

```ts
new Redis({
  url: env.UPSTASH_REDIS_REST_URL!,
  token: env.UPSTASH_REDIS_REST_TOKEN!,
  automaticDeserialization: false,
});
```

## Rationale

- **Single responsibility**: the `serialize`/`deserialize` helpers own all
  JSON parsing. The Redis client is a transport layer, not a serialization
  layer.
- **Predictable types**: `redis.get()` always returns `string | null`, which
  is what `deserialize<T>` expects. No ambiguity about whether a value has
  already been parsed.
- **Consistency**: sorted-set members, scores, and raw values all come back
  as strings, matching the repository base helpers' expectations.

## Consequences

- All `redis.get()` calls return `string | null` — the caller must explicitly
  deserialize via the `deserialize<T>()` helper.
- The repository base (`src/server/repositories/base.ts`) already handles this
  correctly via `getEntity<T>` which calls `deserialize`.
- No performance impact — JSON parsing happens at the same layer, just
  explicitly rather than implicitly.

## Alternatives Considered

- **Keep automatic deserialization and remove our own helpers** — rejected
  because it would couple all repositories to the client's parsing behavior
  and make it harder to handle non-JSON values (scores, set members).
- **Use `redis.get<T>()` with generics** — the client's generic doesn't
  actually perform type-safe parsing; it's a cast. Explicit deserialization
  is safer.
