import { describe, expect, it } from "bun:test"
import { app } from "../src/index"
import { form, load_font } from "./utils"

describe("POST /v1/subset -> WOFF2 outputs", () => {
    const url = "v1/subset"
    const text = "abcdefghijklmnopqrstuvwxyz1234567890"

    it("subsets TTF->WOFF2", async () => {
        const files = await load_font("Roboto-var.ttf")
        const res = await app.request(url, {
            method: "POST",
            body: form({
                files,
                config: JSON.stringify({
                    text,
                    output: "woff2",
                }),
            }),
        })

        expect(res.status).toBe(200)
        expect(res.headers.get("Content-Type")).toBe("font/woff2")
    })

    it("subsets WOFF->WOFF2", async () => {
        const files = await load_font("Pretendard-var.woff")
        const res = await app.request(url, {
            method: "POST",
            body: form({
                files,
                config: JSON.stringify({
                    text,
                    output: "woff2",
                }),
            }),
        })

        expect(res.status).toBe(200)
        expect(res.headers.get("Content-Type")).toBe("font/woff2")
    })

    it("subsets WOFF2->WOFF2", async () => {
        const files = await load_font("GoogleSansCode-var.woff2")
        const res = await app.request(url, {
            method: "POST",
            body: form({
                files,
                config: JSON.stringify({
                    text,
                    output: "woff2",
                }),
            }),
        })

        expect(res.status).toBe(200)
        expect(res.headers.get("Content-Type")).toBe("font/woff2")
    })
})
