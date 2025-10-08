# Use the official Playwright image (bundles browsers + deps)
FROM mcr.microsoft.com/playwright:v1.47.2-jammy

# Add Xvfb for a virtual display and a few basics
RUN apt-get update && apt-get install -y xvfb curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install deps
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Build if you're using TypeScript (otherwise remove)
# RUN npm run build

# App listens on 8080 (change if needed)
EXPOSE 8080
