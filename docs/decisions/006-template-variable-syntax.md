# ADR 006 — Template Variable Syntax

**Status:** Accepted
**Date:** Phase 7

## Context

The master plan (§16) specifies that templates should support variables using
`{{variable_name}}` syntax. Lexora needs to detect variables in prompt
content, present a form for the user to fill in values, and substitute them
during resolution.

## Decision

Use double-brace `{{variable_name}}` syntax with these rules:

- Variable names must start with a letter or underscore.
- Variable names can contain letters, digits, underscores, and hyphens.
- Whitespace inside braces is trimmed: `{{ framework }}` ≡ `{{framework}}`.
- Block references (`{{block:blk_...}}`) are parsed separately and are **not**
  treated as variables.

### Implementation

The template parser (`src/lib/template-parser.ts`) provides:

- `parseVariables(text)` — finds all `{{variable}}` occurrences (excluding
  block references) with character offsets.
- `detectVariables(text)` — returns unique variable names, sorted
  alphabetically, as `PromptVariable[]` objects.
- `extractBlockIds(text)` — finds all `{{block:id}}` references.

The resolver substitutes variables with user-provided values and reports any
that are missing (empty or not provided).

## Rationale

- `{{...}}` is the most common template syntax (Mustache, Jinja, etc.) and is
  immediately recognizable to technical users.
- Separating block references (`{{block:...}}`) from variables
  (`{{name}}`) keeps the grammar unambiguous.
- The name rules (letter/underscore start, hyphens allowed) cover realistic
  variable names like `project_name`, `framework`, `deployment-target`.
- Whitespace tolerance prevents common authoring errors.

## Consequences

- Variables are detected at resolution time, not stored separately — the
  prompt content is the single source of truth.
- The "Use Prompt" dialog auto-detects variables from the resolved content
  (after block expansion), so variables introduced by blocks are also
  surfaced.
- Missing variables are reported but do not block resolution — the
  `{{variable}}` placeholder remains in the output so the user can see what's
  missing.

## Alternatives Considered

- **Single-brace `{variable}`** — risks collision with JSON or other content.
- **Dollar-sign `${variable}`** — common in shell/JS template literals, could
  conflict with code snippets in prompts.
- **Custom delimiter** — adds learning curve without benefit.
