# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY package-lock.json* ./
COPY yarn.lock* ./
COPY pnpm-lock.yaml* ./

# Install dependencies
RUN npm ci --only=production=false || \
    yarn install --frozen-lockfile || \
    pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build frontend
RUN npm run build

# Stage 2: Backend Runtime
FROM node:20-alpine

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package files
COPY package*.json ./
COPY package-lock.json* ./
COPY yarn.lock* ./
COPY pnpm-lock.yaml* ./

# Install production dependencies only
RUN npm ci --only=production || \
    yarn install --frozen-lockfile --production || \
    pnpm install --frozen-lockfile --prod

# Copy Prisma schema and migrations
COPY prisma ./prisma/

# Copy backend source
COPY src ./src/

# Copy built frontend from previous stage
COPY --from=frontend-builder /app/dist ./dist/

# Create directory for SQLite database with correct permissions
RUN mkdir -p /app/data && \
    chown -R nodejs:nodejs /app/data

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001
ENV DATABASE_URL="file:/app/data/dev.db"

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Run Prisma migrations and start server
ENTRYPOINT ["dumb-init", "--"]
CMD ["sh", "-c", "npx prisma migrate deploy && node src/server/server.js"]
