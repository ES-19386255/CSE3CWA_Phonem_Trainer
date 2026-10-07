// Settings for the Playwright end-to-end tests (run with: npm run test:e2e).
//
// The tests use their OWN database file (prisma/e2e.db) on their own port
// (3100), so running them never touches the real dev database or a dev
// server that is already open on port 3000.

import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
const e2eDb = path.join(__dirname, "prisma", "e2e.db");

export default defineConfig({
  testDir: "./e2e",
  // One test at a time: they all share one database, so running them in
  // parallel could make them trip over each other.
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  timeout: 30_000,

  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    // Optional: point at a browser already on this computer (e.g. Chromium
    // or Chrome) if the one Playwright downloads won't run.
    launchOptions: process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
  },

  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],

  // Before the tests: make a fresh database, fill it with the seed data,
  // build the app and start it. Playwright waits for /health to return 200.
  webServer: {
    command: [
      `rm -f "${e2eDb}" "${e2eDb}-wal" "${e2eDb}-shm"`,
      "npx prisma migrate deploy",
      "npx tsx prisma/seed.ts",
      "npm run build",
      `npm run start -- -p ${PORT}`,
    ].join(" && "),
    env: { DATABASE_URL: `file:${e2eDb}` },
    url: `http://localhost:${PORT}/health`,
    reuseExistingServer: true,
    timeout: 240_000,
  },
});
