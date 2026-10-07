// This script fills the database with a starting example, so the app has
// something to show the first time it runs. Run it with: npx prisma db seed
// It also adds SIMULATED history (generation attempts, page views and stat
// snapshots) so the Task 3 dashboard has something to show. Every fake row
// has simulated = true so it can always be told apart from real use.

import { prisma } from "../lib/db";

type Sounds = { english: string; sounds: string[] };

const THIN: Sounds = { english: "thin", sounds: ["θ", "ɪ", "n"] };
const SHIP: Sounds = { english: "ship", sounds: ["ʃ", "ɪ", "p"] };
const CHIN: Sounds = { english: "chin", sounds: ["tʃ", "ɪ", "n"] };
const JAM: Sounds = { english: "jam", sounds: ["dʒ", "æ", "m"] };
const SUN: Sounds = { english: "sun", sounds: ["s", "ɐ", "n"] };

// Turns a list of words into the nested "create" data Prisma wants.
function wordsData(words: Sounds[]) {
  return words.map((word, order) => ({
    english: word.english,
    order,
    phonemes: { create: word.sounds.map((symbol, position) => ({ symbol, position })) },
  }));
}

// A tiny repeatable random number generator. Math.random() would give
// different fake data every seed, which makes screenshots and tests flaky.
function makeRandom(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FAILURE_MESSAGES = [
  "Word list is empty",
  "A word has no phonemes",
  "Could not place every word in the grid",
  "Activity data was invalid",
];

const PAGES = [
  { path: "/wordle", weight: 5, min: 40, max: 240 },
  { path: "/wordsearch", weight: 4, min: 40, max: 220 },
  { path: "/activities", weight: 3, min: 20, max: 150 },
  { path: "/dashboard", weight: 2, min: 15, max: 90 },
  { path: "/", weight: 3, min: 5, max: 40 },
];

async function main() {
  // Clear out any existing data first, so the seed script can be re-run safely.
  await prisma.statSnapshot.deleteMany();
  await prisma.generationEvent.deleteMany();
  await prisma.pageView.deleteMany();
  await prisma.phoneme.deleteMany();
  await prisma.word.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.wordList.deleteMany();

  // ---- real starter data (same as Task 2, now using word lists) ----
  const thinList = await prisma.wordList.create({ data: { name: "Thin", words: { create: wordsData([THIN]) } } });
  const starterList = await prisma.wordList.create({
    data: { name: "Starter Words", words: { create: wordsData([THIN, SHIP, CHIN, JAM, SUN]) } },
  });

  const wordle1 = await prisma.activity.create({
    data: { title: "Thin (Wordle)", type: "WORDLE", showHints: true, maxGuesses: 6, wordListId: thinList.id },
  });
  const search1 = await prisma.activity.create({
    data: { title: "Starter Word Search", type: "WORDSEARCH", showHints: true, gridSize: 10, allowDiagonals: false, wordListId: starterList.id },
  });
  // Same list as above, shown to prove one list can be reused.
  const search2 = await prisma.activity.create({
    data: { title: "Starter Word Search (big grid)", type: "WORDSEARCH", showHints: true, gridSize: 14, allowDiagonals: true, wordListId: starterList.id },
  });

  // ---- simulated activities, including two "bad" ones for the alerts ----
  const shipList = await prisma.wordList.create({ data: { name: "Ship (simulated)", words: { create: wordsData([SHIP]) } } });
  const chinList = await prisma.wordList.create({ data: { name: "Chin (simulated)", words: { create: wordsData([CHIN]) } } });
  const wordle2 = await prisma.activity.create({
    data: { title: "Ship (Wordle, simulated)", type: "WORDLE", showHints: true, maxGuesses: 5, wordListId: shipList.id },
  });
  const wordle3 = await prisma.activity.create({
    data: { title: "Chin (Wordle, simulated)", type: "WORDLE", showHints: false, maxGuesses: 6, wordListId: chinList.id },
  });

  // An empty list: the dashboard should warn about this one.
  const emptyList = await prisma.wordList.create({ data: { name: "Empty list (simulated)" } });
  await prisma.activity.create({
    data: { title: "Empty Wordle (simulated)", type: "WORDLE", showHints: true, maxGuesses: 6, wordListId: emptyList.id },
  });

  // A word with no phonemes: the API blocks this, so it has to be put in
  // directly here. The dashboard should flag it as invalid data.
  const brokenList = await prisma.wordList.create({
    data: { name: "Broken list (simulated)", words: { create: [{ english: "broken", order: 0 }] } },
  });
  await prisma.activity.create({
    data: { title: "Broken Word Search (simulated)", type: "WORDSEARCH", showHints: true, gridSize: 10, allowDiagonals: false, wordListId: brokenList.id },
  });

  // ---- simulated generation attempts over the last 14 days ----
  const random = makeRandom(42);
  const pick = <T,>(items: T[]) => items[Math.floor(random() * items.length)];
  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;

  const wordleIds = [wordle1.id, wordle2.id, wordle3.id];
  const searchIds = [search1.id, search2.id];

  const events = Array.from({ length: 150 }, () => {
    const isWordle = random() < 0.6; // Wordle is used a bit more
    const success = random() < 0.88;
    return {
      activityId: pick(isWordle ? wordleIds : searchIds),
      activityType: isWordle ? ("WORDLE" as const) : ("WORDSEARCH" as const),
      success,
      errorMessage: success ? null : pick(FAILURE_MESSAGES),
      simulated: true,
      createdAt: new Date(now - random() * 14 * DAY),
    };
  });
  await prisma.generationEvent.createMany({ data: events });

  // ---- simulated page views ----
  const weighted = PAGES.flatMap((page) => Array<(typeof PAGES)[number]>(page.weight).fill(page));
  const views = Array.from({ length: 220 }, () => {
    const page = pick(weighted);
    return {
      path: page.path,
      durationSeconds: Math.round(page.min + random() * (page.max - page.min)),
      simulated: true,
      createdAt: new Date(now - random() * 14 * DAY),
    };
  });
  await prisma.pageView.createMany({ data: views });

  // ---- simulated daily stat snapshots (one per day for the last week) ----
  const wordleCount = 4; // counts for the activities made above
  const wordSearchCount = 3;
  for (let day = 6; day >= 0; day--) {
    const cutoff = now - day * DAY;
    const eventsSoFar = events.filter((e) => e.createdAt.getTime() <= cutoff);
    const viewsSoFar = views.filter((v) => v.createdAt.getTime() <= cutoff);
    const wordleUses = eventsSoFar.filter((e) => e.activityType === "WORDLE").length;
    const searchUses = eventsSoFar.length - wordleUses;
    await prisma.statSnapshot.create({
      data: {
        wordleCount,
        wordSearchCount,
        generationsOk: eventsSoFar.filter((e) => e.success).length,
        generationsFailed: eventsSoFar.filter((e) => !e.success).length,
        avgTimeOnPage: viewsSoFar.length
          ? viewsSoFar.reduce((sum, v) => sum + v.durationSeconds, 0) / viewsSoFar.length
          : 0,
        mostUsedType: wordleUses >= searchUses ? "WORDLE" : "WORDSEARCH",
        simulated: true,
        createdAt: new Date(cutoff),
      },
    });
  }

  console.log("Seed complete:");
  console.log(`  ${wordleCount} Wordle + ${wordSearchCount} Word Search activities (some simulated)`);
  console.log(`  ${events.length} simulated generation attempts`);
  console.log(`  ${views.length} simulated page views`);
  console.log("  7 simulated stat snapshots");
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
