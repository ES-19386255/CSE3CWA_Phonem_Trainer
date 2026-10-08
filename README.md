# Phoneme Builder — Tasks 1 to 3

A classroom activity builder for Speech Pathology teachers. Teachers build
activities out of phonemes (sounds), and the app turns them into a Wordle
game or a Word Search puzzle, downloadable as one HTML file a student can
open in any browser.

- **Task 1** built the frontend: the builder, the live preview and the HTML export.
- **Task 2** added the backend: SQLite and Prisma, a CRUD API, validation and Docker.
- **Task 3** added the dashboard and reporting: a record of every generation
  and page view, stats, alerts, a `/health` check, end-to-end tests,
  load tests, accessibility fixes, and Docker Compose with a saved database.

## Node version

Use **Node 22 LTS**. `better-sqlite3` is a native module and has no
pre-built file for brand-new Node versions. The scripts in `scripts/` and
`jmeter/` also use `import`, which old Node versions cannot run. With nvm:
`nvm install 22 && nvm use 22` (and `nvm alias default 22` so every new
terminal uses it).

## Getting started

```bash
cp .env.example .env                 # sets DATABASE_URL for local dev
npm install                          # also runs `prisma generate`
npx prisma migrate deploy            # creates the database tables
npm run db:seed                      # starter activities + simulated history
npm run dev
```

Open <http://localhost:3000>. Use `npx prisma migrate dev --name <name>`
instead of `deploy` only when you are changing `schema.prisma`.

`npm run db:seed` **wipes and refills** the database, so run it on a
database you don't mind resetting. It prints a short summary when it is done.

```bash
npm run build         # production build (also type-checks)
npm run lint          # code checks
npm run db:studio     # Prisma Studio, a GUI for the database
npm run test:e2e      # Playwright tests (see Testing)
```

## What the app does

| Page | What it is |
| --- | --- |
| `/` | Home |
| `/wordle`, `/wordsearch` | Build, preview and download an activity. Can load a saved activity |
| `/activities` | Manage saved activities and their words (full CRUD) |
| `/dashboard` | **Task 3.** Health, stats, alerts, charts and reports |
| `/settings` | Dark mode and text size |
| `/about` | About and the walkthrough video link |
| `/health` | Returns 200 `{ "status": "ok" }` when the server and database work |

## Dashboard and reporting (Task 3)

`/dashboard` reads everything from the database through `/api/stats`, and
refreshes by itself every 15 seconds. It shows:

- **Health status** from `/health`
- **Stat cards:** Wordle and Word Search activity counts, average time on
  page, most-used activity type, successful and failed generations
- **A 14-day chart** of generations (successes and failures), with a "Show as
  table" button for the same numbers
- **Reports:** usage per activity, time on page per page, and the most recent
  generation attempts
- **Alerts** (words as well as colour, "Error" or "Warning"):
  - *Failed generation:* a warning when some fail, an error when 25% or more
    of the last 24 hours' attempts failed (needs at least 5 attempts)
  - *Empty word list:* an activity has no words
  - *Invalid data:* a word has no phonemes, or uses an unknown symbol

### Where the data comes from

Real use is recorded as it happens:

- Pressing Generate calls `POST /api/activities/:id/generate`, or
  `POST /api/events` for an unsaved activity, and logs a success or failure.
- Every page records how long it was visible (`POST /api/page-views`).
- Opening the dashboard saves a **stat snapshot** (at most one a minute), so
  the history of the stats is kept in the database too.

`npm run db:seed` also adds **simulated** history (150 generations, 220 page
views, 7 daily snapshots, an empty-list activity and a broken activity) so
the dashboard and alerts have something to show. Every fake row has
`simulated = true`, and the dashboard shows how many simulated rows there are.

## Project layout

```
app/
  page.tsx, wordle/, wordsearch/, about/, settings/   Task 1 pages
  activities/            Task 2: manage activities and words
  dashboard/             Task 3: the dashboard
  health/                GET /health
  api/                   REST route handlers (see the table below)

components/     Reusable pieces (nav bar, cards, WordBuilder, StatCard, TrendChart)

lib/
  phonemes.ts, wordScore.ts, wordSearchGrid.ts   Game logic
  buildWordleHtml.ts, buildWordSearchHtml.ts      HTML export
  db.ts            Shared Prisma connection (SQLite, WAL mode)
  stats.ts         Task 3: works out every number on the dashboard
  checkActivity.ts Task 3: finds empty lists and invalid words
  validation.ts    zod schemas for every write endpoint
  apiError.ts, apiClient.ts, usePageTimer.ts

prisma/
  schema.prisma    The data model
  seed.ts          Starter data + simulated history
  migrations/      Version history of database changes

e2e/               Playwright tests (CRUD, generate/view, dashboard, accessibility)
jmeter/            Load test plan, scripts and README
scripts/           lighthouse-audit.mjs
Dockerfile, docker-compose.yml, docker-entrypoint.sh
```

## Database schema

- **WordList** — a named, reusable list of words. Many activities can share one.
- **Word** — one word in a list. **Phoneme** — one sound in a word, its own
  row so a symbol like `tʃ` is never split. `order`/`position` keep the sequence.
- **Activity** — one Wordle or Word Search configuration. It points at a
  WordList (and cannot be left without one).
- **GenerationEvent** — one attempt to generate: type, success or failure,
  error message, `simulated` flag, time.
