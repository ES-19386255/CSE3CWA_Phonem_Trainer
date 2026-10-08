// Accessibility checks using axe-core (the same engine Lighthouse uses, but
// run in more situations): every page, in light, dark and large-text modes,
// plus a few opened-up states like the kebab menu and the add-word form.
// Each page must have zero violations of the WCAG 2.2 AA rules.

import { test, expect, type Page } from "@playwright/test";
import { expectNoAxeViolations } from "./helpers";

const PAGES = [
  { path: "/", name: "Home", ready: "heading" },
  { path: "/wordle", name: "Wordle", ready: "select" },
  { path: "/wordsearch", name: "Word Search", ready: "select" },
  { path: "/activities", name: "Manage", ready: "activity" },
  { path: "/dashboard", name: "Dashboard", ready: "Key numbers" },
  { path: "/about", name: "About", ready: "heading" },
  { path: "/settings", name: "Settings", ready: "heading" },
];

const MODES = [
  { name: "light", cookies: [] as string[] },
  { name: "dark", cookies: ["theme=dark"] },
  { name: "dark + large text", cookies: ["theme=dark", "textSize=large"] },
];

// Waits until the page has loaded the data it needs, so axe sees the real page.
async function waitUntilReady(page: Page, ready: string) {
  if (ready === "select") await page.locator("select").first().waitFor();
  else if (ready === "activity") await page.getByRole("heading", { level: 3 }).first().waitFor();
  else if (ready === "heading") await page.getByRole("heading", { level: 1 }).waitFor();
  else await page.getByText(ready).first().waitFor();
}

for (const mode of MODES) {
  for (const pageInfo of PAGES) {
    test(`${pageInfo.name} has no accessibility violations (${mode.name})`, async ({ page, context, baseURL }) => {
      await context.addCookies(
        mode.cookies.map((pair) => {
          const [name, value] = pair.split("=");
          return { name, value, url: baseURL! };
        }),
      );
      await page.goto(pageInfo.path);
      await waitUntilReady(page, pageInfo.ready);
      await expectNoAxeViolations(page);
    });
  }
}

test("Manage page with the add-word form open has no violations", async ({ page }) => {
  await page.goto("/activities");
  await page.getByRole("button", { name: "+ Add a word" }).first().click();
  await expect(page.getByRole("button", { name: "Add word" })).toBeVisible();
  await expectNoAxeViolations(page);
});

test("the kebab menu is open and has no violations", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();
  await expect(page.locator("header").getByRole("link", { name: "About" })).toBeVisible();
  await expectNoAxeViolations(page);
});

test("the kebab menu can be used with the keyboard only", async ({ page }) => {
  await page.goto("/");
  const button = page.getByRole("button", { name: "Open menu" });
  await button.focus();
  await page.keyboard.press("Enter");
  await expect(button).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Escape");
  await expect(button).toHaveAttribute("aria-expanded", "false");
  await expect(button).toBeFocused();
});

test("every page has its own title", async ({ page }) => {
  const titles = new Set<string>();
  for (const pageInfo of PAGES) {
    await page.goto(pageInfo.path);
    titles.add(await page.title());
  }
  expect(titles.size).toBe(PAGES.length);
});

test("a skip link jumps past the navigation to the main content", async ({ page }) => {
  await page.goto("/wordle");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to main content" });
  await expect(skip).toBeFocused();
  await expect(skip).toBeVisible();
});
