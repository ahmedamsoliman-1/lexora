# Lexora

> **A personal workspace for writing, improving, organizing, composing, versioning, and reusing prompts and text.**

**Project codename:** `lexora`
**Document:** Master Product & Implementation Plan
**Primary deployment target:** Vercel
**Primary stack:** Next.js + TypeScript + Firebase Authentication + Upstash Redis
**Writing assistance:** LanguageTool-compatible provider
**Architecture:** Full-stack Next.js using a Backend-for-Frontend (BFF) pattern

---

# 1. Vision

Lexora is a modern personal workspace for managing prompts, reusable paragraphs, instructions, templates, snippets, and other pieces of text.

The problem Lexora solves is simple: useful prompts are usually scattered across ChatGPT conversations, Markdown files, notes applications, source-code repositories, documents, and clipboard history.

Lexora should become the user's **single source of truth for reusable text and prompts**.

However, Lexora is not intended to be only a storage application.

Its core workflow is:

```text
Write
  ↓
Correct
  ↓
Improve
  ↓
Organize
  ↓
Compose
  ↓
Reuse
```

Writing assistance is therefore a first-class feature.

As the user writes, Lexora should automatically detect spelling, grammar, punctuation, capitalization, duplicated words, and basic style issues.

The application should eventually also understand the structure of prompts and provide prompt-specific quality checks.

---

# 2. Product Principles

Lexora should follow several strong principles.

## 2.1 Writing comes first

The editor is the heart of the product.

Creating and editing text must feel fast, clean, and distraction-free.

The application should never feel like an administration dashboard with a textarea added to it.

---

## 2.2 Projects provide structure

Everything should naturally belong to a project.

Example:

```text
Lexora
│
├── Omnisphere
│   ├── Backend Agent Prompt
│   ├── Deployment Debugging Prompt
│   └── Architecture Review
│
├── Scoreline
│   ├── Implementation Prompt
│   └── Review Instructions
│
├── Personal Projects
│   ├── Master Plan Generator
│   ├── Next.js Agent Prompt
│   └── Firebase Setup
│
└── Recruitment
    ├── Recruiter Response
    └── CV Review Prompt
```

Projects provide hierarchy.

Tags provide cross-project organization.

---

## 2.3 Reuse instead of duplication

Users frequently repeat instructions such as:

```text
Use TypeScript.

Use Next.js App Router.

Follow the existing architecture.

Do not modify unrelated files.

Read docs/master-plan.md before implementation.
```

Lexora should allow these instructions to exist once as reusable **Blocks**.

---

## 2.4 Free-first architecture

The initial application should be practical to operate using free tiers wherever possible.

Primary infrastructure:

```text
Vercel
Firebase Authentication
Upstash Redis
LanguageTool-compatible API
```

Do not introduce infrastructure merely because it may become useful later.

---

## 2.5 Provider independence

External integrations must be abstracted.

For example:

```text
WritingProvider
    │
    ├── LanguageToolProvider
    └── FutureSelfHostedProvider
```

Lexora should not become tightly coupled to a single grammar API.

---

## 2.6 Privacy-conscious

Prompts can contain private code, architecture information, personal writing, credentials accidentally pasted by users, and other sensitive content.

Lexora should minimize sending text to external services.

The UI should clearly communicate when text is being processed by an external writing provider.

Future self-hosted writing providers should be possible without redesigning the application.

---

# 3. Target User

The initial target is a single technical user managing large amounts of reusable text.

Typical content includes:

* Coding prompts
* Agent instructions
* System prompts
* Project implementation prompts
* Architecture prompts
* LLM handoff instructions
* Reusable paragraphs
* Technical explanations
* Recruitment responses
* Writing templates
* Image-generation prompts
* Research prompts
* Debugging prompts
* Command templates
* Reusable instructions
* Notes
* Snippets

The data model should nevertheless support multiple authenticated users from the beginning.

Every resource must belong to a Firebase user ID.

---

# 4. High-Level Architecture

```text
                         ┌──────────────────┐
                         │     Browser      │
                         │                  │
                         │ React / Next.js  │
                         └────────┬─────────┘
                                  │
                                  │ HTTPS
                                  ▼
                     ┌─────────────────────────┐
                     │       Next.js BFF       │
                     │                         │
                     │ Server Components       │
                     │ Route Handlers          │
                     │ Server Services         │
                     └───────┬────────┬────────┘
                             │        │
                    ┌────────┘        └────────────┐
                    ▼                              ▼
            ┌───────────────┐              ┌───────────────┐
            │   Firebase    │              │    Upstash    │
            │               │              │     Redis     │
            │ Authentication│              │               │
            └───────────────┘              │ Application DB│
                                           └───────┬───────┘
                                                   │
                                      ┌────────────┘
                                      │
                                      ▼
                                ┌──────────────┐
                                │ Writing API  │
                                │              │
                                │ LanguageTool │
                                └──────────────┘
```

---

# 5. Technology Stack

## Frontend

```text
Next.js
React
TypeScript
App Router
Tailwind CSS
shadcn/ui
Lucide Icons
```

Potential editor technologies should be evaluated during implementation.

Preferred candidates:

```text
TipTap
Lexical
CodeMirror
```

For the first implementation, prefer the simplest editor that provides:

* Reliable plain/rich text editing
* Decorations
* Inline issue highlighting
* Keyboard handling
* Selection APIs
* Extensibility
* Good React integration

Do not build a custom contenteditable implementation unless necessary.

---

# 6. Backend

Use Next.js as both frontend and BFF.

Example structure:

```text
src/
├── app/
├── components/
├── features/
├── lib/
├── server/
│   ├── auth/
│   ├── projects/
│   ├── prompts/
│   ├── blocks/
│   ├── versions/
│   ├── search/
│   └── writing/
└── types/
```

Browser code must never contain:

* Upstash administrative credentials
* Firebase Admin credentials
* Writing-provider secrets
* Future AI provider secrets

---

# 7. Authentication

