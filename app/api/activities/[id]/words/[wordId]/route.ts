import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { updateWordSchema } from "@/lib/validation";
import { errorResponse, validationErrorResponse, withErrorHandling } from "@/lib/apiError";

type RouteParams = { params: Promise<{ id: string; wordId: string }> };

function parseId(id: string): number | null {
  const parsed = Number(id);
  return Number.isInteger(parsed) ? parsed : null;
}

// Finds a word, but only if it actually belongs to the given activity --
// this stops one activity's URL being used to edit another activity's word.
async function findWordInActivity(activityId: number, wordId: number) {
  return prisma.word.findFirst({ where: { id: wordId, activityId } });
}

// Updates a word's English spelling and/or its phonemes. Sending a new
// "sounds" list replaces the old phonemes entirely, rather than merging
// with them, since a partial phoneme edit wouldn't make sense on its own.
export const PATCH = withErrorHandling(async (request: Request, { params }: RouteParams) => {
  const { id, wordId } = await params;
  const activityId = parseId(id);
  const wid = parseId(wordId);
  if (activityId === null || wid === null) return errorResponse("Invalid id", 400);

  const existing = await findWordInActivity(activityId, wid);
  if (!existing) return errorResponse("Word not found in this activity", 404);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Request body must be valid JSON", 400);
  }

  const parsed = updateWordSchema.safeParse(body);
  if (!parsed.success) return validationErrorResponse(parsed.error);
  const data = parsed.data;

  // Replacing the old phonemes and updating the word happen as one
  // transaction, so a failure partway through can't leave the word with
  // no phonemes at all -- either both steps happen, or neither does.
  // The word update is always the LAST item in this array (whether or
  // not a phoneme delete comes before it), so grabbing the last result
  // is correct regardless of how many steps ran.
  const results = await prisma.$transaction([
    ...(data.sounds ? [prisma.phoneme.deleteMany({ where: { wordId: wid } })] : []),
    prisma.word.update({
      where: { id: wid },
      data: {
        english: data.english,
        phonemes: data.sounds
          ? { create: data.sounds.map((symbol, position) => ({ symbol, position })) }
          : undefined,
      },
      include: { phonemes: { orderBy: { position: "asc" } } },
    }),
  ]);
  const word = results[results.length - 1];

  return NextResponse.json(word);
});

// Deletes one word from an activity. Its phonemes are deleted
// automatically (the database cascades this, see prisma/schema.prisma).
export const DELETE = withErrorHandling(async (_request: Request, { params }: RouteParams) => {
  const { id, wordId } = await params;
  const activityId = parseId(id);
  const wid = parseId(wordId);
  if (activityId === null || wid === null) return errorResponse("Invalid id", 400);

  const existing = await findWordInActivity(activityId, wid);
  if (!existing) return errorResponse("Word not found in this activity", 404);

  await prisma.word.delete({ where: { id: wid } });
  return NextResponse.json({ deleted: true });
});
