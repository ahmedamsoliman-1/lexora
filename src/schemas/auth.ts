import { z } from "zod";

/** POST /api/auth/session — exchange a Firebase ID token for a session cookie. */
export const createSessionSchema = z.object({
  idToken: z.string().min(1, "ID token is required."),
});

/** POST /api/auth/register — register a new email/password user. */
export const registerSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

/** POST /api/auth/login — sign in with email/password. */
export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});
