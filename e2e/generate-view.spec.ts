// Test 2: generate a file from a saved activity, then open the downloaded
// file and actually use it, to prove what was generated really works.
// It also checks the generation was counted for the dashboard.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test, expect, type Download } from "@playwright/test";
import { createActivityViaApi, deleteActivitiesByTitle, expectNoAxeViolations, getStats, loadSavedActivity, phonemeButton, uniqueTitle } from "./helpers";

// Saves a download into a temp folder as a real .html file so it can be opened.
async function saveDownload(download: Download) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "e2e-"));
  const file = path.join(dir, download.suggestedFilename());
  await download.saveAs(file);
  return file;
}

test("Wordle: generate from a saved activity, then play the downloaded file", async ({ page, request }) => {
  const title = uniqueTitle("Wordle");
  try {
    await createActivityViaApi(request, {
      title,
      type: "WORDLE",
      maxGuesses: 6,
      words: [{ english: "thin", sounds: ["θ", "ɪ", "n"] }],
    });
    const before = (await getStats(request)).generations.ok;

    // Load the saved activity into the builder and generate the file
    await page.goto("/wordle");
    await loadSavedActivity(page, title);
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Generate downloadable HTML" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("wordle-thin.html");

    // The file holds the answer from the database
    const file = await saveDownload(download);
    expect(fs.readFileSync(file, "utf8")).toContain('"answer":["θ","ɪ","n"]');

    // VIEW it: open the downloaded file and win the game with the right answer
    await page.goto(`file://${file}`);
    await expect(page.getByRole("heading", { name: "Phoneme Wordle" })).toBeVisible();
    await expectNoAxeViolations(page); // the file students use must be accessible too
    for (const sound of ["θ", "ɪ", "n"]) await phonemeButton(page, sound).click();
    await page.getByRole("button", { name: "Enter" }).click();
    await expect(page.locator("#message")).toContainText("Correct!");

    // The generation should have been counted (it's reported in the background)
    await expect.poll(async () => (await getStats(request)).generations.ok).toBeGreaterThan(before);
  } finally {
    await deleteActivitiesByTitle(request, title);
  }
});

test("Word Search: generate from a saved activity, then find every word in the downloaded file", async ({ page, request }) => {
  const title = uniqueTitle("Word Search");
  try {
    await createActivityViaApi(request, {
      title,
      type: "WORDSEARCH",
      gridSize: 10,
      words: [
        { english: "thin", sounds: ["θ", "ɪ", "n"] },
        { english: "ship", sounds: ["ʃ", "ɪ", "p"] },
        { english: "jam", sounds: ["dʒ", "æ", "m"] },
      ],
    });

    await page.goto("/wordsearch");
    await loadSavedActivity(page, title);
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Generate downloadable HTML" }).click();
    const download = await downloadPromise;
    const file = await saveDownload(download);

    // VIEW the file: a 10 x 10 grid and three clues
    await page.goto(`file://${file}`);
    await expect(page.locator("#grid .cell")).toHaveCount(100);
    await expectNoAxeViolations(page); // the file students use must be accessible too
    await expect(page.locator("#word-list li")).toHaveCount(3);

    // The file stores where each word is hidden, so use that to click
    // the first and last square of every word, like a student would.
    const data = JSON.parse(fs.readFileSync(file, "utf8").match(/<script id="game-data"[^>]*>([\s\S]*?)<\/script>/)![1]);
    expect(data.placed).toHaveLength(3);
    for (const word of data.placed) {
      const lastRow = word.row + word.dRow * (word.sounds.length - 1);
      const lastCol = word.col + word.dCol * (word.sounds.length - 1);
      await page.locator("#grid .cell").nth(word.row * data.size + word.col).click();
      await page.locator("#grid .cell").nth(lastRow * data.size + lastCol).click();
    }
    await expect(page.locator("#message")).toContainText("All words found!");
  } finally {
    await deleteActivitiesByTitle(request, title);
  }
});
