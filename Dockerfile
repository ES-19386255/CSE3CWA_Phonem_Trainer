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
ENV DATABASE_URL="file:./dev.db"
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
# Includes the seeded dev.db created during the build above, so the
# container has working example data the moment it starts.
COPY --from=builder /app/prisma ./prisma

RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3000

# Lets Docker itself (and `docker ps`) report whether the app is actually
# healthy, using the same /health endpoint the brief asks for.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["npm", "run", "start"]
