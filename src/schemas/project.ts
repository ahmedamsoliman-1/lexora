import { z } from "zod";

/** POST /api/projects — create a project. */
export const createProjectSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required.")
    .max(100, "Name must be 100 characters or fewer."),
  description: z.string().max(2000).optional(),
  icon: z.string().max(50).optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
});

/** PATCH /api/projects/:id — update a project (all fields optional). */
export const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(2000).optional(),
  icon: z.string().max(50).optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  pinned: z.boolean().optional(),
  archived: z.boolean().optional(),
});

/** Query params for GET /api/projects. */
export const listProjectsQuerySchema = z.object({
  archived: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
  limit: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : 50)),
  cursor: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : undefined)),
});
