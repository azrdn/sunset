import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { cors } from "hono/cors";
import z from "zod";

const TEMP_DIR = ".tmp";
const app = new Hono().post(
	"/api/v1/subset",
	zValidator(
		"form",
		z.object({
			subset_text: z.string().min(1),
			font_file: z
				.file()
				.mime(["font/otf", "font/ttf", "font/woff", "font/woff2"])
				.max(10_000_000),
			output: z.enum(["ttf", "woff2"]),
		}),
	),
	cors({ origin: "*" }),
	async (c) => {
		const { font_file, subset_text, output } = c.req.valid("form");
		await Bun.write(`${TEMP_DIR}/font.ttf`, font_file);
		await Bun.$`hb-subset --face-loader=ft \
            ${TEMP_DIR}/font.ttf \
            --text=${subset_text} \
            -o ${TEMP_DIR}/output.ttf`;
		let file = Bun.file(`${TEMP_DIR}/output.ttf`);

		if (output === "woff2") {
			await Bun.$`woff2_compress ${TEMP_DIR}/output.ttf`.quiet();
			file = Bun.file(`${TEMP_DIR}/output.woff2`);
			return c.body(await file.arrayBuffer(), 201, {
				"Content-Type": "font/woff2",
			});
		}

		return c.body(await file.arrayBuffer(), 201, {
			"Content-Type": "font/ttf",
		});
	},
);

const server = Bun.serve({
	port: 4321,
	fetch: app.fetch,
});

["SIGINT", "SIGTERM"].map((signal) =>
	process.on(signal, async () => {
		await server.stop();
		console.log("Shutting down.");
		process.exit(0);
	}),
);
