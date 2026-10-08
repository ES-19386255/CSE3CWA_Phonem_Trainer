# A Debian-based image (not Alpine) is used on purpose: better-sqlite3 is a
# native module, and prebuilt binaries for it are far more reliable on
# Debian's glibc than on Alpine's musl libc, which often forces a slow,
# error-prone compile-from-source step instead.
FROM node:22-bookworm-slim AS base
WORKDIR /app
# Prisma's own engines need OpenSSL to be present explicitly on this base
# image -- without it, `prisma generate`/`migrate` only warn and guess at
# a version, which can misbehave later.
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
 && rm -rf /var/lib/apt/lists/*

# ---- Dependencies -----------------------------------------------------
# Installed in their own stage so this layer is only rebuilt when
# package.json/package-lock.json actually change, not on every code edit.
# The schema is copied in before `npm ci` specifically because `npm ci`
# triggers `prisma generate` (see the "postinstall" script in
# package.json), which needs prisma/schema.prisma to already exist.
FROM base AS deps
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

# ---- Build --------------------------------------------------------------
# Generates the Prisma client, creates and seeds a starter SQLite
# database, and builds the Next.js app -- all inside the image, so the
# result doesn't depend on anything from the host machine.
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV DATABASE_URL="file:./dev.db"
RUN npx prisma generate
RUN npx prisma migrate deploy
RUN npx tsx prisma/seed.ts
RUN npm run build

# ---- Run ----------------------------------------------------------------
FROM base AS runner
ENV NODE_ENV=production
# The live database sits in /app/data, away from the code, so a volume can
# be mounted there without hiding the app's own files.
ENV DATABASE_URL="file:/app/data/app.db"
ENV PORT=3000

# Runs as a dedicated, non-root user rather than the image's default root,
# since the container never needs root privileges to serve the app.
RUN groupadd --system --gid 1001 nodejs \
 && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
# Includes the seeded dev.db created during the build above. The start
# script copies it to /app/data the first time, so there is example data.
COPY --from=builder /app/prisma ./prisma
COPY docker-entrypoint.sh ./docker-entrypoint.sh

# Made here, owned by nextjs, so a new named volume copies that owner.
RUN chmod +x docker-entrypoint.sh && mkdir -p /app/data \
 && chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3000

# Lets Docker itself (and `docker ps`) report whether the app is actually
# healthy, using the same /health endpoint the brief asks for.
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["./docker-entrypoint.sh"]
