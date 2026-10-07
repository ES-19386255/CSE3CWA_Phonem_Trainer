import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { pageViewSchema } from "@/lib/validation";
import { errorResponse, validationErrorResponse, withErrorHandling } from "@/lib/apiError";

// Records one page view and how long it was open (used for "average time on page").
export const POST = withErrorHandling(async (request: Request) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Request body must be valid JSON", 400);
  }

  const parsed = pageViewSchema.safeParse(body);
  if (!parsed.success) return validationErrorResponse(parsed.error);

  const view = await prisma.pageView.create({ data: parsed.data });
  return NextResponse.json(view, { status: 201 });
});
