FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package*.json ./
RUN npm ci
COPY src/ ./src/

FROM node:20-alpine
RUN apk add --no-cache docker-compose python3 make g++
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY package*.json ./
EXPOSE 8094
CMD ["node", "src/server/index.js"]
