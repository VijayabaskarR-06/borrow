FROM node:22-bookworm-slim AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
FROM dependencies AS build
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build:next
FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0 BORROW_DATA_DIR=/app/data
RUN groupadd --system --gid 1001 borrow && useradd --system --uid 1001 --gid borrow borrow && mkdir -p /app/data && chown borrow:borrow /app/data
COPY --from=build --chown=borrow:borrow /app/.next/standalone ./
COPY --from=build --chown=borrow:borrow /app/.next/static ./.next/static
COPY --from=build --chown=borrow:borrow /app/public ./public
USER borrow
EXPOSE 3000
CMD ["node","server.js"]
