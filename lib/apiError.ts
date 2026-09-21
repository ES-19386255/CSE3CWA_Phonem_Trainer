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

// Wraps a route handler so any *unexpected* error -- a bug, a database
// problem, anything not already handled -- still comes back in the same
// { error: "..." } shape instead of a raw stack trace or a blank 500.
// The real error is logged server-side; the client only ever sees a safe,
// generic message.
export function withErrorHandling<Args extends unknown[]>(
  handler: (...args: Args) => Promise<Response>
) {
  return async (...args: Args): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (err) {
      console.error("Unexpected API error:", err);
      return errorResponse("Something went wrong handling that request", 500);
    }
  };
}