- **PageView** — one visit to a page: path, seconds visible, `simulated`, time.
- **StatSnapshot** — the headline stats saved at a moment in time, so they can be
  reported over time.

Deleting a list deletes its words and phonemes, and the database won't
allow it while an activity still uses the list. Deleting an activity keeps
its events (they just lose the link), so the history isn't lost.

## API routes

| Route | Method | What it does |
|---|---|---|
| `/health` | GET | 200 `{ status: "ok" }` if the server and database work |
| `/api/activities` | GET, POST | List activities / create one |
| `/api/activities/:id` | GET, PATCH, DELETE | Read, update or delete one activity |
| `/api/activities/:id/generate` | POST | Check the activity, log the attempt, return the download. **422** and a logged failure if it has problems |
| `/api/activities/:id/words` | POST | Add a word to the activity's list |
| `/api/activities/:id/words/:wordId` | PATCH, DELETE | Edit or delete a word |
| `/api/wordlists` | GET | List the word lists |
| `/api/events` | POST | Log a generation (a failure needs an `errorMessage`) |
| `/api/page-views` | POST | Log a page visit |
| `/api/stats` | GET | Every number for the dashboard, and the alerts |
| `/api/stats` | POST | Save a stat snapshot (refused if one was saved in the last 60 s) |

Every write is checked with `zod` first. Every error has the same shape,
`{ "error": "a readable message" }`, with 400 for bad input, 404 for
something missing, 422 for an activity that can't be generated, and 500 for
anything unexpected (see `withErrorHandling` in `lib/apiError.ts`).

## Testing

### Playwright (end to end)

```bash
npx playwright install chromium   # first time only
npm run test:e2e
```

Playwright starts its own copy of the app on port 3100 with its own
database (`prisma/e2e.db`), so it never touches your dev data. It runs 31 tests:

- `builder-crud.spec.ts` — create, read, update and delete in the builder
- `generate-view.spec.ts` — generate a Wordle and a Word Search, open the
  downloaded file, play it, and check the generation was counted
- `dashboard.spec.ts` — `/health` is 200, and an empty list raises an alert
- `accessibility.spec.ts` — axe checks on every page in light, dark and large
  text, plus keyboard checks

`npm run test:e2e:report` opens the last HTML report.

### Load testing (JMeter)

See [`jmeter/README.md`](jmeter/README.md). In short, in two terminals:

```bash
./jmeter/start-load-server.sh                                  # terminal 1
JMETER=~/apache-jmeter-5.6.3/bin/jmeter ./jmeter/run-stages.sh # terminal 2
```

It runs 1, 10, 100, 1,000 and 10,000 teacher sessions (10 requests each)
against a separate database, and writes a table to `jmeter/results/summary.md`
and an HTML report per stage. In my run there were no failed requests at any
stage. At x10000 (200 users at once) the average response was 274 ms, with a
slow worst case caused by SQLite allowing one writer at a time.

### Accessibility (Lighthouse and axe)

```bash
export CHROME_PATH=$(node -e "console.log(require('@playwright/test').chromium.executablePath())")
node scripts/lighthouse-audit.mjs        # app must be running on port 3000
```

All pages score 100 for accessibility. What was wrong, what was fixed and
what has not been checked (for example a real screen reader) is in
[`docs/accessibility.md`](docs/accessibility.md).

## Docker

### With Docker Compose (keeps the database)

```bash
docker compose up --build      # then open http://localhost:3000
docker compose down            # stop; the data is kept
docker compose down -v         # stop and delete the data
```

The database lives at `/app/data/app.db` inside the container, on a named
volume called `phoneme-data`. Anything you create or generate is still
there after a restart.

### With plain Docker (starts fresh every time)

```bash
docker build -t phoneme-builder .
docker run -p 3000:3000 phoneme-builder
```

Add `-v phoneme-data:/app/data` to keep the data here too.

### How it works

1. **deps** installs dependencies in their own layer.
2. **builder** generates the Prisma client, creates and seeds a starter
   database (`prisma/dev.db`), and runs `next build`.
3. **runner** copies across only what is needed and runs as a non-root user.

When the container starts, `docker-entrypoint.sh` copies the seeded database
to `/app/data/app.db` **only if there is no database there yet**, runs
`prisma migrate deploy` (so an older saved database is brought up to date),
then starts the app. With a volume this happens once; without one, every
new container starts from the seeded copy.

The image has a `HEALTHCHECK` that calls `/health`, so `docker ps` shows
`(healthy)`. It uses `node:22-bookworm-slim` (Debian, not Alpine) because
`better-sqlite3` has far more reliable pre-built files for glibc.

## Limits I know about

- **SQLite allows one writer at a time.** The load test shows it: no
  failures, but the worst responses got slow at 200 users at once. WAL mode and
  a busy timeout help. For real heavy use I would move to PostgreSQL.
- **One app instance only.** Because the database is a file, two containers
  can't safely share it.
- **The simulated data is fake.** It is marked `simulated = true`, and
  it is there so the dashboard has something to show.
- **Time on page** only counts while the tab is visible, and visits under one
  second are ignored.
- **Accessibility:** passing the automatic tools is a good start, not proof.
  I haven't tried a real screen reader.
- **One audit warning:** `npm audit` shows a high-severity finding in
  `deepmerge-ts`, pulled in by Prisma's own CLI config tooling. It is a
  dev-time tool, not code that runs for users, and no Prisma version fixes it
  while still supporting the "no native binary" mode used here.