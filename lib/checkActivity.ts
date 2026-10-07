// Checks a list of words is fit to generate an activity from. Used by the
// generate route, so a bad list fails with a clear reason (and gets logged)
// instead of making a broken file.

import { findPhoneme } from "./phonemes";

export type WordToCheck = { english: string; sounds: string[] };

// Returns a list of problems. An empty list means the words are fine.
export function findProblems(words: WordToCheck[]): string[] {
  if (words.length === 0) return ["Word list is empty"];

  const problems: string[] = [];
  for (const word of words) {
    if (word.sounds.length === 0) {
      problems.push(`The word "${word.english}" has no phonemes`);
      continue;
    }
    for (const symbol of word.sounds) {
      if (!findPhoneme(symbol)) problems.push(`The word "${word.english}" uses an unknown phoneme "${symbol}"`);
    }
  }
  return problems;
}
