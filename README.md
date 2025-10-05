# Sunset

Sunset is a web app for experimenting with font subsetting.

<!-- 
TODO: Docker compose setup
-->

## Requirements (Non Docker Installation)

- [**Bun**](https://bun.com/)
- **hb_subset** (from HarfBuzz)
- **woff2**
- **7zz**

Make sure every CLI listed above is available on the `PATH` of the server process.

## Installation

```bash
bun install
```

This will install dependencies for every workspace in the repo.

## Local development

- Run both the server and client: `bun run dev`
- Server/client only: `bun run -F <server | client> dev`

The server listens on `http://localhost:4321` by default. You can adjust the maximum accepted request size by setting the `MAX_SIZE` environment variable (bytes).

<!-- TODO: API_URL Explanation -->

## Testing

Server-side font subsetting tests live under `pkgs/server/test`. Run them with:

```bash
bun test pkgs/server/test
```

## Docker

You can build a container image of the server using the provided Dockerfile:

```bash
cd pkgs/server
docker build -t sunset-server .
```
