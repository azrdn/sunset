FROM oven/bun:alpine AS builder
WORKDIR /app
COPY . .
WORKDIR /app/pkgs/server
RUN bun install --production --frozen-lockfile \
    && bun build --compile --minify src/index.ts --outfile sunset

FROM alpine:latest
RUN apk add --no-cache harfbuzz-utils woff2 7zip
COPY --from=builder /app/pkgs/server/sunset /bin/sunset

ENV NODE_ENV=production
EXPOSE 4321
ENTRYPOINT [ "/bin/sunset" ]