Use Firebase Authentication.

Initial providers:

```text
Email/password
Google
```

Potential future providers:

```text
GitHub
Microsoft
```

Authentication flow:

```text
Browser
   │
Firebase Authentication
   │
Firebase ID Token
   │
Next.js BFF
   │
Firebase Admin verification
   │
uid
   │
Application services
```

All backend operations must resolve the authenticated Firebase UID.

Never trust a `userId` supplied by the client.

---

# 8. Persistence

Use Upstash Redis as the primary application persistence layer.

The persistence implementation must be isolated behind repositories.

Example:

```ts
interface PromptRepository {
  create(input: CreatePromptInput): Promise<Prompt>;
  get(userId: string, id: string): Promise<Prompt | null>;
  update(userId: string, id: string, input: UpdatePromptInput): Promise<Prompt>;
  delete(userId: string, id: string): Promise<void>;
  listByProject(userId: string, projectId: string): Promise<Prompt[]>;
}
```

Business logic must not directly scatter Redis commands throughout route handlers.

Use:

```text
Route
  ↓
Service
  ↓
Repository
  ↓
Redis
```

---

# 9. Redis Namespace

Use a clear namespace.

```text
lexora:v1:
```

Examples:

```text
lexora:v1:user:{uid}
lexora:v1:project:{uid}:{projectId}
lexora:v1:prompt:{uid}:{promptId}
lexora:v1:block:{uid}:{blockId}
```

Indexes:

```text
lexora:v1:user:{uid}:projects
lexora:v1:user:{uid}:prompts
lexora:v1:user:{uid}:blocks

lexora:v1:project:{uid}:{projectId}:prompts
```

Favorites:

```text
lexora:v1:user:{uid}:favorites
```

Recent items:

```text
lexora:v1:user:{uid}:recent
```

Tags:

```text
lexora:v1:user:{uid}:tags
lexora:v1:tag:{uid}:{tag}:prompts
```

Versions:

```text
lexora:v1:prompt:{uid}:{promptId}:versions
```

Writing cache:

```text
lexora:v1:writing:{hash}
```

Never use `KEYS *` for application queries.

Maintain explicit indexes.

---

# 10. Core Domain Model

Lexora should initially have the following major entities:

```text
User
Project
Prompt
Block
PromptVersion
Tag
Favorite
WritingIssue
```

---

# 11. User

```ts
interface UserProfile {
  id: string;
  displayName?: string;
  email?: string;
  photoUrl?: string;

  preferences: UserPreferences;

  createdAt: string;
  updatedAt: string;
}
```

Preferences:

```ts
interface UserPreferences {
  theme: "system" | "light" | "dark";

  writingLanguage: string;

  autoCheckWriting: boolean;

  editorFontSize: number;

  editorWidth: "comfortable" | "wide";

  reducedMotion: boolean;
}
```

---

# 12. Projects

Projects are the primary organizational unit.

```ts
interface Project {
  id: string;
  userId: string;

  name: string;
  description?: string;

  icon?: string;
  color?: string;

  pinned: boolean;
  archived: boolean;

  createdAt: string;
  updatedAt: string;
}
```

Project operations:

```text
Create
Rename
Edit description
Change icon
Pin
Unpin
Archive
Restore
Delete
```

Deleting a project must require confirmation.

The application must explicitly decide whether prompts are deleted or moved before destructive project deletion.

Prefer:

```text
Archive → normal workflow
Permanent delete → explicit secondary action
```

---

# 13. Prompts

Prompts are the primary content object.

```ts
interface Prompt {
  id: string;
  userId: string;
  projectId: string;

  title: string;
  description?: string;

  content: string;

  type: PromptType;

  tags: string[];

  favorite: boolean;
  pinned: boolean;
  archived: boolean;

  createdAt: string;
  updatedAt: string;
}
```

Prompt types:

```ts
type PromptType =
  | "prompt"
  | "system-prompt"
  | "agent-prompt"
  | "template"
  | "paragraph"
  | "snippet"
  | "instruction"
  | "note";
```

Types should primarily be metadata.

Do not create separate persistence systems for each type.

---

# 14. Reusable Blocks

Blocks are reusable pieces of text.

Example:

```text
Name:
Coding Agent Rules

Content:

Read the project documentation completely before implementation.

Respect the existing architecture.

Do not modify unrelated code.

Run relevant tests after every meaningful implementation stage.
```

Model:

```ts
interface Block {
  id: string;
  userId: string;

  name: string;
  description?: string;

  content: string;

  tags: string[];

  favorite: boolean;

  createdAt: string;
  updatedAt: string;
}
```

---

# 15. Block References

Prompts should support block references.

Example:

```text
Implement the authentication feature.

{{block:coding-agent-rules}}

Requirements:

- Firebase authentication
- Server-side validation

{{block:output-format}}
```

Internally, references should preferably use immutable IDs:

```text
{{block:blk_01ABC}}
```

The editor can display the friendly block name.

This prevents references from breaking when a block is renamed.

---

# 16. Prompt Variables

Templates should support variables.

Example:

```text
Create a {{framework}} application called {{project_name}}.

Use {{database}} for persistence.

Authentication should use {{authentication_provider}}.

Deploy the application to {{deployment_target}}.
```

Lexora should detect variables automatically.

Model:

```ts
interface PromptVariable {
  name: string;
  defaultValue?: string;
}
```

When the user selects **Use Prompt**, display:

```text
Project name
[ Celestia ]

Framework
[ Next.js ]

Database
[ PostgreSQL ]

Authentication provider
[ Firebase ]

Deployment target
[ Vercel ]
```

Generate the final resolved prompt without modifying the stored template.

---

# 17. Prompt Resolution Engine

Create a dedicated resolver.

```text
Stored Prompt
      │
      ├── Resolve Blocks
      │
      ├── Resolve Variables
      │
      └── Validate
      ↓
Final Prompt
```

API concept:

```ts
resolvePrompt({
  prompt,
  blocks,
  variables
})
```

