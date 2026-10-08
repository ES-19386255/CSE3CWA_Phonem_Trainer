// Reads the .jtl files JMeter wrote (results/x1.jtl, x10.jtl, ...) and
// prints a markdown table: how many requests, how many failed, how fast.
// Usage: node jmeter/summarise.mjs [results folder]
// It also saves the table as summary.md in that folder.

import fs from "node:fs";
import path from "node:path";

const dir = process.argv[2] ?? "results";

// JMeter's CSV puts quotes around fields that contain commas, so a plain
// split(",") isn't enough.
function parseCsvLine(line) {
  const cells = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') inQuotes = false;
      else cell += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ",") { cells.push(cell); cell = ""; }
    else cell += ch;
  }
  cells.push(cell);
  return cells;
}

function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  return sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)];
}

function summarise(rows) {
  const times = rows.map((r) => r.elapsed).sort((a, b) => a - b);
  const failed = rows.filter((r) => !r.success).length;
  const start = Math.min(...rows.map((r) => r.timeStamp));
  const end = Math.max(...rows.map((r) => r.timeStamp + r.elapsed));
  const seconds = Math.max((end - start) / 1000, 0.001);
  return {
    samples: rows.length,
    failed,
    errorPct: (failed / rows.length) * 100,
    avg: times.reduce((a, b) => a + b, 0) / times.length,
    p90: percentile(times, 90),
    p95: percentile(times, 95),
    p99: percentile(times, 99),
    max: times[times.length - 1],
    perSecond: rows.length / seconds,
    seconds,
  };
}

const files = fs
  .readdirSync(dir)
  .filter((f) => /^x\d+\.jtl$/.test(f))
  .sort((a, b) => parseInt(a.slice(1)) - parseInt(b.slice(1)));

if (files.length === 0) {
  console.error(`No x*.jtl files found in ${dir}`);
  process.exit(1);
}

const out = [];
const stages = {};
for (const file of files) {
  const [header, ...lines] = fs.readFileSync(path.join(dir, file), "utf8").split(/\r?\n/).filter(Boolean);
  const columns = parseCsvLine(header);
  const col = (name) => columns.indexOf(name);
  stages[file.replace(".jtl", "")] = lines.map((line) => {
    const cells = parseCsvLine(line);
    return {
      timeStamp: Number(cells[col("timeStamp")]),
      elapsed: Number(cells[col("elapsed")]),
      label: cells[col("label")],
      success: cells[col("success")] === "true",
    };
  });
}

const f1 = (n) => n.toFixed(1);
out.push("| Stage | Requests | Failed | Error % | Avg (ms) | p90 (ms) | p95 (ms) | p99 (ms) | Max (ms) | Requests/sec | Duration (s) |");
out.push("| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |");
for (const [stage, rows] of Object.entries(stages)) {
  const s = summarise(rows);
  out.push(`| ${stage} | ${s.samples} | ${s.failed} | ${f1(s.errorPct)} | ${f1(s.avg)} | ${s.p90} | ${s.p95} | ${s.p99} | ${s.max} | ${f1(s.perSecond)} | ${f1(s.seconds)} |`);
}

// A second table: each kind of request, in the biggest stage that ran.
const lastStage = Object.keys(stages).at(-1);
const labels = [...new Set(stages[lastStage].map((r) => r.label))];
out.push("", `Per request type in ${lastStage}:`, "");
out.push("| Request | Count | Failed | Avg (ms) | p95 (ms) |");
out.push("| --- | --- | --- | --- | --- |");
for (const label of labels) {
  const s = summarise(stages[lastStage].filter((r) => r.label === label));
  out.push(`| ${label} | ${s.samples} | ${s.failed} | ${f1(s.avg)} | ${s.p95} |`);
}

fs.writeFileSync(path.join(dir, "summary.md"), out.join("\n") + "\n");
console.log("\n" + out.join("\n"));
