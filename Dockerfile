FROM node:20-slim

ENV DOCKER_API_VERSION=1.39

# Install Docker CLI
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        ca-certificates \
        curl \
        gnupg && \
    curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /usr/share/keyrings/docker.gpg && \
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker.gpg] https://download.docker.com/linux/debian bookworm stable" \
        > /etc/apt/sources.list.d/docker.list && \
    apt-get update && \
    apt-get install -y docker-ce-cli && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy package files first (better caching)
COPY package.json package-lock.json* ./

RUN npm install --omit=dev

# Copy source
COPY . .

# Run as non-root
RUN useradd -m appuser
USER appuser

EXPOSE 3000

CMD ["npm", "start"]
