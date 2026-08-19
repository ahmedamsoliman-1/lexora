# ADR 001 — Use Upstash Redis for Persistence

**Status:** Accepted
**Date:** Phase 0

## Context

Lexora needs a persistence layer for users, projects, prompts, blocks,
versions, tags, favorites, and writing-cache entries. The product plan
requires a free-first, serverless-friendly stack that deploys cleanly to
Vercel.

## Decision

Use **Upstash Redis** (REST API) as the primary application persistence layer.

## Rationale

- Serverless-friendly: REST API works well from Vercel functions without
  long-lived connections.
- Generous free tier suitable for a personal MVP.
- Native sorted sets and hashes map naturally to indexes and counters.
- Low operational overhead.

## Consequences

- All persistence code is isolated behind repositories so the rest of the
  application never issues Redis commands directly.
- The keyspace is namespaced under `lexora:v1:` with explicit indexes; `KEYS *`
  is forbidden for application queries.
- Multi-key operations use pipelines/transactions where appropriate.
- We avoid treating Redis as a relational store; cross-entity joins are done
  in service code, not via SQL-like queries.

## Alternatives Considered

- A relational database (Postgres) — adds operational complexity and a
  connection model that is awkward in serverless for the MVP scope.
- A document database (Firestore) — viable, but the master plan commits to
  Upstash Redis and we follow the plan.