The resolver should detect:

```text
Missing block
Missing variable
Circular block reference
Invalid syntax
Empty required variable
```

---

# 18. Prompt Composer

Create a dedicated Composer workspace.

The Composer allows temporary prompt construction without requiring the result to immediately become a stored prompt.

Concept:

```text
┌─────────────────────────────────────────────────────────────┐
│ Composer                                         Preview   │
├──────────────────┬──────────────────────────────────────────┤
│ BLOCKS           │ COMPOSITION                              │
│                  │                                          │
│ Coding Rules     │ You are responsible for implementing... │
│ Agent Rules      │                                          │
│ Next.js Rules    │ [ Coding Rules ]                         │
│ Output Format    │                                          │
│ Firebase         │ Implement the following requirements...  │
│                  │                                          │
│                  │ [ Output Format ]                        │
│                  │                                          │
├──────────────────┴──────────────────────────────────────────┤
│  1,284 chars                     Copy      Save as Prompt   │
└─────────────────────────────────────────────────────────────┘
```

Support:

```text
Add block
Remove block
Reorder blocks
Write custom text
Resolve variables
Preview final prompt
Copy
Save as new prompt
```

Drag-and-drop is desirable but not mandatory for the first MVP.

---

# 19. Writing Assistance — Core Feature

Writing assistance is one of Lexora's defining capabilities.

It must be designed as a subsystem rather than implemented as an arbitrary API call from the editor.

Architecture:

```text
Editor
   │
   │ debounce
   ▼
POST /api/writing/check
   │
   ▼
WritingService
   │
   ▼
WritingProvider
   │
   ├── LanguageToolProvider
   │
   └── future providers
```

---

# 20. Writing Provider Interface

Create a provider abstraction.

Conceptually:

```ts
interface WritingProvider {
  check(input: WritingCheckInput): Promise<WritingCheckResult>;
}
```

Input:

```ts
interface WritingCheckInput {
  text: string;
  language?: string;
}
```

Output:

```ts
interface WritingCheckResult {
  language: string;
  issues: WritingIssue[];
}
```

Issue:

```ts
interface WritingIssue {
  id: string;

  message: string;
  shortMessage?: string;

  offset: number;
  length: number;

  category:
    | "spelling"
    | "grammar"
    | "punctuation"
    | "style"
    | "typography"
    | "other";

  replacements: string[];

  ruleId?: string;
}
```

The editor must depend on this normalized format rather than LanguageTool's native response.

---

# 21. LanguageTool Integration

The first provider should use a LanguageTool-compatible HTTP API.

Responsibilities:

```text
Send text
Select language
Receive matches
Normalize response
Handle provider errors
Handle rate limits
Return WritingIssue[]
```

Do not expose provider-specific response structures to frontend components.

Environment configuration should support something conceptually equivalent to:

```text
WRITING_PROVIDER=languagetool
LANGUAGETOOL_BASE_URL=...
LANGUAGETOOL_API_KEY=...
```

The API key must remain optional if the configured endpoint does not require one.

Do not hard-code the public endpoint throughout the application.

---

# 22. Writing Check Behavior

Never call the writing API for every keystroke.

Use debouncing.

Suggested initial behavior:

```text
User types
    ↓
800ms inactivity
    ↓
Text changed?
    ↓ yes
Calculate hash
    ↓
Check local/server cache
    ↓
Call provider if necessary
```

The exact debounce interval should be configurable.

Start around:

```text
800 ms
```

---

# 23. Writing Cache

Calculate a hash from:

```text
provider
language
text
provider configuration version
```

Example:

```text
SHA-256(
  "languagetool|en-US|Create an applicaton..."
)
```

Store normalized results temporarily:

```text
lexora:v1:writing:{hash}
```

Use a TTL.

The cache must not become permanent storage of every paragraph the user has ever written.

---

# 24. Writing Editor UX

Writing issues should appear inline.

Example:

```text
Create an applicaton that mange prompts.
          ──────────      ─────
```

Selecting the issue should display:

```text
Possible spelling mistake

application

[ Apply ] [ Ignore ]
```

Another:

```text
"mange"

Suggestions:

manage
range

[ Manage ] [ Ignore ]
```

Applying a correction should update the editor without losing cursor position where practical.

---

# 25. Writing Issue Panel

In addition to inline decorations, provide an issue panel.

Example:

```text
Writing
────────────────────

2 issues

Spelling
"applicaton"
→ application

Grammar
"that manage"
→ that manages

────────────────────

Ignore all
Recheck
```

On narrow screens this can become a drawer.

---

# 26. Writing Status

The editor footer can display:

```text
✓ Saved     2 writing issues     English (US)
```

States:

```text
Checking...
No issues
2 issues
Writing assistance unavailable
Writing assistance disabled
```

Provider failure must never prevent editing or saving.

Writing assistance is enhancement, not a dependency for persistence.

---

# 27. Personal Dictionary

Users should eventually be able to add valid technical words.

Examples:

```text
Next.js
Upstash
Omnisphere
Scoreline
Lexora
Fastify
Kubernetes
```

Model:

```text
lexora:v1:user:{uid}:dictionary
```

When provider issues are returned, filter known personal dictionary terms before sending them to the editor.

Operations:

```text
Add to dictionary
Remove from dictionary
View dictionary
```

---

# 28. Ignore Rules

Allow users to ignore specific issue types/rules.

Possible future storage:

```text
lexora:v1:user:{uid}:writing:ignored-rules
```

Do not overbuild this during the initial MVP.

---

# 29. Language Support

Do not hard-code the application to English.

User preference:

```text
writingLanguage
```

Prompt-level override may later be supported.

Editor control:

```text
Language
English (US) ▼
```

Also support:

```text
Auto Detect
```

if the configured writing provider handles it reliably.

---

# 30. Future AI Writing Layer

Grammar correction and AI rewriting are different systems.

Keep them separated.

```text
WritingProvider
      │
      └── deterministic grammar/spelling

AIProvider
      │
      └── generative transformations
```

