export async function load_font(filename: string): Promise<File> {
    const file = Bun.file(`${import.meta.dir}/fonts/${filename}`)
    let type = "application/octet-stream"

    if (filename.endsWith(".otf")) type = "font/otf"
    else if (filename.endsWith(".ttf")) type = "font/ttf"
    else if (filename.endsWith(".woff")) type = "font/woff"
    else if (filename.endsWith(".woff2")) type = "font/woff2"

    return new File([await file.arrayBuffer()], filename, { type })
}

type FormValues = Record<string, string | string[] | Blob | Blob[]>
export const form = (object: FormValues) => {
    const form = new FormData()
    const entries = Object.entries(object)

    for (const [k, v] of entries) {
        if (typeof v === "string" || v instanceof Blob) {
            form.append(k, v)
            continue
        }

        if (Array.isArray(v)) for (const i of v) form.append(k, i)
    }
    return form
}