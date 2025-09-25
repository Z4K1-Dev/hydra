FROM node:18-alpine

# Install system dependencies
RUN apk add --no-cache \
    bash \
    curl \
    git \
    python3 \
    py3-pip \
    build-base

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Create necessary directories
RUN mkdir -p data config logs sessions

# Build the application
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S glm -u 1001

# Change ownership
RUN chown -R glm:nodejs /app
USER glm

# Expose port (for web interface if needed)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node healthcheck.js

# Entry point
ENTRYPOINT ["node", "dist/index.js"]

# Default command
CMD ["start"]