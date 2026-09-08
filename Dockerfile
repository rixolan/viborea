FROM oven/bun:1.4 AS web
WORKDIR /web
COPY web/package.json web/bun.lock ./
RUN bun install --frozen-lockfile
COPY web/ .
ARG VITE_CLERK_PUBLISHABLE_KEY=
ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY
RUN bun run build

FROM oven/bun:1.4
WORKDIR /app
COPY core/package.json core/bun.lock ./
RUN bun install --frozen-lockfile
COPY core/ .
COPY --from=web /web/dist /web/dist
ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080
CMD ["bun", "src/server.ts"]
