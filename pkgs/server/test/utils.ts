export async function load_font(filename: string): Promise<File> {
    const file = Bun.file(`${import.meta.dir}/fonts/${filename}`)
    let type = "application/octet-stream"

    if (filename.endsWith(".otf")) type = "font/otf"
    else if (filename.endsWith(".ttf")) type = "font/ttf"
    else if (filename.endsWith(".woff")) type = "font/woff"
    else if (filename.endsWith(".woff2")) type = "font/woff2"

    return new File([await file.arrayBuffer()], filename, { type })
}

export const form = (object: Record<string, string | Blob | Blob[]>) => {
    const form = new FormData()

    for (const [key, val] of Object.entries(object)) {
        if (typeof val === "string" || val instanceof Blob) {
            form.append(key, val)
            continue
        }
        for (const item of Array.from(val)) form.append(key, item)
    }
    return form
}
