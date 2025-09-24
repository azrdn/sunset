import { rm } from "node:fs/promises";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { cors } from "hono/cors";
import z from "zod";

const TEMP_DIR = ".tmp";
const schema = z.object({
	subset_text: z.string().min(1).max(15_000),
	font_file: z.file().mime(["font/otf", "font/ttf", "font/woff", "font/woff2"]),
	output: z.enum(["ttf", "woff2"]),
});

export const app = new Hono().post(
	"/v1/subset",
	bodyLimit({ maxSize: 20_480_000 }),
	cors(),
	async (c) => {
		const form = await c.req.formData();
		const parsed = schema.safeParse(Object.fromEntries(form.entries()));
		if (!parsed.success) return c.body(null, 400);

		const { font_file, subset_text, output } = parsed.data;
		const req_dir = `${TEMP_DIR}/${Bun.randomUUIDv7()}`;

		await Promise.all([
			Bun.write(`${req_dir}/font.sfnt`, font_file),
			Bun.write(`${req_dir}/target.txt`, subset_text),
		]);
		await Bun.$`hb-subset \
            --face-loader=ft \
            --font-file="${req_dir}/font.sfnt" \
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
		await rm(req_dir, { recursive: true });
		return c.body(buffer, 200, { "Content-Type": content_type });
	},
);

export default {
	fetch: app.fetch,
	port: 4321,
} satisfies Bun.ServeOptions;

["SIGINT", "SIGTERM"].map((sig) =>
	process.on(sig, () => {
		console.log("Shutting down.");
		process.exit();
	}),
);