Future actions:

```text
Improve writing
Make clearer
Make shorter
Make professional
Simplify
Expand
Rewrite
Explain changes
```

Do not require an LLM API for MVP completion.

---

# 31. Future BYOK AI

A future version may support **Bring Your Own Key**.

Providers could include:

```text
OpenAI-compatible endpoint
OpenAI
Anthropic
Gemini
Groq
OpenRouter
Custom endpoint
```

Do not implement all providers prematurely.

Design interfaces so they can be added cleanly.

---

# 32. Prompt Quality Analysis

Eventually Lexora should understand that a prompt is not merely ordinary prose.

Create a future `PromptAnalyzer` subsystem.

Possible checks:

```text
Undefined variables
Broken block references
Ambiguous instructions
Conflicting requirements
Missing expected output
Missing context
Very long paragraphs
Repeated instructions
Unresolved placeholders
Potential secrets
Malformed template syntax
```

Example:

```text
Build the application and make it modern.
```

Lexora could eventually display:

```text
Prompt Quality

⚠ "modern" is ambiguous.

Consider defining:
- visual style
- spacing
- typography
- color treatment

⚠ No output format specified.

⚠ No technology stack detected.
```

This should initially be heuristic and deterministic where possible.

Do not require AI for every quality check.

---

# 33. Prompt Health

A future optional score:

```text
Prompt Health
84 / 100
```

Potential dimensions:

```text
Writing
Structure
Variables
References
Completeness
Clarity
```

Avoid presenting this as objective truth.

It should be a helpful indicator rather than a scientific score.

---

# 34. Autosave

Prompts should autosave.

Workflow:

```text
User edits
   ↓
local editor state
   ↓
debounce
   ↓
PATCH prompt
   ↓
Redis
```

UI:

```text
Saving...
Saved
Save failed — retrying
```

Do not require users to click a Save button for ordinary edits.

---

# 35. Local Draft Protection

Avoid losing work if the browser crashes before autosave.

Maintain temporary local draft state.

Possible approach:

```text
localStorage / IndexedDB
```

On opening a prompt:

```text
Server version
      vs
Local unsaved draft
```

If local content is newer, offer recovery.

---

# 36. Version History

Prompts should support versions.

Do not create a version for every keystroke.

Create versions based on meaningful save checkpoints.

Possible strategy:

```text
Autosave continuously.

Create version when:
- enough time has elapsed
- meaningful content changed
- user manually creates snapshot
```

Model:

```ts
interface PromptVersion {
  id: string;
  promptId: string;
  userId: string;

  content: string;

  createdAt: string;
  reason:
    | "automatic"
    | "manual"
    | "restore";
}
```

---

# 37. Version UI

Example:

```text
Version History

Today

14:32   Current
13:51   Automatic snapshot
11:06   Manual snapshot

Yesterday

21:14   Automatic snapshot
```

Actions:

```text
Preview
Compare
Restore
Copy
```

Restoring should itself create a new version rather than destroying history.

---

# 38. Search

Global search is essential.

Keyboard shortcut:

```text
⌘ K
```

or:

```text
Ctrl + K
```

Search:

```text
Projects
Prompts
Blocks
Tags
```

Example:

```text
Search Lexora...

> firebase auth

PROMPTS

Firebase BFF Authentication
Personal Website / Authentication

Firebase Agent Setup
Personal Projects / Agents

BLOCKS

Firebase Rules
Authentication
```

---

# 39. Search Architecture

For MVP, build an abstraction:

```ts
interface SearchService {
  search(userId: string, query: string): Promise<SearchResult[]>;
}
```

The initial implementation can use Redis-backed indexes and lightweight normalized matching.

The architecture should allow later integration with a dedicated search service without changing UI code.

Do not introduce vector search merely because the application contains prompts.

---

# 40. Tags

Tags provide cross-project classification.

Example:

```text
#nextjs
#firebase
#backend
#agent
#architecture
#writing
#research
#image
```

Support:

```text
Add
Remove
Search
Filter
Rename
Delete
```

Tag names should be normalized.

---

# 41. Favorites

Users should be able to favorite:

```text
Prompts
Blocks
```

Favorites should be quickly accessible from the sidebar/dashboard.

---

# 42. Pinning

Pinning is different from favorites.

Use pinning for navigation priority.

Examples:

```text
Pinned Projects
Pinned Prompts
```

---

# 43. Recent Items

Maintain recent access history.

Use a sorted set:

```text
lexora:v1:user:{uid}:recent
```

Score:

```text
Unix timestamp
```

Limit history to a reasonable amount.

Example:

```text
100–200 resources
```

---

# 44. Dashboard

The dashboard should be useful rather than analytics-heavy.

Concept:

```text
┌──────────────────────────────────────────────────────────────┐
│ Lexora                                      Search     User │
├──────────────┬───────────────────────────────────────────────┤
│              │                                               │
│ Home         │ Good afternoon.                               │
│ Projects     │                                               │
│ Prompts      │ Search your workspace                         │
│ Blocks       │ ┌───────────────────────────────────────────┐ │
│ Favorites    │ │ Search prompts, blocks and projects...    │ │
│              │ └───────────────────────────────────────────┘ │
│ PROJECTS     │                                               │
│              │ Recent                                        │
│ Omnisphere   │                                               │
│ Scoreline    │ Backend Agent Prompt                 8 min    │
│ Personal     │ Master Plan Generator                1 day    │
│              │ Firebase Setup                       2 days   │
│              │                                               │
│ + Project    │ Pinned Projects                               │
│              │                                               │
│              │ Omnisphere   Scoreline   Personal             │
│              │                                               │
└──────────────┴───────────────────────────────────────────────┘
```

---

# 45. Main Navigation

Desktop sidebar:

```text
Lexora

Search

Home
All Prompts
Blocks
Favorites

PROJECTS

Omnisphere
Scoreline
Personal
Recruitment

+ New Project

────────────────

Settings
User
```

