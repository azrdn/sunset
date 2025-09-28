import { describe, expect, it } from "bun:test"
import { app } from "../src/index"
import { form, load_font } from "./utils"

describe("POST /v1/subset -> unicodes validation", () => {
    const url = "v1/subset"

    it("accepts codepoints and ranges (case-insensitive, optional U+; separators: comma/space)", async () => {
        const files = await load_font("Roboto-var.ttf")
        const res = await app.request(url, {
            method: "POST",
            body: form({
                files,
                config: JSON.stringify({
                    output: "ttf",
                    unicodes: "U+41-5A, 61-7a,u+30-39",
                }),
            }),
        })

        expect(res.status).toBe(200)
        expect(res.headers.get("Content-Type")).toBe("font/ttf")
    })

    it("rejects out-of-range codepoints (> U+10FFFD)", async () => {
        const files = await load_font("Roboto-var.ttf")
        const res = await app.request(url, {
            method: "POST",
            body: form({
                files,
                config: JSON.stringify({
                    output: "ttf",
                    unicodes: "U+10FFFD-110000",
                }),
            }),
        })

        expect(res.status).toBe(400)
    })

    it("rejects ranges where start > end (e.g., '7F-0')", async () => {
        const files = await load_font("Roboto-var.ttf")
        const res = await app.request(url, {
            method: "POST",
            body: form({
                files,
                config: JSON.stringify({
                    output: "ttf",
                    unicodes: "7F-0",
                }),
            }),
        })

        expect(res.status).toBe(400)
    })

    it("rejects malformed tokens (non-hex)", async () => {
        const files = await load_font("Roboto-var.ttf")
        const res = await app.request(url, {
            method: "POST",
            body: form({
                files,
                config: JSON.stringify({
                    output: "ttf",
                    unicodes: "U+ZZ,B5",
                }),
            }),
        })

        expect(res.status).toBe(400)
    })
})
