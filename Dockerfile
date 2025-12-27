FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY src/ ./src/
COPY bin/ ./bin/

# Make binary executable
RUN chmod +x bin/gh-pr-review

# Set PATH to include our binary
ENV PATH="/app/bin:${PATH}"

# Set up entrypoint
ENTRYPOINT ["gh-pr-review"]