Sidebar should be collapsible.

---

# 46. Prompt Editor Layout

Desktop:

```text
┌───────────────────────────────────────────────────────────────┐
│ ← Personal / Prompts                     ☆      •••          │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│ Backend Implementation Agent                                  │
│                                                               │
│ #agent   #nextjs   #backend                                   │
│                                                               │
│ ───────────────────────────────────────────────────────────   │
│                                                               │
│ You are responsible for implementing the backend...           │
│                                                               │
│ {{block:coding-rules}}                                        │
│                                                               │
│ Requirements                                                  │
│                                                               │
│ - Use Next.js                                                 │
│ - Use Firebase authentication                                 │
│                                                               │
│ ───────────────────────────────────────────────────────────   │
│                                                               │
│ ✓ Saved        2 writing issues       824 words               │
└───────────────────────────────────────────────────────────────┘
```

Keep the editor visually quiet.

---

# 47. Visual Direction

Lexora should feel:

```text
Modern
Quiet
Focused
Premium
Minimal
Fast
Technical without looking like an admin panel
```

Visual inspiration can come conceptually from:

```text
Linear
Raycast
Notion
Arc
Vercel
Craft
```

Do not copy any product directly.

---

# 48. Theme

Support:

```text
Light
Dark
System
```

Dark mode should be designed intentionally rather than produced by simple color inversion.

Use CSS variables/design tokens.

---

# 49. Design Tokens

Create semantic tokens such as:

```text
--background
--foreground
--surface
--surface-hover
--border
--muted
--muted-foreground
--accent
--accent-foreground
--danger
--success
--warning
```

Avoid hard-coded colors scattered throughout components.

---

# 50. Typography

The content editor deserves special typography.

Requirements:

```text
Comfortable line height
Readable width
Strong heading hierarchy
Excellent monospace rendering
Clear inline code
Good Arabic/non-Latin compatibility where practical
```

Do not make editor text unnecessarily small.

---

# 51. Responsive Design

Lexora is primarily desktop-oriented but must remain functional on mobile/tablet.

Desktop:

```text
Sidebar + Editor + optional writing panel
```

Tablet:

```text
Collapsible sidebar + editor
```

Mobile:

```text
Top navigation
Editor
Bottom/drawer actions
```

Do not attempt to display three desktop columns on a phone.

---

# 52. Keyboard-First Interaction

Important shortcuts:

```text
⌘ K      Search
⌘ N      New prompt
⌘ ⇧ N    New project
⌘ Enter  Resolve/use prompt where appropriate
Esc      Close dialogs
```

Platform-aware equivalents should be supported.

Do not override standard browser/editor shortcuts unnecessarily.

---

# 53. Copy Experience

Copying prompts is one of the most frequent actions.

Provide obvious:

```text
Copy
```

After copy:

```text
✓ Copied
```

Resolved templates should offer:

```text
Copy Original
Copy Resolved
```

---

# 54. API Design

Suggested BFF endpoints:

```text
/api/auth/session

/api/projects
/api/projects/:id

/api/prompts
/api/prompts/:id
/api/prompts/:id/versions
/api/prompts/:id/resolve

/api/blocks
/api/blocks/:id

/api/search

/api/writing/check
/api/writing/dictionary

/api/settings
```

Use conventional HTTP semantics.

---

# 55. Projects API

```text
GET    /api/projects
POST   /api/projects

GET    /api/projects/:id
PATCH  /api/projects/:id
DELETE /api/projects/:id
```

---

# 56. Prompts API

```text
GET    /api/prompts
POST   /api/prompts

GET    /api/prompts/:id
PATCH  /api/prompts/:id
DELETE /api/prompts/:id

POST   /api/prompts/:id/resolve
```

Filters:

```text
projectId
tag
type
favorite
archived
query
```

---

# 57. Blocks API

```text
GET    /api/blocks
POST   /api/blocks

GET    /api/blocks/:id
PATCH  /api/blocks/:id
DELETE /api/blocks/:id
```

---

# 58. Writing API

```text
POST /api/writing/check
```

Request:

```json
{
  "text": "Create an applicaton.",
  "language": "en-US"
}
```

Normalized response:

```json
{
  "language": "en-US",
  "issues": [
    {
      "id": "issue_x",
      "message": "Possible spelling mistake",
      "offset": 10,
      "length": 10,
      "category": "spelling",
      "replacements": [
        "application"
      ]
    }
  ]
}
```

---

# 59. Validation

Use runtime validation for all API inputs.

A library such as Zod is appropriate.

Never assume TypeScript types validate HTTP requests.

Validate:

```text
IDs
Titles
Content
Tags
Enums
Pagination
Query parameters
Writing requests
```

---

# 60. Security

Every application resource must be scoped to the authenticated UID.

Bad:

```ts
getPrompt(promptId)
```

Preferred:

```ts
getPrompt(userId, promptId)
```

Repositories should enforce ownership whenever possible.

---

# 61. Secret Detection

Since this is a prompt application, users may accidentally paste secrets.

A future deterministic detector can warn about patterns resembling:

```text
API keys
Bearer tokens
Private keys
AWS keys
JWTs
Passwords in common formats
```

Example:

```text
Potential secret detected.

This text may be sent to an external writing provider.

[Disable Writing Check]
[Continue]
```

This can become especially important before external AI integrations.

Do not block ordinary text unnecessarily.

---

# 62. Rate Limiting

Public BFF routes should have basic protection.

Particularly:

```text
/api/writing/check
/api/search
```

Use authenticated user IDs as part of rate-limit keys.

Example concept:

```text
lexora:ratelimit:writing:{uid}
```

Keep limits generous enough not to damage normal editor behavior.

---

# 63. Error Handling

Create normalized application errors.

Example:

```ts
{
  code: "WRITING_PROVIDER_UNAVAILABLE",
  message: "Writing assistance is temporarily unavailable."
}
```

Useful codes:

