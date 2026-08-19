# Lexora Architecture

This document describes the implemented architecture of Lexora. The
authoritative product and feature plan lives in
[`master-plan.md`](./master-plan.md); this document records how that plan is
realized in code and evolves as implementation progresses.

## 1. High-Level Architecture

Lexora is a full-stack Next.js application using the App Router and a
Backend-for-Frontend (BFF) pattern.

```
                          ┌──────────────────┐
                          │     Browser      │
                          │ React / Next.js  │
                          └────────┬─────────┘
                                   │ HTTPS
                                   ▼
                      ┌─────────────────────────┐
                      │       Next.js BFF       │
                      │  Server Components      │
                      │  Route Handlers         │
                      │  Server Services        │
                      └───────┬────────┬────────┘
                              │        │
                     ┌────────┘        └────────────┐
                     ▼                              ▼
             ┌───────────────┐              ┌───────────────┐
             │   Firebase    │              │    Upstash    │
             │ Authentication│              │     Redis     │
             └───────────────┘              │ Application DB│
                                            └───────┬───────┘
                                                    │
                                       ┌────────────┘
                                       ▼
                                 ┌──────────────┐
                                 │ Writing API  │
                                 │ LanguageTool │
                                 └──────────────┘
```

## 2. BFF Boundaries

The browser never talks to Upstash Redis, Firebase Admin, or the writing
provider directly. Instead it talks to Next.js Route Handlers under
`/api/*`, which:

1. Verify the Firebase ID token sent by the client.
2. Resolve the authenticated UID.
3. Call domain services.
4. Return normalized JSON.

Server-only modules live under `src/server/*` and must never be imported from
client components. The `server` keyword in import paths and the absence of
`NEXT_PUBLIC_` prefixes on the relevant environment variables enforce this at
the environment level.

## 3. Layering

```
Route Handler  →  Service  →  Repository  →  Redis
```

- **Route handlers** (`src/app/api/*`) only parse/validate input, call a
  service, and serialize the response.
- **Services** (`src/server/services/*`) contain business logic and
  orchestrate multiple repositories when needed.
- **Repositories** (`src/server/repositories/*`) own the Redis keyspace and
  serialization. Business logic never issues Redis commands directly.

## 4. Authentication

Firebase Authentication is the only authentication mechanism.

- The browser uses the Firebase client SDK to sign in and obtain an ID token.
- The ID token is sent to the BFF (typically via a cookie or `Authorization`
  header).
- The BFF uses the Firebase Admin SDK to verify the token and extract the
  `uid`.
- Every backend operation is scoped to that `uid`. Client-supplied user IDs
  are never trusted.

See [ADR 002](./decisions/002-use-firebase-auth.md).

## 5. Persistence — Upstash Redis

Redis is the primary application persistence layer. All access is isolated
behind repositories so business logic is decoupled from Redis specifics.

### Namespace

All keys are prefixed with `lexora:v1:`. Examples:

```
lexora:v1:user:{uid}
lexora:v1:project:{uid}:{projectId}
lexora:v1:prompt:{uid}:{promptId}
lexora:v1:block:{uid}:{blockId}

lexora:v1:user:{uid}:projects        # sorted set index
lexora:v1:user:{uid}:prompts         # sorted set index
lexora:v1:user:{uid}:blocks          # sorted set index
lexora:v1:project:{uid}:{projectId}:prompts
lexora:v1:user:{uid}:favorites
lexora:v1:user:{uid}:recent          # sorted set, score = timestamp
lexora:v1:user:{uid}:tags
lexora:v1:tag:{uid}:{tag}:prompts
lexora:v1:prompt:{uid}:{promptId}:versions
lexora:v1:writing:{hash}             # writing check cache, TTL
```

Application code never uses `KEYS *`. All lookups go through explicit indexes
maintained by repositories.

See [ADR 001](./decisions/001-use-upstash-redis.md).

## 6. IDs

All entity IDs are ULIDs with a short domain prefix to aid debugging:

```
prj_01J...   # project
prm_01J...   # prompt
blk_01J...   # block
ver_01J...   # prompt version
usr_01J...   # user
```

## 7. Dates

All timestamps are stored as UTC ISO-8601 strings. Presentation converts to the
user's local timezone.

## 8. Writing Assistance

Writing assistance is a subsystem, not an ad-hoc API call.

```
Editor (debounced)  →  POST /api/writing/check  →  WritingService
                                                          ↓
                                                  WritingProvider
                                                          ↓
                                                  LanguageToolProvider
```

- `WritingProvider` is a normalized interface (`check(input) → result`).
- `LanguageToolProvider` adapts a LanguageTool-compatible HTTP API to that
  interface.
- The editor only ever depends on the normalized `WritingIssue[]` shape.
- Results are cached in Redis under `lexora:v1:writing:{hash}` with a TTL.
- Provider failures never block editing or saving.

See [ADR 003](./decisions/003-writing-provider-abstraction.md).

## 9. Prompt Resolver

Templates are resolved by a dedicated resolver that:

1. Expands `{{block:id}}` references (with circular reference detection).
2. Substitutes `{{variable}}` values.
3. Validates the result (missing blocks, missing variables, etc.).

The resolver is a pure, testable module that does not touch Redis directly —
repositories supply the blocks.

## 10. Autosave

Prompts autosave. The editor keeps local state, debounces changes, and PATCHes
the prompt. The editor footer shows independent states for saving, writing
checks, and word count. Provider failures never prevent saving.

## 11. Search

`SearchService` is an abstraction over the persistence layer. The MVP
implementation uses Redis-backed indexes and lightweight normalized matching.
The UI depends only on the `SearchService` interface, so a dedicated search
service can be plugged in later without UI changes.

## 12. Environment

Environment variables are validated with Zod via `@t3-oss/env-nextjs` in
`src/lib/env.ts`. Missing or malformed variables fail fast at startup in
non-test environments.

## 13. Status

This document tracks the implemented architecture. As phases land it is
updated alongside the code.

**Implemented:**

- Phase 0 — Foundation (Next.js, TypeScript, Tailwind, shadcn/ui, env
  validation, theme tokens, lint/format/test tooling, base structure).
- Phase 1 — Authentication (Firebase client SDK, Firebase Admin SDK,
  email/password + Google sign-in, session-cookie-based BFF auth, protected
  workspace layout, login/register/logout UI, normalized error mapping).
- Phase 2 — Redis Foundation (Upstash Redis client, key namespace helpers,
  serialization helpers, repository base patterns, ULID-based prefixed IDs,
  UserProfile repository + bootstrap on sign-in).
- Phase 3 — Projects (repository, service, API, sidebar integration, projects
  list page, project detail page, create/edit dialog, pin/archive/delete
  actions, Zod validation, 58 tests passing).
