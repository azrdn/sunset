export async function load_font(filename: string): Promise<File> {
    const file = Bun.file(`test/fonts/${filename}`)
    let type = "application/octet-stream"

    if (filename.endsWith(".otf")) type = "font/otf"
    else if (filename.endsWith(".ttf")) type = "font/ttf"
    else if (filename.endsWith(".woff")) type = "font/woff"
    else if (filename.endsWith(".woff2")) type = "font/woff2"

    return new File([await file.arrayBuffer()], filename, { type })
}

export function form(object: Record<string, string | Blob>) {
    const form = new FormData()
    for (const [k, v] of Object.entries<string | Blob>(object)) {
        form.append(k, v)
    }
    return form
}
