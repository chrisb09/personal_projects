FROM node:20-alpine

# Install git as git is needed by update-stats.js to inspect repos!
RUN apk add --no-cache git openssh-client

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application files
COPY . .

# Set default env command for watcher
ENV WATCH_BUILD_CMD="npm run build"

# Run the startup script
CMD ["node", "scripts/docker-entrypoint.js"]
