# syntax=docker/dockerfile:1
# Build context is the repo root (see docker-compose.yml).

# ── 1. Compile the Soroban smart wallet → wasm ───────────────────────────────
FROM rust:1-slim AS contract
WORKDIR /src
RUN rustup target add wasm32v1-none
COPY Cargo.toml Cargo.lock ./
COPY contracts ./contracts
RUN cargo build -p smart-wallet --release --target wasm32v1-none

# ── 2. Install node dependencies ─────────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app
COPY web/package.json web/package-lock.json ./
RUN npm ci

# ── 3. Build the Next.js console (standalone output) ─────────────────────────
FROM node:22-alpine AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY web/ ./
RUN npm run build

# ── 4. Minimal runtime image ─────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs

COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
# Compiled contract used by the create-wallet deploy path.
COPY --from=contract /src/target/wasm32v1-none/release/smart_wallet.wasm /app/smart_wallet.wasm
ENV SMART_WALLET_WASM=/app/smart_wallet.wasm

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
