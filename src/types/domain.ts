/**
 * Core domain entity types.
 *
 * These match the models defined in `docs/master-plan.md` sections 10–17.
 * Timestamps are stored as UTC ISO-8601 strings. IDs are ULIDs with a domain
 * prefix (see `src/server/ids.ts`).
 */

export interface UserProfile {
  id: string;
  uid: string;
  displayName?: string;
  email?: string;
  photoUrl?: string;
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  theme: "system" | "light" | "dark";
  writingLanguage: string;
  autoCheckWriting: boolean;
  editorFontSize: number;
  editorWidth: "comfortable" | "wide";
  reducedMotion: boolean;
}

export interface Project {
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

export type PromptType =
  | "prompt"
  | "system-prompt"
  | "agent-prompt"
  | "template"
  | "paragraph"
  | "snippet"
  | "instruction"
  | "note";

export interface Prompt {
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

export interface Block {
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

export interface PromptVersion {
  id: string;
  promptId: string;
  userId: string;
  content: string;
  createdAt: string;
  reason: "automatic" | "manual" | "restore";
}

/** A reusable prompt variable detected from template syntax `{{name}}`. */
export interface PromptVariable {
  name: string;
  defaultValue?: string;
}
