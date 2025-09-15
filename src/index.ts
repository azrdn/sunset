import { rm } from "node:fs/promises";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { cors } from "hono/cors";
import z from "zod";

const TEMP_DIR = ".tmp";
const app = new Hono().post(
    "/v1/subset",
    zValidator("form", z.object({
        subset_text: z.string().min(1).max(15_000),
        font_file: z
            .file()
            .mime(["font/otf", "font/ttf", "font/woff", "font/woff2"])
            .max(20_000_000),
        output: z.enum(["ttf", "woff2"]),
    })),
    cors({ origin: "*" }),
    async (c) => {
        const { font_file, subset_text, output } = c.req.valid("form");
        const req_dir = `${TEMP_DIR}/${Bun.randomUUIDv7()}`;

        await Promise.all([
            Bun.write(`${req_dir}/font.ttf`, font_file),
            Bun.write(`${req_dir}/target.txt`, subset_text)
        ])
        await Bun.$`hb-subset \
            --face-loader=ft \
            --font-file="${req_dir}/font.ttf" \
            --text-file=${req_dir}/target.txt \
            -o ${req_dir}/output.ttf`;

        let out_path = `${req_dir}/output.ttf`;
        let content_type = "font/ttf";

        if (output === "woff2") {
            await Bun.$`woff2_compress ${req_dir}/output.ttf`.quiet();
            out_path = `${req_dir}/output.woff2`;
            content_type = "font/woff2";
        }

        const buffer = await Bun.file(out_path).arrayBuffer();
        await rm(req_dir, { recursive: true })
        return c.body(buffer, 200, { "Content-Type": content_type });
    },
);

const server = Bun.serve({
    fetch: app.fetch,
    port: 4321,
});

["SIGINT", "SIGTERM"].map((sig) =>
    process.on(sig, async () => {
        await server.stop();
        console.log("Shutting down.");
        process.exit(0);
    }),
);
