FROM oven/bun:1.4
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build
ENV NITRO_HOST=0.0.0.0
ENV PORT=8081
EXPOSE 8081
CMD ["bun", ".output/server/index.mjs"]
