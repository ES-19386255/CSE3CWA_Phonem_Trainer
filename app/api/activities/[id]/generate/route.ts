import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { activityInclude } from "@/lib/activityQuery";
import { findProblems } from "@/lib/checkActivity";
import { buildWordleHtml } from "@/lib/buildWordleHtml";
import { buildWordSearchHtml } from "@/lib/buildWordSearchHtml";
import { buildWordSearch } from "@/lib/wordSearchGrid";
import { errorResponse, withErrorHandling } from "@/lib/apiError";

type RouteParams = { params: Promise<{ id: string }> };

// Builds the standalone HTML file for a saved activity on the server, and
// records whether it worked (success or failure) in GenerationEvent.
// It's a POST, not a GET, because every call writes a row to the database.
export const POST = withErrorHandling(async (_request: Request, { params }: RouteParams) => {
  const parsedId = Number((await params).id);
  if (!Number.isInteger(parsedId)) return errorResponse("Invalid activity id", 400);

  const activity = await prisma.activity.findUnique({ where: { id: parsedId }, include: activityInclude });
  if (!activity) return errorResponse("Activity not found", 404);

  // Saves how the attempt went. If saving the log itself fails, we still
  // answer the request, so a logging problem never blocks a teacher.
  async function logEvent(success: boolean, errorMessage?: string) {
    try {
      await prisma.generationEvent.create({
        data: { activityId: activity!.id, activityType: activity!.type, success, errorMessage },
      });
    } catch (err) {
      console.error("Could not log generation event:", err);
    }
  }

  const words = activity.wordList.words.map((word) => ({
    english: word.english,
    sounds: word.phonemes.map((p) => p.symbol), // already in position order
  }));

  const problems = findProblems(words);
  if (problems.length > 0) {
    await logEvent(false, problems[0]);
    return NextResponse.json({ error: problems[0], problems }, { status: 422 });
  }

  let html: string;
  if (activity.type === "WORDLE") {
    html = buildWordleHtml({
      sounds: words[0].sounds,
      english: words[0].english,
      showHints: activity.showHints,
      maxGuesses: activity.maxGuesses ?? 6,
    });
  } else {
    const grid = buildWordSearch(words, activity.gridSize ?? 10);
    // The grid builder quietly skips a word it can't fit, so check for that.
    if (grid.placed.length < words.length) {
      const message = "Could not place every word in the grid";
      await logEvent(false, message);
      return NextResponse.json({ error: message, problems: [message] }, { status: 422 });
    }
    html = buildWordSearchHtml(grid, activity.showHints);
  }

  await logEvent(true);
  const safeTitle = activity.title.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
  const filename = `${safeTitle || "activity"}.html`;
  return NextResponse.json({ ok: true, filename, html });
});