```text
UNAUTHORIZED
FORBIDDEN
NOT_FOUND
VALIDATION_ERROR
CONFLICT
RATE_LIMITED

WRITING_PROVIDER_UNAVAILABLE
WRITING_PROVIDER_RATE_LIMITED

PROMPT_BLOCK_NOT_FOUND
PROMPT_VARIABLE_MISSING
PROMPT_CIRCULAR_REFERENCE
```

Do not leak provider internals or credentials.

---

# 64. Observability

Use structured server logging.

Include:

```text
requestId
route
method
status
duration
userId hash where appropriate
error code
```

Never log complete prompt content by default.

Never log authentication tokens.

Never log external provider credentials.

---

# 65. Analytics

For the personal MVP, analytics should be minimal.

Potential internal statistics:

```text
Project count
Prompt count
Block count
Favorite count
```

Do not create a complex event pipeline during initial implementation.

---

# 66. Settings

Settings sections:

```text
Account
Appearance
Editor
Writing
Data
About
```

Writing settings:

```text
Writing assistance          ON
Language                    English (US)
Check while typing          ON
Personal dictionary
```

Editor:

```text
Font size
Editor width
Line height
Spellcheck
```

---

# 67. Data Export

Users must not be locked into Lexora.

Provide future export:

```text
JSON
Markdown
```

Possible project export:

```text
project/
├── project.json
├── prompts/
│   ├── backend-agent.md
│   └── review-agent.md
└── blocks/
    ├── coding-rules.md
    └── output-format.md
```

Data portability is important for a personal knowledge tool.

---

# 68. Import

Future import:

```text
Markdown
Text
Lexora JSON export
```

Potential later:

```text
Folder import
```

Do not make import a blocker for MVP.

---

# 69. PWA

Lexora could later become installable as a PWA.

Benefits:

```text
Mac-like app experience
Windows installation
Mobile home-screen access
Offline shell
```

Do not prioritize full offline synchronization during MVP.

---

# 70. Suggested Repository Structure

```text
lexora/
│
├── docs/
│   ├── master-plan.md
│   ├── architecture.md
│   └── decisions/
│
├── public/
│
├── src/
│   │
│   ├── app/
│   │   ├── (auth)/
│   │   ├── (workspace)/
│   │   │   ├── page.tsx
│   │   │   ├── projects/
│   │   │   ├── prompts/
│   │   │   ├── blocks/
│   │   │   ├── favorites/
│   │   │   ├── composer/
│   │   │   └── settings/
│   │   │
│   │   └── api/
│   │       ├── projects/
│   │       ├── prompts/
│   │       ├── blocks/
│   │       ├── search/
│   │       └── writing/
│   │
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   └── common/
│   │
│   ├── features/
│   │   ├── projects/
│   │   ├── prompts/
│   │   ├── blocks/
│   │   ├── composer/
│   │   ├── search/
│   │   └── writing/
│   │
│   ├── server/
│   │   ├── auth/
│   │   ├── repositories/
│   │   ├── services/
│   │   ├── writing/
│   │   │   ├── provider.ts
│   │   │   ├── languagetool.ts
│   │   │   ├── normalize.ts
│   │   │   └── cache.ts
│   │   └── redis/
│   │
│   ├── lib/
│   │
│   ├── hooks/
│   │
│   ├── schemas/
│   │
│   └── types/
│
├── tests/
│
├── .env.example
├── package.json
└── README.md
```

Exact structure may evolve, but maintain strong domain separation.

---

# 71. Environment Variables

Create `.env.example`.

Conceptually:

```bash
# Application
NEXT_PUBLIC_APP_NAME=Lexora
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Firebase Client
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# Upstash
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Writing
WRITING_PROVIDER=languagetool
LANGUAGETOOL_BASE_URL=
LANGUAGETOOL_API_KEY=
```

Never commit actual secrets.

---

# 72. Testing Strategy

Use multiple layers.

## Unit

Test:

```text
Prompt resolver
Variable parser
Block parser
Circular reference detection
Writing response normalization
Personal dictionary filtering
Tag normalization
Repository serialization
```

## Integration

Test:

```text
Authentication enforcement
Project CRUD
Prompt CRUD
Block CRUD
Writing endpoint
Prompt resolution
```

## UI

Test critical flows:

```text
Login
Create project
Create prompt
Autosave
Writing correction
Apply suggestion
Copy prompt
Create reusable block
Resolve template
Search
```

---

# 73. Development Phases

Implementation should proceed incrementally.

Do not attempt every feature simultaneously.

---

# Phase 0 — Foundation

Create:

```text
Next.js project
TypeScript
Tailwind
shadcn/ui
Linting
Formatting
Environment validation
Base directory structure
Theme tokens
```

Deliverable:

A clean application shell running locally.

---

# Phase 1 — Authentication

Implement:

```text
Firebase client
Firebase Admin
Login
Registration
Logout
Protected workspace
Session/token validation
User bootstrap
```

Deliverable:

Authenticated users can access Lexora.

---

# Phase 2 — Redis Foundation

Implement:

```text
Upstash connection
Key namespace helpers
Repository base patterns
Serialization helpers
Error handling
```

Deliverable:

Server can safely persist user-scoped resources.

---

# Phase 3 — Projects

Implement:

```text
Create project
List projects
Open project
Rename
Edit
Pin
Archive
Delete
```

Deliverable:

Project navigation works end-to-end.

---

# Phase 4 — Basic Prompts

Implement:

```text
Create prompt
Open prompt
Edit title
Edit content
Autosave
Delete
Archive
Favorite
Tags
```

Deliverable:

Lexora already functions as a basic prompt manager.

---

# Phase 5 — Writing Assistance

This phase is critical and belongs in MVP.

Implement:

```text
WritingProvider interface
LanguageTool provider
/api/writing/check
Normalization
Debouncing
Caching
Inline editor decorations
Suggestion popup
Apply suggestion
Ignore suggestion
Issue count
Provider error handling
Language selection
```

Deliverable:

Lexora actively helps users correct text while writing.

