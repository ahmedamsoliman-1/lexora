import { z } from "zod";

const PROMPT_TYPES = [
  "prompt",
  "system-prompt",
  "agent-prompt",
  "template",
  "paragraph",
  "snippet",
  "instruction",
  "note",
] as const;

/** POST /api/prompts — create a prompt. */
export const createPromptSchema = z.object({
  projectId: z.string().min(1, "Project ID is required."),
  title: z
    .string()
    .min(1, "Title is required.")
    .max(200, "Title must be 200 characters or fewer."),
  description: z.string().max(2000).optional(),
  content: z.string().max(200_000).default(""),
  type: z.enum(PROMPT_TYPES).default("prompt"),
  tags: z.array(z.string()).default([]),
});

/** PATCH /api/prompts/:id — update a prompt (all fields optional). */
export const updatePromptSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  content: z.string().max(200_000).optional(),
  type: z.enum(PROMPT_TYPES).optional(),
  tags: z.array(z.string()).optional(),
  favorite: z.boolean().optional(),
  pinned: z.boolean().optional(),
  archived: z.boolean().optional(),
  projectId: z.string().min(1).optional(),
});

/** Query params for GET /api/prompts. */
export const listPromptsQuerySchema = z.object({
  projectId: z.string().optional(),
  tag: z.string().optional(),
  type: z.enum(PROMPT_TYPES).optional(),
  favorite: z
    .enum(["true", "false"])
    .optional()
    .transform((v) =>
      v === "true" ? true : v === "false" ? false : undefined,
    ),
  archived: z
    .enum(["true", "false"])
    .optional()
    .transform((v) =>
      v === "true" ? true : v === "false" ? false : undefined,
    ),
  query: z.string().optional(),
  limit: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : 50)),
  cursor: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : undefined)),
});
