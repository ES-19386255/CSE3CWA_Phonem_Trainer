// Small helpers shared by the tests.

import { expect, type APIRequestContext, type Locator, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { ALL_PHONEMES } from "../lib/phonemes";

// Every test makes its own activity with a unique title, so tests never
// depend on each other or on the seed data.
export function uniqueTitle(label: string) {
  return `E2E ${label} ${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

// A phoneme button's accessible name is its symbol plus its hint (e.g. "θ (th, as in thin)"),
// so this finds the right button from the symbol, using the same data
// the app uses.
export function phonemeButton(scope: Page | Locator, ipa: string) {
  const phoneme = ALL_PHONEMES.find((p) => p.ipa === ipa);
  if (!phoneme) throw new Error(`Unknown phoneme in test: ${ipa}`);
  return scope.getByRole("button", { name: `${phoneme.ipa} (${phoneme.hint})`, exact: true });
}

// Makes an activity straight through the API (quicker than clicking
// through the form when the form isn't what's being tested).
export async function createActivityViaApi(
  request: APIRequestContext,
  body: Record<string, unknown>,
): Promise<{ id: number; title: string }> {
  const res = await request.post("/api/activities", { data: body });
  if (!res.ok()) throw new Error(`Could not create activity: ${res.status()} ${await res.text()}`);
  return res.json();
}

// Deletes every activity whose title matches, used to tidy up after a test
// (even if the test failed halfway). If the tidy-up itself fails, it is
// ignored, so it can't hide the real reason the test failed.
export async function deleteActivitiesByTitle(request: APIRequestContext, title: string) {
  try {
    const res = await request.get("/api/activities");
    const all: { id: number; title: string }[] = await res.json();
    for (const activity of all.filter((a) => a.title === title)) {
      await request.delete(`/api/activities/${activity.id}`);
    }
  } catch {
    // nothing to do: the next run uses a fresh unique title anyway
  }
}

// Picks a saved activity from the "Load a saved activity" dropdown. That
// dropdown only appears once the saved activities have loaded, so this
// waits for the select that actually contains the title instead of just
// grabbing the first select on the page (which could be Difficulty).
export async function loadSavedActivity(page: Page, title: string) {
  const picker = page.locator("select").filter({ has: page.locator("option", { hasText: title }) });
  await picker.selectOption({ label: title });
}

export async function getStats(request: APIRequestContext) {
  const res = await request.get("/api/stats");
  return res.json();
}

// The accessibility rules checked everywhere: WCAG 2.2 level AA plus
// axe's general best practices.
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

// Runs axe on the page and fails with a short, readable list of what
// broke and where (rule, how serious, and the first few elements).
export async function expectNoAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
  const message = results.violations
    .map((v) => `${v.id} (${v.impact}): ${v.help}\n` + v.nodes.slice(0, 3).map((n) => `    ${n.target.join(" ")}`).join("\n"))
    .join("\n");
  expect(results.violations, message).toEqual([]);
}
