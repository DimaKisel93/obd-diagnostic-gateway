# syntax=docker/dockerfile:1
FROM node:22-bookworm-slim AS base

WORKDIR /app

# Install dependencies
RUN groupadd -g 1001 -r nodejs
RUN useradd -r -u 1001 -g nodejs nextjs

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install pnpm
RUN npm install -g pnpm --no-cache

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY . .

# Build
RUN pnpm build

# Production stage
FROM node:22-bookworm-slim AS production

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

RUN groupadd -g 1001 -r nodejs
RUN useradd -r -u 1001 -g nodejs nextjs

RUN apt-get update && apt-get upgrade -y && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

# Copy built app
COPY --from=base /app/dist ./dist
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package.json ./package.json
COPY --from=base /app/prisma ./prisma
COPY --from=base /app/src ./src

USER nextjs

EXPOSE 3000

CMD ["node", "dist/main.js"]