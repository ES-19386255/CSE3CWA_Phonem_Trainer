import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generationEventSchema } from "@/lib/validation";
import { errorResponse, validationErrorResponse, withErrorHandling } from "@/lib/apiError";

// The Wordle and Word Search pages build their files in the browser, so
// they report each success or failure here to be counted on the dashboard.
export const POST = withErrorHandling(async (request: Request) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Request body must be valid JSON", 400);
  }

  const parsed = generationEventSchema.safeParse(body);
  if (!parsed.success) return validationErrorResponse(parsed.error);
  const data = parsed.data;

  // A failure should say why. A success shouldn't carry an error message.
  if (!data.success && !data.errorMessage) return errorResponse("A failed generation needs an errorMessage", 400);

  // If the activity id doesn't exist (e.g. deleted), keep the event but drop the link.
  let activityId = data.activityId;
  if (activityId !== undefined && !(await prisma.activity.findUnique({ where: { id: activityId }, select: { id: true } }))) {
    activityId = undefined;
  }

  const event = await prisma.generationEvent.create({
    data: {
      activityId,
      activityType: data.activityType,
      success: data.success,
      errorMessage: data.success ? null : data.errorMessage,
    },
  });
  return NextResponse.json(event, { status: 201 });
});
