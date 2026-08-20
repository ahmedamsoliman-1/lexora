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
- The ID token is sent to the BFF via a session cookie (httpOnly, created by
  `POST /api/auth/session`).
- The BFF uses the Firebase Admin SDK to verify the token and extract the
  `uid`.
- Every backend operation is scoped to that `uid`. Client-supplied user IDs
  are never trusted.

### Error handling

The `getAuthErrorMessage` function (`src/features/auth/auth-provider.tsx`)
maps Firebase error codes to user-friendly messages, ensuring raw internals
are never surfaced to the UI. It is exported as a pure function so it can be
unit-tested independently of the React component tree
(`src/features/auth/auth-provider.test.ts`).

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

### Deserialization

The Redis client is configured with `automaticDeserialization: false`. All
JSON serialization/deserialization is handled explicitly by the
`serialize`/`deserialize` helpers in `src/server/redis/serialize.ts`. This
ensures `redis.get()` always returns `string | null`, giving the repository
base predictable types to work with.

See [ADR 001](./decisions/001-use-upstash-redis.md) and
[ADR 008](./decisions/008-disable-redis-autodeserialization.md).

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
- The editor is built on TipTap v3 (ProseMirror), chosen for its mature
  Decoration API for inline issue highlighting.

See [ADR 003](./decisions/003-writing-provider-abstraction.md) and
[ADR 004](./decisions/004-editor-selection.md).

## 9. Blocks

Blocks are reusable pieces of text (coding rules, output format, recurring
instructions). They live in their own repository and are referenced from
prompts using immutable IDs:

```
{{block:blk_01ABC}}
```

The editor displays the raw reference; the resolver expands it at resolution
time. Using immutable IDs (not block names) means renaming a block never breaks
references.

See [ADR 005](./decisions/005-block-reference-syntax.md).

### Block subsystem

- **Repository** (`src/server/repositories/block-repository.ts`): CRUD with
  tag and favorite indexes, pipeline-based atomic writes.
- **Service** (`src/server/services/block-service.ts`): Auth-scoped, enforces
  ownership.
- **API**: `GET/POST /api/blocks`, `GET/PATCH/DELETE /api/blocks/:id`.
- **UI**: Block list page (`/blocks`) with create dialog; block editor page
  (`/blocks/[id]`) with autosave, tags, and a "Copy reference" button.

## 10. Prompt Resolver

Templates are resolved by a dedicated, pure, testable resolver
(`src/server/services/prompt-resolver.ts`) that does **not** touch Redis
directly — repositories supply the blocks.

### Template parser

`src/lib/template-parser.ts` provides pure functions for detecting template
syntax in prompt content:

- `parseBlockReferences(text)` → finds all `{{block:blk_...}}` references with
  offsets.
- `parseVariables(text)` → finds all `{{variable_name}}` occurrences (excluding
  block references).
- `detectVariables(text)` → unique variable names, sorted.
- `extractBlockIds(text)` → unique block IDs referenced in the text.

### Resolution flow

1. **Resolve block references** — recursively expand `{{block:id}}` by looking
   up the block's content. Nested references are resolved depth-first.
   **Circular references** are detected by tracking visited block IDs in the
   chain and throwing `PROMPT_CIRCULAR_REFERENCE`.
2. **Detect variables** — after block expansion, since blocks may introduce
   their own `{{variable}}` placeholders.
3. **Resolve variables** — substitute `{{variable}}` with user-provided values.
   Missing variables are reported but do not block resolution.
4. **Validate** — report `missingBlockIds` and `missingVariables`.

### API

`POST /api/prompts/:id/resolve` — fetches referenced blocks from the
repository, runs the resolver, returns:

```json
{
  "content": "resolved text...",
  "detectedVariables": [{ "name": "framework" }],
  "missingBlockIds": ["blk_missing"],
  "missingVariables": ["database"]
}
```

### UI

The **"Use Prompt" dialog** (`src/features/prompts/use-prompt-dialog.tsx`)
opens from the prompt editor, auto-detects variables, shows a live resolved
preview as the user fills in values, and offers "Copy Original" and "Copy
Resolved" buttons. Missing block references are flagged with a warning.

See [ADR 006](./decisions/006-template-variable-syntax.md).

## 11. Autosave

