import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createActivitySchema } from "@/lib/validation";
import { errorResponse, validationErrorResponse, withErrorHandling } from "@/lib/apiError";

// Every activity a teacher has saved, newest first, with their words and
// phonemes included so the frontend doesn't need a second request per activity.
export const GET = withErrorHandling(async () => {
  const activities = await prisma.activity.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      words: {
        orderBy: { order: "asc" },
        include: { phonemes: { orderBy: { position: "asc" } } },
      },
    },
  });
  return NextResponse.json(activities);
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

  const activity = await prisma.activity.create({
    data: {
      title: data.title,
      type: data.type,
      showHints: data.showHints,
      maxGuesses: data.maxGuesses,
      gridSize: data.gridSize,
      allowDiagonals: data.allowDiagonals,
      words: {
        create: data.words.map((word, order) => ({
          english: word.english,
          order,
          phonemes: { create: word.sounds.map((symbol, position) => ({ symbol, position })) },
        })),
      },
    },
    include: { words: { include: { phonemes: true } } },
  });

  return NextResponse.json(activity, { status: 201 });
});
