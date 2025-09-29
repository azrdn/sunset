import { mkdir, rm } from "node:fs/promises"
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
        const parsed = validate_req({
            files: form.getAll("files"),
            config: form.get("config"),
        })
        if (!parsed.success) return c.body(null, 400)

        const { files, config } = parsed.output
        const req_id = Bun.randomUUIDv7()
        const req_dir = `${TEMP_DIR}/${req_id}`
        const file_names = files.map(file => file.name.split(".")[0] ?? file.name)

        await Promise.all([
            ...files.map(file => Bun.write(`${req_dir}/in/${file.name}`, file)),
            mkdir(`${req_dir}/out`, { recursive: true }),
            Bun.write(`${req_dir}/text.txt`, config.text),
            Bun.write(`${req_dir}/unicode_list.txt`, config.unicodes.join(",")),
        ])

        await Promise.all(
            files.map((file, index) => {
                return Bun.$`hb-subset \
                    --face-loader=ft \
                    --font-file "${req_dir}/in/${file.name}" \
                    --text-file ${req_dir}/text.txt \
                    --unicodes-file ${req_dir}/unicode_list.txt \
                    -o ${req_dir}/out/${file_names[index]}.ttf`
            }),
        )

        if (config.output === "woff2") {
            await Promise.all(
                file_names.map(
                    name => Bun.$`woff2_compress ${req_dir}/out/${name}.ttf`.quiet(),
                ),
            )
        }

        const ext = config.output === "woff2" ? "woff2" : "ttf"
        let out_path = `${req_dir}/out/${file_names[0]}.${ext}`
        let content_type = config.output === "woff2" ? "font/woff2" : "font/ttf"

        if (files.length > 1) {
            out_path = `${req_dir}/${req_id}.zip`
            content_type = "application/zip"

            const glob_pttrn = config.output === "woff2" ? "*.woff2" : "*.ttf"
            await Bun.$`7zz a -tzip ${req_dir}/${req_id} ./${req_dir}/out/${glob_pttrn}`.quiet()
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
