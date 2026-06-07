# ---- Stage 1: Builder ----
FROM node:22-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm@11.5.1
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/backend/package.json ./packages/backend/
COPY packages/frontend/package.json ./packages/frontend/
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm --filter @pcm/shared build && \
    pnpm --filter @pcm/backend build && \
    pnpm --filter @pcm/frontend build

# ---- Stage 2: Runtime ----
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/backend/package.json ./packages/backend/
COPY packages/frontend/package.json ./packages/frontend/
# Install pnpm, install prod deps with --ignore-scripts (native better-sqlite3 binary is copied
# from builder below), then remove pnpm and its store/cache in the same layer - none of it is
# needed at runtime (CMD runs `node` directly) and it roughly doubles the image size otherwise.
RUN npm install -g pnpm@11.5.1 && \
    pnpm install --frozen-lockfile --prod --ignore-scripts && \
    npm uninstall -g pnpm && \
    rm -rf /root/.local/share/pnpm /root/.cache /root/.npm
COPY --from=builder /app/node_modules/.pnpm/better-sqlite3@*/node_modules/better-sqlite3/build /tmp/better-sqlite3-build
RUN target_dir=$(find node_modules/.pnpm -maxdepth 1 -name 'better-sqlite3@*')/node_modules/better-sqlite3 && \
    cp -r /tmp/better-sqlite3-build "$target_dir/build" && \
    rm -rf /tmp/better-sqlite3-build
COPY --from=builder /app/packages/backend/dist ./packages/backend/dist
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/frontend/dist ./packages/backend/dist/public
COPY --from=builder /app/packages/backend/src/db/schema.sql ./packages/backend/dist/db/schema.sql
EXPOSE 3000
CMD ["node", "packages/backend/dist/index.js"]
