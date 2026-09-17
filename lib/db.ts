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

const adapter = new PrismaBetterSQLite3({ url: databaseUrl });
export const prisma = new PrismaClient({ adapter });