This phase should receive significant testing.

---

# Phase 6 — Blocks

Implement:

```text
Block CRUD
Block browser
Insert block
Reference syntax
Reference resolution
Missing-reference handling
```

Deliverable:

Reusable text becomes a first-class feature.

---

# Phase 7 — Variables

Implement:

```text
Variable parser
Variable detection
Variable form
Prompt resolver
Resolved preview
Copy resolved prompt
```

Deliverable:

Prompts become reusable templates.

---

# Phase 8 — Search

Implement:

```text
Global search
⌘ K
Project search
Prompt search
Block search
Tag filtering
```

Deliverable:

Large workspaces remain easy to navigate.

---

# Phase 9 — Versions

Implement:

```text
Automatic snapshots
Manual snapshot
History
Preview
Restore
```

Deliverable:

Users can safely evolve important prompts.

---

# Phase 10 — Composer

Implement:

```text
Composer workspace
Add blocks
Custom text
Reorder
Variables
Preview
Copy
Save as prompt
```

Deliverable:

Lexora becomes a prompt construction environment.

---

# Phase 11 — Polish

Focus on:

```text
Responsive design
Keyboard shortcuts
Loading states
Empty states
Error states
Accessibility
Animations
Performance
Dark mode
Mobile behavior
```

---

# 74. MVP Definition

Lexora MVP is complete when the user can:

```text
✓ Register/login
✓ Create projects
✓ Create prompts
✓ Edit prompts
✓ Autosave prompts
✓ Organize prompts by project
✓ Add tags
✓ Favorite prompts
✓ Create reusable blocks
✓ Reference blocks from prompts
✓ Use prompt variables
✓ Resolve a final prompt
✓ Copy prompts
✓ Search workspace
✓ Receive spelling corrections
✓ Receive grammar corrections
✓ Apply corrections inline
✓ Configure writing language
✓ View basic version history
✓ Use dark/light mode
```

The Composer can be MVP+ if implementation time becomes excessive.

---

# 75. Explicit Non-Goals for Initial MVP

Do not initially build:

```text
Teams
Organizations
Billing
Subscriptions
Public marketplace
Prompt selling
Complex RBAC
Real-time collaboration
Comments
Social features
Vector database
AI chat interface
Dozens of LLM providers
Browser extension
Native mobile app
Native Mac app
Complex analytics
```

These can distract from making the editor excellent.

---

# 76. Future — Prompt Playground

Eventually users could test prompts directly from Lexora.

```text
Prompt
   │
   ▼
Model selector
   │
   ▼
Run
   │
   ▼
Output
```

Possible providers:

```text
OpenAI-compatible APIs
OpenAI
Anthropic
Gemini
Local models
```

This should use BYOK or user-configured endpoints.

---

# 77. Future — Prompt Comparison

Allow:

```text
Prompt A
vs
Prompt B
```

Run against the same model/input and compare responses.

Useful for prompt engineering.

---

# 78. Future — Prompt Forking

Users could fork prompts:

```text
Backend Agent v1
     │
     ├── Fastify variant
     ├── Next.js variant
     └── Python variant
```

This is different from version history.

Versions represent time.

Forks represent intentional alternatives.

---

# 79. Future — Browser Extension

Potential Lexora extension:

```text
Select text
      ↓
Save to Lexora

or

Right click
      ↓
Insert Lexora Prompt
```

Useful on:

```text
ChatGPT
Claude
Gemini
GitHub
Gmail
Other web applications
```

---

# 80. Future — Desktop Quick Launcher

Potential shortcut:

```text
⌥ Space
```

Then:

```text
Search Lexora
```

Select:

```text
Backend Agent Prompt
```

and immediately copy it.

This could eventually be implemented as:

```text
PWA
Raycast extension
Native helper
```

---

# 81. Future — Shareable Prompts

Users could intentionally generate read-only links.

Example:

```text
lexora.app/share/...
```

Sharing must be explicitly opt-in.

Everything remains private by default.

---

# 82. Future — Prompt Collections

Projects are organizational.

Collections could represent curated groups.

Example:

```text
My Coding Agent Toolkit

- Planning Agent
- Implementation Agent
- Code Reviewer
- Security Reviewer
- Documentation Writer
```

A prompt could belong to one project and multiple collections.

---

# 83. Future — Prompt Usage Statistics

Useful statistics could eventually include:

```text
Last copied
Copy count
Last edited
Most used
Most reused block
```

Keep analytics local/internal unless there is a strong reason otherwise.

---

# 84. Performance Goals

Lexora should feel immediate.

Targets:

```text
Navigation: effectively instant
Editor typing: zero perceptible latency
Autosave: non-blocking
Writing checks: asynchronous
Search: near-instant for normal personal datasets
```

External writing-provider latency must never freeze the editor.

---

# 85. Accessibility

Implement:

```text
Keyboard navigation
Visible focus states
Semantic controls
ARIA where necessary
Accessible dialogs
Sufficient contrast
Reduced-motion support
Screen-reader labels
```

Inline writing decorations must not be understandable only through color.

---

# 86. Empty States

Empty states should help users move forward.

Example:

```text
No prompts yet

Create your first prompt and Lexora will keep it
organized, corrected and ready to reuse.

[ Create Prompt ]
```

Project:

```text
This project is empty.

[ New Prompt ]
[ Add Existing Prompt ]
```

Blocks:

```text
Reusable blocks prevent you from repeating the same
instructions across prompts.

[ Create Block ]
```

---

# 87. Loading States

Prefer skeletons where appropriate.

Avoid giant centered spinners for ordinary navigation.

Editor should distinguish:

```text
Loading prompt
Saving
Checking writing
```

These are independent states.

---

# 88. Toasts

Use toasts sparingly.

Good:

```text
Prompt deleted
Block restored
Copied to clipboard
```

Bad:

```text
Prompt saved
Prompt saved
Prompt saved
```

Autosave status belongs in the editor rather than repetitive notifications.

---

# 89. Confirmation Dialogs

