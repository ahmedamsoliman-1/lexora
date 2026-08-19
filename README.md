# Lexora

> A personal workspace for writing, improving, organizing, composing, versioning, and reusing prompts and text.

**Write once. Improve it. Reuse everywhere.**

Lexora is a personal workspace for managing prompts, reusable paragraphs,
instructions, templates, snippets, and other pieces of text. It is built around
a focused editor with first-class writing assistance, project-based
organization, reusable blocks, template variables, and fast keyboard-driven
search.

## Features

- Focused, fast writing editor with inline writing assistance
- Firebase Authentication (email/password, Google)
- Upstash Redis persistence with user-scoped repositories
- Projects, prompts, blocks, tags, favorites, and version history
- Reusable blocks referenced from prompts via `{{block:id}}`
- Template variables via `{{variable_name}}` and a resolution engine
- Global search with `⌘ K`
- Light / dark / system theme
- Provider-independent writing assistance (LanguageTool-compatible)

## Architecture

Lexora is a full-stack Next.js application using the App Router and a
Backend-for-Frontend (BFF) pattern.

```
Browser  →  Next.js BFF (Server Components / Route Handlers)  →  Services  →  Repositories  →  Upstash Redis
                                          ↓
                                   Firebase Admin (auth verification)
                                          ↓
                                   Writing Provider (LanguageTool)
```

Browser code never touches Upstash credentials, Firebase Admin credentials, or
writing-provider secrets. Every backend operation resolves the authenticated
Firebase UID from the verified ID token — client-supplied user IDs are never
trusted.

See [`docs/architecture.md`](./docs/architecture.md) for details and
[`docs/master-plan.md`](./docs/master-plan.md) for the full product plan.

## Tech Stack

- **Framework:** Next.js 14 (App Router) + React 18 + TypeScript 5
- **Styling:** Tailwind CSS + shadcn/ui + Lucide icons
- **Auth:** Firebase Authentication (client SDK + Admin SDK)
- **Persistence:** Upstash Redis (REST)
- **Writing assistance:** LanguageTool-compatible provider abstraction
- **Validation:** Zod (+ `@t3-oss/env-nextjs` for environment variables)
- **Testing:** Vitest + Testing Library

## Prerequisites

- Node.js 20 (see `.nvmrc`)
- pnpm 9+
- A Firebase project with Authentication enabled
- An Upstash Redis database
- (Optional) A LanguageTool-compatible endpoint

## Local Development

1. **Install dependencies**

   ```bash
   nvm use
   pnpm install
   ```

2. **Configure environment variables**

   ```bash
   cp .env.example .env
   ```

   Fill in the values in `.env`. See `.env.example` for descriptions. Phase 0
   runs without any external services — all infrastructure variables are
   optional until later phases.

3. **Run the dev server**

   ```bash
   pnpm dev
   ```

   Open <http://localhost:3000>.

## Development Commands

| Command             | Description                              |
| ------------------- | ---------------------------------------- |
| `pnpm dev`          | Start the dev server                     |
| `pnpm build`        | Production build                         |
| `pnpm start`        | Start the production server              |
| `pnpm lint`         | Run ESLint                               |
| `pnpm lint:fix`     | Auto-fix ESLint issues                   |
| `pnpm format`       | Format the codebase with Prettier        |
| `pnpm format:check` | Check formatting without writing         |
| `pnpm typecheck`    | Run TypeScript type checks               |
| `pnpm test`         | Run the Vitest test suite once           |
| `pnpm test:watch`   | Run Vitest in watch mode                 |

## Firebase Setup

1. Create a project at <https://console.firebase.google.com>.
2. Enable **Authentication** and the sign-in providers you want (email/password
   and Google are the initial providers).
3. Under **Project settings → General → Your apps**, register a web app to get
   the client config values (`apiKey`, `authDomain`, `projectId`, `appId`).
4. Under **Project settings → Service accounts**, generate a new private key
   and use the `project_id`, `client_email`, and `private_key` for the server
   variables.
5. Fill the matching `NEXT_PUBLIC_FIREBASE_*` and `FIREBASE_*` variables in
   `.env`.

## Upstash Setup

1. Create a database at <https://console.upstash.com>.
2. Use the **REST URL** and **REST Token** from the database details page.
3. Fill `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in `.env`.

## Writing Provider Setup

The default provider is LanguageTool-compatible.

- `WRITING_PROVIDER=languagetool`
- `LANGUAGETOOL_BASE_URL` — base URL of the LanguageTool-compatible API
  (e.g. the public `https://api.languagetool.org/v2` endpoint or a self-hosted
  instance).
- `LANGUAGETOOL_API_KEY` — optional. Only set if your endpoint requires one.

For local development you can run the public LanguageTool API, a self-hosted
LanguageTool server, or simply leave the URL empty and writing assistance will
gracefully report as unavailable without blocking editing.

## Testing

Tests are written with [Vitest](https://vitest.dev) and
[@testing-library/react](https://testing-library.com). Run the suite with:

```bash
pnpm test
```

## Deployment

Lexora targets [Vercel](https://vercel.com).

1. Push the repository to GitHub/GitLab/Bitbucket.
2. Import the project in Vercel.
3. Configure the environment variables from `.env.example` in the Vercel
   project settings.
4. Deploy.

## Project Structure

```
src/
├── app/            # Next.js App Router (pages, layouts, route handlers)
├── components/     # Reusable React components (ui, layout, common)
├── features/       # Feature modules (projects, prompts, blocks, ...)
├── hooks/          # React hooks
├── lib/            # Cross-cutting utilities (env, cn, ...)
├── schemas/        # Zod schemas for API/runtime validation
├── server/         # Server-only code (auth, repositories, services, redis, writing)
└── types/          # Shared TypeScript types
```

See [`docs/architecture.md`](./docs/architecture.md) and
[`docs/master-plan.md`](./docs/master-plan.md) for more.

## License

Private project.
