"use client";

import { Extension } from "@tiptap/core";
import type { Editor } from "@tiptap/react";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { Node as PmNode } from "@tiptap/pm/model";

import type { WritingIssue } from "@/server/writing/types";

const writingPluginKey = new PluginKey<DecorationSet>("writingIssues");

/**
 * Map a plain-text offset (from `editor.getText()`) to a ProseMirror document
 * position.
 *
 * `getText()` returns text with `\n` between block nodes. We walk the
 * document's top-level blocks and map each text offset to the corresponding
 * ProseMirror position, accounting for block boundaries.
 */
export function textOffsetToPos(doc: PmNode, offset: number): number {
  let textLen = 0;
  let blockPos = 0;

  for (let i = 0; i < doc.childCount; i++) {
    const block = doc.child(i);
    const blockText = block.textContent;

    if (offset <= textLen + blockText.length) {
      const localOffset = offset - textLen;
      return blockPos + 1 + localOffset;
    }

    textLen += blockText.length;
    if (offset === textLen && i < doc.childCount - 1) {
      return blockPos + 1 + blockText.length;
    }

    textLen += 1;
    blockPos += block.nodeSize;
  }

  return blockPos;
}

/**
 * TipTap extension that renders inline decorations for writing issues.
 *
 * @see docs/master-plan.md §24 Writing Editor UX
 */
export const WritingDecorations = Extension.create({
  name: "writingDecorations",

  addProseMirrorPlugins() {
    return [
      new Plugin<DecorationSet>({
        key: writingPluginKey,
        state: {
          init() {
            return DecorationSet.empty;
          },
          apply(tr, oldState) {
            const newIssues = tr.getMeta(writingPluginKey) as
              WritingIssue[] | undefined;
            if (newIssues !== undefined) {
              return buildDecorations(tr.doc, newIssues);
            }
            if (tr.docChanged) {
              return oldState.map(tr.mapping, tr.doc);
            }
            return oldState;
          },
        },
        props: {
          decorations(state) {
            return writingPluginKey.getState(state);
          },
        },
      }),
    ];
  },
});

function buildDecorations(doc: PmNode, issues: WritingIssue[]): DecorationSet {
  const decorations: Decoration[] = [];

  for (const issue of issues) {
    const from = textOffsetToPos(doc, issue.offset);
    const to = textOffsetToPos(doc, issue.offset + issue.length);
    if (from >= to) continue;

    decorations.push(
      Decoration.inline(from, to, {
        class: `writing-issue writing-issue--${issue.category}`,
        "data-issue-id": issue.id,
        "data-category": issue.category,
      }),
    );
  }

  return DecorationSet.create(doc, decorations);
}

/**
 * Update the writing issues in the editor's ProseMirror plugin state.
 */
export function setWritingIssues(editor: Editor, issues: WritingIssue[]): void {
  const { view } = editor;
  const tr = view.state.tr;
  tr.setMeta(writingPluginKey, issues);
  view.dispatch(tr);
}

/**
 * Apply a replacement for a specific writing issue in the editor.
 * Replaces the text range and removes the issue from decorations.
 */
export function applyReplacement(
  editor: Editor,
  issue: WritingIssue,
  replacement: string,
): void {
  const doc = editor.state.doc;
  const from = textOffsetToPos(doc, issue.offset);
  const to = textOffsetToPos(doc, issue.offset + issue.length);

  if (from < to) {
    editor
      .chain()
      .focus()
      .deleteRange({ from, to })
      .insertContentAt(from, replacement)
      .run();
  }
}
