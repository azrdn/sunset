import { describe, expect, it } from "bun:test";
import { app } from "../src/index";
import { form, load_font } from "./util";

describe("POST /v1/subset", () => {
	const url = "v1/subset";
	const subset_text = "abcdefghijklmnopqrstuvwxyz1234567890";

	it("subsets TTF->TTF", async () => {
		const font_file = await load_font("Roboto-var.ttf");
		const res = await app.request(url, {
			method: "POST",
			body: form({ subset_text, font_file, output: "ttf" }),
		});
		const buf = new Uint8Array(await res.arrayBuffer());

		expect(res.status).toBe(200);
		expect(res.headers.get("Content-Type")).toBe("font/ttf");
		expect(buf.byteLength).toBeGreaterThan(0);
	});

	it("subsets WOFF->TTF", async () => {
		const font_file = await load_font("Pretendard-var.woff");
		const res = await app.request(url, {
			method: "POST",
			body: form({ subset_text, font_file, output: "ttf" }),
		});
		const buf = new Uint8Array(await res.arrayBuffer());

		expect(res.status).toBe(200);
		expect(res.headers.get("Content-Type")).toBe("font/ttf");
		expect(buf.byteLength).toBeGreaterThan(0);
	});

	it("subsets WOFF2->TTF", async () => {
		const font_file = await load_font("GoogleSansCode-var.woff2");
		const res = await app.request(url, {
			method: "POST",
			body: form({ subset_text, font_file, output: "ttf" }),
		});

		expect(res.status).toBe(200);
		expect(res.headers.get("Content-Type")).toBe("font/ttf");
	});

	it("subsets TTF->WOFF2", async () => {
		const font_file = await load_font("Roboto-var.ttf");
		const res = await app.request(url, {
			method: "POST",
			body: form({ subset_text, font_file, output: "woff2" }),
		});

		expect(res.status).toBe(200);
		expect(res.headers.get("Content-Type")).toBe("font/woff2");
	});

	it("subsets WOFF->WOFF2", async () => {
		const font_file = await load_font("Pretendard-var.woff");
		const res = await app.request(url, {
			method: "POST",
			body: form({ subset_text, font_file, output: "woff2" }),
		});

		expect(res.status).toBe(200);
		expect(res.headers.get("Content-Type")).toBe("font/woff2");
	});

	it("subsets WOFF2->WOFF2", async () => {
		const font_file = await load_font("GoogleSansCode-var.woff2");
		const res = await app.request(url, {
			method: "POST",
			body: form({ subset_text, font_file, output: "woff2" }),
		});

		expect(res.status).toBe(200);
		expect(res.headers.get("Content-Type")).toBe("font/woff2");
	});

	it("fails validation when subset_text omitted", async () => {
		const font_file = await load_font("GoogleSansCode-var.woff2");
		const res = await app.request(url, {
			method: "POST",
			body: form({ font_file, output: "ttf" }),
		});

		expect(res.status).toBe(400);
	});

	it("fails validation when font_file omitted", async () => {
		const res = await app.request(url, {
			method: "POST",
			body: form({ subset_text, output: "ttf" }),
		});

		expect(res.status).toBe(400);
	});

	it("fails validation when output omitted", async () => {
		const font_file = await load_font("Roboto-var.ttf");
		const res = await app.request(url, {
			method: "POST",
			body: form({ subset_text, font_file }),
		});

		expect(res.status).toBe(400);
	});

	it("fails validation when subset_text is empty", async () => {
		const font_file = await load_font("Roboto-var.ttf");
		const res = await app.request(url, {
			method: "POST",
			body: form({ subset_text: "", font_file, output: "ttf" }),
		});

		expect(res.status).toBe(400);
	});

	it("rejects when file MIME type is not allowed", async () => {
		const bogus = new File([new Uint8Array([0, 1, 2, 3])], "bogus.bin", {
			type: "application/octet-stream",
		});
		const res = await app.request(url, {
			method: "POST",
			body: form({ subset_text, font_file: bogus, output: "ttf" }),
		});

		expect(res.status).toBe(400);
	});

	it("enforces body size limit (returns 413)", async () => {
		const bigFile = new File([new Uint8Array(21_000_000)], "big.ttf", {
			type: "font/ttf",
		});
		const res = await app.request(url, {
			method: "POST",
			body: form({ subset_text, font_file: bigFile, output: "ttf" }),
		});

		expect(res.status).toBe(400);
	});
});
