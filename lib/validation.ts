// Checks that data sent to the API is actually usable before it touches
// the database. Each rule below has a plain-English message, so a bad
// request gets a clear error back instead of a confusing crash.

import { z } from "zod";

// One phoneme symbol. It just needs at least one character -- there's no
// upper limit, since a symbol like "tʃ" is more than one character long.
const phonemeSymbol = z
  .string({ error: "Each phoneme symbol must be text" })
  .trim()
  .min(1, "A phoneme symbol can't be empty");

// One word: its everyday spelling, plus the phonemes that make up its sound.
export const wordSchema = z.object({
  english: z
    .string({ error: "A word needs an English spelling" })
    .trim()
    .min(1, "A word needs an English spelling"),
  sounds: z
    .array(phonemeSymbol, { error: "A word needs a list of phonemes" })
    .min(1, "A word needs at least one phoneme"),
});

// A brand new activity. Some fields only make sense for one activity type
// (maxGuesses for Wordle, gridSize/allowDiagonals for Word Search), so
// they're left optional rather than required for every activity.
export const createActivitySchema = z.object({
  title: z
    .string({ error: "An activity needs a title" })
    .trim()
    .min(1, "An activity needs a title"),
  type: z.enum(["WORDLE", "WORDSEARCH"], { error: "Type must be WORDLE or WORDSEARCH" }),
  showHints: z.boolean().optional().default(true),
  maxGuesses: z.number().int().min(3, "Needs at least 3 guesses").max(10, "10 guesses is the most allowed").optional(),
  gridSize: z.number().int().min(5, "Grid needs to be at least 5x5").max(20, "20x20 is the largest allowed").optional(),
  allowDiagonals: z.boolean().optional(),
  words: z.array(wordSchema).optional().default([]),
});

// Updating an activity's own settings: every field is optional (an
// update might only touch one setting, like just switching hints off),
// and words aren't included here -- those go through the separate
// /words endpoints below, so this can't be used to accidentally wipe them.
export const updateActivitySchema = createActivitySchema.omit({ words: true }).partial();

export const createWordSchema = wordSchema;
export const updateWordSchema = wordSchema.partial();
