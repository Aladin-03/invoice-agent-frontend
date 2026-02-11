# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies for build)
RUN npm ci

# Copy all source files
COPY . .

# Build arguments - these MUST be declared before ENV
ARG VITE_API_BASE_URL
ARG VITE_OPENAI_API_KEY

# Print for debugging (will show in build logs)
RUN echo "Building with API URL: $VITE_API_BASE_URL"
RUN echo "API Key length: $(echo $VITE_OPENAI_API_KEY | wc -c)"

# Set as environment variables for Vite build
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_OPENAI_API_KEY=$VITE_OPENAI_API_KEY

# Build the app (Vite will read these env vars)
RUN npm run build

# Verify the build output contains the env vars
RUN echo "Checking if env vars are in bundle..." && \
    grep -r "VITE_API_BASE_URL" dist/ || echo "Warning: VITE_API_BASE_URL not found in bundle"

# Production stage
FROM nginx:alpine

# Copy built files from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port for Cloud Run
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
