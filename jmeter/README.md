# Load testing with JMeter

This folder holds the JMeter load test for Phoneme Builder.

| File | What it is |
| --- | --- |
| `phoneme-builder.jmx` | The test plan: one "teacher session" of 10 requests |
| `start-load-server.sh` | Starts the app on its own fresh database (port 3200) |
| `run-stages.sh` | Runs the plan at x1, x10, x100, x1000 and x10000 |
| `summarise.mjs` | Turns JMeter's result files into a table |
| `results/` | Made when you run it (ignored by git) |

## What one "session" does

Each pass through the plan is one teacher using the app, in this order:

1. `GET /health`
2. `GET /api/activities` (also finds the ids of two seeded activities)
3. `GET /wordle` (the page)
4. `POST /api/activities/{id}/generate` for a Wordle activity
5. `POST /api/activities/{id}/generate` for a Word Search activity
6. `POST /api/page-views`
7. `POST /api/activities` (create one) then `DELETE` it again
8. `GET /api/stats`
9. `GET /dashboard` (the page)

Every request has an assertion on its status code (200, or 201 for creates),
so a wrong answer counts as a failure, not just a slow one.

The generate, page-view and create/delete requests all **write** to the
SQLite database, so the test also checks the database copes with many
requests at once (WAL mode and a 10 second busy timeout, see `lib/db.ts`).

## The stages

| Stage | Sessions | Requests | Users at once (default) |
| --- | --- | --- | --- |
| x1 | 1 | 10 | 1 |
| x10 | 10 | 100 | 10 |
| x100 | 100 | 1,000 | 100 |
| x1000 | 1,000 | 10,000 | 200 (5 loops each) |
| x10000 | 10,000 | 100,000 | 200 (50 loops each) |

"x10" means ten sessions in total. At most `MAX_THREADS` (default 200) users
run at the same moment, because one laptop running both the app and JMeter
can't honestly act as 10,000 separate computers. It's the equivalent
workload, not 10,000 simultaneous people. To use more simultaneous users:
`MAX_THREADS=1000 ./jmeter/run-stages.sh`.

## How to run it

1. **Install JMeter 5.6.x** (needs Java 8 or newer: check with `java -version`).
   Download the zip from <https://jmeter.apache.org/download_jmeter.cgi>, unzip
   it and use `bin/jmeter`, or install it with your package manager. If it
   isn't on your PATH, set `JMETER=/path/to/apache-jmeter-5.6.3/bin/jmeter`.
2. **Start the app on a fresh database** (first terminal, leave it running):
   ```bash
   ./jmeter/start-load-server.sh
   ```
   It builds the app and starts it at <http://localhost:3200>. It uses
   `prisma/load.db`, not your dev database.
3. **Run the stages** (second terminal):
   ```bash
   ./jmeter/run-stages.sh
   ```
   Smaller or quicker runs: `STAGES="1 10 100" ./jmeter/run-stages.sh`.
4. **Read the results**: the table is printed at the end and saved to
   `jmeter/results/summary.md`. JMeter also makes a full HTML report for each
   stage: open `jmeter/results/x1000-report/index.html` in a browser.

To look at the plan itself (good for the video): `jmeter -t jmeter/phoneme-builder.jmx`.

You can also run the app in Docker and point the test at it:
`PORT=3000 ./jmeter/run-stages.sh`. The Docker database is the one in the
container, so restart the container afterwards to get its data back.

## How to read the table

- **Error %** should be 0. Anything above 0 means the app gave a wrong answer or timed out.
- **Avg / p95 / p99 (ms)**: how long requests took. p95 means 95% were faster than this.
- **Requests/sec** is throughput. When it stops rising as users are added
  (while latency keeps climbing), that is the point where the app is saturated.

## What I found before writing the JMeter results

I couldn't run JMeter itself while building this, so I first replayed the
same 10-request session with a small Node script against the production
build, at the same five sizes. These are **not** JMeter numbers (the script
and the app were sharing a 2-CPU machine), so use them only as a rough idea.
Your own JMeter results are the ones to report.

| Stage | Requests | Failed | Avg (ms) | p95 (ms) | Requests/sec |
| --- | --- | --- | --- | --- | --- |
| x1 | 10 | 0 | 36 | 92 | 28 |
| x10 | 100 | 0 | 58 | 139 | 157 |
| x100 | 1,000 | 0 | 310 | 2423 | 185 |
| x1000 | 10,000 | 0 | 714 | 1047 | 261 |
| x10000 | 100,000 | 0 | 1147 | 2588 | 173 |

What the replay showed:

- **No errors at any size**, including 100,000 requests. The WAL mode and
  busy timeout in `lib/db.ts` kept the SQLite writes from failing.
- **One real bug, now fixed.** `/api/stats` loaded every recent event into
  JavaScript to count them per day, so it got slower as the database grew
  (235 ms with only 8,000 events) and slowed every other request too,
  because Node does its work on one thread. It now asks SQLite to count per
  day, and takes about 75 ms with 22,000 events. This is why the load test
  is worth doing: it never showed up with the small seed data.
- **Where it tops out.** Throughput stops rising at roughly 170 to 260
  requests per second and latency climbs after that. That is expected for
  one Node process with one SQLite file. Going further would need more than
  one server process and a database that allows many writers (for example
  PostgreSQL). That is a next step, not something to fix in this task.
- The load test writes real rows (about 2 events and 1 page view per
  session), which is why it uses its own `prisma/load.db`.
