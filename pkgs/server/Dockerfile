FROM oven/bun:alpine
WORKDIR /src
COPY ./ ./
RUN bun install --production --frozen-lockfile \
    && bun build --compile --minify --bytecode src/index.ts --outfile app

FROM alpine:latest
RUN apk add --no-cache harfbuzz-utils woff2
COPY --from=0 /src/app /bin/sunset

ENV NODE_ENV=production
EXPOSE 4321
ENTRYPOINT [ "/bin/sunset" ]