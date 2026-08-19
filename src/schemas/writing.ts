import { z } from "zod";

/** POST /api/writing/check — check text for writing issues. */
export const writingCheckSchema = z.object({
  text: z.string().min(1, "Text is required.").max(50_000, "Text too long."),
  language: z.string().max(20).optional(),
});

/** POST /api/writing/dictionary — add a word to the personal dictionary. */
export const addDictionaryWordSchema = z.object({
  word: z.string().min(1).max(100),
});

/** DELETE /api/writing/dictionary — remove a word from the dictionary. */
export const removeDictionaryWordSchema = z.object({
  word: z.string().min(1).max(100),
});
