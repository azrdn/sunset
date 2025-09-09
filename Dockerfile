FROM oven/bun:alpine
WORKDIR /src
COPY ./ ./
RUN bun install --production --frozen-lockfile \
    && bun build --compile --minify index.ts --outfile app

FROM alpine:latest
RUN apk add --no-cache harfbuzz-utils woff2
COPY --from=0 /src/app /bin/sunset
EXPOSE 4321
CMD [ "/bin/sunset" ]