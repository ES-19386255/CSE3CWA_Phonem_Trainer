import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { computeStats } from "@/lib/stats";
import { withErrorHandling } from "@/lib/apiError";

// All the dashboard numbers, worked out fresh from the database.
export const GET = withErrorHandling(async () => {
  return NextResponse.json(await computeStats());
});

// Saves the current numbers as a StatSnapshot row, so the stats
// themselves are stored in the database. If one was saved less than a
// minute ago, that one is returned instead, so opening the dashboard
// repeatedly doesn't flood the table.
export const POST = withErrorHandling(async () => {
  const latest = await prisma.statSnapshot.findFirst({ orderBy: { createdAt: "desc" } });
  if (latest && Date.now() - latest.createdAt.getTime() < 60_000) {
    return NextResponse.json({ saved: false, snapshot: latest });
  }

  const stats = await computeStats();
  const snapshot = await prisma.statSnapshot.create({
    data: {
      wordleCount: stats.activities.wordle,
      wordSearchCount: stats.activities.wordSearch,
      generationsOk: stats.generations.ok,
      generationsFailed: stats.generations.failed,
      avgTimeOnPage: stats.avgTimeOnPage,
      mostUsedType: stats.mostUsedType,
    },
  });
  return NextResponse.json({ saved: true, snapshot }, { status: 201 });
});
