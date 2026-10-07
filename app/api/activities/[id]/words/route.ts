import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createWordSchema } from "@/lib/validation";
import { errorResponse, validationErrorResponse, withErrorHandling } from "@/lib/apiError";

type RouteParams = { params: Promise<{ id: string }> };

function parseId(id: string): number | null {
  const parsed = Number(id);
  return Number.isInteger(parsed) ? parsed : null;
}

// Adds one new word to the end of an activity's word list.
export const POST = withErrorHandling(async (request: Request, { params }: RouteParams) => {
  const activityId = parseId((await params).id);
  if (activityId === null) return errorResponse("Invalid activity id", 400);

  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
    include: { words: true },
  });
  if (!activity) return errorResponse("Activity not found", 404);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Request body must be valid JSON", 400);
  }

  const parsed = createWordSchema.safeParse(body);
  if (!parsed.success) return validationErrorResponse(parsed.error);
  const data = parsed.data;

  const word = await prisma.word.create({
    data: {
      english: data.english,
      order: activity.words.length, // new words go on the end of the list
      activityId,
      phonemes: { create: data.sounds.map((symbol, position) => ({ symbol, position })) },
    },
    include: { phonemes: { orderBy: { position: "asc" } } },
  });

  return NextResponse.json(word, { status: 201 });
});
