# Phoneme Builder — Task 2 (in progress, 4th attempt)

A classroom activity builder for Speech Pathology teachers. Teachers build activities out of phonemes (sounds), and the app turns them into a Wordle game or a Word Search puzzle, downloadable as one HTML file.

This version adds a real backend and database: activities and their words are now stored in a database via Prisma, instead of being fixed in the frontend code. This is being built in stages — see the progress note below for what's done so far.

## API routes

All routes live under `app/api/` (Next.js App Router route handlers), except
the health check, which the brief specifically asks for at `/health`.

| Route | Method | What it does |
|---|---|---|
| `/health` | GET | Returns `{ status: "ok" }` with 200 if the server and database are both reachable. |
| `/api/activities` | GET | Lists every saved activity, with its words and phonemes included. |
| `/api/activities` | POST | Creates a new activity, optionally with an initial word list. |
| `/api/activities/:id` | GET | Fetches one activity in full. |
| `/api/activities/:id` | PATCH | Updates an activity's own settings (title, type, hints, difficulty) — not its words. |
| `/api/activities/:id` | DELETE | Deletes an activity (its words and their phonemes cascade automatically). |
| `/api/activities/:id/words` | POST | Adds a new word (with phonemes) to an activity. |
| `/api/activities/:id/words/:wordId` | PATCH | Updates a word's spelling and/or phonemes. |
| `/api/activities/:id/words/:wordId` | DELETE | Deletes one word. |

Every write endpoint validates its input with `zod` (see `lib/validation.ts`)
before touching the database, and every error comes back as
`{ "error": "a readable message" }` with an appropriate status code (400 for
bad input, 404 for something that doesn't exist).

This was tested with a temporary stand-in for the real database client (for
the same sandbox-network reason described above), sending real HTTP
requests to every route and checking the exact status codes and error
messages returned — but not against the real Prisma-generated client yet.
Worth trying each route for real once this is running locally.

## Frontend integration

- **`/activities`** — a management page: create and delete activities,
  and add, edit, or delete the words inside each one. This is where full
  CRUD on words actually happens.
- **Wordle and Word Search pages** — both now offer a "Load a saved
  activity" dropdown at the top. Picking one loads its word(s) and
  settings straight into the existing builder, so the same preview and
  Generate button work from stored data instead of only the fixed Task 1
  example. Both pages also gained a "Save to library" field, so a word
  list built in the browser can be kept in the database for later.
- **`lib/apiClient.ts`** — small fetch wrapper functions shared by all of
  the above, so every page talks to the backend the same way.

This step was tested two ways: the `apiClient` functions against a mocked
`fetch` (confirming the right URL/method/body for every call), and the new
`WordBuilder` component (used for both adding and editing a word) by
directly mounting it and simulating real clicks — building the word "sun"
by clicking phoneme keys and confirming it submitted exactly
`{ english: "sun", sounds: ["s", "ɐ", "n"] }`. The full pages were also
checked with a temporary stand-in database client (see the note below) to
confirm they render correctly and contain the expected content, though the
interactive load/save flow hasn't been exercised against a real database
yet — worth trying for real once this is running locally.

## Node version

Use Node 22 LTS (or another LTS release), not the very newest "Current"
version. `better-sqlite3` (the SQLite driver Prisma's adapter uses) needs
to compile a small native addon against Node's V8 engine, and pre-built
binaries for brand-new, non-LTS Node releases often aren't published yet
— which can cause `npm install` to try compiling from source and fail on
V8 API changes. With `nvm`: `nvm install 22 && nvm use 22`.

## Getting started

```bash
npm install          # also runs `prisma generate` automatically
npx prisma migrate dev --name init   # creates the database and its tables
npm run db:seed       # fills it with two starter activities
npm run dev
```

Open <http://localhost:3000>.

```bash
npm run build   # production build (also type-checks)
npm run lint    # code checks
npm run db:studio   # opens Prisma Studio, a GUI for browsing the database
```

## Project layout

```
app/            Pages and (soon) API routes
components/     Small reusable pieces (buttons, nav bar, cards)
lib/            Data and logic with no React in it
prisma/
  schema.prisma   The database schema (source of truth for the data model)
  seed.ts         Fills the database with starter data
  migrations/     Version history of database changes (created by prisma migrate)
prisma.config.ts  Tells the Prisma CLI where the schema and seed script live
```

## Database schema

Three tables, matching how phoneme-based activities actually work:

- **Activity** — one saved Wordle or Word Search configuration (title, type,
  hint/difficulty settings).
- **Word** — one word inside an activity, in its English spelling.
- **Phoneme** — one sound inside a word, stored as its own row (not one
  character of a text field), so a multi-character symbol like `tʃ` is
  never a problem. An `order`/`position` field on Word and Phoneme keeps
  everything in the right sequence.

Deleting an Activity cascades to delete its Words, and deleting a Word
cascades to delete its Phonemes — so cleanup is automatic.

## Known issue: one residual npm audit finding

`npm audit` will show one remaining high-severity issue in `deepmerge-ts`,
pulled in by Prisma's own CLI config tooling (`@prisma/config`). This is a
stack-overflow risk in a dev-time config-parsing tool, not in code that
runs in production or is reachable by an end user, and there's currently no
Prisma version available that fixes it while still supporting the
Rust-free "no native binary" mode this project uses. Worth being aware of,
not worth blocking on.

## Troubleshooting: page loads but nothing is clickable in `npm run dev`

If the app looks fully styled but no buttons, keyboards, or toggles respond
to clicks, this is very likely a network/firewall issue rather than a code
issue. `npm run dev` opens a WebSocket connection back to the dev server for
hot-reloading (Fast Refresh); if that connection is blocked (common on
corporate networks, VPNs, or with strict firewalls), the page renders but
React never finishes starting up, with no obvious console error.

Workaround: use a production build instead of dev mode.

```bash
npm run build
npm run start
```

