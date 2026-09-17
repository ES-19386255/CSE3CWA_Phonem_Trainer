# Phoneme Builder — Task 2 (v4, in progress)

A classroom activity builder for Speech Pathology teachers. Teachers build
activities out of phonemes (sounds), and the app turns them into a Wordle
game or a Word Search puzzle, downloadable as one HTML file.

This version adds a real backend and database: activities and their words are
now stored in a database via Prisma, instead of being fixed in the frontend
code. This is being built in stages — see the progress note below for what's
done so far.

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

## Database schema (Task 2, step 1 of 5)

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

