# ============== Stage 1: Build ==============
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies (including devDependencies for build)
COPY package.json package-lock.json* ./
RUN npm ci

COPY prisma ./prisma
# generate Prisma Client into node_modules/@prisma/client (default)
RUN npx prisma generate

# Copy source and build
COPY . .
RUN npm run build

# ============== Stage 2: Production ==============
FROM node:20-alpine AS production

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 -G nodejs

# Copy only production dependencies
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy built output from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# IMPORTANT: also copy the generated Prisma engines/client artifacts
# (If you generate in builder, you must ensure runtime has them)
COPY --from=builder /app/node_modules ./node_modules

# entrypoint runs migrate then starts app
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]

# Own the app directory
RUN chown -R nestjs:nodejs /app

USER nestjs

EXPOSE 3000

CMD ["node", "dist/main.js"]
