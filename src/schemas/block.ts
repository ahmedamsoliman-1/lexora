import { z } from "zod";

/** POST /api/blocks — create a block. */
export const createBlockSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required.")
    .max(100, "Name must be 100 characters or fewer."),
  description: z.string().max(2000).optional(),
  content: z.string().max(200_000).default(""),
  tags: z.array(z.string()).default([]),
});

/** PATCH /api/blocks/:id — update a block (all fields optional). */
export const updateBlockSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(2000).optional(),
  content: z.string().max(200_000).optional(),
  tags: z.array(z.string()).optional(),
  favorite: z.boolean().optional(),
});

/** Query params for GET /api/blocks. */
export const listBlocksQuerySchema = z.object({
  tag: z.string().optional(),
  favorite: z
    .enum(["true", "false"])
    .optional()
    .transform((v) =>
      v === "true" ? true : v === "false" ? false : undefined,
    ),
  limit: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : 50)),
  cursor: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : undefined)),
});
