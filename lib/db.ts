// Creates one shared database connection. Every API route and the seed
// script import `prisma` from here, instead of each building their own
// connection -- that way they always point at the exact same file.

import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "./generated/prisma/client";
import { PrismaBetterSQLite3 } from "@prisma/adapter-better-sqlite3";

// This file lives in lib/, one folder below the project root, so this
// always resolves to <project root>/prisma/dev.db -- no matter which
// directory a command happens to be run from. A plain relative path like
// "file:./dev.db" would instead depend on the current working directory,
// and can silently point at the wrong (empty) database file.
const projectRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const defaultDbPath = path.join(projectRoot, "prisma", "dev.db");

// DATABASE_URL can still override this with an absolute path (useful for
// Docker, where the database might live somewhere else entirely).
const rawUrl = process.env.DATABASE_URL;
const isAbsoluteFileUrl = rawUrl && path.isAbsolute(rawUrl.replace(/^file:/, ""));
const databaseUrl = isAbsoluteFileUrl ? rawUrl! : `file:${defaultDbPath}`;

// timeout = how long (ms) a query waits if the database file is busy,
// instead of failing straight away. Helps when many requests arrive at once.
const adapter = new PrismaBetterSQLite3({ url: databaseUrl, timeout: 10000 });
export const prisma = new PrismaClient({ adapter });

// Turns on SQLite's WAL mode, which lets reads carry on while a write is
// happening. That matters for the load tests. The setting is saved inside
// the database file, so it only needs doing once. It runs on the first
// /health call (and in the seed), and is remembered so it isn't repeated.
let walPromise: Promise<unknown> | null = null;
export function ensureWal() {
  if (!walPromise) {
    walPromise = prisma.$queryRawUnsafe("PRAGMA journal_mode = WAL").catch((err) => {
      walPromise = null; // try again next time if it failed
      console.error("Could not turn on WAL mode:", err);
    });
  }
  return walPromise;
}
