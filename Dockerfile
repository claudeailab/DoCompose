# syntax=docker/dockerfile:1
FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci
COPY src/ ./src/

FROM node:20-alpine
# docker-cli and docker-cli-compose are needed at runtime for compose operations.
# python3/make/g++ are NOT needed — native modules are already compiled in builder.
RUN apk add --no-cache docker-cli docker-cli-compose
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY package*.json ./
EXPOSE 8094
HEALTHCHECK --interval=30s --timeout=5s --retries=3 --start-period=10s \
  CMD wget -qO /dev/null http://localhost:8094/api/health || exit 1
CMD ["node", "src/server/index.js"]
