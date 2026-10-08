// Runs a Lighthouse accessibility audit on every page and prints a table.
// Usage:  node scripts/lighthouse-audit.mjs [base url]
// The app must already be running (default http://localhost:3000).
// It saves each full report (HTML + JSON) into lighthouse-reports/ and
// writes a short summary.md there too.
// If Chrome isn't found, set CHROME_PATH to your Chrome/Chromium file.

import { execFileSync } from "node:child_process";
import fs from "node:fs";

const base = process.argv[2] ?? "http://localhost:3000";
const outDir = "lighthouse-reports";
const pages = [
  { name: "home", path: "/" },
  { name: "wordle", path: "/wordle" },
  { name: "wordsearch", path: "/wordsearch" },
  { name: "activities", path: "/activities" },
  { name: "dashboard", path: "/dashboard" },
  { name: "about", path: "/about" },
  { name: "settings", path: "/settings" },
];

fs.mkdirSync(outDir, { recursive: true });
const rows = [];

for (const page of pages) {
  const outputBase = `${outDir}/${page.name}`;
  console.log(`Auditing ${base}${page.path} ...`);
  execFileSync(
    "npx",
    [
      "--yes",
      "lighthouse@13.5.0",
      base + page.path,
      "--only-categories=accessibility",
      "--output=json",
      "--output=html",
      `--output-path=${outputBase}`,
      '--chrome-flags=--headless=new --no-sandbox',
      "--quiet",
    ],
    { stdio: "inherit" },
  );

  const report = JSON.parse(fs.readFileSync(`${outputBase}.report.json`, "utf8"));
  const failed = Object.values(report.audits)
    .filter((audit) => audit.scoreDisplayMode === "binary" && audit.score !== null && audit.score < 1)
    .map((audit) => audit.id);
  rows.push({ page: page.path, score: Math.round(report.categories.accessibility.score * 100), failed });
}

const lines = [
  "| Page | Accessibility score | Failing audits |",
  "| --- | --- | --- |",
  ...rows.map((row) => `| ${row.page} | ${row.score} | ${row.failed.join(", ") || "none"} |`),
];
fs.writeFileSync(`${outDir}/summary.md`, lines.join("\n") + "\n");
console.log("\n" + lines.join("\n"));
