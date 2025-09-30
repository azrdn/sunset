/**
 * queryselector but no longer returns with undefined as union,
 * also errors when element not found.
 */
export const select = <T = Element>(selector: string): T => {
    const el = document.querySelector(selector)
    if (!el) throw new Error("Element not found")
    return el as T
}

/** taken from https://stackoverflow.com/a/18650828  */
export const format_bytes = (bytes: number, decimals = 2) => {
    if (!+bytes) return "0 Bytes"

    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ["Bytes", "KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"]

    const i = Math.max(0, Math.floor(Math.log(bytes) / Math.log(k)))

    return `${parseFloat((bytes / k ** i).toFixed(dm))} ${sizes[i]}`
}

export const formdata_maker = (object: Record<string, string | Blob | Blob[]>) => {
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

export const download_res = async (resp: Response) => {
    const filename = resp.headers.get("content-disposition")?.split("filename=")[1]
    console.log(filename)

    const blob = await resp.blob()
    const temp_url = URL.createObjectURL(blob)
    const a = document.createElement("a")

    a.href = temp_url
    a.download = filename ?? "download"

    document.body.appendChild(a).click()
    URL.revokeObjectURL(temp_url)
    a.remove()
}
