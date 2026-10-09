// Extra checks for the monitoring side: /health, the dashboard, and the
// alert that appears when an activity can't be generated.

import { test, expect } from "@playwright/test";
import { createActivityViaApi, deleteActivitiesByTitle, getStats, loadSavedActivity, uniqueTitle } from "./helpers";

test("/health returns 200", async ({ request }) => {
  const res = await request.get("/health");
  expect(res.status()).toBe(200);
  expect(await res.json()).toEqual({ status: "ok" });
});

test("dashboard shows health, the key numbers and an alert for an empty word list", async ({ page, request }) => {
  const title = uniqueTitle("Empty");
  try {
    // An activity with no words can't be generated: the server should
    // refuse it, log a failure, and the dashboard should warn about it.
    const activity = await createActivityViaApi(request, { title, type: "WORDLE" });
    const res = await request.post(`/api/activities/${activity.id}/generate`);
    expect(res.status()).toBe(422);
    expect((await res.json()).error).toBe("Word list is empty");

    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByText("✓ Healthy")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Key numbers" })).toBeVisible();
    await expect(page.getByText(`"${title}" uses an empty word list`)).toBeVisible();
    await expect(page.getByRole("heading", { name: /^Alerts \(\d+\)$/ })).toBeVisible();
  } finally {
    await deleteActivitiesByTitle(request, title);
  }
});

test("Wordle: generating a saved activity with an empty word list shows an error and is counted", async ({ page, request }) => {
  const title = uniqueTitle("Empty Wordle");
  try {
    await createActivityViaApi(request, { title, type: "WORDLE" });
    const before = (await getStats(request)).generations.failed;

    await page.goto("/wordle");
    await loadSavedActivity(page, title);
    await page.getByRole("button", { name: "Generate downloadable HTML" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "Word list is empty" })).toBeVisible();

    await expect.poll(async () => (await getStats(request)).generations.failed).toBe(before + 1);
  } finally {
    await deleteActivitiesByTitle(request, title);
  }
});
