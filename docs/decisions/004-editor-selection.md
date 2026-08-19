# ADR 004 — Editor Selection (TipTap)

**Status:** Accepted
**Date:** Phase 4

## Context

The master plan (§5) identifies the editor as the heart of the product and
requires an editor that provides: reliable plain/rich text editing,
decorations, inline issue highlighting, keyboard handling, selection APIs,
extensibility, and good React integration. The plan explicitly says not to
build a custom `contenteditable` implementation unless necessary.

Candidates evaluated: TipTap, Lexical, CodeMirror.

## Decision

Use **TipTap v3** (`@tiptap/react` + `@tiptap/starter-kit` + `@tiptap/pm`).

## Rationale

- Built on ProseMirror, which has the most mature **Decoration API** for
  inline issue highlighting (underlines under misspelled words, etc.) —
  critical for Phase 5 writing assistance.
- First-class React integration via `@tiptap/react`.
- The StarterKit provides a solid plain-text / rich-text baseline without
  requiring a custom schema.
- Extensible: custom nodes, marks, and plugins can be added without forking.
- Can be configured as plain text (single paragraph / document) for
  prompt-writing, then extended to richer structures later.
- `@tiptap/pm` exposes the ProseMirror primitives needed for decorations and
  programmatic text replacements (applying corrections without losing cursor
  position).

## Consequences

- The editor content is ProseMirror JSON internally. For prompts we store
  plain text (`.getText()`) in Redis so the data model stays portable and
  provider-agnostic.
- Inline decorations are applied via a ProseMirror plugin that reads the
  normalized `WritingIssue[]` and renders decoration ranges — the editor never
  depends on LanguageTool's native response shape.
- Applying a suggestion uses ProseMirror transactions to replace a text range
  and restore the selection, preserving cursor position where practical.

## Alternatives Considered

- **Lexical** — strong React integration and modern architecture, but its
  decoration/transform API is less battle-tested for inline grammar
  highlighting than ProseMirror's.
- **CodeMirror v6** — excellent decoration support, but oriented toward code
  editing rather than prose; less natural for the prompt-writing experience.
- **Custom contenteditable** — rejected per the master plan; too brittle for
  inline decorations, selection handling, and cursor preservation.
