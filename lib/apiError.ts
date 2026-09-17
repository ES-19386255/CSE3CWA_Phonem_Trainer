// Every API route uses this so errors always come back in the same
// shape: { error: "a readable message" }, with the right HTTP status.

import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

// Turns a failed zod validation into a 400 response, using the first
// problem found as the message (usually the clearest one to show).
export function validationErrorResponse(error: ZodError) {
  const firstIssue = error.issues[0];
  return errorResponse(firstIssue?.message ?? "Invalid request data", 400);
}