Prompts autosave. The editor keeps local state, debounces changes, and PATCHes
the prompt. The editor footer shows independent states for saving, writing
checks, and word count. Provider failures never prevent saving.

## 12. Search

> **Status: Not yet implemented (Phase 8).**

`SearchService` will be an abstraction over the persistence layer. The MVP
implementation will use Redis-backed indexes and lightweight normalized
matching. The UI will depend only on the `SearchService` interface, so a
dedicated search service can be plugged in later without UI changes.

## 13. Environment

Environment variables are validated with Zod via `@t3-oss/env-nextjs` in
`src/lib/env.ts`. Missing or malformed variables fail fast at startup in
non-test environments.

### Dependency overrides

Transitive dependency compatibility issues are resolved via pnpm overrides in
`pnpm-workspace.yaml`:

- `@firebase/auth` pinned to `1.13.3` (compatibility with `firebase` v12.16.0).
- `jwks-rsa>jose` pinned to `4.15.9` (avoids `jose` v5 breaking changes in
  `firebase-admin`'s JWT verification path).

See [ADR 009](./decisions/009-dependency-overrides.md).

## 14. Visual Identity & Theme

Lexora uses a **purple/cyan brand identity** with semantic CSS design tokens
and full **light/dark/system theme switching**.

### Brand mark

`src/components/brand/lexora-mark.tsx` — an SVG with a purple-to-cyan gradient
(`#8b5cf6` → `#22d3ee`) forming a stylized "L". Used in the sidebar header and
auth layout. An `icon.svg` at the app root provides favicon support.

### Design tokens

Semantic tokens (`--background`, `--foreground`, `--surface`, `--primary`,
`--accent`, `--muted-foreground`, `--border`, etc.) are the only color
references in components. No hard-coded hex values appear in component code.

Both light and dark themes define `--shadow-*` tokens (`--shadow-sm`,
`--shadow-md`, `--shadow-lg`, `--shadow-glow`) that are used by cards,
buttons, and the sidebar for consistent depth.

### Theme system

- **`ThemeProvider`** (`src/components/theme/theme-provider.tsx`): Client
  context that manages the theme state (`system` | `light` | `dark`). Reads
  the initial value from `localStorage` via a lazy state initializer (no
  setState-in-effect). When `system`, subscribes to
  `matchMedia("(prefers-color-scheme: dark)")` and derives the resolved theme.
  Persists changes to `localStorage`.
- **FOUC prevention**: An inline script in `<head>` (layout.tsx) reads
  `localStorage` and sets the `.dark` class on `<html>` before React hydrates.
- **`ThemeToggle`** (`src/components/theme/theme-toggle.tsx`): Segmented
  Light/Dark/System toggle shown in the sidebar footer, mobile top bar, and
  auth layout.

### Intentional dark mode

Dark mode is not a simple inversion — surfaces shift to deep blue-tinted dark
(`245 30% 6%`), the primary shifts to a brighter violet (`255 95% 75%`) for
contrast, and the body background uses dark radial gradients. Shadow tokens
use black with higher opacity for depth.

### Writing decorations

Writing-issue decoration colors (§8) are category-specific and defined in
`globals.css` under `@layer components`. They are independent of the brand
palette so they remain readable regardless of theme.

### Scrollbar & selection

Custom scrollbar styling (thin, translucent) and primary-tinted text
selection are applied in the base layer for both themes.

See [ADR 007](./decisions/007-visual-identity-and-theme.md).

## 15. Responsive Design

Lexora is **mobile-first** — the primary usage target is mobile devices.

### Layout architecture

```
WorkspaceShell (client component, manages drawer state)
├── Sidebar (desktop, fixed aside, hidden below lg)
├── MobileSidebar (Sheet drawer from left, hidden at lg+)
├── MobileTopBar (hamburger + brand, hidden at lg+)
└── main content (responsive padding: px-4 py-6 → lg:px-10 lg:py-10)
```

- **Mobile** (< 1024px): Top bar with hamburger menu, slide-in sidebar drawer,
  bottom-sheet writing issue panel, single-column layouts, enlarged touch
  targets (`py-2.5`).
- **Desktop** (1024px+): Fixed sidebar, multi-column grids, side panel for
  writing issues, standard touch targets (`py-2`).

### Key components

- `Sheet` (`src/components/ui/sheet.tsx`): Radix Dialog-based slide-in drawer,
  used for the mobile sidebar (left) and the writing issue panel (bottom).
- `WorkspaceShell` (`src/components/layout/workspace-shell.tsx`): Client
  component managing `mobileSidebarOpen` state.
- `MobileTopBar` (`src/components/layout/mobile-top-bar.tsx`): Compact header
  with hamburger toggle.
- `Sidebar` shares `SidebarContent` between desktop and mobile with
  `onNavigate` to auto-close the drawer on link click.

### Writing issue panel

- **Desktop**: Fixed right-column `aside` (`hidden lg:block`)
- **Mobile**: Bottom Sheet (`side="bottom"`, `max-h-[70vh]`), triggered by the
  same toggle button which checks viewport width.

See [ADR 010](./decisions/010-mobile-first-responsive-design.md).

## 16. Status

This document tracks the implemented architecture. As phases land it is
updated alongside the code.

**Implemented:**

- Phase 0 — Foundation (Next.js 16, React 19, TypeScript 5, Tailwind CSS v4,
  shadcn/ui, env validation, theme tokens, lint/format/test tooling, base
  directory structure).
- Phase 1 — Authentication (Firebase client SDK, Firebase Admin SDK,
  email/password + Google sign-in, session-cookie-based BFF auth, protected
  workspace layout, login/register/logout UI, `getAuthErrorMessage` with unit
  tests).
- Phase 2 — Redis Foundation (Upstash Redis client with
  `automaticDeserialization: false`, key namespace helpers, serialization
  helpers, repository base patterns, ULID-based prefixed IDs, UserProfile
  repository + bootstrap on sign-in).
- Phase 3 — Projects (repository, service, API, sidebar integration, projects
  list page, project detail page, create/edit dialog, pin/archive/delete
  actions, Zod validation).
- Phase 4 — Basic Prompts (prompt repository with tag/favorite/project
  indexes, prompt service, API routes with filters, TipTap editor with
  debounced autosave, prompt list + detail pages, project detail showing
  prompts, dashboard showing recent prompts, tag normalization).
- Phase 5 — Writing Assistance (WritingProvider interface, LanguageTool
  provider with normalization, writing service with caching/rate-limiting/
  dictionary filtering, `/api/writing/check` + `/api/writing/dictionary`
  routes, TipTap decoration extension for inline issue highlighting,
  suggestion popup, writing issue panel, debounced `useWritingCheck` hook,
  editor integration with click-to-fix and ignore, writing status footer).
- Phase 6 — Blocks (block repository with tag/favorite indexes, block service,
  API routes, block list page with create dialog, block editor page with
  autosave + copy-reference, `{{block:id}}` reference syntax).
- Phase 7 — Variables & Resolution (template parser for `{{variable}}` and
  `{{block:id}}` detection, prompt resolver with circular reference detection,
  `/api/prompts/:id/resolve` route, "Use Prompt" dialog with variable form +
  resolved preview + copy original/resolved, copy button on prompt editor).

**Post-phase improvements:**

- Visual identity redesign: `LexoraMark` brand component, purple/cyan gradient
  theme, intentional dark mode, `icon.svg` favicon
  ([ADR 007](./decisions/007-visual-identity-and-theme.md)).
- Redis `automaticDeserialization: false` to ensure predictable types in
  repository helpers ([ADR 008](./decisions/008-disable-redis-autodeserialization.md)).
- Dependency overrides for `@firebase/auth` and `jwks-rsa>jose` via
  `pnpm-workspace.yaml` ([ADR 009](./decisions/009-dependency-overrides.md)).
- Auth error handling refactored to exported `getAuthErrorMessage` with unit
  tests.
- Mobile-first responsive design: `Sheet` component, `WorkspaceShell` with
  mobile sidebar drawer, `MobileTopBar`, bottom-sheet writing issue panel,
  responsive padding and touch targets
  ([ADR 010](./decisions/010-mobile-first-responsive-design.md)).
- Theme system: `ThemeProvider` with system/light/dark switching, FOUC
  prevention via inline script, `ThemeToggle` segmented control, refined
  token palette with shadow system, custom scrollbar and selection styling.

**Current state:** 115 tests passing, 23 routes, 10 ADRs.