Require confirmation for destructive actions:

```text
Delete project
Delete prompt
Delete block
Delete all data
```

Prefer archive where practical.

---

# 90. Data Consistency

Redis operations involving multiple indexes may require atomic operations or carefully designed ordering.

Example prompt creation may require:

```text
Create prompt record
Add to user prompt index
Add to project prompt index
Add tags
```

Use transactions/pipelines where supported and appropriate.

Repositories should own these details.

---

# 91. IDs

Use sortable unique IDs such as:

```text
ULID
```

Example:

```text
prm_01J...
blk_01J...
prj_01J...
ver_01J...
```

Prefixes improve debugging.

---

# 92. Dates

Store timestamps in UTC ISO-8601 or consistently as Unix milliseconds.

Never mix formats unpredictably.

Presentation should use the user's local timezone.

---

# 93. Pagination

Do not assume the user will always have 20 prompts.

List APIs should support pagination.

Concept:

```text
limit
cursor
```

Prefer cursor pagination over large offset scans.

---

# 94. Optimistic UI

Use optimistic updates where safe.

Examples:

```text
Favorite
Pin
Rename
Tag
```

Autosave should keep local content responsive regardless of network latency.

---

# 95. Offline Behavior

MVP does not require full offline mode.

However:

```text
Editor should not destroy current text when network disappears.
```

Show:

```text
Offline — changes will be retried.
```

Use local draft recovery.

---

# 96. README Requirements

The repository README should explain:

```text
What Lexora is
Features
Architecture
Prerequisites
Local development
Firebase setup
Upstash setup
Writing provider setup
Environment variables
Development commands
Testing
Deployment
```

Do not make `docs/master-plan.md` a substitute for a usable README.

---

# 97. Architecture Documentation

After implementation begins, create:

```text
docs/architecture.md
```

Document:

```text
Authentication
BFF boundaries
Redis model
Repository pattern
Prompt resolver
Writing provider
Autosave
Search
```

---

# 98. Architecture Decision Records

For major decisions, use:

```text
docs/decisions/
```

Example:

```text
001-use-upstash-redis.md
002-use-firebase-auth.md
003-writing-provider-abstraction.md
004-editor-selection.md
```

Keep ADRs short and practical.

---

# 99. Code Quality Rules

Implementation should favor:

```text
Small focused modules
Strong TypeScript
Explicit domain types
Runtime validation
Server/client separation
Reusable components
Testable services
Repository abstractions
Clear error handling
```

Avoid:

```text
God components
Huge route handlers
Redis calls inside React components
Business logic inside UI components
Duplicated schemas
any everywhere
Hard-coded provider URLs
Hard-coded user IDs
```

---

# 100. Implementation Guidance for the Coding Agent

The coding agent receiving this document should treat it as the project's architectural source of truth.

Before coding:

1. Read this document completely.
2. Inspect the repository.
3. Determine what already exists.
4. Do not replace working infrastructure unnecessarily.
5. Create a short implementation checklist.
6. Implement incrementally.
7. Keep the application runnable after meaningful milestones.
8. Run lint/type checks/tests regularly.
9. Update documentation when implementation decisions differ from this plan.
10. Never commit secrets.

If the repository is empty, begin with **Phase 0**.

Do not attempt to implement all 100 sections simultaneously.

---

# 101. Priority Order

When tradeoffs are required, prioritize:

```text
1. Excellent editor experience
2. Reliable persistence
3. Writing assistance
4. Projects
5. Prompts
6. Reusable blocks
7. Search
8. Variables/templates
9. Version history
10. Composer
11. Advanced AI features
```

The application must remain useful even if all future AI functionality is removed.

---

# 102. Product Identity

## Name

**Lexora**

## Short description

> Write better prompts. Keep them organized.

## Expanded description

> Lexora is a personal workspace for writing, correcting, organizing, composing, versioning, and reusing prompts and text.

Possible UI tagline:

> **Your prompt workspace.**

Alternative:

> **Write once. Improve it. Reuse everywhere.**

---

# 103. Core User Journey

The ideal first-use journey is:

```text
Open Lexora
     ↓
Sign in
     ↓
Create "Personal Projects"
     ↓
Create Prompt
     ↓
Start writing
     ↓
Lexora detects spelling mistake
     ↓
Apply correction
     ↓
Add reusable Coding Rules block
     ↓
Insert {{block:coding-rules}}
     ↓
Add {{project_name}} variable
     ↓
Preview resolved prompt
     ↓
Copy
     ↓
Paste into coding agent
```

If this flow feels excellent, the core product succeeds.

---

# 104. Final Product Architecture

```text
                          LEXORA
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
     PROJECTS             PROMPTS              BLOCKS
        │                    │                    │
        │                    ├── Tags             │
        │                    ├── Variables        │
        │                    ├── Versions         │
        │                    └── References ──────┘
        │
        └────────────────────┬─────────────────────
                             │
                             ▼
                           EDITOR
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
          AUTOSAVE        WRITING        RESOLVER
                             │              │
                             │              ├── Blocks
                             │              └── Variables
                             │
                             ▼
                     WritingProvider
                             │
                             ▼
                      LanguageTool
                             │
                             ▼
                     Corrections UI

                             +

                          SEARCH
                             │
                             ▼
                       ⌘ K anywhere

                             +

                         COMPOSER
                             │
                             ▼
                Blocks + Text + Variables
                             │
                             ▼
                     Resolved Prompt
                             │
                             ▼
                           COPY
```

---

# 105. Definition of Success

Lexora succeeds when storing a prompt in a random Notes document or searching through old AI conversations feels less convenient than opening Lexora.

The user should be able to move from:

```text
"I need that prompt I used before."
```

to:

```text
⌘ K
→ search
→ open
→ improve
→ copy
```

within seconds.

The application should not merely **store prompts**.

It should help the user **write better prompts, construct them from reusable knowledge, preserve their evolution, find them immediately, and reuse them anywhere.**

That is the core of Lexora.
