import { mkdir, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { Hono } from "hono"
import { bodyLimit } from "hono/body-limit"
import { cors } from "hono/cors"
import { req_validator } from "validator"

const EXIT_SIGNALS = ["SIGINT", "SIGTERM"]
const MAX_REQ_SIZE = parseInt(Bun.env.MAX_SIZE || "20971520", 10)

export const app = new Hono()

app.use("/v1/subset", cors({ origin: "*", exposeHeaders: ["*"] }))
app.post("/v1/subset", bodyLimit({ maxSize: MAX_REQ_SIZE }), async c => {
    const form = await c.req.formData()
    const parsed = await req_validator({
        files: form.getAll("files"),
        config: form.get("config"),
    })
    if (!parsed.success) return c.body(null, 400)

    const { files, config } = parsed.output
    const req_id = Bun.randomUUIDv7()
    const req_dir = `${tmpdir()}/sunset-${req_id}`
    const file_names = files.map(file => file.name.split(".")[0] || file.name)

    await Promise.all([
        ...files.map(file => Bun.write(`${req_dir}/in/${file.name}`, file)),
        mkdir(`${req_dir}/out`, { recursive: true }),
        Bun.write(`${req_dir}/text.txt`, config.text),
        Bun.write(`${req_dir}/unicode_list.txt`, config.unicodes.join(",")),
    ])

    await Promise.all(
        files.map(
            (file, index) => Bun.$`hb-subset \
            --face-loader=ft \
            --font-file "${req_dir}/in/${file.name}" \
            --text-file ${req_dir}/text.txt \
            --unicodes-file ${req_dir}/unicode_list.txt \
            -o ${req_dir}/out/${file_names[index]}.ttf`,
        ),
    )

    const ext = config.output
    if (ext === "woff2") {
        const conversion_tasks = file_names.map(name =>
            Bun.$`woff2_compress ${req_dir}/out/${name}.ttf`.quiet(),
        )
        await Promise.all(conversion_tasks)
    }

    let file_name = `${file_names[0]}.${ext}`
    let out_path = `${req_dir}/out/${file_name}`
    let content_type = `font/${ext}`

    if (files.length > 1) {
        file_name = `${req_id}.zip`
        out_path = `${req_dir}/${file_name}`
        content_type = "application/zip"

        await Bun.$`7zz a -tzip ${out_path} ${req_dir}/out/{.,}*${ext}`.quiet()
    }

    const buffer = await Bun.file(out_path).arrayBuffer()
    await rm(req_dir, { recursive: true })
    return c.body(buffer, 200, {
        "Content-Type": content_type,
        "Content-Disposition": `attachment; filename=${file_name}`,
    })
})

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
