// Works out every number the dashboard shows, straight from the database.
// Keeping it in one place means the /api/stats route and the saved
// snapshots always agree with each other.

import { prisma } from "./db";
import { findPhoneme } from "./phonemes";

export type Alert = {
  id: string;
  level: "error" | "warning";
  kind: "failed-generation" | "empty-word-list" | "invalid-data";
  message: string;
  activityId?: number;
};

const DAY = 24 * 60 * 60 * 1000;

export async function computeStats() {
  const now = Date.now();
  const dayAgo = new Date(now - DAY);
  const trendStart = new Date(now - 13 * DAY);

  const [
    activityTypes,
    generationTypes,
    okCount,
    failedCount,
    recentOk,
    recentFailed,
    topFailure,
    viewAverage,
    viewPages,
    simulatedEvents,
    simulatedViews,
    recentEvents,
    trendEvents,
    lists,
    wordsWithoutPhonemes,
    distinctSymbols,
    snapshots,
  ] = await Promise.all([
    prisma.activity.groupBy({ by: ["type"], _count: { _all: true } }),
    prisma.generationEvent.groupBy({ by: ["activityType"], _count: { _all: true } }),
    prisma.generationEvent.count({ where: { success: true } }),
    prisma.generationEvent.count({ where: { success: false } }),
    prisma.generationEvent.count({ where: { success: true, createdAt: { gte: dayAgo } } }),
    prisma.generationEvent.count({ where: { success: false, createdAt: { gte: dayAgo } } }),
    prisma.generationEvent.groupBy({
      by: ["errorMessage"],
      where: { success: false, createdAt: { gte: dayAgo } },
      _count: { _all: true },
      orderBy: { _count: { errorMessage: "desc" } },
      take: 1,
    }),
    prisma.pageView.aggregate({ _avg: { durationSeconds: true }, _count: { _all: true } }),
    prisma.pageView.groupBy({
      by: ["path"],
      _avg: { durationSeconds: true },
      _count: { _all: true },
      orderBy: { _count: { path: "desc" } },
    }),
    prisma.generationEvent.count({ where: { simulated: true } }),
    prisma.pageView.count({ where: { simulated: true } }),
    prisma.generationEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { activity: { select: { title: true } } },
    }),
    prisma.generationEvent.findMany({
      where: { createdAt: { gte: trendStart } },
      select: { createdAt: true, success: true },
    }),
    prisma.wordList.findMany({
      include: { _count: { select: { words: true } }, activities: { select: { id: true, title: true } } },
    }),
    prisma.word.findMany({
      where: { phonemes: { none: {} } },
      select: { english: true, wordListId: true },
    }),
    prisma.phoneme.groupBy({ by: ["symbol"] }),
    prisma.statSnapshot.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
  ]);

  // ---- activity counts ----
  const wordleCount = activityTypes.find((t) => t.type === "WORDLE")?._count._all ?? 0;
  const wordSearchCount = activityTypes.find((t) => t.type === "WORDSEARCH")?._count._all ?? 0;

  // ---- most used type (by generations; Wordle wins a tie) ----
  const wordleUses = generationTypes.find((t) => t.activityType === "WORDLE")?._count._all ?? 0;
  const searchUses = generationTypes.find((t) => t.activityType === "WORDSEARCH")?._count._all ?? 0;
  const mostUsedType = wordleUses + searchUses === 0 ? null : wordleUses >= searchUses ? "WORDLE" : "WORDSEARCH";

  const totalGenerations = okCount + failedCount;

  // ---- 14 day trend, one bucket per day (oldest first) ----
  const trend = Array.from({ length: 14 }, (_, i) => {
    const date = new Date(now - (13 - i) * DAY).toISOString().slice(0, 10);
    return { date, ok: 0, failed: 0 };
  });
  for (const event of trendEvents) {
    const bucket = trend.find((day) => day.date === event.createdAt.toISOString().slice(0, 10));
    if (!bucket) continue;
    if (event.success) bucket.ok++;
    else bucket.failed++;
  }

  // ---- alerts ----
  const alerts: Alert[] = [];

  const recentTotal = recentOk + recentFailed;
  if (recentFailed > 0) {
    const reason = topFailure[0]?.errorMessage;
    const badShare = recentTotal >= 5 && recentFailed / recentTotal >= 0.25;
    alerts.push({
      id: "failed-generation",
      level: badShare ? "error" : "warning",
      kind: "failed-generation",
      message: `${recentFailed} of ${recentTotal} generations failed in the last 24 hours${reason ? ` (most common: ${reason})` : ""}`,
    });
  }

  // Word list id -> the activities that use it, to name them in alerts.
  const usersOf = new Map(lists.map((list) => [list.id, list.activities]));
  const listNames = new Map(lists.map((list) => [list.id, list.name]));

  for (const list of lists) {
    if (list._count.words > 0) continue;
    for (const activity of list.activities) {
      alerts.push({
        id: `empty-${activity.id}`,
        level: "warning",
        kind: "empty-word-list",
        message: `"${activity.title}" uses an empty word list ("${list.name}")`,
        activityId: activity.id,
      });
    }
  }

  for (const word of wordsWithoutPhonemes) {
    alerts.push({
      id: `nophonemes-${word.wordListId}-${word.english}`,
      level: "error",
      kind: "invalid-data",
      message: `The word "${word.english}" in list "${listNames.get(word.wordListId)}" has no phonemes`,
      activityId: usersOf.get(word.wordListId)?.[0]?.id,
    });
  }

  const unknownSymbols = distinctSymbols.map((s) => s.symbol).filter((symbol) => !findPhoneme(symbol));
  if (unknownSymbols.length > 0) {
    const badPhonemes = await prisma.phoneme.findMany({
      where: { symbol: { in: unknownSymbols } },
      select: { symbol: true, word: { select: { english: true, wordListId: true } } },
    });
    for (const bad of badPhonemes) {
      alerts.push({
        id: `unknown-${bad.word.wordListId}-${bad.word.english}-${bad.symbol}`,
        level: "error",
        kind: "invalid-data",
        message: `The word "${bad.word.english}" uses an unknown phoneme "${bad.symbol}"`,
        activityId: usersOf.get(bad.word.wordListId)?.[0]?.id,
      });
    }
  }

  return {
    generatedAt: new Date(now).toISOString(),
    activities: { wordle: wordleCount, wordSearch: wordSearchCount, total: wordleCount + wordSearchCount },
    mostUsedType,
    usage: { wordle: wordleUses, wordSearch: searchUses },
    generations: {
      ok: okCount,
      failed: failedCount,
      total: totalGenerations,
      successRate: totalGenerations === 0 ? null : okCount / totalGenerations,
    },
    avgTimeOnPage: viewAverage._avg.durationSeconds ?? 0,
    pageViews: viewAverage._count._all,
    pages: viewPages.map((page) => ({
      path: page.path,
      views: page._count._all,
      avgSeconds: page._avg.durationSeconds ?? 0,
    })),
    simulated: { generations: simulatedEvents, pageViews: simulatedViews },
    trend,
    recentEvents: recentEvents.map((event) => ({
      id: event.id,
      activityTitle: event.activity?.title ?? null,
      activityType: event.activityType,
      success: event.success,
      errorMessage: event.errorMessage,
      simulated: event.simulated,
      createdAt: event.createdAt.toISOString(),
    })),
    alerts,
    snapshots: snapshots.map((snap) => ({
      id: snap.id,
      wordleCount: snap.wordleCount,
      wordSearchCount: snap.wordSearchCount,
      generationsOk: snap.generationsOk,
      generationsFailed: snap.generationsFailed,
      avgTimeOnPage: snap.avgTimeOnPage,
      mostUsedType: snap.mostUsedType,
      simulated: snap.simulated,
      createdAt: snap.createdAt.toISOString(),
    })),
  };
}
