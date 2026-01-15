FROM node:18-alpine

# Install wget for health checks
RUN apk add --no-cache wget

# Create non-root user first
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Set working directory and change ownership
WORKDIR /app
RUN chown nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Copy package files
COPY --chown=nodejs:nodejs package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy source code
COPY --chown=nodejs:nodejs . .

# Expose port
EXPOSE 3001

# Health check using the health route
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Start the application in production mode
CMD ["npm", "start"]