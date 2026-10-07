import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withErrorHandling } from "@/lib/apiError";

// Every saved word list, with how many words it has and how many
// activities use it. Used to pick a list to reuse.
export const GET = withErrorHandling(async () => {
  const lists = await prisma.wordList.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { words: true, activities: true } } },
  });
  return NextResponse.json(
    lists.map((list) => ({
      id: list.id,
      name: list.name,
      wordCount: list._count.words,
      activityCount: list._count.activities,
    })),
  );
});
