import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createActivitySchema } from "@/lib/validation";
import { activityInclude, toApiActivity } from "@/lib/activityQuery";
import { errorResponse, validationErrorResponse, withErrorHandling } from "@/lib/apiError";

// Every activity a teacher has saved, newest first, with their words and
// phonemes included so the frontend doesn't need a second request per activity.
export const GET = withErrorHandling(async () => {
  const activities = await prisma.activity.findMany({
    orderBy: { createdAt: "desc" },
    include: activityInclude,
  });
  return NextResponse.json(activities.map(toApiActivity));
});

// Creates a new activity, optionally with its word list included right away.
export const POST = withErrorHandling(async (request: Request) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Request body must be valid JSON", 400);
  }

  const parsed = createActivitySchema.safeParse(body);
  if (!parsed.success) return validationErrorResponse(parsed.error);
  const data = parsed.data;

  // Either reuse a word list that already exists, or make a new one
  // (named after the activity) from the words that were sent.
  let wordListData;
  if (data.wordListId !== undefined) {
    const list = await prisma.wordList.findUnique({ where: { id: data.wordListId } });
    if (!list) return errorResponse("Word list not found", 404);
    wordListData = { connect: { id: data.wordListId } };
  } else {
    wordListData = {
      create: {
        name: data.title,
        words: {
          create: data.words.map((word, order) => ({
            english: word.english,
            order,
            phonemes: { create: word.sounds.map((symbol, position) => ({ symbol, position })) },
          })),
        },
      },
    };
  }

  const activity = await prisma.activity.create({
    data: {
      title: data.title,
      type: data.type,
      showHints: data.showHints,
      maxGuesses: data.maxGuesses,
      gridSize: data.gridSize,
      allowDiagonals: data.allowDiagonals,
      wordList: wordListData,
    },
    include: activityInclude,
  });

  return NextResponse.json(toApiActivity(activity), { status: 201 });
});
