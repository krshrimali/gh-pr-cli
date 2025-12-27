FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY src/ ./src/
COPY bin/ ./bin/

RUN chmod +x bin/gh-pr-review

ENV PATH="/app/bin:${PATH}"

ENTRYPOINT ["gh-pr-review"]