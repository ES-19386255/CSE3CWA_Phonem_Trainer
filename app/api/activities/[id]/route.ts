import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { updateActivitySchema } from "@/lib/validation";
import { errorResponse, validationErrorResponse, withErrorHandling } from "@/lib/apiError";

type RouteParams = { params: Promise<{ id: string }> };

// Turns the "id" from the URL into a real number, or null if it isn't one.
function parseId(id: string): number | null {
  const parsed = Number(id);
  return Number.isInteger(parsed) ? parsed : null;
}

export const GET = withErrorHandling(async (_request: Request, { params }: RouteParams) => {
  const activityId = parseId((await params).id);
  if (activityId === null) return errorResponse("Invalid activity id", 400);

  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
    include: {
      words: {
        orderBy: { order: "asc" },
        include: { phonemes: { orderBy: { position: "asc" } } },
      },
    },
  });
  if (!activity) return errorResponse("Activity not found", 404);

  return NextResponse.json(activity);
});

// Updates an activity's own settings (title, type, hints, difficulty).
// To add, change, or remove its words, use the /words endpoints instead.
export const PATCH = withErrorHandling(async (request: Request, { params }: RouteParams) => {
  const activityId = parseId((await params).id);
  if (activityId === null) return errorResponse("Invalid activity id", 400);

  const existing = await prisma.activity.findUnique({ where: { id: activityId } });
  if (!existing) return errorResponse("Activity not found", 404);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Request body must be valid JSON", 400);
  }

  const parsed = updateActivitySchema.safeParse(body);
  if (!parsed.success) return validationErrorResponse(parsed.error);
  const data = parsed.data;

  const activity = await prisma.activity.update({
    where: { id: activityId },
    data: {
      title: data.title,
      type: data.type,
      showHints: data.showHints,
      maxGuesses: data.maxGuesses,
      gridSize: data.gridSize,
      allowDiagonals: data.allowDiagonals,
    },
    include: {
      words: {
        orderBy: { order: "asc" },
        include: { phonemes: { orderBy: { position: "asc" } } },
      },
    },
  });

  return NextResponse.json(activity);
});

// Deletes an activity. Its words and their phonemes are deleted
// automatically (the database cascades this, see prisma/schema.prisma).
export const DELETE = withErrorHandling(async (_request: Request, { params }: RouteParams) => {
  const activityId = parseId((await params).id);
  if (activityId === null) return errorResponse("Invalid activity id", 400);

  const existing = await prisma.activity.findUnique({ where: { id: activityId } });
  if (!existing) return errorResponse("Activity not found", 404);

  await prisma.activity.delete({ where: { id: activityId } });
  return NextResponse.json({ deleted: true });
});
