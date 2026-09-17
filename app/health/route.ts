// A simple endpoint other tools (or a marker checking the brief) can hit
// to confirm the server is running: GET /health should return 200 OK.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    // A tiny real query, not just "the server responded" -- this
    // confirms the database connection itself is working too.
    await prisma.activity.count();
    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch {
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
