import { describe, expect, it } from "bun:test"
import { app } from "../src/index"
import { form, load_font } from "./utils"

describe("POST /v1/subset -> TTF outputs", () => {
    const url = "v1/subset"
    const text = "abcdefghijklmnopqrstuvwxyz1234567890"

    it("subsets TTF->TTF", async () => {
        const files = await load_font("Roboto-var.ttf")
        const res = await app.request(url, {
            method: "POST",
            body: form({ files, config: JSON.stringify({ text, output: "ttf" }) }),
        })
        const buf = new Uint8Array(await res.arrayBuffer())

        expect(res.status).toBe(200)
        expect(res.headers.get("Content-Type")).toBe("font/ttf")
        expect(buf.byteLength).toBeGreaterThan(0)
    })

    it("subsets WOFF->TTF", async () => {
        const files = await load_font("Pretendard-var.woff")
        const res = await app.request(url, {
            method: "POST",
            body: form({ files, config: JSON.stringify({ text, output: "ttf" }) }),
        })
        const buf = new Uint8Array(await res.arrayBuffer())

        expect(res.status).toBe(200)
        expect(res.headers.get("Content-Type")).toBe("font/ttf")
        expect(buf.byteLength).toBeGreaterThan(0)
    })

    it("subsets WOFF2->TTF", async () => {
        const files = await load_font("GoogleSansCode-var.woff2")
        const res = await app.request(url, {
            method: "POST",
            body: form({ files, config: JSON.stringify({ text, output: "ttf" })}),
        })

        expect(res.status).toBe(200)
        expect(res.headers.get("Content-Type")).toBe("font/ttf")
    })
})
