import { describe, expect, it } from "bun:test"
import { app } from "../src/index"
import { form, load_font } from "./utils"

describe("POST /v1/subset -> validation", () => {
    const url = "v1/subset"
    const text = "abcdefghijklmnopqrstuvwxyz1234567890"

    it("fails validation when file omitted", async () => {
        const res = await app.request(url, {
            method: "POST",
            body: form({ config: JSON.stringify({ text, output: "ttf" }) }),
        })

        expect(res.status).toBe(400)
    })

    it("fails validation when output omitted", async () => {
        const files = await load_font("Roboto-var.ttf")
        const res = await app.request(url, {
            method: "POST",
            body: form({ files, config: JSON.stringify({ text }) }),
        })

        expect(res.status).toBe(400)
    })

    it("rejects when file's signature doesn't match", async () => {
        const bogus = new File([new Uint8Array([0, 1, 2, 3, 9])], "bogus.bin")
        const res = await app.request(url, {
            method: "POST",
            body: form({
                files: [bogus],
                config: JSON.stringify({ text, output: "ttf" }),
            }),
        })

        expect(res.status).toBe(400)
    })

    it("enforces body size limit", async () => {
        const bigFile = new File([new Uint8Array(21_000_000)], "big.ttf", {
            type: "font/ttf",
        })
        const res = await app.request(url, {
            method: "POST",
            body: form({
                files: [bigFile],
                config: JSON.stringify({ text, output: "ttf" }),
            }),
        })

        expect(res.status).toBe(413)
    })
})
