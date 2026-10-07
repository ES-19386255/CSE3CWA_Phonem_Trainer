// Shared pieces for the activity routes. Words now live in a WordList, so
// every route needs the same "include" and the same flattening step.
// Keeping them here means the routes stay short and return the same shape.

import { Prisma } from "./generated/prisma/client";

// Loads an activity together with its word list, words and phonemes.
export const activityInclude = {
  wordList: {
    include: {
      words: {
        orderBy: { order: "asc" },
        include: { phonemes: { orderBy: { position: "asc" } } },
      },
    },
  },
} satisfies Prisma.ActivityInclude;

type ActivityWithList = Prisma.ActivityGetPayload<{ include: typeof activityInclude }>;

// The frontend still expects `activity.words`, so copy the list's words up
// to the top level. It also gets the list's id and name for sharing.
export function toApiActivity(activity: ActivityWithList) {
  const { wordList, ...rest } = activity;
  return {
    ...rest,
    wordListName: wordList.name,
    words: wordList.words,
  };
}
