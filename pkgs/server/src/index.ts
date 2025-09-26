import { rm } from "node:fs/promises"
import { Hono } from "hono"
import { bodyLimit } from "hono/body-limit"
import { cors } from "hono/cors"
import validate_req from "validator/request"

const TEMP_DIR = ".tmp"
const EXIT_SIGNALS = ["SIGINT", "SIGTERM"]

export const app = new Hono().post(
    "/v1/subset",
    bodyLimit({ maxSize: 20_480_000 }),
    cors(),
    async c => {
        const form = await c.req.formData()
        const parsed = validate_req(Object.fromEntries(form.entries()))
        if (!parsed.success) return c.body(null, 400)

        const { file, text, unicodes, output } = parsed.output
        const req_dir = `${TEMP_DIR}/${Bun.randomUUIDv7()}`

        await Promise.all([
            Bun.write(`${req_dir}/font.sfnt`, file),
            Bun.write(`${req_dir}/text.txt`, text),
            Bun.write(`${req_dir}/unicode_list.txt`, unicodes.join(",")),
        ])
        await Bun.$`hb-subset \
            --face-loader=ft \
            --font-file="${req_dir}/font.sfnt" \
            --text-file=${req_dir}/text.txt \
            --unicodes-file=${req_dir}/unicode_list.txt \
            -o ${req_dir}/output.ttf`

        let out_path = `${req_dir}/output.ttf`
        let content_type = "font/ttf"

        if (output === "woff2") {
            await Bun.$`woff2_compress ${req_dir}/output.ttf`.quiet()
            out_path = `${req_dir}/output.woff2`
            content_type = "font/woff2"
        }

        const buffer = await Bun.file(out_path).arrayBuffer()
        await rm(req_dir, { recursive: true })
        return c.body(buffer, 200, { "Content-Type": content_type })
    },
)

EXIT_SIGNALS.map(sig =>
    process.on(sig, () => {
        console.log("Shutting down.")
        process.exit()
    }),
)

export default {
    fetch: app.fetch,
    port: 4321,
} satisfies Bun.ServeOptions
