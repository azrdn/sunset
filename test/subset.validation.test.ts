import { describe, expect, it } from "bun:test"
import { app } from "../src/index"
import { form, load_font } from "./util"

describe("POST /v1/subset -> validation", () => {
    const url = "v1/subset"
    const text = "abcdefghijklmnopqrstuvwxyz1234567890"

    it("fails validation when file omitted", async () => {
        const res = await app.request(url, {
            method: "POST",
            body: form({ text, output: "ttf" }),
        })

        expect(res.status).toBe(400)
    })

    it("fails validation when output omitted", async () => {
        const file = await load_font("Roboto-var.ttf")
        const res = await app.request(url, {
            method: "POST",
            body: form({ text, file }),
        })

        expect(res.status).toBe(400)
    })

    it("rejects when file MIME type is not allowed", async () => {
        const bogus = new File([new Uint8Array([0, 1, 2, 3])], "bogus.bin", {
            type: "application/octet-stream",
        })
        const res = await app.request(url, {
            method: "POST",
            body: form({ text, file: bogus, output: "ttf" }),
        })

        expect(res.status).toBe(400)
    })

    it("enforces body size limit", async () => {
        const bigFile = new File([new Uint8Array(21_000_000)], "big.ttf", {
            type: "font/ttf",
        })
        const res = await app.request(url, {
            method: "POST",
            body: form({ text, file: bigFile, output: "ttf" }),
        })

        expect(res.status).toBe(413)
    })

    // --- Unicode-specific validation cases ---
    it("rejects invalid single unicode hex (non-hex chars)", async () => {
        const file = await load_font("Roboto-var.ttf")
        const res = await app.request(url, {
            method: "POST",
            body: form({ file, output: "ttf", unicodes: "GHIJ" }),
        })

        expect(res.status).toBe(400)
    })

    it("rejects out-of-range single codepoint (> U+10FFFF)", async () => {
        const file = await load_font("Roboto-var.ttf")
        const res = await app.request(url, {
            method: "POST",
            body: form({ file, output: "ttf", unicodes: "110000" }),
        })

        expect(res.status).toBe(400)
    })

    it("rejects reversed unicode range (start > end)", async () => {
        const file = await load_font("Roboto-var.ttf")
        const res = await app.request(url, {
            method: "POST",
            body: form({ file, output: "ttf", unicodes: "005A-0041" }),
        })

        expect(res.status).toBe(400)
    })

    it("rejects range with end out-of-range (> U+10FFFF)", async () => {
        const file = await load_font("Roboto-var.ttf")
        const res = await app.request(url, {
            method: "POST",
            body: form({ file, output: "ttf", unicodes: "10FFFE-110000" }),
        })

        expect(res.status).toBe(400)
    })

    it("rejects malformed prefixed value", async () => {
        const file = await load_font("Roboto-var.ttf")
        const res = await app.request(url, {
            method: "POST",
            body: form({ file, output: "ttf", unicodes: "U+-0041" }),
        })

        expect(res.status).toBe(400)
    })
})
