FROM node:20-alpine AS builder
WORKDIR /app
# Install build deps for native modules (sqlite3/bcrypt) if needed
RUN apk add --no-cache python3 make g++
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi
COPY tsconfig.json nest-cli.json ./
COPY src ./src
RUN npm run build

FROM node:20-alpine AS runner
ENV NODE_ENV=production
WORKDIR /app
# Create data dir for sqlite volume
RUN mkdir -p /data
# Copy node_modules and build output from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/dist ./dist
EXPOSE 4000
CMD ["node", "dist/main.js"]
