// Test 1: the builder CRUD flow, clicked through the real Manage page.
// Create an activity, add a word, edit it, delete the word, delete the activity.

import { test, expect } from "@playwright/test";
import { deleteActivitiesByTitle, phonemeButton, uniqueTitle } from "./helpers";

test("builder CRUD: create, add, edit and delete an activity and its word", async ({ page, request }) => {
  const title = uniqueTitle("CRUD");

  try {
    await page.goto("/activities");

    // CREATE the activity
    await page.getByPlaceholder("Title").fill(title);
    await page.getByRole("combobox").selectOption("WORDLE");
    await page.getByRole("button", { name: "Create" }).click();

    // The card for this activity (found by its heading) is used for everything after.
    const card = page.locator("div.rounded-lg", { has: page.getByRole("heading", { name: title }) });
    await expect(card).toBeVisible();
    await expect(card.getByText("Wordle · 0 words")).toBeVisible();

    // CREATE a word: tap the phonemes θ ɪ n, type the spelling, add it
    await card.getByRole("button", { name: "+ Add a word" }).click();
    for (const sound of ["θ", "ɪ", "n"]) await phonemeButton(card, sound).click();
    await card.getByPlaceholder("English spelling").fill("thin");
    await card.getByRole("button", { name: "Add word" }).click();
    await expect(card.getByText("θ - ɪ - n → thin")).toBeVisible();
    await expect(card.getByText("Wordle · 1 word")).toBeVisible();

    // READ: it should still be there after a full page reload (saved in the database)
    await page.reload();
    await expect(card.getByText("θ - ɪ - n → thin")).toBeVisible();

    // UPDATE the word: change the last sound to ŋ and the spelling to "thing"
    await card.getByRole("button", { name: "Edit" }).click();
    await card.getByRole("button", { name: "Remove last" }).click();
    await phonemeButton(card, "ŋ").click();
    await card.getByPlaceholder("English spelling").fill("thing");
    await card.getByRole("button", { name: "Save" }).click();
    await expect(card.getByText("θ - ɪ - ŋ → thing")).toBeVisible();

    // The change must really be in the database, so ask the API directly too
    const all: { title: string; words: { english: string }[] }[] = await (await request.get("/api/activities")).json();
    expect(all.find((a) => a.title === title)?.words.map((w) => w.english)).toEqual(["thing"]);

    // DELETE the word, then the whole activity
    await card.getByRole("button", { name: "Delete", exact: true }).click();
    await expect(card.getByText("Wordle · 0 words")).toBeVisible();

    await card.getByRole("button", { name: "Delete activity" }).click();
    await expect(page.getByRole("heading", { name: title })).toHaveCount(0);

    await page.reload();
    await expect(page.getByRole("heading", { name: title })).toHaveCount(0);
  } finally {
    // Tidy up even if something above failed.
    await deleteActivitiesByTitle(request, title);
  }
});
