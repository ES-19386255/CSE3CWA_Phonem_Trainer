/*
  Warnings:

  - You are about to drop the column `activityId` on the `Word` table. All the data in the column will be lost.
  - Added the required column `wordListId` to the `Activity` table without a default value. This is not possible if the table is not empty.
  - Added the required column `wordListId` to the `Word` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "WordList" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "GenerationEvent" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "activityId" INTEGER,
    "activityType" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "errorMessage" TEXT,
    "simulated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GenerationEvent_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PageView" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "path" TEXT NOT NULL,
    "durationSeconds" INTEGER NOT NULL,
    "simulated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "StatSnapshot" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "wordleCount" INTEGER NOT NULL,
    "wordSearchCount" INTEGER NOT NULL,
    "generationsOk" INTEGER NOT NULL,
    "generationsFailed" INTEGER NOT NULL,
    "avgTimeOnPage" REAL NOT NULL,
    "mostUsedType" TEXT,
    "simulated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Activity" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "showHints" BOOLEAN NOT NULL DEFAULT true,
    "maxGuesses" INTEGER,
    "gridSize" INTEGER,
    "allowDiagonals" BOOLEAN,
    "wordListId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Activity_wordListId_fkey" FOREIGN KEY ("wordListId") REFERENCES "WordList" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Activity" ("allowDiagonals", "createdAt", "gridSize", "id", "maxGuesses", "showHints", "title", "type", "updatedAt") SELECT "allowDiagonals", "createdAt", "gridSize", "id", "maxGuesses", "showHints", "title", "type", "updatedAt" FROM "Activity";
DROP TABLE "Activity";
ALTER TABLE "new_Activity" RENAME TO "Activity";
CREATE TABLE "new_Word" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "english" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "wordListId" INTEGER NOT NULL,
    CONSTRAINT "Word_wordListId_fkey" FOREIGN KEY ("wordListId") REFERENCES "WordList" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Word" ("english", "id", "order") SELECT "english", "id", "order" FROM "Word";
DROP TABLE "Word";
ALTER TABLE "new_Word" RENAME TO "Word";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "GenerationEvent_createdAt_idx" ON "GenerationEvent"("createdAt");

-- CreateIndex
CREATE INDEX "PageView_createdAt_idx" ON "PageView"("createdAt");
