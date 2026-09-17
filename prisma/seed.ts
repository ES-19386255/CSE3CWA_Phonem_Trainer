// This script fills the database with a starting example, so the app has
// something to show the first time it runs. Run it with: npx prisma db seed

import { prisma } from "../lib/db";

// The same five words used as the fixed example list in Task 1.
const WORD_SEARCH_WORDS = [
  { english: "thin", sounds: ["θ", "ɪ", "n"] },
  { english: "ship", sounds: ["ʃ", "ɪ", "p"] },
  { english: "chin", sounds: ["tʃ", "ɪ", "n"] },
  { english: "jam", sounds: ["dʒ", "æ", "m"] },
  { english: "sun", sounds: ["s", "ɐ", "n"] },
];

async function main() {
  // Clear out any existing data first, so the seed script can be re-run safely.
  await prisma.phoneme.deleteMany();
  await prisma.word.deleteMany();
  await prisma.activity.deleteMany();

  // One Wordle activity, with a single answer word (matching Task 1's scope).
  await prisma.activity.create({
    data: {
      title: "Thin (Wordle)",
      type: "WORDLE",
      showHints: true,
      maxGuesses: 6,
      words: {
        create: [
          {
            english: "thin",
            order: 0,
            phonemes: { create: ["θ", "ɪ", "n"].map((symbol, position) => ({ symbol, position })) },
          },
        ],
      },
    },
  });

  // One Word Search activity, with the fixed five-word list.
  await prisma.activity.create({
    data: {
      title: "Starter Word Search",
      type: "WORDSEARCH",
      showHints: true,
      gridSize: 10,
      allowDiagonals: false,
      words: {
        create: WORD_SEARCH_WORDS.map((word, order) => ({
          english: word.english,
          order,
          phonemes: { create: word.sounds.map((symbol, position) => ({ symbol, position })) },
        })),
      },
    },
  });

  console.log("Seed complete: 1 Wordle activity and 1 Word Search activity created.");
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
